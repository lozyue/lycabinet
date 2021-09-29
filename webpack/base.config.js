const { resolve } = require("path");

const is_PlainObject = (obj ) => (Object.prototype.toString.call(obj) === '[object Object]');
function deepAssign(target, source){
  for(let item in source){
    if(!(target[item] && is_PlainObject(target[item])) ){
      target[item] = source[item];
    }else{
      deepAssign(target[item], source[item]);
    }
  }
  return target;
}

const baseConfig = {
  mode: 'production',

  devtool: 'source-map', // source map

  mode: "production",
  devtool: 'source-map', // source map
  entry: {
    lycabinet: "./src/index.js",
    // lycabinet_light: './src/light.js',
  },
  output: {
    // support appointed directory
    filename: "[name].js",
    // For production mode. The assets is `publicPath`+filename
    publicPath: '/',
    path: resolve(__dirname, 'dist'),
    // Chunk name except of entry file. 
    chunkFilename: '[name]_chunk.js',
    // In webpack 5
    library: {
      name: 'Lycabinet',
      type: 'umd', 
      umdNamedDefine: true,
      export: 'default',
    }, 
    // Environment configurations
    environment: {
      // whether allow ES5 Arrow-Function in built code.
      arrowFunction: true,
    }
  },
  resolve: {
    // path alias in `import` statement.
    alias:{
      '@': resolve(__dirname, './src')
    },
    // Elliptical post name of files.
    extensions: ['.js','.json','.css','.ts','.vue'],
    // the directory for webpack parse
    modules: [resolve(__dirname, '../node_modules'), 'node_modules'],
  },
  module:{
    // Elevate the export missing warn tp an error. 
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
  plugins:[],
  performance: {
    hints: false,
  },
  node: {
    __dirname: false,
    __filename: false,
    global: true,
  },
}

module.exports = {
  baseConfig: baseConfig,
  deepAssign: deepAssign,
}
