/**
 * 
 */
 export function getRoadLengths(game=this) {

  const playerIds = game.players.map(p => p.id);

  const playerRoads = playerIds.reduce((acc,pid) => {
    return [
      ...acc,
      {
        pid: pid,
        roads: game.state.roads.filter(r => r.playerId == pid).map(r => r.inds)
      }
    ]
  },[]);

  const playerRoadLengths = playerRoads.reduce((acc,pr) => {
    return {
      ...acc,
      [pr.pid]: findMaxRoadLength(pr.roads)
    }
  },{});

  return playerRoadLengths;

};

/**
 * 
 * @param {*} roads 
 * @param {*} game 
 * @returns 
 */
function findMaxRoadLength(roads) {
  let maxRoadLength = 0;
  roads.forEach(road => {
    const otherRoads = roads.filter(otr => otr[0] != road[0] || otr[1] != road[1]);
    const roadLength = measureRoadSegment(road, otherRoads);
    maxRoadLength = roadLength > maxRoadLength ? roadLength : maxRoadLength;
  });
  return maxRoadLength;
};

/**
 * TODO: This doesn't need to be in game... it should be in a utility file
 * @param {*} roads 
 * @param {*} game 
 * @returns 
 */
 function measureRoadSegment(road, otherRoads) {

  let maxConnectingLength = 0;

  const connectingRoads = otherRoads.reduce((acc,otr) => {
    let overlap;
    if (otr[0] == road[0] || otr[0] == road[1]) overlap = otr[0];
    else if (otr[1] == road[0] || otr[1] == road[1]) overlap = otr[1];
    else overlap = null;

    if (overlap != null) {
      return [
        ...acc,
        { road: otr, overlap }
      ];
    }
    else return acc;
  },[]);

  connectingRoads.forEach(cr => {
    const otherOtherRoads = otherRoads.filter(oor => {
      return oor[0] != cr.overlap &&
        oor[1] != cr.overlap &&
        (
          oor[0] != cr.road[0] || 
          oor[1] != cr.road[1]
        );
    });
    const segmentLength = measureRoadSegment(cr.road, otherOtherRoads);
    maxConnectingLength = segmentLength > maxConnectingLength ? segmentLength : maxConnectingLength;
  });

  return maxConnectingLength + 1; // and one for the road
};