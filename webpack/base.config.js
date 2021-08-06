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
    // 可以指定 目录 + 名称
    filename: "[name].js",
    // 所有资源引入的公共路径 一般用于生产环境 资源引入路径为 publicPath+filename
    publicPath: '/',
    // 所有输出包括资源根目录的文件夹地址
    path: resolve(__dirname, 'dist'),
    // 除了入口文件外的其余分隔chunk部分
    chunkFilename: '[name]_chunk.js',
    // webpack 5
    library: {
      name: 'Lycabinet',
      type: 'umd', 
      umdNamedDefine: true,
      export: 'default',
    }, 

    /* below webpack 5
    // 作为library导出  值为整个库向外暴露的变量名
    library: 'Lycabinet', // '[name]',
    // 导出到的模块
    libraryTarget: 'umd',
    // 
    libraryExport: 'default',
    // 
    umdNamedDefine: true, */
    // webapck 打包环境配置
    environment: {
      // 是否允许箭头函数写法
      arrowFunction: true,
    }
  },
  resolve: {
    // 路径别名，允许使用 如@ 代替src目录
    alias:{
      '@': resolve(__dirname, './src')
    },
    // 配置省略路径的后缀名规则 如省略 '.js'
    extensions: ['.js','.json','.css','.ts','.vue'],
    // webpack解析模块寻找的目录
    modules: [resolve(__dirname, '../node_modules'), 'node_modules'],
  },
  module:{
    // 将缺失的导出提示成错误而不是警告
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
