const path = require("path");

module.exports = {
  entry: "./src/index.js", // Adjust based on your entry file
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
          },
        },
      },
    ],
  },
  resolve: {
    fallback: {
      "zlib": false,
      "querystring": false,
      "crypto": false,
      "stream": false,
      "http": false,
      "fs": false,
      "net": false,
    },
  },
};