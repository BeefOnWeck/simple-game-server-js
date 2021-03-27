import chai, { should } from 'chai';
import { gameCore } from '../../src/games/gameCore.js';

chai.should();

describe('Game Core', function() {

  it('Should keep track of the current phase', function() {
    let game = {...gameCore}; // shallow copy
    game.should.have.property('phase').equal('boot');
    game = game.nextPhase();
    game.should.have.property('phase').equal('setup');
    game = game.nextPhase();
    game.should.have.property('phase').equal('play');
    game = game.nextPhase();
    game.should.have.property('phase').equal('end');
    game = game.nextPhase();
    game.should.have.property('phase').equal('end');
  });

  it('Should keep track of the current round', function() {
    let game = {...gameCore}; // shallow copy
    game.should.have.property('round').equal(0);
    game = game.nextRound();
    game.should.have.property('round').equal(1);
    game = game.nextRound();
    game.should.have.property('round').equal(2);
    game = game.reset();
    game.should.have.property('round').equal(0);
  });

  it('Should clear the player, state, and actions properties on reset()', function() {
    let game = {...gameCore}; // shallow copy
    game = game.addPlayer('name1', 'id1').addPlayer('name2', 'id2');
    game.state = { foo: 'bar' };
    game.actions = { baz: 'qux' };
    game.should.have.property('players').that.is.not.empty;
    game.should.have.property('state').that.is.not.empty;
    game.should.have.property('actions').that.is.not.empty;
    game = game.reset();
    game.should.have.property('players').that.is.empty;
    game.should.have.property('state').that.is.empty;
    game.should.have.property('actions').that.is.empty;
  });

  it('Should add players when we ask it to', function() {
    let game = {...gameCore}; // shallow copy
    game.should.have.property('players').that.is.empty;
    game = game.addPlayer('name', 'socket');
    game.should.have.property('players').deep.equal([
      {
        name: 'name',
        id: 'socket'
      }
    ]);
    game.should.have.property('numPlayers').equal(1);
    game = game.addPlayer('other', 'player');
    game.should.have.property('players').deep.equal([
      {
        name: 'name',
        id: 'socket'
      },
      {
        name: 'other',
        id: 'player'
      }
    ]);
    game.should.have.property('numPlayers').equal(2);
  });

  it('Should set the activePlayer when asked to', function() {
    let game = {...gameCore}; // shallow copy
    game = game.addPlayer('name1', 'id1').addPlayer('name2', 'id2');
    game.should.have.property('activePlayerId').equal('id1');
    game = game.setActivePlayer('id2');
    game.should.have.property('activePlayerId').equal('id2');
  });

  it('Should throw an error on setActivePlayer(invalid_id)', function() {
    let game = {...gameCore}; // shallow copy
    game = game.addPlayer('name1', 'id1').addPlayer('name2', 'id2');
    game.setActivePlayer.bind(game, 'id42')
      .should.throw(Error, 'Cannot set an invalid ID as the active player.');
  });

  it('Should go to the next player when asked', function() {
    let game = {...gameCore}; // shallow copy
    game = game.addPlayer('name1', 'id1').addPlayer('name2', 'id2')
      .addPlayer('name3', 'id3').addPlayer('name4', 'id4');
    game.should.have.property('activePlayerId').equal('id1');
    game.should.have.property('round').equal(0);
    game.should.have.property('numPlayers').equal(4);
    game = game.nextPlayer();
    game.should.have.property('activePlayerId').equal('id2');
    game.should.have.property('round').equal(0);
    game = game.nextPlayer();
    game.should.have.property('activePlayerId').equal('id3');
    game.should.have.property('round').equal(0);
    game = game.nextPlayer();
    game.should.have.property('activePlayerId').equal('id4');
    game.should.have.property('round').equal(0);
    game = game.nextPlayer();
    game.should.have.property('activePlayerId').equal('id1');
    game.should.have.property('round').equal(1);
  });

});
