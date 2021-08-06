const path = require("path");
// import { baseConfig } from './base.config.js'
const {baseConfig, deepAssign} = require("./base.config.js");

/* // 合并base.config.js配置文件 需要先进行安装
// npm install -D webpack-merge
const WebpackMerge = require('webpack-merge') */

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
    // targetExport: 'default', // Or the webpack will wrap a ['default'] over the target and can see in window when load by script tag. see: https://segmentfault.com/a/1190000013632880
    environment: {
      // 是否允许箭头函数写法
      arrowFunction: true,
    }
  },
  module: {
    strictExportPresence: true,
    rules: [
      {
        test: /\.[jt]s$/,
        use: [
          // babel-loader,
          // 对象方式进行设置
          {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  // 指定环境插件
                  '@babel/preset-env',
                  // 配置信息
                  {
                    // 允许环境和版本
                    targets: {
                      "chrome": "68",
                      "firefox": "78",
                      // "ie": "11",
                    },
                    // 指定core-js版本 与安装一致
                    "corejs": "3",
                    // 使用 core-js 的方法 usage指定按需加载
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
// devConfig = WebpackMerge(baseConfig, devConfig); // 使用webpack提供的函数进行合并配置
module.exports = devConfig;
