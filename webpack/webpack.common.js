const webpack = require('webpack');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const srcDir = path.join(__dirname, '..', 'src');

module.exports = {
   entry: {
      main: path.join(srcDir, 'main.ts'),
      background: path.join(srcDir, 'background.ts')
   },
   output: {
      path: path.join(__dirname, '../dist/js'),
      filename: '[name].js'
   },
   optimization: {
      splitChunks: {
         name: 'vendor',
         chunks(chunk) {
            return chunk.name !== 'main';
         }
      }
   },
   module: {
      rules: [
         {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
         }
      ]
   },
   resolve: {
      extensions: ['.ts', '.tsx', '.js']
   },
   plugins: [
      new CopyPlugin({
         patterns: [{from: '.', to: '../', context: 'public'}],
         options: {}
      }),
      new webpack.ProvidePlugin({
         $: 'jquery',
         jQuery: 'jquery',
         'window.$': 'jquery',
         'window.jQuery': 'jquery',
      })
   ]
};
