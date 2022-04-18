import chai, { should } from 'chai';
import { gameCore } from '../../src/games/gameCore.js';
import { selectGame, getMeta, getConfig, bindToGame } from '../../src/games/gameSelector.js';
import { bindHandlers } from '../../src/socketHandlers.js';

chai.should();

describe('Server', function() {

  // Mock socket.io
  let io = {};
  io.to = (pid) => (mt,mc) => {};

  // Setup game core and bind the socket.io handlers to it
  const [getGame,setGame] = bindToGame({});
  setGame(gameCore);
  const [join, rejoin, action, endTurn] = bindHandlers(io, getGame, setGame);


  it('Should allow players to join', function() {
    // Start with a fresh game core object
    let game = getGame();
    game = game.reset();
    setGame(game);

    // Have two players join via mocked sockets
    join({id: 'id1'})('username1',(o)=>{});
    join({id: 'id2'})('username2',(o)=>{});

    game = getGame();
    game.should.have.property('players').deep.equal([
      {
        name: 'username1',
        id: 'id1'
      },
      {
        name: 'username2',
        id: 'id2'
      }
    ]);
  });

  it('Should allow players to rejoin', function() {
    // Start with a fresh game core object
    let game = getGame();
    game = game.reset();
    setGame(game);

    // Have two players join via mocked sockets
    join({id: 'id1'})('username1',(o)=>{});
    join({id: 'id2'})('username2',(o)=>{});

    game = getGame();
    game.activePlayerId.should.equal('id1');
    game.firstPlayerId.should.equal('id1');

    rejoin({id: 'id3'})('username1',(o)=>{});

    game = getGame();
    game.activePlayerId.should.equal('id3');
    game.firstPlayerId.should.equal('id3');

    rejoin({id: 'id4'})('username2',(o)=>{});

    game = getGame();
    game.should.have.property('players').deep.equal([
      {
        name: 'username1',
        id: 'id3'
      },
      {
        name: 'username2',
        id: 'id4'
      }
    ]);
  });
  

});
