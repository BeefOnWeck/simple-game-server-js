import chai from 'chai';
import { selectGame } from '../../src/games/gameSelector.js';
import { findNeighboringHexagons, findNeighboringNodes } from '../../src/games/hexagon-island/resolutions.js';
import { getRoadLengths } from '../../src/games/hexagon-island/roads.js';

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
      rollResult: [0,0],
      playerResources: {},
      bugs: {},
      scorpionIndex: null
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
      rollResult: [0,0],
      playerResources: {},
      bugs: {},
      scorpionIndex: null
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

    game.possibleActions = ['rollDice'];
    
    game.state.rollResult[0].should.equal(0);
    game.state.rollResult[1].should.equal(0);
    game = game.rollDice();
    game.state.rollResult[0].should.not.equal(0);
    game.state.rollResult[1].should.not.equal(0);

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

    game.possibleActions = ['rollDice'];

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
      let rollSum = game.state.rollResult.reduce((pv,cv) => pv+cv, 0);
      histogram[rollSum-2].count++;
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
    game = game.makeBuilding(0, 'playerIdString', 'village', false);

    const roadIndex = 0;
    game = game.buildRoad(roadIndex,'playerIdString', false);

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
    game = game.makeBuilding(nodeIndex, 'playerIdString', 'village', false);

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
        color: '#DC143C'
      },
      {
        name: 'name2',
        id: 'id2',
        color: '#4169E1'
      }
    ]);
  });

  it('Should prevent a new building from being constructed within two spaces of an existing building', function() {
    
    let game = selectGame('Hexagon Island');
    game = game.setup(3);

    game = game.makeBuilding(0, 'pid1', 'village', false);
    game = game.buildRoad(0, 'pid1', false);

    game = game.makeBuilding(2, 'pid1', 'village', false);
    game = game.buildRoad(1, 'pid1', false);

    game.makeBuilding.bind(game, 3, 'pid2', 'burgh', false)
      .should.throw(Error, 'Cannot place a building there; you must respect the two-space rule.');

    game = game.makeBuilding(4, 'pid2', 'burgh', false);

  });

  it('Should prevent a village from being built on a node with an existing village', function() {
    
    let game = selectGame('Hexagon Island');
    game = game.setup(3);

    game = game.makeBuilding(0, 'pid1', 'village', false);

    game.makeBuilding.bind(game, 0, 'pid2', 'village', false)
      .should.throw(Error, 'Cannot place a village on a space that already has a village.');

    game = game.makeBuilding(2, 'pid2', 'village', false);

  });

  it('Should enforce road-building to occur next to other buildings and roads', function() {

    let game = selectGame('Hexagon Island');
    game = game.setup(3);

    game = game.makeBuilding(0, 'pid1', 'village', false);
    game = game.buildRoad(1, 'pid1', false);

    // Can't build here because it isn't connected to the other road
    game.buildRoad.bind(game, 3, 'pid1', false)
      .should.throw(Error, 'Roads have to be built next to other roads or buildings you own.');    

    // But we can build there if we first build the connecting road
    game = game.buildRoad(2, 'pid1', false);
    game = game.buildRoad(3, 'pid1', false);

    // This connects to the other side of the building
    game = game.buildRoad(0, 'pid1', false);

  });

  it('Should prevent a road from being built on another road', function() {
    
    let game = selectGame('Hexagon Island');
    game = game.setup(3);

    game = game.makeBuilding(0, 'pid1', 'village', false);
    game = game.buildRoad(1, 'pid1', false);

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
      .should.throw(Error, 'Not enough resources to build.');
    
    game.buildRoad.bind(game, 1, 'id1')
      .should.throw(Error, 'Not enough resources to build.'); 

  });

  it('Should find the neighboring nodes around a hexagon', function() {

    let game = selectGame('Hexagon Island');
    game = game.setup(3);

    let hexagonIndex = 0;
    let nodeIndicies = findNeighboringNodes(hexagonIndex,game);

    nodeIndicies.should.deep.equal([0,1,2,3,4,5]);

    hexagonIndex = 1;
    nodeIndicies = findNeighboringNodes(hexagonIndex,game);

    nodeIndicies.should.deep.equal([1,2,6,7,8,9]);

  });

  it('Should find the neighboring hexagons around a node', function() {

    let game = selectGame('Hexagon Island');
    game = game.setup(3);

    let nodeIndex = 0;
    let hexagonIndices = findNeighboringHexagons(nodeIndex,game);

    hexagonIndices.should.deep.equal([0,2,3]);

  });

  it('Should assign resources to players based on the outcome of the dice roll.', function() {

    let game = selectGame('Hexagon Island');
    game = game.setup(5);

    game = game.addPlayer('name1','id1');
    
    // Put a village on every node
    game.state.nodes.map(n => {
      n.playerId = 'id1';
      n.buildingType = 'village';
      return n;
    });

    game.possibleActions = ['rollDice'];

    game = game.processAction({
      'rollDice': {}
    });

    const diceResult = game.state.rollResult.reduce((pv,cv) => pv+cv, 0);

    const rolledResources = game.state.hexagons.filter(h => {
      return h.number == diceResult;
    }).map(h => {
      return h.resource;
    });

    // Should get 6 resources for each hexagon that is rolled
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

  it('Should move to setup once enough players have been added.', function() {
    let game = selectGame('Hexagon Island', {configNumPlayers: 2});
    game = game.addPlayer('name1','id1')
      .addPlayer('name2','id2');

    game.phase.should.equal('setup');
    game.possibleActions.should.deep.equal(['setupVillagesAndRoads']);

  });

  it('Should implement the setup-village-and-road action', function() {
    let game = selectGame('Hexagon Island', {configNumPlayers: 2});
    game = game.addPlayer('name1','id1')
      .addPlayer('name2','id2');

    game = game.processAction({
      'setupVillagesAndRoads': {
        pid: 'id1',
        nodes: [0],
        roads: [0]
      }
    });

    game.state.nodes[0].playerId.should.equal('id1');
    game.state.roads[0].playerId.should.equal('id1');

  });

  it('Should progress through setup and then enter the play phase', function() {
    let game = selectGame('Hexagon Island', {configNumPlayers: 2});
    game = game.addPlayer('name1','id1')
      .addPlayer('name2','id2');

    game.phase.should.equal('setup');

    game = game.processAction({
      'setupVillagesAndRoads': {
        pid: 'id1',
        nodes: [43],
        roads: [57]
      }
    }).processAction({
      'setupVillagesAndRoads': {
        pid: 'id2',
        nodes: [15],
        roads: [18]
      }
    }).processAction({
      'setupVillagesAndRoads': {
        pid: 'id2',
        nodes: [1],
        roads: [1]
      }
    }).processAction({
      'setupVillagesAndRoads': {
        pid: 'id1',
        nodes: [33],
        roads: [58]
      }
    });

    game.phase.should.equal('play');
    game.activePlayerId.should.equal('id1');

    const numPlayerOneResources = Object.values(game.state.playerResources['id1']).reduce((acc,v) => acc + v, 0);
    const numPlayerTwoResources = Object.values(game.state.playerResources['id2']).reduce((acc,v) => acc + v, 0);

    // Each node should neighbor three hexagons, which means up to six resources per player.
    // But if one of the hexagons is a desert, then the total will be reduced to no less than 4.
    numPlayerOneResources.should.be.greaterThanOrEqual(4);
    numPlayerTwoResources.should.be.greaterThanOrEqual(4);

  });

  // NOTE: This test will sometimes fail if a '7' is rolled.
  it('Should correctly handle turns during the play phase', function() {
    let game = selectGame('Hexagon Island', {configNumPlayers: 2});
    game = game.addPlayer('name1','id1')
      .addPlayer('name2','id2');

    game.phase.should.equal('setup');

    game = game.processAction({
      'setupVillagesAndRoads': {
        pid: 'id1',
        nodes: [43],
        roads: [57]
      }
    }).processAction({
      'setupVillagesAndRoads': {
        pid: 'id2',
        nodes: [15],
        roads: [18]
      }
    }).processAction({
      'setupVillagesAndRoads': {
        pid: 'id2',
        nodes: [1],
        roads: [1]
      }
    }).processAction({
      'setupVillagesAndRoads': {
        pid: 'id1',
        nodes: [33],
        roads: [58]
      }
    });

    game.phase.should.equal('play');
    game.round.should.equal(1);

    // Cheat here so the players actually have resources to build stuff
    game = game.assignResources('id1', ['block','timber','block','timber','block','timber','fiber','cereal']);
    game = game.assignResources('id2', ['block','timber','block','timber','block','timber','fiber','cereal']);

    game = game.processAction({
      'rollDice': {
        pid: 'id1'
      }
    });

    // In case we roll a 7
    game.possibleActions = ['buildStuff'];
    
    game = game.processAction({
      'buildStuff': {
        pid: 'id1',
        nodes: [],
        roads: [43, 44]
      }
    }).processAction({
      'buildStuff': {
        pid: 'id1',
        nodes: [22],
        roads: []
      }
    }).processAction({
      'endTurn': {}
    }).processAction({
      'rollDice': {
        pid: 'id2'
      }
    });
    
    // In case we roll a 7
    game.possibleActions = ['buildStuff'];

    game = game.processAction({
      'buildStuff': {
        pid: 'id2',
        nodes: [],
        roads: [6, 7]
      }
    }).processAction({
      'buildStuff': {
        pid: 'id2',
        nodes: [7],
        roads: []
      }
    }).processAction({
      'endTurn': {}
    });

    game.round.should.equal(2);

  });

  it('Should throw an error if a player ends their turn without rolling the dice', function() {
    let game = selectGame('Hexagon Island', {configNumPlayers: 2});
    game = game.addPlayer('name1','id1')
      .addPlayer('name2','id2')
      .processAction({
      'setupVillagesAndRoads': {
        pid: 'id1',
        nodes: [43],
        roads: [57]
      }
      })
      .processAction({
        'setupVillagesAndRoads': {
          pid: 'id2',
          nodes: [15],
          roads: [18]
        }
      })
      .processAction({
        'setupVillagesAndRoads': {
          pid: 'id2',
          nodes: [1],
          roads: [1]
        }
      })
      .processAction({
        'setupVillagesAndRoads': {
          pid: 'id1',
          nodes: [33],
          roads: [58]
        }
      });

    game.nextPlayer.bind(game).should.throw(Error,'Cannot end your turn without at least rolling the dice');
  });

  it('Should throw an error if a player tries to setup with selecting both a road and a building.', function() {
    let game = selectGame('Hexagon Island', {configNumPlayers: 2});
    game = game.addPlayer('name1','id1')
      .addPlayer('name2','id2');

    game.processAction.bind(
      game,
      {
        'setupVillagesAndRoads': {
          pid: 'id1',
          nodes: [0],
          roads: []
        }
      }
    ).should.throw(Error, 'Must select one building and one road during setup.');

    game.processAction.bind(
      game,
      {
        'setupVillagesAndRoads': {
          pid: 'id1',
          nodes: [],
          roads: [0]
        }
      }
    ).should.throw(Error, 'Must select one building and one road during setup.');

    game.processAction.bind(
      game,
      {
        'setupVillagesAndRoads': {
          pid: 'id1',
          nodes: [0]
        }
      }
    ).should.throw(Error, 'Must select one building and one road during setup.');

    game.processAction.bind(
      game,
      {
        'setupVillagesAndRoads': {
          pid: 'id1',
          roads: [0]
        }
      }
    ).should.throw(Error, 'Must select one building and one road during setup.');

    game.processAction.bind(
      game,
      {
        'setupVillagesAndRoads': {
          pid: 'id1'
        }
      }
    ).should.throw(Error, 'Must select one building and one road during setup.');

  });

  it('Should find the winning player', function() {
    let game = selectGame('Hexagon Island', {
      configNumPlayers: 2,
      scoreToWin: 3
    });
    game = game.addPlayer('name1','id1')
      .addPlayer('name2','id2');

    game.phase.should.equal('setup');

    game = game.processAction({
      'setupVillagesAndRoads': {
        pid: 'id1',
        nodes: [43],
        roads: [57]
      }
    }).processAction({
      'setupVillagesAndRoads': {
        pid: 'id2',
        nodes: [15],
        roads: [18]
      }
    }).processAction({
      'setupVillagesAndRoads': {
        pid: 'id2',
        nodes: [1],
        roads: [1]
      }
    }).processAction({
      'setupVillagesAndRoads': {
        pid: 'id1',
        nodes: [33],
        roads: [58]
      }
    });

    game.phase.should.equal('play');
    game.round.should.equal(1);

    // Cheat here so the players actually have resources to build stuff
    game = game.assignResources('id1', ['block','timber','block','timber','block','timber','fiber','cereal']);
    game = game.assignResources('id2', ['block','timber','block','timber','block','timber','fiber','cereal']);

    game = game.processAction({
      'rollDice': {
        pid: 'id1'
      }
    });
    
    // In case we roll a 7
    game.possibleActions = ['buildStuff'];

    game = game.processAction({
      'buildStuff': {
        pid: 'id1',
        nodes: [],
        roads: [43, 44]
      }
    }).processAction({
      'buildStuff': {
        pid: 'id1',
        nodes: [22],
        roads: []
      }
    });

    game.theWinner.should.equal('id1');

  });

  it('Should block resources from whichever hexagon contains the scorpion.', function() {

    let game = selectGame('Hexagon Island');
    game = game.setup(5);

    game = game.addPlayer('name1','id1');
    
    // Add a village for player 1 on all nodes
    game.state.nodes.forEach((_,i,a) => {
      a[i].playerId = 'id1';
      a[i].buildingType = 'village';
    });

    // Loop over all hexagons, move the scorpion to each one, 
    // and then verify that the appropriate resource is blocked.
    game.state.hexagons.forEach((hex,ind) => {
      game.state.playerResources = {
        id1: {
          block: 0,
          timber: 0,
          fiber: 0,
          cereal: 0,
          rock: 0
        }
      };

      game = game.moveScorpion(ind);

      const diceResult = hex.number;
      if (diceResult) {
        game.state.rollResult = [diceResult-1,1];
        game = game.resolveRoll();

        const rolledResources = game.state.hexagons.filter((h,i) => {
          return h.number == diceResult && i != game.state.scorpionIndex;
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

      }

    });

  });

  it('Should have the scorpion move every time a 7 is rolled', function() {

    let game = selectGame('Hexagon Island');
    game = game.setup(5);

    game = game.addPlayer('name1','id1');

    game.possibleActions = ['rollDice'];
    game.state.rollResult = [3,4];
    game = game.resolveRoll();

    game.possibleActions.should.deep.equal(['moveScorpion']);

    game = game.processAction({
      'moveScorpion': {
        'hexInd': 16
      }
    });

    game.state.scorpionIndex.should.equal(16);

    game.possibleActions.should.deep.equal([
      'trade',
      'buildStuff',
      'endTurn',
      'buyBug'
    ]);

  });

  it('Should correctly handle resource trades', function() {
    let game = selectGame('Hexagon Island', {configNumPlayers: 2});
    game = game.addPlayer('name1','id1')
      .addPlayer('name2','id2');

    // TODO: Pull this out into a function so we're not repeating it everywhere
    game = game.processAction({
      'setupVillagesAndRoads': {
        pid: 'id1',
        nodes: [43],
        roads: [57]
      }
    }).processAction({
      'setupVillagesAndRoads': {
        pid: 'id2',
        nodes: [15],
        roads: [18]
      }
    }).processAction({
      'setupVillagesAndRoads': {
        pid: 'id2',
        nodes: [1],
        roads: [1]
      }
    }).processAction({
      'setupVillagesAndRoads': {
        pid: 'id1',
        nodes: [33],
        roads: [58]
      }
    });

    game = game.processAction({
      'rollDice': {
        pid: 'id1'
      }
    });

    // In case we roll a 7
    game.possibleActions = ['trade'];

    // Remove all resources so we can test from a clean slate
    game.state.playerResources = {
      id1: {
        block: 0,
        timber: 0,
        fiber: 0,
        cereal: 0,
        rock: 0
      },
      id2: {
        block: 0,
        timber: 0,
        fiber: 0,
        cereal: 0,
        rock: 0
      }
    }

    game = game.assignResources('id1', ['block','block','block']);

    game = game.processAction({
      'trade': {
        pid: 'id1',
        have: 'block',
        want: 'rock'
      }
    });

    game.state.playerResources.should.deep.equal({
      id1: {
        block: 0,
        timber: 0,
        fiber: 0,
        cereal: 0,
        rock: 1
      },
      id2: {
        block: 0,
        timber: 0,
        fiber: 0,
        cereal: 0,
        rock: 0
      }
    });

  });

  it('Should find the longest road for each player and set hasTheLongestRoad', function() {
    let game = selectGame('Hexagon Island');
    game = game.setup(5)
      .addPlayer('name1','id1')
      .addPlayer('name2','id2');

    // First have to make an adjacent building for id1
    game = game.makeBuilding(5, 'id1', 'village', false);

    // Make roads for id1
    game = game.buildRoad(0,'id1', false)
      .buildRoad(18,'id1', false)
      .buildRoad(21,'id1', false)
      .buildRoad(22,'id1', false)
      .buildRoad(23,'id1', false)
      .buildRoad(38,'id1', false)
      .buildRoad(39,'id1', false)
      .buildRoad(55,'id1', false)
      .buildRoad(56,'id1', false);

    game = game.setActivePlayer('id2');

    // First have to make an adjacent building for id2
    game = game.makeBuilding(10, 'id2', 'village', false);

    // Make roads for id2
    game = game.buildRoad(26,'id2', false)
      .buildRoad(27,'id2', false)
      .buildRoad(25,'id2', false);

    const roadLengths = getRoadLengths(game);

    roadLengths.should.deep.equal({
      id1: 7,
      id2: 2
    });

    game = game.findTheLongestRoad();

    game.hasTheLongestRoad.should.equal('id1');

  });

  it('Longest road tie-breakers go to the incumbent', function() {
    let game = selectGame('Hexagon Island', {
      configNumPlayers: 2,
      scoreToWin: 3,
      boardGameWidth: 5
    });

    game = game.addPlayer('name1','id1')
      .addPlayer('name2','id2');

    // First have to make an adjacent building for id1
    game = game.makeBuilding(5, 'id1', 'village', false);

    // Make roads for id1
    game = game.buildRoad(0,'id1', false)
      .buildRoad(18,'id1', false);

    game = game.setActivePlayer('id2');

    // First have to make an adjacent building for id2
    game = game.makeBuilding(10, 'id2', 'village', false);

    // Make roads for id2
    game = game.buildRoad(26,'id2', false)
      .buildRoad(27,'id2', false)
      .buildRoad(28,'id2', false);
    game = game.findTheLongestRoad();
    game.hasTheLongestRoad.should.equal('id2');

    // Build more roads for id1
    game = game.setActivePlayer('id1');
    game = game.buildRoad(21,'id1', false);
    game = game.findTheLongestRoad();
    game.hasTheLongestRoad.should.equal('id2');

    // And then build one more for id1
    game = game.buildRoad(22,'id1', false);
    game = game.findTheLongestRoad();
    game.hasTheLongestRoad.should.equal('id1');

    // Make another building and id1 should be the winner
    game = game.findTheWinner();
    chai.assert(game.theWinner == null);
    game = game.makeBuilding(43,'id1',false);
    game = game.findTheWinner();
    chai.assert(game.theWinner == 'id1');

  });

  it('Should allow players to buy bugs', function(){
    let game = selectGame('Hexagon Island', {configNumPlayers: 2});
    game = game.addPlayer('name1','id1')
      .addPlayer('name2','id2');

    // TODO: Pull this out into a function so we're not repeating it everywhere
    game = game.processAction({
      'setupVillagesAndRoads': {
        pid: 'id1',
        nodes: [43],
        roads: [57]
      }
    }).processAction({
      'setupVillagesAndRoads': {
        pid: 'id2',
        nodes: [15],
        roads: [18]
      }
    }).processAction({
      'setupVillagesAndRoads': {
        pid: 'id2',
        nodes: [1],
        roads: [1]
      }
    }).processAction({
      'setupVillagesAndRoads': {
        pid: 'id1',
        nodes: [33],
        roads: [58]
      }
    });

    // Cheat here so the first player can buy a bug
    game = game.assignResources('id1', ['fiber','cereal','rock']);

    // Have to start your turn by rolling the dice
    game = game.processAction({
      'rollDice': {
        pid: 'id1'
      }
    });

    if (game.possibleActions.includes('moveScorpion')) {
      game = game.processAction({
        'moveScorpion': {
          hexInd: 0
        }
      });
    }

    // Buying a bug should be in the list of allowable actions
    game.possibleActions.should.deep.equal([
      'trade',
      'buildStuff',
      'endTurn',
      'buyBug'
    ]);

    game = game.processAction({
      'buyBug': {
        pid: 'id1'
      }
    });

    game.state.bugs.should.deep.equal({
      id1: 1,
      id2: 0
    });

    game.possibleActions.should.deep.equal([
      'moveScorpion'
    ]);

    game = game.processAction({
      'moveScorpion': {
        hexInd: 0
      }
    }).processAction({
      'endTurn': {
        pid: 'id1'
      }
    });

    // Cheat here so the second player can buy a bug
    game = game.assignResources('id2', ['fiber','cereal','rock']);

    // Have to start your turn by rolling the dice
    game = game.processAction({
      'rollDice': {
        pid: 'id2'
      }
    });
    
    if (game.possibleActions.includes('moveScorpion')) {
      game = game.processAction({
        'moveScorpion': {
          hexInd: 0
        }
      });
    }

    game = game.processAction({
      'buyBug': {
        pid: 'id2'
      }
    });

    game.state.bugs.should.deep.equal({
      id1: 1,
      id2: 1
    });

  });

  it('Should find the player with the most bugs and set hasTheMostBugs', function(){
    let game = selectGame('Hexagon Island', {configNumPlayers: 2});
    game = game.addPlayer('name1','id1')
      .addPlayer('name2','id2');

    // TODO: Pull this out into a function so we're not repeating it everywhere
    game = game.processAction({
      'setupVillagesAndRoads': {
        pid: 'id1',
        nodes: [43],
        roads: [57]
      }
    }).processAction({
      'setupVillagesAndRoads': {
        pid: 'id2',
        nodes: [15],
        roads: [18]
      }
    }).processAction({
      'setupVillagesAndRoads': {
        pid: 'id2',
        nodes: [1],
        roads: [1]
      }
    }).processAction({
      'setupVillagesAndRoads': {
        pid: 'id1',
        nodes: [33],
        roads: [58]
      }
    });

    // Cheat here so the first player can buy a bug
    game = game.assignResources('id1', ['fiber','cereal','rock'])
    .assignResources('id1', ['fiber','cereal','rock'])
    .assignResources('id1', ['fiber','cereal','rock']);


    // Have to start your turn by rolling the dice
    game = game.processAction({
      'rollDice': {
        pid: 'id1'
      }
    });

    if (game.possibleActions.includes('moveScorpion')) {
      game = game.processAction({
        'moveScorpion': {
          hexInd: 0
        }
      });
    }

    // Buying a bug should be in the list of allowable actions
    game.possibleActions.should.deep.equal([
      'trade',
      'buildStuff',
      'endTurn',
      'buyBug'
    ]);

    game = game.processAction({
      'buyBug': {
        pid: 'id1'
      }
    }).processAction({
      'moveScorpion': {
        hexInd: 0
      }
    }).processAction({
      'buyBug': {
        pid: 'id1'
      }
    }).processAction({
      'moveScorpion': {
        hexInd: 0
      }
    }).processAction({
      'buyBug': {
        pid: 'id1'
      }
    }).processAction({
      'moveScorpion': {
        hexInd: 0
      }
    });

    game.state.bugs.should.deep.equal({
      id1: 3,
      id2: 0
    });

    game.hasTheMostBugs.should.equal('id1');

    game = game.processAction({
      'endTurn': {
        pid: 'id1'
      }
    });

    // Cheat here so the second player can buy a bug
    game = game.assignResources('id2', ['fiber','cereal','rock'])
    .assignResources('id2', ['fiber','cereal','rock'])
    .assignResources('id2', ['fiber','cereal','rock'])
    .assignResources('id2', ['fiber','cereal','rock']);

    // Have to start your turn by rolling the dice
    game = game.processAction({
      'rollDice': {
        pid: 'id2'
      }
    });
    
    if (game.possibleActions.includes('moveScorpion')) {
      game = game.processAction({
        'moveScorpion': {
          hexInd: 0
        }
      });
    }

    game = game.processAction({
      'buyBug': {
        pid: 'id2'
      }
    }).processAction({
      'moveScorpion': {
        hexInd: 0
      }
    }).processAction({
      'buyBug': {
        pid: 'id2'
      }
    }).processAction({
      'moveScorpion': {
        hexInd: 0
      }
    }).processAction({
      'buyBug': {
        pid: 'id2'
      }
    }).processAction({
      'moveScorpion': {
        hexInd: 0
      }
    });

    game.hasTheMostBugs.should.equal('id1');

    game.state.bugs.should.deep.equal({
      id1: 3,
      id2: 3
    });

    game = game.processAction({
      'buyBug': {
        pid: 'id2'
      }
    }).processAction({
      'moveScorpion': {
        hexInd: 0
      }
    });

    game.hasTheMostBugs.should.equal('id2');

    game.state.bugs.should.deep.equal({
      id1: 3,
      id2: 4
    });

  });

  // TODO: Cities

  // TODO: Most ninjas bonus



});