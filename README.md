# Lycabinet

A simple small JSON Object storage helper with good performance.

一个性能还不错的 小型JSON对象数据存储辅助类.


## Description

一个性能还不错的 小型JSON对象数据存储辅助类.

支持存储 JSON 原生支持的基本数据类型

提供 lazy 系列方法, 可以用于频繁修改场景以提高性能.

目前支持 包括本地存储 LocalStorage / SessionStorage 和自定义外部 API 存储两种并行模式.


## Usage

用法介绍

### Init

很容易就能初始化一个存储对象：
```js
// 不带配置项的初始化
var settings=new lzycabinet("settings");

// 第二个参数可以进行配置，当前展示是部分默认配置
var settings=new lzycabinet("settings",{
  autoload: true,
});
```
这里就建立了一个 key 为`settings`的存储对象
你可以方便的对它进行读写保存等操作


#### Load

使用 load 方法初始化载入数据
```js
settings.load();
```
内置存储库默认基于 localStorage ,调用 load 后将载入数据，但目前在初始化时会自动调用载入

当然你也可以指定外部存储，如一个网络请求，支持 Promise 异步通信，详见: [外部存储XHR通信配置](#外部存储xhr通信配置)



#### Set Data

使用 set 方法或者 lazySet 方法来存储一个数据
后者和前者的区别是是否自动懒保存
注意：使用set方法进行数据写入并不会自动保存
```js
// 使用 key, value 的方式来存储数据
settings.set("name","张三");
// 支持存储各种标准JSON支持的数据类型
settings.set("info",{
  age: 3,
  weight: 45,
  email: "zs@gmail.com",
});
```

#### Grab Data

读取数据使用 read 方法
```js
// 提供存储数据的 key 
settings.read("info");
// 返回 => 
// Object { age: 3, weight: 45, email: "zs@gmail.com" }
```


#### Save Data
存储设定的数据

#####
调用 save 方法来保存数据
默认内置存储是 localStorage ,也同时支持外部存储
配置外部存储详见: [外部存储XHR通信配置](#外部存储xhr通信配置)

```js
settings.save();
```

####


### options

| option      | 描述                                                                 | type    | default |
| ----------- | -------------------------------------------------------------------- | ------- | ------- |
| initStorage | 初始化的数据对象引用(之后的`load,set,save,clear`等方法均其上进行)      | Object  | {}      |
| autoload    | 初始化时是否自动调用加载方法                                         | Boolean | true    |
| saveMutex   | 是否启用保存动作状态互斥                                                     | Boolean | true    |
| lazyPeriod | 懒保存节流周期。单位: ms,影响`lazySave`和`lazySet`方法的节流。挂载`LactionJS`替换为Laction instance的周期 | Integer | 5000 |
| concurrence | 是否允许本地和外部存储并行，设置为false时且未设定外部存储将不会进行本地存储    | Boolean | true    |
| outerLoad   | 外部存储加载方法配置,详见[外部存储XHR通信配置](#外部存储xhr通信配置) | Object  | null    |
| outerSave   | 外部存储保存方法配置,详见[外部存储XHR通信配置](#外部存储xhr通信配置) | Object  | null    |
| outerClear  | 外部存储清除方法配置,详见[外部存储XHR通信配置](#外部存储xhr通信配置) | Object  | null    |


### 外部存储XHR通信配置

Lycabinet支持双路保存
即本地内置存储和云端外置存储双支持
默认云端优先级大于本地存储。

在开启了外置存储的情况下，通过 concurrence 可以配置是否继续启用本地内置存储支持

外部接口需要提供三个方法：清除、保存和加载。

默认为全保存方式，所做数据修改在前端已自动节流，故采用这种折中的方式，适合小型数据粗保存。

要启用云端存储，在创建实例时传递以下属性配置：

```js
new Lycabinet("rootName", {
  outerLoad: ([rootName, cabinet], success, error)=>{
    // data = fetch(rootName) // fetch the data by rootName.
    let data = {};
    success(data); // call on success. give the fetched data.
  },
  outerSave: ([rootName, cabinet], success, error)=>{
    // save(rootName, cabinet) // some ajax or fetch manipulations.
    success();
  },
  outerClear: ([rootName, cabinet], success, error)=>{
    // clear(root) 
    success();
  },
});
```



### Advance

与 Laction JS 共同使用

升级 lazy 系列方法的性能表现。


在初始化仅需调用一下函数即可完成
```js
import Lycabinet from 'lycabinet';
const lactionIns = new Laction(...options); 必须先引入 LactionJS 并初始化其一个实例
lactionIns.use(Lycabinet); // And the time the lazy method period in lycabinet is depends on laction configurations and with a better performance.
```

这将改变 lycabinet 内部 lazySave 的节流防抖机制

虽然节流防抖周期将取决于 laction 实例，

但在降低了节流防抖的计算成本，能更好的应用上贴近人性化的节流防抖设置保存频率。


#### 安全模式

默认情况下对于实例化的 lycabinet 对象是保护起来的。

你应该通过 `set`, `get`, `delete`, `foreach`, `map`, `clear` 等方法

来读写访问其中的数据。

#### Directly Modify 直改模式

但有时你会觉得总是使用 
```js
lycabinet_instance.set('target_key', value);
```
set,get 的函数调用方式 太过麻烦,

那么你可以通过调用`getStore`方法来获得保存的数据对象的一个引用，然后你可以直接在这个Object的引用自由的读写它.

同时各种方法仍然有效。并且不妨碍任何save，load等操作.

```js
const storage = lycabinet_instance.getStore();
storage.key_1 = {name:'desc',value:`That's pretty!`};
lycabinet_instance.save();
```

你甚至可以配合小型响应式系统插件 `observe` plugin 来对其get和set操作来应用自动行为,

其将对数据对象进行劫持，在对数据对象进行修改后会自动调用保存方法。


#### lycabinet.light.js

如果你仅仅只是想使用简单的增改保存功能，那一个发布订阅系统确实是不必要的。

我们也提供更轻小的版本 lycabinet.light.js

它只包含核心方法，适合需要大量创建实例的场景

但由于去掉了发布订阅系统，以此为基础的拓展模块都将无法工作.

虽然默认light版没有导入任何拓展模块，但其他拓展方法的插件仍然可以正常工作。

因此如果你确实需要 observer 和 filter 模块，在 src/light.js 中将相应位置注释取消，重新编译即可。


## Plugins

（Some are in developing）

- `Observer.js`// 监视对数据对象的修改操作并自动调用保存方法
- `Expire.js` // 可基于 LactionJS(模糊型) 的定时删除过期 item 的插件 (因为需要定时更新过期时间防止页面突然关闭) 精度取决于laction的最小值设定
- `zip.js` // 对存储的 json 进行压缩加密，安全性略微提高但并不可靠。
