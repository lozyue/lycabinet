const path = require("path");
const {baseConfig, deepAssign} = require("./base.config.js");


var devConfig = {
  mode: 'development',
  devtool: 'cheap-module-source-map',

  entry: {
    lycabinet: "./src/index",
    "lycabinet.light": './src/light',
  },

  output: {
    filename: '[name].js',
    library: '[name]',
    libraryTarget: 'umd',
    // webpack 5
    library: {
      name: 'Lycabinet',
      type: 'window', // give the definition to window 
      umdNamedDefine: true,
      export: 'default',
    }, 
    environment: {
      arrowFunction: true,
    }
  },
  module: {
    strictExportPresence: true,
    rules: [
      {
        test: /.ts$/,
        use: [{
          loader: 'ts-loader',
          options: {},
        }],
        exclude: /node_modules/,
      },
      {
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: {
                      "chrome": "68",
                      "firefox": "78",
                      // "ie": "11",
                    },
                    "corejs": "3",
                    "useBuiltIns": "usage",
                  }
                ],

              ]
            }
          }
        ],
        exclude: /node_modules/,
      }
    ],
  },

  // hot server
  devServer: {
    compress: true,
    contentBase: path.resolve(__dirname, '..', 'doc/demo'),
    // Where makes the point.
    watchContentBase: true,
    liveReload: true,
    injectClient: false,

    clientLogLevel: 'none',
    quiet: false,
    port: 8090,
    open: true,
    historyApiFallback: {
      disableDotRule: true,
    },
    watchOptions: {
      ignored: /node_modules/,
    },
  },

  plugins: [
  ],
};

devConfig = deepAssign(baseConfig, devConfig);

module.exports = devConfig;
