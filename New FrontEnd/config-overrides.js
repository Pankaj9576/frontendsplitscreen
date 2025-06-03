module.exports = {
  webpack: function (config, env) {
    return config;
  },
  devServer: function (configFunction) {
    return function (proxy, allowedHost) {
      const config = configFunction(proxy, allowedHost);
      config.setupMiddlewares = (middlewares, devServer) => {
        console.log('Custom middleware running');
        middlewares.push({
          path: '/custom',
          middleware: (req, res) => res.send('Custom route')
        });
        return middlewares;
      };
      return config;
    };
  }
};