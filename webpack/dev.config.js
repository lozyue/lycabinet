const path = require("path");
// import { baseConfig } from './base.config.js'
const {baseConfig, deepAssign} = require("./base.config.js");

// npm install -D webpack-merge
// const WebpackMerge = require('webpack-merge');

var devConfig = {
  mode: 'development',

  devtool: 'cheap-module-source-map',

  entry: {
    lycabinet: "./src/index.js",
    // "lycabinet.light": './src/light.js',
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
    // Or the webpack will wrap a ['default'] over the target and can see in window when load by script tag. 
    // see: https://segmentfault.com/a/1190000013632880
    // targetExport: 'default', 
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
    contentBase: path.resolve(__dirname, '..', 'doc'),
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
    // new webpack.DefinePlugin({
    //     LYCABINET_VERSION: `"${require('../package.json').version}"`,
    //     GIT_HASH: JSON.stringify(gitRevisionPlugin.version()),
    // }),
  ],
};

devConfig = deepAssign(baseConfig, devConfig);
// devConfig = WebpackMerge(baseConfig, devConfig); // merge by the function provided with webpack.
module.exports = devConfig;
