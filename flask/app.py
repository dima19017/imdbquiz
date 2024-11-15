import os

from functools import wraps
from cs50 import SQL
from flask import Flask, flash, redirect, render_template, request, session
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash
import sqlite3

# Конфигурируем приложение
app = Flask(__name__)

# Конфигурируем сессии использовать ФС (вместо подписанных куки)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
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