const path = require('path');
const webpack = require('webpack');

const {baseConfig, deepAssign} = require("./base.config.js");

var prodConfig = {
  mode: 'production',
  bail: true,
  devtool: 'source-map', // source map

  entry: {
    "lycabinet": {
      import: './src/index',
      library: {
        name: 'Lycabinet',
        type: 'umd', 
        umdNamedDefine: true,
        export: 'default',
      }, 
    },
    "lycabinet.light": {
      import: './src/light',
      library: {
        name: "Lycabinet",
        type: 'umd', 
        umdNamedDefine: true,
        export: 'default',
      }
    },
    "lycabinet.esm": {
      import: './src/index',
      library: {
        // name: "Lycabinet", // Must keep unset in module type.
        type: "module",
        // export: 'default',
      }
    },
    "lycabinet.light.esm": {
      import: './src/light',
      library: {
        type: "module",
      }
    }
  },

  output: {
    path: path.resolve(__dirname, '..', 'dist'),
    filename: '[name].min.js',
    environment: {
      arrowFunction: true,
    },
    clean: true,
  },
  module: {
    strictExportPresence: true,
    rules: [
      // ts-loader
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
          // babel-loader
          {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  // babel options.
                  {
                    // Target Environment support.
                    targets: {
                      "chrome": "58",
                      // "firefox": "78",
                      "ie": "11",
                    },
                    // Specific the version of core-js. It should be the same as installed. 
                    "corejs": "3",
                    // `usage` keyword makes treeshake.
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

  plugins:[
    new webpack.DefinePlugin({
        LYCABINET_VERSION: `"${require('../package.json').version}"`,
        // GIT_HASH: JSON.stringify(gitRevisionPlugin.version()),
    }),
  ],
  experiments: {
    outputModule: true,
  }
};

prodConfig = deepAssign(baseConfig, prodConfig);
module.exports = prodConfig;
