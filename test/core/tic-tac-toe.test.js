import chai from 'chai';
import { game0 } from '../../src/games/tic-tac-toe/tic-tac-toe.js';

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

  // TODO: Should assign a player a mark when they join the game.

  it('Should update state when marks are added to the grid', function() {
    let game = {...game0}; // shallow copy
    game = game.addPlayer('First','1').addPlayer('Second','2');
    game = game.makeMark('1', 0, 0);
    game = game.makeMark('2', 1, 1);
    game.should.have.property('state').deep.equal({
      grid: [
        { mark: 'x', row: 0, col: 0}, { mark: null, row: 0, col: 1}, { mark: null, row: 0, col: 2},
        { mark: null, row: 1, col: 0}, { mark: 'o', row: 1, col: 1}, { mark: null, row: 1, col: 2},
        { mark: null, row: 2, col: 0}, { mark: null, row: 2, col: 1}, { mark: null, row: 2, col: 2}
      ],
      marks: ['x','o']
    });
  });

  it('Should find the winner if there is a three-in-a-row', function() {
    let game = {...game0}; // shallow copy
    game = game.addPlayer('First','1').addPlayer('Second','2');
    game = game.makeMark('1', 0, 0).makeMark('2', 1, 1).
      makeMark('1', 0, 1).makeMark('2', 1, 0).
      makeMark('1', 0, 2).findTheWinner();

    game.should.have.property('state').deep.equal({
      grid: [
        { mark: 'x', row: 0, col: 0}, { mark: 'x', row: 0, col: 1}, { mark: 'x', row: 0, col: 2},
        { mark: 'o', row: 1, col: 0}, { mark: 'o', row: 1, col: 1}, { mark: null, row: 1, col: 2},
        { mark: null, row: 2, col: 0}, { mark: null, row: 2, col: 1}, { mark: null, row: 2, col: 2}
      ],
      marks: ['x','o']
    });

    game.should.have.property('theWinner').equal('1');
    
  });  

  

});
