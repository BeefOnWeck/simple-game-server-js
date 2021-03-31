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
        
      ]
    });
  });

  it('Should shuffle the deck of cards pseudorandomly', function() {
    let game = selectGame('Blackjack');

    const N = 10000;
    // let counts = Array.from({length: game.state.deck.length}, () => {
    //   return game.state.deck.map(v => ({...v, count: 0}));
    // });
    let counts = game.state.deck.map(v => {
      return {
        ...v,
        hist: Array.from({length: game.state.deck.length}, h => 0)
      }
    });

    for (let i = 0; i < N; i++) {
      game = game.shuffleDeck();
      game.state.deck.forEach((card, cardIndex) => {
        const countIndex = counts.findIndex(c => {
          return c.suit === card.suit 
              && c.rank === card.rank;
        });
        counts[countIndex].hist[cardIndex]++;
      });
    }

    console.log(counts[1].hist.map(h => h));

    // TODO: What is the expected value and variance for each histogram bin?
    // Assume card distribution is supposed to be uniformly distributed.
    // Then each bin should be identically distributed as binomial(N,1/52).
    // Expected value for each bin is just N/52.
    // Variance is just N*(1/52)*(51/52).
    // For N = 10000, these are E[X] = 192.31 and var[X] = 188.61.
    // The standard deviation is sqrt(188.61) = 13.73.
    // Really should calculate tail probabilities via the CDF, but a really 
    // loose estimate would be to expect each bin to be 192 +/- 42 = [150, 234].
    // Maybe not such a bad approximation since N is large.
  });

});