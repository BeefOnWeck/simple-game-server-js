import chai from 'chai';
import { gameCore } from '../../src/games/gameCore.mjs';

chai.should();

describe('Game Core', function() {

  it('Should keep track of the current phase', function() {
    gameCore.should.have.property('phase').equal('boot');
    let game = gameCore.nextPhase();
    game.should.have.property('phase').equal('setup');
    game = game.nextPhase();
    game.should.have.property('phase').equal('play');
    game = game.nextPhase();
    game.should.have.property('phase').equal('end');
    game = game.nextPhase();
    game.should.have.property('phase').equal('end');
  });

  it('Should clear the player, state, and actions properties on reset()', function() {
    let game = {...gameCore}; // shallow copy
    game.players = [ 'one', 'two'];
    game.state = { foo: 'bar' };
    game.actions = { baz: 'fuz' };
    game.should.have.property('players').that.is.not.empty;
    game.should.have.property('state').that.is.not.empty;
    game.should.have.property('actions').that.is.not.empty;
    game = game.reset();
    game.should.have.property('players').that.is.empty;
    game.should.have.property('state').that.is.empty;
    game.should.have.property('actions').that.is.empty;
  });

  it('Should add players when we ask it to', function() {
    let game = gameCore;
    game.should.have.property('players').that.is.empty;
    game = game.addPlayer('name', 'socket');
    game.should.have.property('players').deep.equal([
      {
        name: 'name',
        id: 'socket'
      }
    ]);
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
  });

});
