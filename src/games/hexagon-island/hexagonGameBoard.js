
import { shuffle } from '../blackjack/standardDeck52.js';

function computeHexGridCentroids(centroidSpacing=1, numCentroidsAcross=5) {
  let hexGridCentroids = [];
  let maxOffset = (numCentroidsAcross - 1)/2;
  for (let offset=-maxOffset; offset<=maxOffset; offset++){
    let numSteps = numCentroidsAcross - Math.abs(offset);
    let verticalOffset = offset * Math.sqrt(3/4);
    let horizontalOffset = Math.abs(offset) / 2;
    for (let step=0; step<numSteps; step++){
      hexGridCentroids.push({
        x: centroidSpacing * (horizontalOffset + step),
        y: centroidSpacing * (verticalOffset + maxOffset)
      });
    }
  }
  return hexGridCentroids;
}

function assignResourcesAndRolls(centroids) {
  
  // Resource ratios
  let numCentroids = centroids.length;
  let canonicalCount = 18;
  let brickRatio = 3 / canonicalCount;
  let oreRatio = 3 / canonicalCount;
  let woodRatio = 4 / canonicalCount;
  let grainRatio = 4 / canonicalCount;
  let sheepRatio = 4 / canonicalCount;

  // Determine number of hexagons per resource type
  let numBrick = Math.round(brickRatio * numCentroids);
  let numOre = Math.round(oreRatio * numCentroids);
  let numWood = Math.round(woodRatio * numCentroids);
  let numGrain = Math.round(grainRatio * numCentroids);
  let numSheep = Math.round(sheepRatio * numCentroids);
  //let numDesert = numCentroids - numBrick - numOre - numWood - numGrain - numSheep;

  // Form [randomly-shuffled] resources array
  let size = numCentroids;
  let resources = [];
  while(size--) resources[size] = ' ';
  resources.fill('brick', 0);
  resources.fill('ore', numBrick);
  resources.fill('wood', numBrick + numOre);
  resources.fill('grain', numBrick + numOre + numWood);
  resources.fill('sheep', numBrick + numOre + numWood + numGrain);
  resources.fill('desert', numBrick + numOre + numWood + numGrain + numSheep);
  resources = shuffle(resources);
  if (numBrick + numOre + numWood + numGrain + numSheep == numCentroids) {
    resources[0] = 'desert'; // Take the first random element and make it a desert
  }

  // Number ratios
  let twoRatio = 1 / canonicalCount;
  let threeRatio = 2 / canonicalCount;
  let fourRatio = 2 / canonicalCount;
  let fiveRatio = 2 / canonicalCount;
  let sixRatio = 2 / canonicalCount;
  let eightRatio = 2 / canonicalCount;
  let nineRatio = 2 / canonicalCount;
  let tenRatio = 2 / canonicalCount;
  let elevenRatio = 2 / canonicalCount;
  //let twelveRatio = 1 / canonicalCount;

  // Determine number of hexagons per number
  let numTwo = Math.round(twoRatio * numCentroids);
  let numThree = Math.round(threeRatio * numCentroids);
  let numFour = Math.round(fourRatio * numCentroids);
  let numFive = Math.round(fiveRatio * numCentroids);
  let numSix = Math.round(sixRatio * numCentroids);
  let numEight = Math.round(eightRatio * numCentroids);
  let numNine = Math.round(nineRatio * numCentroids);
  let numTen = Math.round(tenRatio * numCentroids);
  let numEleven = Math.round(elevenRatio * numCentroids);
  //let numTwelve = Math.round(twelveRatio * numCentroids);

  // Form [randomly-shuffled] numbers array
  size = numCentroids-1;
  let numbers = [];
  while(size--) numbers[size] = ' ';
  numbers.fill('2', 0);
  numbers.fill('3', numTwo);
  numbers.fill('4', numTwo + numThree);
  numbers.fill('5', numTwo + numThree + numFour);
  numbers.fill('6', numTwo + numThree + numFour + numFive);
  numbers.fill('8', numTwo + numThree + numFour + numFive + numSix);
  numbers.fill('9', numTwo + numThree + numFour + numFive + numSix + numEight);
  numbers.fill('10', numTwo + numThree + numFour + numFive + numSix + numEight + numNine);
  numbers.fill('11', numTwo + numThree + numFour + numFive + numSix + numEight + numNine + numTen);
  numbers.fill('12', numTwo + numThree + numFour + numFive + numSix + numEight + numNine + numTen + numEleven);
  numbers.push('');
  numbers = shuffle(numbers);

  let desertIndex = resources.indexOf('desert');
  let blankIndex = numbers.indexOf('');
  if (desertIndex != blankIndex) {
    numbers[blankIndex] = numbers[desertIndex];
    numbers[desertIndex] = '';
  }

  return {resources, numbers};
}

function computeNodesAndRoads(centroids, centroidSpacing=1, resources) {
  let nodes = [];
  let hexagons = [];
  let roads = [];
  // let lines = [];
  let radius = centroidSpacing / Math.sqrt(3.0);
  // Find the [non-unique] six nodes around each hexagon centroid
  centroids.forEach((el, idx) => {
    // let hex = '';
    let hex = [];
    let cumIdx = idx*6;
    for (let step=0; step<6; step++){
      let angle = step * Math.PI / 3.0;
      let x = Math.round((radius * Math.sin(angle) + el.x + Number.EPSILON)*1000)/1000;
      let y = Math.round((radius * Math.cos(angle) + el.y + Number.EPSILON)*1000)/1000;
      nodes.push({
        x: x,
        y: y
      });
      // hex = step<5 ? hex + `${x},${y}, ` : hex + `${x},${y}`; // svg polygon defining a hexagon
      hex.push({
        x: x,
        y: y
      });
      if (step == 0) {
        roads.push([cumIdx + 5, cumIdx]);
      } else {
        roads.push([cumIdx+step-1, cumIdx+step]);
      }
    }
    hexagons.push({
      poly: hex,// should be nodes and not svg
      resource: resources[idx]
    });
  });
  // Now go through the list of nodes and reduce it down to the unique set
  nodes = nodes.reduce((unique, item, index) => {
    // Is `item` already in the `unique` array?
    let newIdx = unique.map((val, idx) => {
      if (val.x == item.x && val.y == item.y) { return idx; }
      else { return null; }
    }).filter((val) => {
      return val != null;
    });
    // If `item` is already in `unique`
    if ( newIdx.length > 0 ) {
      // Update the indices in `roads`
      roads = roads.map((segment) => {
        let s1 = segment[0] == index ? newIdx[0] : segment[0];
        let s2 = segment[1] == index ? newIdx[0] : segment[1];
        return [s1, s2];
      });
      // And don't add the node to the `unique` list
      return unique;
    } else { // If `item` is not already in `unique`, add it
      newIdx = unique.length;
      // Update the indices in `roads`
      roads = roads.map((segment) => {
        let s1 = segment[0] == index ? newIdx : segment[0];
        let s2 = segment[1] == index ? newIdx : segment[1];
        return [s1, s2];
      });
      return [...unique, item];
    }
  }, []);
  // Define road lines
  // roads.forEach((segment) => {
  //   let node1 = nodes[segment[0]];
  //   let node2 = nodes[segment[1]];
  //   let path = `M ${node1.x} ${node1.y} L ${node2.x} ${node2.y}`;
  //   lines.push(path);
  // });
  return {nodes, hexagons, roads}; //, lines};
}

/**
 * 
 * @param {Number} centroidSpacing 
 * @param {Number} numCentroidsAcross 
 * @returns {Object}
 */
export function setupGameBoard(centroidSpacing = 1, numCentroidsAcross = 5) {

  let centroids = computeHexGridCentroids(centroidSpacing, numCentroidsAcross);
  let {resources, numbers} = assignResourcesAndRolls(centroids);
  let {nodes, hexagons, roads} = computeNodesAndRoads(centroids, centroidSpacing, resources);
  
  centroids.forEach((cent, index) => {
    cent.number = numbers[index];
  });

  // Make room for the player ID
  roads = roads.map(r => {
    return {
      inds: r,
      playerId: null
    };
  });

  // Make room for the player ID and building type
  nodes = nodes.map(n => {
    return {
      ...n,
      playerId: null,
      buildingType: null
    };
  });

  return {
    centroids: centroids,
    nodes: nodes,
    hexagons: hexagons,
    numbers: numbers,
    roads: roads
    // lines: lines
  };
}