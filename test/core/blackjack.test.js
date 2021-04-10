import chai from 'chai';
import { selectGame } from '../../src/games/gameSelector.js';

chai.should();

describe('Blackjack', function() {

  it('Should have the correct initial state', function() {
    let game = selectGame('Blackjack');
    game.should.have.property('state').deep.equal({
      deck: [

        { suit: 'Clubs', rank: '2' }, 
        { suit: 'Clubs', rank: '3' }, 
        { suit: 'Clubs', rank: '4' }, 
        { suit: 'Clubs', rank: '5' }, 
        { suit: 'Clubs', rank: '6' }, 
        { suit: 'Clubs', rank: '7' }, 
        { suit: 'Clubs', rank: '8' }, 
        { suit: 'Clubs', rank: '9' }, 
        { suit: 'Clubs', rank: '10' }, 
        { suit: 'Clubs', rank: 'Jack' }, 
        { suit: 'Clubs', rank: 'Queen' }, 
        { suit: 'Clubs', rank: 'King' }, 
        { suit: 'Clubs', rank: 'Ace' },

        { suit: 'Diamonds', rank: '2' }, 
        { suit: 'Diamonds', rank: '3' }, 
        { suit: 'Diamonds', rank: '4' }, 
        { suit: 'Diamonds', rank: '5' }, 
        { suit: 'Diamonds', rank: '6' }, 
        { suit: 'Diamonds', rank: '7' }, 
        { suit: 'Diamonds', rank: '8' }, 
        { suit: 'Diamonds', rank: '9' }, 
        { suit: 'Diamonds', rank: '10' }, 
        { suit: 'Diamonds', rank: 'Jack' }, 
        { suit: 'Diamonds', rank: 'Queen' }, 
        { suit: 'Diamonds', rank: 'King' }, 
        { suit: 'Diamonds', rank: 'Ace' },

        { suit: 'Hearts', rank: '2' }, 
        { suit: 'Hearts', rank: '3' }, 
        { suit: 'Hearts', rank: '4' }, 
        { suit: 'Hearts', rank: '5' }, 
        { suit: 'Hearts', rank: '6' }, 
        { suit: 'Hearts', rank: '7' }, 
        { suit: 'Hearts', rank: '8' }, 
        { suit: 'Hearts', rank: '9' }, 
        { suit: 'Hearts', rank: '10' }, 
        { suit: 'Hearts', rank: 'Jack' }, 
        { suit: 'Hearts', rank: 'Queen' }, 
        { suit: 'Hearts', rank: 'King' }, 
        { suit: 'Hearts', rank: 'Ace' },

        { suit: 'Spades', rank: '2' }, 
        { suit: 'Spades', rank: '3' }, 
        { suit: 'Spades', rank: '4' }, 
        { suit: 'Spades', rank: '5' }, 
        { suit: 'Spades', rank: '6' }, 
        { suit: 'Spades', rank: '7' }, 
        { suit: 'Spades', rank: '8' }, 
        { suit: 'Spades', rank: '9' }, 
        { suit: 'Spades', rank: '10' }, 
        { suit: 'Spades', rank: 'Jack' }, 
        { suit: 'Spades', rank: 'Queen' }, 
        { suit: 'Spades', rank: 'King' }, 
        { suit: 'Spades', rank: 'Ace' }
        
      ],

      playerFunds: [],

      playerBets: [],

      playerHands: {
        DEALER: {
          faceDown: [],
          faceUp: []
        }
      },

      discardPile: []

    });
  });

  it('Should shuffle the deck of cards pseudorandomly', function() {
    // If shuffling results in the position of each card being identically 
    // distributed as uniform(0,51), then we can perform an experiment 
    // where we repeatedly shuffle the deck and look at how often each 
    // card ends up in each position. If the assumption is true, then 
    // the counts for each card in each position should be binomial(N,p), 
    // where N = number of trials and p = 1/52.
    //
    // Based on the above, there are a lot of ways we could check to see 
    // how well randomized the deck is after shuffling:
    // 1. Perform a hypothesis test on the histogram bin for every 
    //    card/position pair, checking that it is indeed binomial(N,p).
    // 2. Generate an empirical CDF from all histogram bins and compare this 
    //    to the theoretical binomial(N,1/52) CDF via something like K-L 
    //    divergence.
    // 3. Make a normal approximation and check to ensure that all histogram 
    //    bin count values fall within +/- four standard deviations (99.99%).
    //
    // This test implements approach #3, since the normal approximation is 
    // expected to be pretty good if N is large and p is not too close to 
    // 0 or 1.

    let game = selectGame('Blackjack');

    const N = 10000; // Number of trials

    // Create an unshuffled copy of the deck and add a histogram for each card
    let counts = game.state.deck.map(v => {
      return {
        ...v,
        hist: Array.from({length: game.state.deck.length}, h => 0)
      }
    });

    // For each trial:
    for (let i = 0; i < N; i++) {
      // 1. Get a fresh deck
      game = selectGame('Blackjack');
      // 2. Shuffle it once
      game = game.shuffleDeck();
      // 3. Loop over shuffled deck
      game.state.deck.forEach((card, cardIndex) => {
        // 3.a. Find corresponding index in the unshuffled deck
        const countIndex = counts.findIndex(c => {
          return c.suit === card.suit 
              && c.rank === card.rank;
        });
        // 3.b. Increment the histogram bin for these indices
        counts[countIndex].hist[cardIndex]++;
      });
    }

    // Define the expected upper and lower bounds
    const mu = N/52;
    const sigma = Math.sqrt(N*51/52/52);
    const lowerBound = mu - 4*sigma;
    const upperBound = mu + 4*sigma;

    // Now loop over all histogram bins and check for outliers
    let numberOfOutliers = 0;
    counts.forEach(card => {
      card.hist.forEach(hits => {
        if (hits < lowerBound || hits > upperBound) numberOfOutliers++;
      });
    });

    // Since we're checking for mu +/- 4*sigma, we expect to have only about 
    // 1/15787 of our histogram counts be outliers. Since there are only 
    // 52*52 = 2704 bins, we don't expect any outliers (most of the time).
    numberOfOutliers.should.equal(0);

    // TODO: Consider averaging across cards, which should reduce the 
    // variance of the estimate and allow for tighter confidence intervals.

  });

  it('Should remove a card from the deck when the card is drawn.', function() {
    let game = selectGame('Blackjack');
    game = game.shuffleDeck();
    game.state.deck.should.have.length(52);
    game = game.drawCard(); // no argument means card goes in the discard pile
    game.state.deck.should.have.length(51);
    game.state.discardPile.should.have.length(1);
  });

  it('Should add a card to a player hand when they draw a card.', function() {
    let game = selectGame('Blackjack');
    game = game.shuffleDeck();
    game = game.addPlayer('player1','id1');
    game = game.drawCard('id1');
    game.state.playerHands['id1']['faceDown'].should.have.length(1);
    game.state.deck.should.have.length(51);
    game.state.discardPile.should.have.length(0);
  });

  it('Should hide facedown cards from other players.', function() {
    let game = selectGame('Blackjack');
    game = game.shuffleDeck().addPlayer('player1','id1').addPlayer('player2','id2');
    game = game.drawCard('id1').drawCard('id1', 'faceUp');
    game = game.drawCard('id2').drawCard('id2', 'faceUp');

    let status1 = game.getGameStatus('id1');
    status1.should.deep.equal({
      name: 'Blackjack',
      phase: 'play',
      round: 1,
      activePlayer: 'id1',
      currentActions: ['make-initial-bet'],
      players: [
        {
          name: 'player1',
          id: 'id1'
        },
        {
          name: 'player2',
          id: 'id2'
        }
      ],
      state: {
        deck: 48,
        playerFunds: [
          { id: 'id1', amount: 100 },
          { id: 'id2', amount: 100 }
        ],
        playerBets: [],
        discardPile: 0,
        playerHands: {
          DEALER: {
            faceDown: 0,
            faceUp: []
          },
          id1: {
            faceUp: game.state.playerHands['id1']['faceUp'],
            faceDown: game.state.playerHands['id1']['faceDown']
          },
          id2: {
            faceUp: game.state.playerHands['id2']['faceUp'],
            faceDown: 1
          }
        }
      }
    });
    
    let status2 = game.getGameStatus('id2');
    status2.should.deep.equal({
      name: 'Blackjack',
      phase: 'play',
      round: 1,
      activePlayer: 'id1',
      currentActions: ['make-initial-bet'],
      players: [
        {
          name: 'player1',
          id: 'id1'
        },
        {
          name: 'player2',
          id: 'id2'
        }
      ],
      state: {
        deck: 48,
        playerFunds: [
          { id: 'id1', amount: 100 },
          { id: 'id2', amount: 100 }
        ],
        playerBets: [],
        discardPile: 0,
        playerHands: {
          DEALER: {
            faceDown: 0,
            faceUp: []
          },
          id1: {
            faceUp: game.state.playerHands['id1']['faceUp'],
            faceDown: 1
          },
          id2: {
            faceUp: game.state.playerHands['id2']['faceUp'],
            faceDown: game.state.playerHands['id2']['faceDown']
          }
        }
      }
    });
  });

  it('Should allow players to make bets.', function() {
    let game = selectGame('Blackjack');
    game = game.shuffleDeck().addPlayer('player1','id1').addPlayer('player2','id2');
    game = game.makeBet('id1', 10).makeBet('id2', 10);
    game.state.playerBets.should.deep.equal([
      { id: 'id1', amount: 10 },
      { id: 'id2', amount: 10 }
    ]);
  });

  it('Should deal a player two cards after they submit a bet action.', function() {
    let game = selectGame('Blackjack');
    game = game.shuffleDeck().addPlayer('player1','id1').addPlayer('player2','id2');
    game = game.processActions({
      'make-initial-bet': {
        pid: 'id1',
        amount: 10
      }
    });
    game.state.playerBets.should.deep.equal([
      { id: 'id1', amount: 10 }
    ]);
    game.state.playerHands['id1']['faceDown'].should.have.length(1);
    game.state.playerHands['id1']['faceUp'].should.have.length(1);
    game.state.deck.should.have.length(50);
    game.state.discardPile.should.have.length(0);
  });

  it('Should deal the dealer after dealing the last player.', function() {
    let game = selectGame('Blackjack');
    game = game.shuffleDeck().addPlayer('player1','id1').addPlayer('player2','id2');
    game = game.processActions({
      'make-initial-bet': {
        pid: 'id1',
        amount: 10
      }
    });
    game = game.nextPlayer();
    game = game.processActions({
      'make-initial-bet': {
        pid: 'id2',
        amount: 5
      }
    });
    game = game.nextPlayer();
    game.state.playerBets.should.deep.equal([
      { id: 'id1', amount: 10 },
      { id: 'id2', amount: 5 }
    ]);
    game.state.playerHands['DEALER']['faceDown'].should.have.length(1);
    game.state.playerHands['DEALER']['faceUp'].should.have.length(1);
    game.state.deck.should.have.length(46);
    game.state.discardPile.should.have.length(0);
  });

  it('Should specify the correct current action.', function() {
    let game = selectGame('Blackjack');
    game.currentActions.should.deep.equal([]);
    game = game.shuffleDeck().addPlayer('player1','id1').addPlayer('player2','id2');
    game.currentActions.should.deep.equal([
      'make-initial-bet'
    ]);
    game = game.makeBet('id1', 10).nextPlayer();
    game = game.makeBet('id2', 10).nextPlayer();
    game.currentActions.should.deep.equal([
      'make-move'
    ]);
  });

  it('Should support players making a move after their bet.', function() {
    let game = selectGame('Blackjack', {configNumPlayers: 4});
    game = game.shuffleDeck()
      .addPlayer('player1','id1')
      .addPlayer('player2','id2')
      .addPlayer('player3','id3')
      .addPlayer('player4','id4');

    game = game.makeBet('id1', 10)
      .drawCard('id1')
      .drawCard('id1', 'faceUp')
      .nextPlayer();
    game = game.makeBet('id2', 10)
      .drawCard('id2')
      .drawCard('id2', 'faceUp')
      .nextPlayer();
    game = game.makeBet('id3', 10)
      .drawCard('id3')
      .drawCard('id3', 'faceUp')
      .nextPlayer();
    game = game.makeBet('id4', 10)
      .drawCard('id4')
      .drawCard('id4', 'faceUp')
      .nextPlayer();

    game = game.makeMove('id1', 'Hit');
    game.state.playerHands['id1']['faceDown'].should.have.length(1);
    game.state.playerHands['id1']['faceUp'].should.have.length(2);
    game.state.playerBets.should.deep.equal([
      { id: 'id1', amount: 10 },
      { id: 'id2', amount: 10 },
      { id: 'id3', amount: 10 },
      { id: 'id4', amount: 10 }
    ]);
    game = game.nextPlayer();
    
    game = game.makeMove('id2', 'Stand');
    game.state.playerHands['id2']['faceDown'].should.have.length(1);
    game.state.playerHands['id2']['faceUp'].should.have.length(1);
    game.state.playerBets.should.deep.equal([
      { id: 'id1', amount: 10 },
      { id: 'id2', amount: 10 },
      { id: 'id3', amount: 10 },
      { id: 'id4', amount: 10 }
    ]);
    game = game.nextPlayer();
    
    game = game.makeMove('id3', 'Double');
    game.state.playerHands['id3']['faceDown'].should.have.length(1);
    game.state.playerHands['id3']['faceUp'].should.have.length(2);
    game.state.playerBets.should.deep.equal([
      { id: 'id1', amount: 10 },
      { id: 'id2', amount: 10 },
      { id: 'id3', amount: 20 },
      { id: 'id4', amount: 10 }
    ]);
    game = game.nextPlayer();

    game = game.makeMove('id4', 'Surrender');
    game.state.playerHands['id4']['faceDown'].should.have.length(0);
    game.state.playerHands['id4']['faceUp'].should.have.length(0);
    game.state.playerBets.should.deep.equal([
      { id: 'id1', amount: 10 },
      { id: 'id2', amount: 10 },
      { id: 'id3', amount: 20 },
      { id: 'id4', amount: 5 }
    ]);
    game = game.nextPlayer();
  });

  it('Should resolve dealer hand after all players have made their moves.', function() {
    let game = selectGame('Blackjack', {configNumPlayers: 4});
    game = game.shuffleDeck()
      .addPlayer('player1','id1')
      .addPlayer('player2','id2')
      .addPlayer('player3','id3')
      .addPlayer('player4','id4');

    // Round 1: Make bets
    game = game.makeBet('id1', 10).drawCard('id1')
      .drawCard('id1', 'faceUp').nextPlayer();
    game = game.makeBet('id2', 10).drawCard('id2')
      .drawCard('id2', 'faceUp').nextPlayer();
    game = game.makeBet('id3', 10).drawCard('id3')
      .drawCard('id3', 'faceUp').nextPlayer();
    game = game.makeBet('id4', 10).drawCard('id4')
      .drawCard('id4', 'faceUp').nextPlayer();

    // NOTE: The dealer is delt their cards after all players have made 
    //       their bets and nextPlayer() is called.
    const dealerScore = game.scoreHand('DEALER');

    // Round 1: Make moves
    game = game.makeMove('id1', 'Hit').nextPlayer();
    game = game.makeMove('id2', 'Stand').nextPlayer();
    game = game.makeMove('id3', 'Double').nextPlayer();
    game = game.makeMove('id4', 'Surrender').nextPlayer();

    // NOTE: The dealer hand is resolved after all players have made their 
    //       moves and nextPlayer() is called.
    const newDealerScore = game.scoreHand('DEALER');
    // NOTE: The dealer always hits if their score is below 17
    if (dealerScore < 17) {
      newDealerScore.should.be.above(dealerScore);
    } else {
      newDealerScore.should.equal(dealerScore);
    }
  });

  it('Should turn all cards face up at the end of the round.', function() {
    let game = selectGame('Blackjack', {configNumPlayers: 4});
    game = game.shuffleDeck()
      .addPlayer('player1','id1')
      .addPlayer('player2','id2')
      .addPlayer('player3','id3')
      .addPlayer('player4','id4');

    // Round 1: Make bets
    game = game.makeBet('id1', 10).drawCard('id1')
      .drawCard('id1', 'faceUp').nextPlayer();
    game = game.makeBet('id2', 10).drawCard('id2')
      .drawCard('id2', 'faceUp').nextPlayer();
    game = game.makeBet('id3', 10).drawCard('id3')
      .drawCard('id3', 'faceUp').nextPlayer();
    game = game.makeBet('id4', 10).drawCard('id4')
      .drawCard('id4', 'faceUp').nextPlayer();

    // Round 1: Make moves
    game = game.makeMove('id1', 'Hit').nextPlayer();
    game = game.makeMove('id2', 'Stand').nextPlayer();
    game = game.makeMove('id3', 'Double').nextPlayer();
    game = game.makeMove('id4', 'Surrender').nextPlayer();

    // All cards should now be face up
    game.state.playerHands['id1']['faceDown'].should.have.length(0);
    game.state.playerHands['id1']['faceUp'].should.have.length(3);
    game.state.playerHands['id2']['faceDown'].should.have.length(0);
    game.state.playerHands['id2']['faceUp'].should.have.length(2);
    game.state.playerHands['id3']['faceDown'].should.have.length(0);
    game.state.playerHands['id3']['faceUp'].should.have.length(3);
    game.state.playerHands['id4']['faceDown'].should.have.length(0);
    game.state.playerHands['id4']['faceUp'].should.have.length(0);
    game.state.playerHands['DEALER']['faceDown'].should.have.length(0);
  });

  it('Should resolve player hands at the end of the round.', function() {
    let game = selectGame('Blackjack', {configNumPlayers: 4});
    game = game.shuffleDeck()
      .addPlayer('player1','id1')
      .addPlayer('player2','id2')
      .addPlayer('player3','id3')
      .addPlayer('player4','id4');

    // Round 1: Make bets
    game = game.makeBet('id1', 10).drawCard('id1')
      .drawCard('id1', 'faceUp').nextPlayer();
    game = game.makeBet('id2', 10).drawCard('id2')
      .drawCard('id2', 'faceUp').nextPlayer();
    game = game.makeBet('id3', 10).drawCard('id3')
      .drawCard('id3', 'faceUp').nextPlayer();
    game = game.makeBet('id4', 10).drawCard('id4')
      .drawCard('id4', 'faceUp').nextPlayer();

    // Round 1: Make moves
    game = game.makeMove('id1', 'Hit').nextPlayer();
    game = game.makeMove('id2', 'Stand').nextPlayer();
    game = game.makeMove('id3', 'Double').nextPlayer();
    game = game.makeMove('id4', 'Surrender').nextPlayer();

    // How player hands are resolved depend upon the dealer score
    const dealerScore = game.scoreHand('DEALER');

    const playerOneScore = game.scoreHand('id1');
    const playerOneFunds = game.state.playerFunds
      .filter(fund => fund.id == 'id1')[0].amount;
    if (dealerScore <= 21) {
      if (playerOneScore <= 21) {
        if (playerOneScore > dealerScore) {
          playerOneFunds.should.equal(110);
        } else {
          playerOneFunds.should.equal(90);
        }
      } else {
        playerOneFunds.should.equal(90);
      }
    } else {
      if (playerOneScore <= 21) {
        playerOneFunds.should.equal(110);
      } else {
        playerOneFunds.should.equal(90);
      }
    }

    const playerTwoScore = game.scoreHand('id2');
    const playerTwoFunds = game.state.playerFunds
      .filter(fund => fund.id == 'id2')[0].amount;
    if (dealerScore <= 21) {
      if (playerTwoScore <= 21) {
        if (playerTwoScore > dealerScore) {
          playerTwoFunds.should.equal(110);
        } else {
          playerTwoFunds.should.equal(90);
        }
      } else {
        playerTwoFunds.should.equal(90);
      }
    } else {
      if (playerTwoScore <= 21) {
        playerTwoFunds.should.equal(110);
      } else {
        playerTwoFunds.should.equal(90);
      }
    }

    const playerThreeScore = game.scoreHand('id3');
    const playerThreeFunds = game.state.playerFunds
      .filter(fund => fund.id == 'id3')[0].amount;
    if (dealerScore <= 21) {
      if (playerThreeScore <= 21) {
        if (playerThreeScore > dealerScore) {
          playerThreeFunds.should.equal(120);
        } else {
          playerThreeFunds.should.equal(80);
        }
      } else {
        playerThreeFunds.should.equal(80);
      }
    } else {
      if (playerThreeScore <= 21) {
        playerThreeFunds.should.equal(120);
      } else {
        playerThreeFunds.should.equal(80);
      }
    }

    const playerFourScore = game.scoreHand('id4');
    const playerFourFunds = game.state.playerFunds
      .filter(fund => fund.id == 'id4')[0].amount;
    if (dealerScore <= 21) {
      if (playerFourScore <= 21) {
        if (playerFourScore > dealerScore) {
          playerFourFunds.should.equal(105);
        } else {
          playerFourFunds.should.equal(95);
        }
      } else {
        playerFourFunds.should.equal(95);
      }
    } else {
      if (playerFourScore <= 21) {
        playerFourFunds.should.equal(105);
      } else {
        playerFourFunds.should.equal(95);
      }
    }

  });



});