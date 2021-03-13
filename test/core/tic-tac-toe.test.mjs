import chai from 'chai';
import { game0 } from '../../src/games/tic-tac-toe.mjs';

chai.should();

describe('Tic Tac Toe', function() {

  it('Should have the correct initial state', function() {
    game0.should.have.property('state').deep.equal({
      grid: [
        { mark: null, row: 0, col: 0}, { mark: null, row: 0, col: 1}, { mark: null, row: 0, col: 2},
        { mark: null, row: 1, col: 0}, { mark: null, row: 1, col: 1}, { mark: null, row: 1, col: 2},
        { mark: null, row: 2, col: 0}, { mark: null, row: 2, col: 1}, { mark: null, row: 2, col: 2}
      ],
      marks: ['x','o']
    });
  });

  it('Should update state when a mark is added to the grid', function() {
    let game = {...game0}; // shallow copy
    game = game.addPlayer('First','1').addPlayer('Second','2');
    game = game.makeMark('1', 0, 0);
    game.should.have.property('state').deep.equal({
      grid: [
        { mark: 'x', row: 0, col: 0}, { mark: null, row: 0, col: 1}, { mark: null, row: 0, col: 2},
        { mark: null, row: 1, col: 0}, { mark: null, row: 1, col: 1}, { mark: null, row: 1, col: 2},
        { mark: null, row: 2, col: 0}, { mark: null, row: 2, col: 1}, { mark: null, row: 2, col: 2}
      ],
      marks: ['x','o']
    });

  });

  

});
