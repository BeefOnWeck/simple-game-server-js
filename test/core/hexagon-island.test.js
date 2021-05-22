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
      rollResult: 0,
      playerResources: {}
    });
  });

  it('Should setup the game board correctly', function() {
    let game = selectGame('Hexagon Island', {configNumPlayers: 2});
    game = game.setup(3);

    game.state.centroids.should.have.length(7);
    game.state.nodes.should.have.length(24);
    game.state.hexagons.should.have.length(7);
    game.state.numbers.should.have.length(7);
    game.state.roads.should.have.length(30);

  });

  it('Should be able to reset the board', function() {
    let game = selectGame('Hexagon Island');
    game = game.setup(3);

    game.state.centroids.should.have.length(7);
    game.state.nodes.should.have.length(24);
    game.state.hexagons.should.have.length(7);
    game.state.numbers.should.have.length(7);
    game.state.roads.should.have.length(30);

    game = game.reset();

    game.should.have.property('state').deep.equal({
      centroids: [],
      nodes: [],
      hexagons: [],
      numbers: [],
      roads: [],
      rollResult: 0,
      playerResources: {}
    });    

  });

  it('Should be able to setup() different size boards', function() {
    let game = selectGame('Hexagon Island');
    game = game.setup(3);

    game.state.centroids.should.have.length(7);
    game.state.nodes.should.have.length(24);
    game.state.hexagons.should.have.length(7);
    game.state.numbers.should.have.length(7);
    game.state.roads.should.have.length(30);

    game = game.reset().setup(4);

    game.state.centroids.should.have.length(14);
    game.state.nodes.should.have.length(50);
    game.state.hexagons.should.have.length(14);
    game.state.numbers.should.have.length(14);
    game.state.roads.should.have.length(62);

  });

  it('Should build a canonical sized board with the correct number of resources', function() {

    let game = selectGame('Hexagon Island');
    game = game.setup(5);

    game.state.centroids.should.have.length(19);
    game.state.nodes.should.have.length(54);
    game.state.hexagons.should.have.length(19);
    game.state.numbers.should.have.length(19);
    game.state.roads.should.have.length(72); // TODO: These should be unique

    let numBlock = game.state.hexagons.filter(h => {
      return h.resource == 'block';
    }).length;

    numBlock.should.equal(3);

    let numRock = game.state.hexagons.filter(h => {
      return h.resource == 'rock';
    }).length;

    numRock.should.equal(3);

    let numTimber = game.state.hexagons.filter(h => {
      return h.resource == 'timber';
    }).length;

    numTimber.should.equal(4);

    let numCereal = game.state.hexagons.filter(h => {
      return h.resource == 'cereal';
    }).length;

    numCereal.should.equal(4);

    let numFiber = game.state.hexagons.filter(h => {
      return h.resource == 'fiber';
    }).length;

    numFiber.should.equal(4);

    let numDesert = game.state.hexagons.filter(h => {
      return h.resource == 'desert';
    }).length;

    numDesert.should.equal(1);

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

    // Compute basic expected values
    histogram = histogram.map((h,i) => {
      const expected_probability = (i+2 < 8 ? i+1.0 : 11.0-i) / 36.0;
      const expected_value = N * expected_probability;
      const standard_deviation = Math.sqrt(expected_value * (1-expected_probability));
      return {
        ...h,
        expected_probability,
        expected_value,
        standard_deviation
      };
    })

    // For each trial:
    for (let i = 0; i < N; i++) {
      game = game.rollDice();
      histogram[game.state.rollResult-2].count++;
    }

    // Now loop over all histogram bins and check for outliers
    let numberOfOutliers = 0;
    histogram.forEach(h => {
      const lowerBound = h.expected_value - 4.0*h.standard_deviation;
      const upperBound = h.expected_value + 4.0*h.standard_deviation;
      if (h.count < lowerBound || h.count > upperBound) numberOfOutliers++;
    });

    numberOfOutliers.should.equal(0);

  });

  it('Should build a road when asked', function() {

    let game = selectGame('Hexagon Island');
    game = game.setup(3);

    game.state.roads.should.have.length(30);

    let builtRoads = game.state.roads.filter(r => {
      return r.playerId !== null;
    });

    builtRoads.should.have.length(0);

    // first have to make an adjacent building
    game = game.makeBuilding(0, 'playerIdString', 'village');

    const roadIndex = 0;
    game = game.buildRoad(roadIndex,'playerIdString');

    builtRoads = game.state.roads.filter(r => {
      return r.playerId !== null;
    });

    builtRoads.should.have.length(1);

  });

  it('Should build on a node when asked', function() {

    let game = selectGame('Hexagon Island');
    game = game.setup(3);

    game.state.nodes.should.have.length(24);

    let buildings = game.state.nodes.filter(n => {
      return n.playerId !== null;
    });

    buildings.should.have.length(0);

    const nodeIndex = 0;
    game = game.makeBuilding(nodeIndex, 'playerIdString', 'village');

    buildings = game.state.nodes.filter(n => {
      return n.playerId !== null;
    });

    buildings.should.have.length(1);

  });

  it('Should assign players a color when they join the game', function() {

    let game = selectGame('Hexagon Island');
    game = game.setup(3);

    game = game.addPlayer('name1','id1').addPlayer('name2','id2');

    game.should.have.property('players').deep.equal([
      {
        name: 'name1',
        id: 'id1',
        color: '#8b0000'
      },
      {
        name: 'name2',
        id: 'id2',
        color: '#00008b'
      }
    ]);
  });

  it('Should prevent a new building from being constructed within two spaces of an existing building', function() {
    
    let game = selectGame('Hexagon Island');
    game = game.setup(3);

    game = game.makeBuilding(0, 'pid1', 'village');
    game = game.buildRoad(0, 'pid1');

    game = game.makeBuilding(2, 'pid1', 'village');
    game = game.buildRoad(1, 'pid1');

    game.makeBuilding.bind(game, 3, 'pid2', 'burgh')
      .should.throw(Error, 'Cannot place a building there; you must respect the two-space rule.');

    game = game.makeBuilding(4, 'pid2', 'burgh');

  });

  it('Should prevent a village from being built on a node with an existing village', function() {
    
    let game = selectGame('Hexagon Island');
    game = game.setup(3);

    game = game.makeBuilding(0, 'pid1', 'village');

    game.makeBuilding.bind(game, 0, 'pid2', 'village')
      .should.throw(Error, 'Cannot place a village on a space that already has a village.');

    game = game.makeBuilding(2, 'pid2', 'village');

  });

  it('Should enforce road-building to occur next to other buildings and roads', function() {

    let game = selectGame('Hexagon Island');
    game = game.setup(3);

    game = game.makeBuilding(0, 'pid1', 'village');
    game = game.buildRoad(1, 'pid1');

    // Can't build here because it isn't connected to the other road
    game.buildRoad.bind(game, 3, 'pid1')
      .should.throw(Error, 'Roads have to be built next to other roads or buildings you own.');    

    // But we can build there if we first build the connecting road
    game = game.buildRoad(2, 'pid1');
    game = game.buildRoad(3, 'pid1');

    // This connects to the other side of the building
    game = game.buildRoad(0, 'pid1');

  });

  it('Should prevent a road from being built on another road', function() {
    
    let game = selectGame('Hexagon Island');
    game = game.setup(3);

    game = game.makeBuilding(0, 'pid1', 'village');
    game = game.buildRoad(1, 'pid1');

    game.buildRoad.bind(game, 1, 'pid2')
      .should.throw(Error, 'Cannot build a road on top of an existing road.');

  });

  it('Should be able to assign players resources', function() {

    let game = selectGame('Hexagon Island');
    game = game.setup(3);

    game = game.addPlayer('name1','id1');

    game.state.playerResources.should.deep.equal({
      id1: {
        block: 0,
        timber: 0,
        fiber: 0,
        cereal: 0,
        rock: 0
      }
    });

    game = game.assignResources('id1', 'block');

    game.state.playerResources.should.deep.equal(
      {
        id1: {
          block: 1,
          timber: 0,
          fiber: 0,
          cereal: 0,
          rock: 0
        }
      }
    );

  });

  it('Should be able to deduct resources from players', function() {

    let game = selectGame('Hexagon Island');
    game = game.setup(3);

    game = game.addPlayer('name1','id1');

    game = game.assignResources('id1', 'block');

    game.state.playerResources.should.deep.equal(
      {
        id1: {
          block: 1,
          timber: 0,
          fiber: 0,
          cereal: 0,
          rock: 0
        }
      }
    );

    game = game.deductResources('id1', 'block');

    game.state.playerResources.should.deep.equal({
      id1: {
        block: 0,
        timber: 0,
        fiber: 0,
        cereal: 0,
        rock: 0
      }
    });

    game.deductResources.bind(game, 'id1', 'block')
      .should.throw(Error, 'Cannot deduct resource.');

  });
  
  it('Should throw errors if a player tries to build without the correct resources', function() {

    let game = selectGame('Hexagon Island');
    game = game.setup(3);

    game = game.addPlayer('name1','id1');

    game.makeBuilding.bind(game, 0, 'id1', 'village')
      .should.throw(Error, 'Cannot deduct resource.');
    
    game.buildRoad.bind(game, 1, 'id1')
      .should.throw(Error, 'Cannot deduct resource.'); 

  });

  it('Should find the neighboring nodes around a hexagon', function() {

    let game = selectGame('Hexagon Island');
    game = game.setup(3);

    let hexagonIndex = 0;
    let nodeIndicies = game.findNeighboringNodes(hexagonIndex);

    nodeIndicies.should.deep.equal([0,1,2,3,4,5]);

    hexagonIndex = 1;
    nodeIndicies = game.findNeighboringNodes(hexagonIndex);

    nodeIndicies.should.deep.equal([1,2,6,7,8,9]);

  });

  it('Should find the neighboring hexagons around a node', function() {

    let game = selectGame('Hexagon Island');
    game = game.setup(3);

    let nodeIndex = 0;
    let hexagonIndices = game.findNeighboringHexagons(nodeIndex);

    hexagonIndices.should.deep.equal([0,2,3]);

  });

  it('Should assign resources to players based on the outcome of the dice roll.', function() {

    let game = selectGame('Hexagon Island');
    game = game.setup(5);

    game = game.addPlayer('name1','id1');
    
    game.state.nodes.map(n => {
      n.playerId = 'id1';
      n.buildingType = 'village';
      return n;
    });

    game = game.processActions({
      'roll-dice': {}
    });

    const diceResult = game.state.rollResult;

    const rolledResources = game.state.hexagons.filter(h => {
      return h.number == diceResult;
    }).map(h => {
      return h.resource;
    });

    const numBlock = rolledResources.filter(r => r == 'block').length * 6;
    const numTimber = rolledResources.filter(r => r == 'timber').length * 6;
    const numFiber = rolledResources.filter(r => r == 'fiber').length * 6;
    const numCereal = rolledResources.filter(r => r == 'cereal').length * 6;
    const numRock = rolledResources.filter(r => r == 'rock').length * 6;

    game.state.playerResources.should.deep.equal({
      id1: {
        block: numBlock,
        timber: numTimber,
        fiber: numFiber,
        cereal: numCereal,
        rock: numRock
      }
    });

  });
  
  // TODO: Trade resources
  // TODO: End turn is a thing again (configurable)

});