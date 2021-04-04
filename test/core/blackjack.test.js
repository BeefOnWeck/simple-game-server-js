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

      playerHands: {},

      dealerHand: {
        faceDown: [],
        faceUp: []
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
      phase: 'boot',
      round: 0,
      activePlayer: 'id1',
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
        dealerHand: {
          faceDown: [],
          faceUp: []
        },
        playerFunds: [
          { id: 'id1', amount: 100 },
          { id: 'id2', amount: 100 }
        ],
        discardPile: 0,
        playerHands: {
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
      phase: 'boot',
      round: 0,
      activePlayer: 'id1',
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
        dealerHand: {
          faceDown: [],
          faceUp: []
        },
        playerFunds: [
          { id: 'id1', amount: 100 },
          { id: 'id2', amount: 100 }
        ],
        discardPile: 0,
        playerHands: {
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

});