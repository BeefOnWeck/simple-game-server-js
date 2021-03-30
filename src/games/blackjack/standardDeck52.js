
const suits = ['Clubs', 'Diamonds', 'Hearts', 'Spades'];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 
  'Jack', 'Queen', 'King', 'Ace'];

export const standardDeck52 = suits.reduce((acc,cv) => {
  const oneSuit = ranks.map((v) => ({ suit: cv, rank: v}));
  return [...acc, ...oneSuit];
},[]);


// implement shuffle using reduce