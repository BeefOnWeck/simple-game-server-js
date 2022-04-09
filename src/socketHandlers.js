
/**
 * 
 * @param {*} io 
 * @param {*} getGame 
 * @param {*} setGame 
 * @returns 
 */
export const joinHandler = (io, getGame, setGame) => (socket) => (username, callback) => {

  let game = getGame();
  socket.username = username ?? '';
  console.log('username', username);

  if (game.phase && game.phase == 'boot') {
    // Add them to the game
    try {
      game = game.addPlayer(username, socket.id);
      callback({status: 'You have been added.'});
    } catch (e) {
      callback({status: e.message});
    }
  
    if (game.phase == 'setup' || game.phase == 'play') {
      // Send game status to each player
      game.players.forEach(player => {
        io.to(player.id).emit('game-state',
          game.getGameStatus(player.id)
        );
      });
      // Tell player 1 it's their turn
      io.to(game.firstPlayerId).emit('it-is-your-turn', 
        game.possibleActions
      );
    }

  } else if (game.phase && (game.phase == 'setup' || game.phase == 'play')) {
    callback({status: 'Game has already booted'});
  } else {
    callback({status: 'Game has not booted yet'});
  }

  setGame(game);

};

/**
 * 
 * @param {*} io 
 * @param {*} getGame 
 * @param {*} setGame 
 * @returns 
 */
export const rejoinHandler = (io, getGame, setGame) => (socket) => (username, callback) => {

  let game = getGame();

  try {
    game = game.reconnectPlayer(username, socket.id);
    callback({status: 'You have been reconnected.'});
    game.players.forEach(player => {
      io.to(player.id).emit('game-state',
        game.getGameStatus(player.id)
      );
    });
  } catch (e) {
    callback({status: e.message});
  }

  setGame(game);
};

/**
 * 
 * @param {*} io 
 * @param {*} getGame 
 * @param {*} setGame 
 * @returns 
 */
export const actionHandler = (io, getGame, setGame) => (socket) => (actions, callback) => {

  let game = getGame();

  if (game.phase == 'setup' || game.phase === 'play') {
    if (socket.id === game.activePlayerId) {
      try {
        game = game.processAction(actions);
      } catch (e) {
        callback({status: e.message});
      }
      // Send game status to all players
      game.players.forEach(player => {
        io.to(player.id).emit('game-state',
          game.getGameStatus(player.id)
        );
      });
      // Tell the active player it is their turn
      if (game.phase != 'end') {
        io.to(game.activePlayerId).emit('it-is-your-turn',
          game.possibleActions
        );
      }
    } else {
      callback({status: 'It is not your turn'});
    }
  } else {
    callback({status: 'Play has not started yet'});
  }

  setGame(game);
};

/**
 * 
 * @param {*} io 
 * @param {*} getGame 
 * @param {*} setGame 
 * @returns 
 */
export const endTurnHandler = (io, getGame, setGame) => (socket) => (_, callback) => {

  let game = getGame();

  if (game.phase == 'play') {
    if (socket.id == game.activePlayerId) {
      try {
        game = game.nextPlayer();
        game.players.forEach(player => {
          io.to(player.id).emit('game-state',
            game.getGameStatus(player.id)
          );
        });
        io.to(game.activePlayerId).emit('it-is-your-turn',
          game.possibleActions
        );
      } catch (e) {
        callback({status: e.message});
      }
    } else {
      callback({status: 'It is not your turn'});
    }
  } else {
    callback({status: 'Play has not started yet'});
  }

  setGame(game);

};