# simple-game-server-js
A simple multi-player, turned-based game server written in JavaScript.

## Prerequisites
- NodeJS (tested so far with v12)

## To Run
This is meant to be run in conjuction with [simple-game-client-js](https://github.com/BeefOnWeck/simple-game-client-js).

### Localhost
1. `npm start` in this project
2. `yarn serve` in [simple-game-client-js](https://github.com/BeefOnWeck/simple-game-client-js)
3. Open a browser window to the game (e.g., `http://localhost:8080/tic-tac-toe.html`), which will cause a new player to join the game

### Tests
`npm run tests` (these should all pass; test coverage not 100%)

### Linting
`npm run lint` (expect to see lots of errors)