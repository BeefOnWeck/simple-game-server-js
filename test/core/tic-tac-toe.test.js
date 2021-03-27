import chai from 'chai';
import { selectGame } from '../../src/games/gameSelector.js';

chai.should();

describe('Tic Tac Toe', function() {

  it('Should have the correct initial state', function() {
    let game = selectGame('Tic Tac Toe');
    game.should.have.property('state').deep.equal({
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
    let game = selectGame('Tic Tac Toe');
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
    let game = selectGame('Tic Tac Toe');
    game = game.addPlayer('First','1').addPlayer('Second','2');
    game = game.makeMark('1', 0, 0)
      .makeMark('2', 1, 1)
      .makeMark('1', 0, 1)
      .makeMark('2', 1, 0)
      .makeMark('1', 0, 2)
      .findTheWinner();

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

  it('Should decorate processActions().', function() {
    let game = selectGame('Tic Tac Toe');
    game = game.addPlayer('First','1').addPlayer('Second','2');
    let action = {
      'make-mark': {
        pid: '1',
        ind: 0
      }
    };
    game = game.processActions(action);
    game.should.have.property('state').deep.equal({
      grid: [
        { mark: 'x', row: 0, col: 0}, { mark: null, row: 0, col: 1}, { mark: null, row: 0, col: 2},
        { mark: null, row: 1, col: 0}, { mark: null, row: 1, col: 1}, { mark: null, row: 1, col: 2},
        { mark: null, row: 2, col: 0}, { mark: null, row: 2, col: 1}, { mark: null, row: 2, col: 2}
      ],
      marks: ['x','o']
    });
  });

  it('Should decorate getGameStatus().', function() {
    let game = selectGame('Tic Tac Toe');
    game = game.nextPhase();
    game = game.addPlayer('name1', 'id1').addPlayer('name2', 'id2');

    // First check the beginning game status
    let gameStatus = game.getGameStatus();
    gameStatus.should.deep.equal({
      phase: 'play',
      round: 1,
      activePlayer: 'id1',
      players: [
        {
          name: 'name1',
          id: 'id1',
          mark: 'x'
        },
        {
          name: 'name2',
          id: 'id2',
          mark: 'o'
        }
      ],
      state: {
        grid: [
          { mark: null, row: 0, col: 0}, { mark: null, row: 0, col: 1}, { mark: null, row: 0, col: 2},
          { mark: null, row: 1, col: 0}, { mark: null, row: 1, col: 1}, { mark: null, row: 1, col: 2},
          { mark: null, row: 2, col: 0}, { mark: null, row: 2, col: 1}, { mark: null, row: 2, col: 2}
        ],
        marks: ['x','o']
      },
      theWinner: null // indicates there is no winner yet
    });

    // Then check game status after a winning move
    game = game.makeMark('id1', 0, 0)
      .makeMark('id2', 1, 1)
      .makeMark('id1', 0, 1)
      .makeMark('id2', 1, 0)
      .makeMark('id1', 0, 2)
      .findTheWinner();

    gameStatus = game.getGameStatus();
    gameStatus.should.deep.equal({
      phase: 'play',
      round: 1,
      activePlayer: 'id1',
      players: [
        {
          name: 'name1',
          id: 'id1',
          mark: 'x'
        },
        {
          name: 'name2',
          id: 'id2',
          mark: 'o'
        }
      ],
      state: {
        grid: [
          { mark: 'x', row: 0, col: 0}, { mark: 'x', row: 0, col: 1}, { mark: 'x', row: 0, col: 2},
          { mark: 'o', row: 1, col: 0}, { mark: 'o', row: 1, col: 1}, { mark: null, row: 1, col: 2},
          { mark: null, row: 2, col: 0}, { mark: null, row: 2, col: 1}, { mark: null, row: 2, col: 2}
        ],
        marks: ['x','o']
      },
      theWinner: 'id1' // lists the id of the winner
    });
    
  });

  // Can't add more than 2 players
  it('Should not allow more than two players to join.', function() {
    let game = selectGame('Tic Tac Toe');
    game = game.nextPhase();
    game = game.addPlayer('name1', 'id1').addPlayer('name2', 'id2');
    game.addPlayer.bind(game, 'name3', 'id3')
      .should.throw(Error, 'Cannot add player; exceeds maximum number of players.');
  });

});
