
const suits = ['Clubs', 'Diamonds', 'Hearts', 'Spades'];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 
  'Jack', 'Queen', 'King', 'Ace'];

export const standardDeck52 = suits.reduce((acc,cv) => {
  const oneSuit = ranks.map(v => ({ suit: cv, rank: v}));
  return [...acc, ...oneSuit];
},[]);

export const shuffle = function(deck) {
  return deck.reduce((shuf, _, ind) => {
    // Generate a random index between idx and the end of the array
    const randInd = ind + Math.floor(Math.random() * (shuf.length - ind));
    // Swap the elements at ind and randInd
    [shuf[randInd], shuf[ind]] = [shuf[ind], shuf[randInd]];
    return shuf;
   }, [...deck]);
}