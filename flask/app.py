
# app.py
import os

from functools import wraps
from cs50 import SQL
from flask import Flask, flash, redirect, render_template, request, session, url_for, jsonify
from flask_socketio import SocketIO, join_room, leave_room, send, emit
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash
import sqlite3
import random

# Конфигурируем приложение
app = Flask(__name__)

socketio = SocketIO(app)

rooms = {}

# Конфигурируем сессии использовать ФС (вместо подписанных куки)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_FILE_THRESHOLD"] = 100
Session(app)

# Конфигурируем базу данных
db = SQL("sqlite:///imdbquiz.db")

def apology(message, code=400):
    """Render message as an apology to user with a custom meme image."""
    def escape(s):
        """
        Escape special characters for URL encoding in the meme generator.
        """
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
    """
    Decorate routes to require login.
    https://flask.palletsprojects.com/en/latest/patterns/viewdecorators/
    """
    @wraps(f)
    def decorate_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/login")
        return f(*args, **kwargs)
    return decorate_function

# Это декоратор, для того, чтобы гарантировать, что ответы не кешируются. Перед ответом клиенту мы контролируем кэширование
@app.after_request
def after_request(response):
    """Ensure response aren't cached"""
    # по порядку: no-cache - инструктирует браузер проверять наличие актуальной версии ресурса
    # no-store - запрещает кеширование ни на клиенте, ни на промежуточных прокси-серверах
    # must-revalidate - требует от браузера повторно проверять ресурс при следующем использовании
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    # устанавливает время когда ресурс истекает. 0 - уже устарел
    response.headers["Expires"] = 0
    # старый заголовок для совместимости с http 1
    response.headers["Pragma"] = "no-cache"
    return response

@app.route("/")
@login_required
def index():
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

        if len(rows) != 1 or not check_password_hash(
            rows[0]["hash"], pas
        ):
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
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        confirmation = request.form.get("confirmation")
        if not username:
            return apology("Username is empty", code=400)
        if not password:
            return apology("password is empty", code=400)
        if password == confirmation:
            hash = generate_password_hash(password, method='scrypt', salt_length=16)
            try:
                with sqlite3.connect("imdbquiz.db") as conn:
                    cursor = conn.cursor()
                    cursor.execute("INSERT INTO users (username, hash) VALUES(?, ?)", (username, hash))
                    conn.commit()
                return redirect("/")
            except sqlite3.IntegrityError:
                # return apology("Username is already taken", code=400)
                return apology("Username is already taken", code=400)
        else:
            # return apology("Passwords do not match", code=400)
            return apology("Passwords do not match", code=400)
    else:
        return render_template("register.html")

@app.route("/profile")
@login_required
def profile():
    return apology("Page not found", code=404)

# Обработчик для создания комнаты
@app.route('/handle_create_room', methods=['POST'])
@login_required
def handle_create_room():
    user_id = session.get('user_id')
    room_id = 'room_' + str(len(rooms) + 1)  # Генерация ID комнаты
    rooms[room_id] = {'creator': user_id, 'players': [user_id]}
    session['room_id'] = room_id  # Сохраняем ID комнаты в сессии
    return redirect(url_for('room', room_id=room_id))


# Обработчик для подключения к комнате
@app.route('/handle_join_room', methods=['POST'])
@login_required
def handle_join_room():
    room_id = request.form['room_id']
    user_id = session.get('user_id')

    if room_id in rooms:
        # Проверяем, если игрок уже в комнате, не добавляем его повторно
        if user_id not in rooms[room_id]['players']:
            rooms[room_id]['players'].append(user_id)
        session['room_id'] = room_id  # Сохраняем ID комнаты в сессии
        return redirect(url_for('room', room_id=room_id))
    else:
        return apology("Room not found", code=404)


# Страница комнаты
@app.route('/room/<room_id>')
@login_required
def room(room_id):
    user_id = session.get('user_id')
    if room_id in rooms:
        creator_id = rooms[room_id]['creator']  # Получаем ID создателя комнаты
        return render_template('room.html', room_id=room_id, players=rooms[room_id]['players'], user_id=user_id, creator_id=creator_id)
    else:
        return apology("Room not found", code=404)

# Обработчик для подключений через WebSocket
@socketio.on('join')
def on_join(data):
    room_id = data.get('room_id')
    user_id = session.get('user_id')

    if room_id and user_id:
        join_room(room_id)  # Подключаем пользователя к комнате

        # Если комната ещё не существует, создаём её
        if room_id not in rooms:
            rooms[room_id] = {'players': []}

        # Добавляем игрока в комнату, если его там ещё нет
        if user_id not in rooms[room_id]['players']:
            rooms[room_id]['players'].append(user_id)

        # Оповещаем комнату о новом пользователе и отправляем актуальный список игроков
        emit('message', {
            'msg': f'{user_id} has joined the room.',
            'players': rooms[room_id]['players']
        }, room=room_id)
        print(f"User {user_id} has joined the room {room_id}. Current players: {rooms[room_id]['players']}")
    else:
        print(f"User {user_id} failed to join the room {room_id}.")


@socketio.on('leave')
def on_leave(data):
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
        print(f"User {user_id} has left the room {room_id}. Current players: {rooms[room_id]['players']}")

# Обработчик нажатия на кнопку "Готов"
@socketio.on('ready')
def on_ready(data):
    room_id = data.get('room_id')
    user_id = session.get('user_id')

    if room_id and user_id:
        # Добавляем пользователя в список готовых игроков
        if room_id in rooms and user_id not in rooms[room_id].get('ready_players', []):
            rooms[room_id].setdefault('ready_players', []).append(user_id)
            print(f"User {user_id} is ready in room {room_id}. Ready players: {rooms[room_id]['ready_players']}")
        
        # Оповещаем всех игроков о текущем состоянии комнаты
        emit('update_ready_players', {
            'ready_players': rooms[room_id]['ready_players'],
            'players': rooms[room_id]['players']
        }, room=room_id)

        # Проверяем, все ли игроки готовы
        if len(rooms[room_id]['ready_players']) == len(rooms[room_id]['players']):
            # Если все игроки готовы, активируем кнопку "Начать игру" только для создателя
            emit('enable_start_game', {'can_start': True}, room=room_id)

# Обработчик для начала игры
@socketio.on('start_game')
def on_start_game(data):
    room_id = data.get('room_id')
    user_id = session.get('user_id')

    if room_id and user_id:
        if rooms[room_id]['creator'] == user_id:
            # Только создатель может начать игру
            emit('game_started', {'msg': 'Game started!'}, room=room_id)
            print(f"Game started in room {room_id} by {user_id}")
        else:
            print(f"User {user_id} tried to start the game without being the creator.")


@app.route('/api/rooms', methods=['GET'])
def get_rooms():
    # Вернем содержимое rooms в формате JSON
    return jsonify(rooms)


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
