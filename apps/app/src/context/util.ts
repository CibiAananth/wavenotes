const adjectives = [
  'other',
  'new',
  'good',
  'old',
  'little',
  'great',
  'small',
  'young',
  'long',
  'black',
  'high',
  'only',
  'big',
];

const nouns = [
  'man',
  'world',
  'hand',
  'room',
  'face',
  'thing',
  'place',
  'door',
  'woman',
  'house',
  'money',
  'father',
  'jellybean',
  'country',
  'mother',
];

export const randomUsername = () => {
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];

  return `${adjective}${noun}`;
};

export const randomPassword = () => {
  return Math.random().toString(36).slice(-8);
};
