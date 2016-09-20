"use strict"

var webpack = require("webpack"),
    path    = require("path");

module.exports = {

  entry: {
    app: ["babel-polyfill", "./src/app.js"],
  },

  resolve: {
    root: ".",
    extensions: ["", ".js"],
    modulesDirectories: ["node_modules", "."],
  },

  output: {
    path: path.join(__dirname, "dist"),
    filename: `[name].js`,
    publicPath: '/',
  },

  module: {
    loaders: [
      { test: /(\.js)$/, loader: 'babel?cacheDirectory', exclude: /node_modules/ },
    ],
  },

  debug: true,

  devtool: "source-map",
}
