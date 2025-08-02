const path = require('path');

module.exports = {
  entry: './src/main.ts', // Your main entry TypeScript file
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader',
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'bundle.js', // The output bundled JS file
    path: path.resolve(__dirname, 'dist'), // Output directory
    publicPath: '/dist/' // Important for dev server to find the bundle
  },
  mode: 'production' // 'production' for minified output
};