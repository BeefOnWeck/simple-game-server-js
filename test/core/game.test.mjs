import chai from 'chai';
import { game } from '../../src/game.mjs';

chai.should();

describe('Fame', function() {

  it('Should keep track of the current phase', function() {
    game.should.have.property('currentPhase').equal('boot');
    const game1 = game.nextPhase();
    game1.should.have.property('currentPhase').equal('setup');
    const game2 = game1.nextPhase();
    game2.should.have.property('currentPhase').equal('play');
    const game3 = game2.nextPhase();
    game3.should.have.property('currentPhase').equal('end');
    const game4 = game3.nextPhase();
    game4.should.have.property('currentPhase').equal('boot');
  });

  it('Should clear the player, state, and actions properties on reset()', function() {
    const game1 = {...game}; // shallow copy
    game1.players = [ 'one', 'two'];
    game1.state = { foo: 'bar' };
    game1.actions = { baz: 'fuz' };
    game1.should.have.property('players').that.is.not.empty;
    game1.should.have.property('state').that.is.not.empty;
    game1.should.have.property('actions').that.is.not.empty;
    const game2 = game.reset();
    game2.should.have.property('players').that.is.empty;
    game2.should.have.property('state').that.is.empty;
    game2.should.have.property('actions').that.is.empty;
  });

  it('Should add players when we ask it to', function() {
    game.should.have.property('players').that.is.empty;
    const game1 = game.addPlayer('name', 'socket');
    game1.should.have.property('players').deep.equal([
      {name: 'socket'}
    ]);
    const game2 = game1.addPlayer('other', 'player');
    game2.should.have.property('players').deep.equal([
      {name: 'socket'},
      {other: 'player'}
    ]);
  });

});
