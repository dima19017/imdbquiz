# IMDBquiz
#### Video Demo:  https://youtu.be/xCcvfVs9RGw
#### Description:
My final project is a multiplayer game where players compete in guessing the movie by clues.
You have to guess several movies in the game. Each movie has 3 rounds of hints. The sooner you can guess the movie, the more points you get.
If you guess the movie from the first clue, you get 3 points, from the second 2 points, from the third 1 point.
The leaderboard is shown at the end of the game.
##### layout.html
This is an HTML template for the application, that includes navigation bar, section for flashed messages and blocks for customizing the title and main content.
##### register.html
This is registration page with: registration form for new users, error messages for validation fails and submit button, posting the form data to the /register route
##### login.html
This file defines the login page and include: form for user authentication and submit button. The form posts the login data to the /login route.
##### index.html
File of the Main page with dynamic Main Menu, provides functionality for creating and joining multiplayer rooms. Includes:
- dynamic user display
- create room with button that fetch request to /handle_create_room via POST and redirect to new room, if server responds
- join room button with input form, that fetch request to /handle_join_room and handle success or failure cases
- game description
- socket.io integration
##### room.html
This file implements a room interface, using Flask templates and Socket.io. Players can join, toggle their ready status, and creator of the room can start the game if all players are ready. Key features, that I found interesting:
- dynamic list of players update
- dynamic ready status of players update
- start button only for creator of the room
- creator can't start the game if not all players are ready
##### game.html
Main game file, that serves interface for players participating in a multiplayer quiz game. It dynamically displays game info and allows players to interact with game in real time. Key components include:
- room and game info, including: room ID, timer, steps and rounds progress
- hints for the movies
- answer button, that allows user to sent only one question in round and prevent him from sending multiply answers for the round
- leaderboard
- navigation to a next room, that appear after game is end.
##### imdbquiz.db
Main database file that includes only 1 table, called users, that contains:
- id - int primary key
- username - text not null
- hash - password hash
it is used for several purposes, such as:
- keep info about players that register on the registration page
- check if username and password correct when player login on login page
- check for username when showing players in room and on leaderboard table
##### styles.css
This file in a CSS used to define the appearance and layout of the webpages. Key styles here is:
- Georgia serif font with a light background color and dark text with soft shadows
- Nav bar with golden background and dark border for a little historical feel
- Buttons have a dark brown color and change appearance on hover or when clicked
##### requirements.txt
This file specify the dependencies that are required to run the project
##### app.py
Main server file, that implements all of server logic. Let's dive deep into all key features of this file:
###### dependencies, app config and global env
3 early blocks of the file contains all dependencies, main one are: flask, socketio, session, sql and logging, for sure. A little bit of configuration: database, sessions, socketio and app, in general. Global envs:
- envs for TMDB api integration.
- MOVIE_COUNTER - set amount of rounds in one game
- rooms - main env for room information store
- game_data and game_hints - serve for additional information about room
###### Helpers Functions
This section contains helper functions and routes, such as:
- apology - for render an apology message as David teach us on his last lections
- login_required - decorator that ensures a user must be logged in to access specific routes
- after_request - for responses not to cached
- api for timer and rooms - this two help me a lot in my app debugging
###### Main routes
This part handles several key routes for user authentication and registration:
- index route - passed user to the index.html template
- login route - allow user to login into web app
- logout route - does what its name says
- register route - does exactly what it says
###### Room routes
Hard part of the app, that implements kay features of a socketio and handles room events:
- handle_create_room - handle room creation, generate room_id, saving it to session, redirect user to the room page
- room/<room_id> - displays the room's page based on room_id
- handle_join_room - allow a user to join an existing room
websocket event handlers:
- join - biggest moment of my work. Add a user to specified room, updating the list of players. Send an update with players username (take it from db) and current state of the room. If all players are ready, enable the start game button
- leave - removes a user from the room, updates list of players
- ready - marks a player as ready. If all players ready send enable_start_game emit on client
- start_ game - allows the creator of the room to start the game
###### Timer
Implement a timer for game. Each round consists of several steps (hints) and each step lasts a set duration.
- start_timer - this function initializes the timer for specific room
- update_timer - Runs in a separate thread and keeps track of elapsed time for each step and round. Once all steps in a round are finished, it transitions to the next round and resets the step count.
- on_get_remaining_time(data) - WebSocket event that retrieves the remaining time for the current step and sends updates and hints to players. After all rounds end it calculates leaderboard and send it to players
###### Game
Main code for quiz functionality, that create a game room, allows users to submit their answers and calculate leaderboard in the end
- game/<room_id> - Starts a game in a specified room by fetching a set of random movies
- submit_answer - socketio event that allow Players submit their answers to the movie quiz. The system checks the correctness of each answer and stores the result. After all players submit their answers, scores are calculated and a leaderboard is created.
###### Get film function
Api integration with TMDB for fetching a movies and hints for them from tmdb site: A movie is fetched randomly from the TMDB API based on popularity and region. Details include actors, character names, and movie poster links. If the API request fails or no movies are found, errors are logged.