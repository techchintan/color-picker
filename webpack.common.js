const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: {
    popup: path.resolve('src/popup/popup.jsx'),
    options: path.resolve('src/options/options.jsx'),
    image: path.resolve('src/image/image.jsx'),
    gradient: path.resolve('src/gradient/gradient.jsx'),
    background: path.resolve('src/background/background.js'),
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(jpg|jpeg|png|woff|woff2|eot|ttf|svg)$/,
        type: 'asset/resource'
      }
    ]
  },
  resolve: {
    extensions: ['.jsx', '.js'],
  },
  
  plugins: [
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve('src/static'),
          to: path.resolve('dist'),
          globOptions: {
            ignore: ['**/manifest.firefox.json'],
          },
        },
        {
          from: path.resolve('store/privacy-policy.html'),
          to: path.resolve('dist/privacy-policy.html'),
        },
      ],
    }),
    ...getHtmlPlugins([
      'popup',
      'options',
      'image',
      'gradient',
    ]),
  ],
  output: {
    filename: '[name].js',
    path: path.resolve('dist'),
  },
  optimization: {
    splitChunks: {
      chunks(chunk) {
        return chunk.name !== 'background'
      }
    },
  }
}

function getHtmlPlugins(chunks) {
  return chunks.map(chunk => new HtmlPlugin({
    title: '__MSG_extName__',
    filename: `${chunk}.html`,
    chunks: [chunk],
  }))
}
