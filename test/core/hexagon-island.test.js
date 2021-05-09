import chai from 'chai';
import { selectGame } from '../../src/games/gameSelector.js';

chai.should();

describe('Hexagon Island', function() {

  it('Should have the correct initial state', function() {
    let game = selectGame('Hexagon Island', {configNumPlayers: 2});

    game.should.have.property('state').deep.equal({
      centroids: [],
      nodes: [],
      hexagons: [],
      numbers: [],
      roads: []
    });
  });

  it('Should setup the game board correctly', function() {
    let game = selectGame('Hexagon Island', {configNumPlayers: 2});
    game = game.setup(100, 2);

    game.state.centroids.should.have.length(4);
    game.state.nodes.should.have.length(20);
    game.state.hexagons.should.have.length(4);
    game.state.numbers.should.have.length(4);
    game.state.roads.should.have.length(24);

  });

});