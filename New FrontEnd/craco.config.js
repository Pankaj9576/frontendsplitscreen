module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        timers: require.resolve("timers-browserify"),
        stream: require.resolve("stream-browserify"),
      };
      return webpackConfig;
    },
  },
};