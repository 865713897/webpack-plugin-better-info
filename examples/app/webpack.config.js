const path = require('path');
// const BetterInfo = require('webpack-plugin-better-info');
const BetterInfo = require('./plugin');

module.exports = {
  mode: 'production',
  entry: path.resolve(__dirname, './src/index.js'),
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [new BetterInfo({})],
};
