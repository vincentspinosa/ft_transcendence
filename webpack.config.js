// Import the 'path' module to handle file paths.
const path = require('path');

// This is the main configuration object for webpack.
module.exports = {
  // The 'entry' point of your application. Webpack starts bundling from this file.
  entry: './src/main.ts',

  // 'module' defines how different types of modules within your project are treated.
  module: {
    // 'rules' is an array of objects, where each object defines a rule for a specific file type.
    rules: [
      {
        // This 'test' property uses a regular expression to match files ending with '.ts'.
        test: /\.ts$/,
        // 'use' specifies the loader to be used for the matched files. 'ts-loader' transpiles TypeScript to JavaScript.
        use: 'ts-loader',
        // 'exclude' is used to ignore files in the 'node_modules' directory, as they are usually already compiled.
        exclude: /node_modules/,
      },
      {
        // This rule matches CSS files.
        test: /\.css$/,
        // 'use' is an array of loaders. Loaders are applied from right to left.
        // 'postcss-loader' processes CSS with PostCSS plugins.
        // 'css-loader' interprets '@import' and 'url()' like 'import/require()' and resolves them.
        // 'style-loader' injects CSS into the DOM.
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader',
        ],
      },
    ],
  },

  // 'resolve' is for configuring how modules are resolved.
  resolve: {
    // 'extensions' tells webpack to resolve these extensions. This allows you to import files without specifying the extension (e.g., 'import MyModule from './MyModule' instead of './MyModule.ts').
    extensions: ['.ts', '.js'],
  },

  // 'output' specifies where to output the bundled files.
  output: {
    // 'filename' is the name of the bundled JavaScript file.
    filename: 'bundle.js', // The output bundled JS file
    // 'path' is the absolute path to the output directory.
    path: path.resolve(__dirname, 'dist'), // Output directory
    // 'publicPath' is the public URL of the output directory when referenced in a browser. This is crucial for the webpack-dev-server.
    publicPath: '/dist/' // Important for dev server to find the bundle
  },

  // 'mode' sets the environment for webpack. 'production' enables built-in optimizations like minification.
  mode: 'production'
};