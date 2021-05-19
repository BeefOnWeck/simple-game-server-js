
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
  let blockRatio = 3 / canonicalCount;
  let rockRatio = 3 / canonicalCount;
  let timberRatio = 4 / canonicalCount;
  let cerealRatio = 4 / canonicalCount;
  let fiberRatio = 4 / canonicalCount;

  // Determine number of hexagons per resource type
  let numBlock = Math.round(blockRatio * numCentroids);
  let numRock = Math.round(rockRatio * numCentroids);
  let numTimber = Math.round(timberRatio * numCentroids);
  let numCereal = Math.round(cerealRatio * numCentroids);
  let numFiber = Math.round(fiberRatio * numCentroids);
  //let numDesert = numCentroids - numBlock - numRock - numTimber - numCereal - numFiber;

  // Form [randomly-shuffled] resources array
  let size = numCentroids;
  let resources = [];
  while(size--) resources[size] = ' ';
  resources.fill('block', 0);
  resources.fill('rock', numBlock);
  resources.fill('timber', numBlock + numRock);
  resources.fill('cereal', numBlock + numRock + numTimber);
  resources.fill('fiber', numBlock + numRock + numTimber + numCereal);
  resources.fill('desert', numBlock + numRock + numTimber + numCereal + numFiber);
  resources = shuffle(resources);
  if (numBlock + numRock + numTimber + numCereal + numFiber == numCentroids) {
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

function computeNodesAndRoads(centroids, centroidSpacing=1, resources, numbers) {
  let nodes = [];
  let hexagons = [];
  let roads = [];
  let radius = centroidSpacing / Math.sqrt(3.0);

  // Loop over centroids and construct the nodes, roads, and hexagons
  centroids.forEach((el, idx) => {
    let hex = [];
    let nodeIdx = idx*6; // To keep track of the node indices

    // Find the [non-unique] six nodes around each hexagon centroid
    for (let step=0; step<6; step++){
      let angle = step * Math.PI / 3.0;
      let x = Math.round((radius * Math.sin(angle) + el.x + Number.EPSILON)*1000)/1000;
      let y = Math.round((radius * Math.cos(angle) + el.y + Number.EPSILON)*1000)/1000;
      nodes.push({
        x: x,
        y: y
      });
      hex.push({
        x: x,
        y: y
      });
      if (step == 0) {
        roads.push([nodeIdx + 5, nodeIdx]);
      } else {
        roads.push([nodeIdx+step-1, nodeIdx+step]);
      }
    }
    hexagons.push({
      poly: hex, // TODO: Rename to vertices
      resource: resources[idx],
      number: numbers[idx]
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
      newIdx.forEach(ni => {
        roads = roads.map((segment) => {
          let s1 = segment[0] == index ? ni : segment[0];
          let s2 = segment[1] == index ? ni : segment[1];
          return [s1, s2];
        });
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
  
  // Winnow roads down to a unique set
  roads = roads.reduce((acc,cv) => {
    let reversiblyUnique = true;
    acc.forEach(a => {
      if (cv[0] == a[0] && cv[1] == a[1]) reversiblyUnique = false;
      if (cv[0] == a[1] && cv[1] == a[0]) reversiblyUnique = false;
    });
    let upAcc = reversiblyUnique ? [...acc,cv] : [...acc];
    return upAcc;
  },[]);

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
  let {nodes, hexagons, roads} = computeNodesAndRoads(centroids, centroidSpacing, resources, numbers);
  
  // Add a number to each centroid
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