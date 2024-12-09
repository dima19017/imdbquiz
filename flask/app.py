# app.py
# =============================================================================
# Зависимости
# =============================================================================
import os
import sqlite3
import random
import requests
import logging
import colorlog
import time
from threading import Thread, Lock
from functools import wraps
from cs50 import SQL
from flask import Flask, flash, redirect, render_template, request, session, url_for, jsonify
from flask_socketio import SocketIO, join_room, leave_room, send, emit
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash
# =============================================================================
# Конфигурируем приложение
# =============================================================================
app = Flask(__name__)
socketio = SocketIO(logger=True, engineio_logger=True)
socketio = SocketIO(app)
db = SQL("sqlite:///imdbquiz.db")
# Конфигурируем сессии использовать ФС (вместо подписанных куки)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_FILE_THRESHOLD"] = 100
Session(app)
# =============================================================================
# Глобальные переменные
# =============================================================================
# Задаем данные для TMDB и proxy
TMDB_API_KEY = '69c6b9362872f8b7d98effec5badddd6'
TMDB_API_URL = 'https://api.themoviedb.org/3'
PROXY = "http://eWSWGwq8:dWAf82nT@166.1.128.144:64044"

# Глобальный словарь для хранения данных об играх по ID комнат
game_data = {}

# =============================================================================
# Вспомогательные функции
# =============================================================================
def apology(message, code=400):
    """ Render message as an apology to user with a custom meme image. """
    def escape(s):
        """ Escape special characters for URL encoding in the meme generator. """
        for old, new in [
            ("-", "--"),
            (" ", "-"),
            ("_", "__"),
            ("?", "~q"),
            ("%", "~p"),
            ("#", "~h"),
            ("/", "~s"),
            ('"', "''"),
        ]:
            s = s.replace(old, new)
        return s
    return render_template("apology.html", top=code, bottom=escape(message), message=message), code

def login_required(f):
    """ Decorate routes to require login.
    https://flask.palletsprojects.com/en/latest/patterns/viewdecorators/ """
    @wraps(f)
    def decorate_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/login")
        return f(*args, **kwargs)
    return decorate_function

@app.after_request
def after_request(response):
    """Decorator to ensure response aren't cached. Перед ответом клиенту мы контролируем кэширование"""
    # по порядку: no-cache - инструктирует браузер проверять наличие актуальной версии ресурса
    # no-store - запрещает кеширование ни на клиенте, ни на промежуточных прокси-серверах
    # must-revalidate - требует от браузера повторно проверять ресурс при следующем использовании
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    # устанавливает время когда ресурс истекает. 0 - уже устарел
    response.headers["Expires"] = 0
    # старый заголовок для совместимости с http 1
    response.headers["Pragma"] = "no-cache"
    return response

# =============================================================================
# Основные маршруты
# =============================================================================
@app.route("/")
@login_required
def index():
    ''' Вывод главной страницы '''
    user_id = session["user_id"]
    return render_template("index.html", user_id=user_id)

@app.route("/login", methods=["GET", "POST"])
def login():
    """Log user in"""
    session.clear()
    if request.method == "POST":
        if not request.form.get("username"):
            return apology("must provide username", 403)
        elif not request.form.get("password"):
            return apology("must provide password", 403)

        rows = db.execute("SELECT * FROM users WHERE username = ?", request.form.get("username"))
        pas = request.form.get("password")

        if len(rows) != 1 or not check_password_hash(rows[0]["hash"], pas):
            return apology("invalid username and/or password", 403)
        session["user_id"] = rows[0]["id"]
        return redirect("/")
    else:
        return render_template("login.html")

@app.route("/logout")
def logout():
    """Log user out"""
    session.clear()
    return redirect("/")

@app.route("/register", methods=["GET", "POST"])
def register():
    ''' Регистрация пользователя в базе данных '''
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        confirmation = request.form.get("confirmation")
        if not username:
            return apology("Username is empty", code=400)
        if not password:
            return apology("Password is empty", code=400)
        if password != confirmation:
            return apology("Passwords do not match", code=400)
        hash = generate_password_hash(password, method='scrypt', salt_length=16)
        try:
            with sqlite3.connect("imdbquiz.db") as conn:
                cursor = conn.cursor()
                cursor.execute("INSERT INTO users (username, hash) VALUES(?, ?)", (username, hash))
                conn.commit()
            return redirect("/")
        except sqlite3.IntegrityError:
            return apology("Username is already taken", code=400)
    else:
        return render_template("register.html")

@app.route("/profile")
@login_required
def profile():
    ''' Здесь будет маршрут открытия профиля '''
    return apology("Page not found", code=404)

# =============================================================================
#   Комната
# =============================================================================

@app.route('/api/rooms', methods=['GET'])
def get_rooms():
    ''' api для проверки состояния комнаты '''
    return jsonify(rooms)

# Определение основного глобального словаря комнат
rooms = {}
# Управление уровнем логирования
logging.basicConfig(level=logging.INFO)

@app.route("/handle_create_room", methods=['POST'])
def handle_create_room():
    """ route для обработки кнопки createRoom в index.html. Генерирует room_id и redirect в room.html """
    logging.info("This is work of /handle_create_room route.")
    user_id = session.get('user_id')
    room_id = 'room_' + str(len(rooms) + 1)
    rooms[room_id] = {'creator': '', 'players': []}
    session['room_id'] = room_id
    logging.info(
        "User %s pressed 'create room' button.\n"
        "Room %s created. Current rooms state: %s.\n"
        "room_id %s saved in session.\n"
        "End of /handle_create_room route, redirect to /room.\n",
        user_id, room_id, rooms, room_id)
    return redirect(url_for('room', room_id=room_id))

@app.route('/room/<room_id>')
@login_required
def room(room_id):
    """ route для отображения страницы комнаты по room_id, который called из /handle_create_room """
    user_id = session.get('user_id')
    logging.info("This is work of /room/<room_id> route.")
    if room_id in rooms:
        logging.info("Render %s for user %s.\n"
                     "End of /room/<room_id> route for user %s",
                     room_id, user_id, user_id)
        return render_template('room.html', room_id=room_id, rooms=rooms.get(room_id))
    logging.error("Can't create room %s.\n"
                "End of /room/<room_id> route. Error", room_id)
    return apology("Room not found", code=404)

@app.route('/handle_join_room', methods=['POST'])
@login_required
def handle_join_room():
    ''' обработчик для подключения к комнате '''
    room_id = request.form['room_id']
    if room_id in rooms:
        # Проверяем, если игрок уже в комнате, не добавляем его повторно
        session['room_id'] = room_id  # Сохраняем ID комнаты в сессии
        return redirect(url_for('room', room_id=room_id))
    else:
        return apology("Room not found", code=404)

@socketio.on('join')
def on_join(data):
    """ join """
    room_id = data.get('room_id')
    user_id = session.get('user_id')
    logging.info("\nWEBSOCKET: work of join websocket")
    if room_id and user_id:
        if user_id not in rooms[room_id]['players']:
            rooms[room_id]['players'].append(user_id)
            join_room(room_id)
            logging.info("\nWEBSOCKET: try to create %s for user %s.\n"
             "End of /room/<room_id> route. Render template room.html.\n",
             room_id, user_id)
            emit('message', {
                'msg': f'{user_id} has joined the room.',
                'players': rooms[room_id]['players'],
            }, room=room_id)
        else:
            logging.info("User %s already in room %s. Current players: %s",
                         user_id, room_id, rooms[room_id]['players'])
        if not rooms[room_id].get('creator'):
            rooms[room_id]['creator'] = user_id
            emit('creator', {
                'msg': f'{user_id} has joined the room.',
                'creator': rooms[room_id]['players'],
            }, room=room_id)
    else:
        logging.error("missing %s or %s", room_id, user_id)

@socketio.on('leave')
def on_leave(data):
    """ leave """
    room_id = data.get('room_id')  # Получаем ID комнаты из данных
    user_id = session.get('user_id')  # Получаем ID пользователя из сессии
    if room_id and user_id:
        leave_room(room_id)  # Отключаем пользователя от комнаты
        # Удаляем пользователя из списка участников комнаты
        if room_id in rooms and user_id in rooms[room_id]['players']:
            rooms[room_id]['players'].remove(user_id)
        # Отправляем обновлённый список игроков всем участникам комнаты
        emit('message', {
            'msg': f'{user_id} has left the room.',
            'players': rooms[room_id]['players']
        }, room=room_id)
        logging.info("\nWEBSOCKET: %s has left the room %s. Current players: %s",
                     user_id, room_id, rooms[room_id]['players'])

@socketio.on('ready')
def on_ready(data):
    """ ready. Сокет нажатия на кнопку готов """
    room_id = data.get('room_id')
    user_id = session.get('user_id')

    if room_id and user_id:
        # Добавляем пользователя в список готовых игроков
        if room_id in rooms and user_id not in rooms[room_id].get('ready_players', []):
            rooms[room_id].setdefault('ready_players', []).append(user_id)
            print(f"User {user_id} is ready in room {room_id}. Ready players: {rooms[room_id]['ready_players']}")
        elif room_id in rooms and user_id in rooms[room_id].get('ready_players', []):
            rooms[room_id]['ready_players'].remove(user_id)
            print(f"User {user_id} NOT ready in room {room_id}. Ready players: {rooms[room_id]['ready_players']}")
        # Оповещаем всех игроков о текущем состоянии комнаты
        emit('update_ready_players', {
            'ready_players': rooms[room_id]['ready_players'],
            'players': rooms[room_id]['players']
        }, room=room_id)

        # Проверяем, все ли игроки готовы
        if len(rooms[room_id]['ready_players']) == len(rooms[room_id]['players']):
            # Если все игроки готовы, активируем кнопку "Начать игру" только для создателя
            emit('enable_start_game', {'can_start': True}, room=room_id)
            print(f"In {room_id} Game can be started. Ready players: {rooms[room_id]['ready_players']}")
        else:
            emit('enable_start_game', {'can_start': False}, room=room_id)

# Обработчик для начала игры
@socketio.on('start_game')
def on_start_game(data):
    """ socket for start of the game """
    room_id = data.get('room_id')
    user_id = session.get('user_id')
    logging.info(f"Received 'start_game' request from user {user_id} in room {room_id}.")
    if room_id and user_id:
        # Проверяем, что только создатель может начать игру
        if rooms[room_id]['creator'] == user_id:
            logging.info(f"User {user_id} is the creator of room {room_id}. Starting game.")
            # Получаем случайный фильм
            # Отправляем подсказки всем игрокам через WebSocket
            emit('game_started', {'msg': 'The game has started!'}, room=room_id)
        else:
            print(f"User {user_id} tried to start the game without being the creator.")

# =============================================================================
#   Игра
# =============================================================================
MOVIE_COUNTER = 2
# @app.route('/random_movie', methods=['GET'])
def random_movie():
    ''' Функция получения случайного фильма с основными актерами '''
    page = random.randint(1, 20)
    # Формируем URL с параметрами запроса
    url = f"{TMDB_API_URL}/movie/popular?api_key={TMDB_API_KEY}&language=en-US&page={page}"
    logging.info(f"Fetching random movie from TMDB. URL: {url}")
    
    # Отправляем GET-запрос через requests
    try:
        response = requests.get(url, proxies={"http": PROXY, "https": PROXY} if PROXY else None)
        response.raise_for_status()  # Проверка успешности запроса

        movies_data = response.json()  # Парсим JSON
        movies = movies_data.get('results', [])

        if movies:
            movie = random.choice(movies)  # Случайный фильм из полученного списка
            logging.info(f"Successfully fetched random movie: {movie['original_title']}")

            # Получаем информацию об актерах фильма
            movie_id = movie['id']  # ID фильма для дальнейшего запроса
            cast_url = f"{TMDB_API_URL}/movie/{movie_id}/credits?api_key={TMDB_API_KEY}&language=en-US"
            cast_response = requests.get(cast_url, proxies={"http": PROXY, "https": PROXY} if PROXY else None)
            cast_response.raise_for_status()  # Проверка успешности запроса

            cast_data = cast_response.json()
            actors = cast_data.get('cast', [])
            top_actors = [{'name': actor['name'], 'character': actor['character'], 'profile_path': actor.get('profile_path')} for actor in actors[:5]]  # Получаем первых 5 актеров

            # Включаем актеров в ответ
            movie['actors'] = top_actors
            logging.info(f"Successfully fetched actors for movie: {movie['original_title']}")
            return movie  # Отправляем фильм и актеров в формате JSON
        else:
            logging.error("No movies found in the response.")
            return {'error': 'No movies found'}, 404

    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching data from TMDB: {str(e)}")
        return {'error': f'Error fetching data from TMDB: {str(e)}'}, 500
    #movie = {
    #    'id': 12345,
    #    'release_date': '2023-01-01',
    #    'vote_average': 8.5,
    #    'overview': 'A great movie!',
    #    'original_title': 'Test Movie'
    #}
    #logging.info(f"Movie selected: {movie}")
    #return movie

@app.route('/game/<room_id>', methods=['GET'])
@login_required
def game(room_id):
    ''' Маршрут игровой комнаты '''
    logging.info("Game starting for %s. Checking if players are connected.", room_id)
    if room_id not in rooms or len(rooms[room_id]['players']) == 0:
        logging.error("No players connected to the room %s.", room_id)
        return apology("No players in the room.", code=400)
    # Проверяем, если в комнате еще нет фильма
    if 'movies' not in rooms[room_id]:
        movies_dict = {}

        for counter in range(MOVIE_COUNTER):
            # Вызов функции получения случайного фильма
            movie = random_movie()
            if 'error' in movie:  # Если ошибка при получении фильма
                logging.error(f"Error fetching random movie for room {room_id}: {movie.get('error')}")
                return apology("Could not fetch movie details.", code=500)

            # Используем счетчик как ключ для каждого фильма
            movies_dict[counter + 1] = movie  # Счетчик начинается с 1

        rooms[room_id]['movies'] = movies_dict  # Сохраняем фильмы как словарь

    # Логируем информацию о фильмах
    logging.info(f"Game started in room {room_id}. Movies: {rooms[room_id]['movies']}")

    # Передаем фильмы в шаблон
    return render_template('game.html', room_id=room_id, movies=rooms[room_id]['movies'])


@socketio.on('show_hints_serv')
def show_hints_serv(data):  # Убедитесь, что room_id - строка
    ''' работа с подсказками через сокет '''
    movie_counter = data.get('movie_counter')
    room_id = data.get('room_id')
    logging.info(f"Received room_id: {room_id}, movie_counter: {movie_counter}")
    if room_id in rooms:
        if 'movies' in rooms[room_id]:
            movies = rooms[room_id]['movies']
            if movie_counter in movies:
                        emit('show_hints_on_client', {
                            'msg': 'Hints have joined the room.',
                            'movie': movies[movie_counter]
                        })
            else:
                emit('show_hints_on_client', {
                    'msg': f"Movie {movie_counter} not found in the room."
                })
            # emit('show_hints_on_client', {
            #     'msg': 'hints has joined the room.',
            #     'movie': rooms[room_id]['movies']['{movie_counter'}], })
            logging.info(f"Send {movies[movie_counter]} to room {room_id}.")
        else: logging.error(f"Movie not found in room {room_id}.")
    else: logging.error(f"Room {room_id} not found.")

@socketio.on('submit_answer')
def on_submit_answer(data):
    ''' Сокет отправки ответа '''
    room_id = data['room_id']
    user_id = session.get('user_id')
    answer = data['answer']
    ans_counter = data['answer_counter']
    
    # Логируем входные данные
    logging.info(f"Received answer submission for room_id: {room_id}, user_id: {user_id}, answer: {answer}, answer_counter: {ans_counter}")
    
    correct_answer = rooms[room_id]['movies'][ans_counter]['original_title']
    logging.info(f"Correct answer for movie {ans_counter}: {correct_answer}")
    
    # Проверяем правильность ответа
    is_correct = answer.lower() == correct_answer.lower()
    logging.info(f"Is the answer correct? {is_correct}")
    
    # Сохраняем ответ игрока
    rooms[room_id].setdefault('players_answers', {})
    rooms[room_id]['players_answers'].setdefault(user_id, {})  # Если нет, создаем для user_id пустой словарь
    rooms[room_id]['players_answers'][user_id][ans_counter] = is_correct
    logging.info(f"Updated players_answers for user_id {user_id}: {rooms[room_id]['players_answers'][user_id]}")
    
    # Отправляем статус игрока (правильный или неправильный ответ)
    emit('player_answered', {
        'user_id': user_id,
        'is_correct': is_correct
    })
    logging.info(f"Sent 'player_answered' event for user_id {user_id}")
    
    # Проверяем, все ли игроки завершили ответы (сравниваем с MOVIE_COUNTER)
    all_answers_submitted = True
    players_scores = []

    logging.info(f"Checking if all answers have been submitted for room_id {room_id}")

    for player_id, answers in rooms[room_id]['players_answers'].items():
        logging.info(f"Checking answers for player_id {player_id}: {answers}")
        
        # Проверяем, что у игрока есть ответы на все фильмы (сравниваем количество ответов с MOVIE_COUNTER)
        if len(answers) == MOVIE_COUNTER:  # У игрока должно быть ответов, равных количеству фильмов
            logging.info(f"Player {player_id} has answered all questions.")
            
            # Подсчитываем количество правильных ответов для этого игрока
            correct_answers_count = sum(answers.values())  # Количество правильных ответов
            players_scores.append((player_id, correct_answers_count))  # Добавляем в список (ID игрока, количество правильных ответов)
            logging.info(f"Player {player_id} has {correct_answers_count} correct answers.")
        else:
            all_answers_submitted = False
            logging.info(f"Player {player_id} has not answered all questions. Expected {MOVIE_COUNTER} answers but got {len(answers)}.")
            break

    if all_answers_submitted:
        # Сортируем игроков по количеству правильных ответов (от большего к меньшему)
        sorted_players = sorted(players_scores, key=lambda x: x[1], reverse=True)
        
        # Логируем перед отправкой результата
        logging.info(f"All players have submitted their answers. Sending game results.")
        
        # Подготовка списка победителей в формате для отображения на клиенте
        leaderboard = [{
            'user_id': player[0],
            'correct_answers': player[1],
            'rank': index + 1  # Индекс + 1 - это место игрока
        } for index, player in enumerate(sorted_players)]
        
        emit('game_results', {
            'leaderboard': leaderboard
        })
        logging.info(f"Sent 'game_results' event. Leaderboard: {leaderboard}")
    else:
        logging.info(f"Not all players have submitted their answers yet.")



@socketio.on('end_game')
def on_end_game(data):
    ''' Сокет конца игры '''
    room_id = data['room_id']
    correct_players = [user for user, correct in rooms[room_id]['players_answers'].items() if correct]
    incorrect_players = [user for user, correct in rooms[room_id]['players_answers'].items() if not correct]
    # Отправляем результаты игры
    emit('game_results', {
        'correct_players': correct_players,
        'incorrect_players': incorrect_players })
    # Возвращаем игроков в комнату
    time.sleep(1)
    emit('game_end', {'message': "Returning to room"})

@socketio.on('connect')
def handle_connect():
    ''' Простая проверка подключения '''
    logging.info("\nWEBSOCKET: Клиент подключен через websocket connect")

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
