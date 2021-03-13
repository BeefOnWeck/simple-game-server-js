module.exports = {
  'env': {
    'browser': true,
    'es2021': true,
    'node': true,
  },
  'extends': [
    'google',
    'plugin:functional/recommended',
    'plugin:functional/stylitic'
  ],
  'parserOptions': {
    'ecmaVersion': 12,
    'sourceType': 'module',
  },
  'plugins': [
    'functional'
  ],
  'rules': {
    complexity: ['error', 4]
  },
};
