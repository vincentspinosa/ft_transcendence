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
  devServer: { // Optional: for webpack-dev-server
    static: {
      directory: path.join(__dirname, '.'), // Serve files from the root project directory
    },
    compress: true,
    port: 9000,
    hot: true, // Enable Hot Module Replacement
  },
  mode: 'development' // Can be 'production' for minified output
};