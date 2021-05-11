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
      roads: [],
      rollResult: 0
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

  it('Should be able to reset the board', function() {
    let game = selectGame('Hexagon Island');
    game = game.setup(100, 2);

    game.state.centroids.should.have.length(4);
    game.state.nodes.should.have.length(20);
    game.state.hexagons.should.have.length(4);
    game.state.numbers.should.have.length(4);
    game.state.roads.should.have.length(24);

    game = game.reset();

    game.should.have.property('state').deep.equal({
      centroids: [],
      nodes: [],
      hexagons: [],
      numbers: [],
      roads: [],
      rollResult: 0
    });    

  });

  it('Should be able to setup() different size boards', function() {
    let game = selectGame('Hexagon Island');
    game = game.setup(100, 2);

    game.state.centroids.should.have.length(4);
    game.state.nodes.should.have.length(20);
    game.state.hexagons.should.have.length(4);
    game.state.numbers.should.have.length(4);
    game.state.roads.should.have.length(24);

    game = game.setup(100, 3);

    game.state.centroids.should.have.length(7);
    game.state.nodes.should.have.length(24);
    game.state.hexagons.should.have.length(7);
    game.state.numbers.should.have.length(7);
    game.state.roads.should.have.length(42);

    game = game.setup(100, 4);

    game.state.centroids.should.have.length(14);
    game.state.nodes.should.have.length(50);
    game.state.hexagons.should.have.length(14);
    game.state.numbers.should.have.length(14);
    game.state.roads.should.have.length(84);

  });

  it('Should allow dice to be rolled', function() {

    let game = selectGame('Hexagon Island');
    
    game.state.rollResult.should.equal(0);
    game = game.rollDice();
    game.state.rollResult.should.not.equal(0);

  });

  it('Should roll the dice pseudorandomly', function() {
    // The sum total of rolling two dice can range between 2 and 12.
    // There are 6 * 6 = 36 possible combinations of the two die rolls.
    // The histogram (counts vs. dice total) of the 36 possible 
    // combinations should look like the following if die are random:
    //
    //                                      x
    //                                  x   x   x
    //                              x   x   x   x   x
    // ^                        x   x   x   x   x   x    x
    // |                    x   x   x   x   x   x   x    x    x
    // Counts           x   x   x   x   x   x   x   x    x    x    x
    // Dice total --> | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |

    let game = selectGame('Hexagon Island');

    const N = 10000; // Number of trials

    // Create an empty histogram
    let histogram = Array.from({length: 11}, (h,i) => {
      return {
        bin: i+2,
        count: 0
      };
    });

    // For each trial:
    // for (let i = 0; i < N; i++) {
    //   game = game.rollDice();
    //   histogram[game.rollResult-2].count++;
    // }

    // // Define the expected upper and lower bounds
    // const mu = N/52;
    // const sigma = Math.sqrt(N*51/52/52);
    // const lowerBound = mu - 4*sigma;
    // const upperBound = mu + 4*sigma;

    // // Now loop over all histogram bins and check for outliers
    // let numberOfOutliers = 0;
    // counts.forEach(card => {
    //   card.hist.forEach(hits => {
    //     if (hits < lowerBound || hits > upperBound) numberOfOutliers++;
    //   });
    // });

    // numberOfOutliers.should.equal(0);

  });



});