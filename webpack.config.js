const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: './templates/index.tsx',  // Entry point for TypeScript
  output: {
    filename: 'bundle.js',         // Bundle JS file
    path: path.resolve(__dirname, 'static'),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,  // Process TypeScript files
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,   // Process CSS files
        use: [
          'style-loader',      // Inject CSS into DOM
          'css-loader',        // Resolves CSS imports and URLs
          'postcss-loader',    // Uses PostCSS to process CSS (Tailwind)
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    // Optional: Extract CSS into its own file (if you want to output styles separately)
    new MiniCssExtractPlugin({
      filename: 'styles.css',
    }),
  ],
  mode: 'development', // Or 'production'
};
