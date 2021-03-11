import chai from 'chai';
import { game } from '../../src/game.mjs';

chai.should();

describe('Game', function() {

  it('Should keep track of the current phase', function() {
    game.should.have.property('currentPhase').equal('boot');
    let game1 = game.nextPhase();
    game1.should.have.property('currentPhase').equal('setup');
    game1 = game1.nextPhase();
    game1.should.have.property('currentPhase').equal('play');
    game1 = game1.nextPhase();
    game1.should.have.property('currentPhase').equal('end');
    game1 = game1.nextPhase();
    game1.should.have.property('currentPhase').equal('boot');
  });

  it('Should clear the player, state, and actions properties on reset()', function() {
    let game1 = {...game}; // shallow copy
    game1.players = [ 'one', 'two'];
    game1.state = { foo: 'bar' };
    game1.actions = { baz: 'fuz' };
    game1.should.have.property('players').that.is.not.empty;
    game1.should.have.property('state').that.is.not.empty;
    game1.should.have.property('actions').that.is.not.empty;
    game1 = game1.reset();
    game1.should.have.property('players').that.is.empty;
    game1.should.have.property('state').that.is.empty;
    game1.should.have.property('actions').that.is.empty;
  });

  it('Should add players when we ask it to', function() {
    let game1 = game;
    game1.should.have.property('players').that.is.empty;
    game1 = game1.addPlayer('name', 'socket');
    game1.should.have.property('players').deep.equal([
      {name: 'socket'}
    ]);
    game1 = game1.addPlayer('other', 'player');
    game1.should.have.property('players').deep.equal([
      {name: 'socket'},
      {other: 'player'}
    ]);
  });

});
