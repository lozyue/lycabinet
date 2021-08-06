const path = require('path');
const {baseConfig, deepAssign} = require("./base.config.js");

var prodConfig = {
  mode: 'production',

  bail: true, // 保密，保释人

  devtool: 'source-map', // source map

  entry: {
    lycabinet: './src/index.js',
    "lycabinet.light": './src/light.js',
  },

  output: {
    path: path.resolve(__dirname, '..', 'dist'),
    filename: '[name].min.js',
    // webpack 5
    // webpack 5
    library: {
      name: 'Lycabinet',
      type: 'umd', 
      umdNamedDefine: true,
      export: 'default',
    }, 
    // webapck 打包环境配置
    environment: {
      // 是否允许箭头函数写法
      arrowFunction: true,
    },
    clean: true,
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
                      "chrome": "58",
                      // "firefox": "78",
                      "ie": "11",
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

};


prodConfig = deepAssign(baseConfig, prodConfig);
// prodConfig = WebpackMerge(baseConfig, prodConfig); // 使用webpack提供的函数进行合并配置
module.exports = prodConfig;

