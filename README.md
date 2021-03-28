# simple-game-server-js
A simple multi-player, turned-based game server written in JavaScript.

## Prerequisites
- NodeJS (v14+)
- NPM (v7+)

## To Run
This is meant to be run in conjuction with [simple-game-client-js](https://github.com/BeefOnWeck/simple-game-client-js).

### Localhost
1. `npm start` in this project
2. `yarn serve` in [simple-game-client-js](https://github.com/BeefOnWeck/simple-game-client-js)
3. Open a browswer window to the game configuration page
  - Currently hard-coded to `http://localhost:3000/`
4. Click on "Start new game", which will open a modal window
5. Select the game, configure settings, and then hit start
6. Open a browser window for the client
  - URL depends upon game
  - E.g., `http://localhost:8080/tic-tac-toe.html`
  - One window/tab per player
  - Opening window/tab creates a socket connection with server
7. Join the game by entering a username

## Code Quality

### Tests
`npm run tests` (these should all pass)

### Coverage
`npm run coverage` (coverage is not 100%)

### Linting
`npm run lint` (expect to see lots of errors)