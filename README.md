# Lycabinet

A simple small JSON Object storage helper with good performance.

一个性能还不错的 小型JSON对象数据存储辅助类.


## Description

一个性能还不错的 小型JSON对象数据存储辅助类.

支持存储 JSON 原生支持的基本数据类型

提供 lazy 系列方法, 可以用于频繁修改场景以提高性能.

目前支持 包括本地存储 LocalStorage / SessionStorage 和自定义外部 API 存储以及两种并行的存储模式.

甚至有轻微的状态管理功能。能够在有多个页面的时候自动同步修改更新数据。


## Usage

用法介绍

### Init

很容易就能初始化一个存储对象：
```js
// 不带配置项的初始化
var cabinet=new lzycabinet("rootKey");

// 第二个参数可以进行配置，当前展示是部分默认配置
var cabinet=new lzycabinet("rootKey",{
  autoload: true, // 自动装载
  initStorage: { // 初始数据对象，必须为PlainObject
    name: "zs",
    info: {
      age: 3,
      weight: 45,
      email: "zs@gmail.com",
    }
  }
});
```
这里就建立了一个 rootKey 为`cabinet`的存储对象。
你可以方便的对它进行读写装载保存等操作。

rootKey 用于指定存储对象类型的标识键值。

比如 Lycabinet 默认使用 LocalStorage 进行本地存储，那么这个 rootKey=`cabinet` 就会作为LocalStorage一个数据项的键名。
当然你也也可以指定 存储对象 为 SessionStorage ，甚至可以额外配置一个外部数据支持。

#### Load / Clear

使用 load 方法初始化载入数据
```js
cabinet.load();
```
内置存储库默认基于 localStorage ,调用 load 后将载入数据。

但目前在初始化时默认的`autoload`选项为true, 也就会自动调用该方法载入数据。

当然你也可以指定外部存储，如一个Promise的异步的网络请求等，在请求结束后调用回调即可。

详见: [外部存储XHR通信配置](#外部存储xhr通信配置)

清除数据使用`clear`方法，清除本地/外部存储，使用方式类似`load`方法。

选项：
```ts
type AccessOptions = Partial<{
  // 是否保存到外部存储，需配置outerSave选项以生效。
  onCloud: boolean|null,
  // 是否同时保存到本地存储 (在外部存储的时候) 
  concurrent: boolean|null, 
  // 本次操作是否使用深度合并
  deepMerge: boolean|null,
  // 当操作完成时调用的回调函数（异步存储时尤其有用）
  onceDone: (isSuccess: boolean, isCloud: boolean)=>unknown,
}>
```
上述选项中 `onCloud`, `concurrent`, `deepMerge` 即便在实例化时未指定也均有一个会自动根据已知选项生成的默认值，
如果在调用`load`,`save`,`clear`方法时不指定其中的选项则默认使用相应默认实例选项值。

对的，`save`类方法的选项也同`load`,`clear` 一样，所以以下就不再赘述了。

#### Read/Write Data

通过属性名读取数据使用 `get` 方法, 支持别名 `read`
```js
// 提供存储数据的 key 
cabinet.get("info");
// 返回 => 
// Object { age: 3, weight: 45, email: "zs@gmail.com" }
```

写数据使用 `set` 方法或者 `lazySet` 方法来指定属性来设定一个数据，
后者和前者的区别是是否自动懒保存。

也即 `lazySet(,,)` 相当于 `cabinet.set(...).lazySave(...)`

注意：使用set方法进行数据写入并不会自动保存
```js
// 使用 key, value 的方式来存储数据
cabinet.set("name", "张三");
// 支持存储各种标准JSON支持的数据类型(标准外数据类型不保证在存储后可恢复)
cabinet.set("info",{
  age: 5,
  weight: 30,
  email: "zs@gmail.com",
});
```

由于上述cabinet实例对象中的`info`属性是一个对象，因此其内的`age`,`weight`等属性无法直接读写。

但你也可以使用`$get`方法传递点分对象路径来读取其值，路径不存在返回undefined而不会报错。

注意：该方法由 Oberser.js 插件提供。

```js
cabinet.$get("info.age");
// 返回 =>
// 30
```

#### Save Data

调用 `save` 或 `lazySave` 来存储已设定的数据到本地或者云端或两者都有。

`lazySave`方法保存时自带节流防抖，适合高频率场景。

```js
// 直接调用
cabinet.save();
// 指定选项
cabinet.
```

默认内置存储是 localStorage ,也同时支持外部存储
配置外部存储详见: [外部存储XHR通信配置](#外部存储xhr通信配置)


### options

#### Construction Options

初始化构造选项: 

##### 核心选项

在生成实例时以对象的方式传递进去: `new Lycabinet(options: {...})`

| option      | 描述                                                                 | type    | default |
| ----------- | -------------------------------------------------------------------- | ------- | ------- |
| initStorage | 初始化的数据对象引用(之后的`load,set,save,clear`等方法均其上进行)      | Object  | {}      |
| autoload    | 初始化时是否自动调用加载方法, 如果设为 false 禁用后, 需要手动调用实例的_init和load方法 | Boolean | true    |
| saveMutex   | 是否启用保存动作状态互斥                                             | Boolean | true    |
| lazyPeriod | 懒保存节流周期。单位: ms,影响`lazySave`和`lazySet`方法的节流。挂载`LactionJS`替换为Laction instance的周期 | Integer | 5000 |
| concurrence | 是否允许本地和外部存储并行，设置为false时且未设定外部存储将不会进行本地存储    | Boolean | true    |
| outerLoad   | 外部存储加载方法配置,详见[外部存储XHR通信配置](#外部存储xhr通信配置) | Object  | null    |
| outerSave   | 外部存储保存方法配置,详见[外部存储XHR通信配置](#外部存储xhr通信配置) | Object  | null    |
| outerClear  | 外部存储清除方法配置,详见[外部存储XHR通信配置](#外部存储xhr通信配置) | Object  | null    |
| localInterface | 配置本地存储对象及方法，可以自定义对象。详情见下                 | Object  | { ...localStorage } |
| deepMerge   | 在调用`load`装载数据时将加载的cabinet和已有的深层合并               | Boolean | false, 
| shareCabinet | 允许当前实例的cabinet共享到全局以便多个相同 root 的实例引用    | Boolean  | true     |
| useSharedCabinet | 当前实例将不生成新的数据对象，如果已经有共享的cabinet      | Boolean  | true     |
| logEvent  | 是否在控制台打印当前实例触发的事件流,需要全局DEBUG选项开启时才有效 | Boolean  | false    |

示例:
```js
new Lycabinet(PublicConsistentCabinetName, {
  deepMerge: true, // For interior Object-type prop reference keep.
  concurrence: true, // always set storage both cloud and local.
  oncloud: true, // same to default
  autoload: false, // should manually load before using.
  useSharedCabinet: false, // Won't be dirtied
  shareCabinet: true, // global share.
  logEvent: true, // set completely log on.
  // Filter Options
  exclude: ["server.cloudSync"],
  // Outer Storage options
  ...getCloudSettings(),
});

function getCloudSettings(){
  return {
    outerLoad: function([rootName, cabinet], success, failed){
      // Fake ajax. fetch some data by rootName.
      ajax.post(`system/storage/get`,{
        key: rootName,
      }).then(( { data: resp} )=>{
        // If the request is success.
        if(resp.msg==='ok')
          success( resp.data ); // Call the `success` callback given with fetched data.
      }).catch((e)=>{
        failed(e); // Call the failed callback when abort.
      });
    },
    outerSave: function([rootName, cabinet], success, failed){
      // Fake ajax. Save some data by rootName.
      ajax.post(`system/storage/save`,{
        key: rootName,
      }).then(( { data: resp} )=>{
        // If the request is success.
        if(resp.msg==='ok')
          success(); // Callback. No need to given the data.
      }).catch((e)=>{
        failed(e); // Call the failed callback when abort.
      });
    },
    outerClear: function([rootName, cabinet], success, failed){
      // Fake ajax. Delete some data by rootName.
      ajax.post(`system/storage/del`,{
        key: rootName,
      }).then(( { data: resp} )=>{
        // If the request is success.
        if(resp.msg==='ok')
          success( resp.data ); // Callback. No need to given the data.
      }).catch((e)=>{
        failed(e); // Call the failed callback when abort.
      });
    },
  }
}
```

其中 localInterface 配置对象具体如下：
| option     | 描述                                          | type    | default |
| ----------- | -------------------------------------------- | ------- | ------- |
| database   | 存储对象的引用，可以是sessionStorage甚至自定义对象等 | Object | localStorage |
| getItem    | 定义在存储对象上读取数据的方法名 | string | "getItem" |
| setItem    | 定义在存储对象上增加和修改数据的方法名 | string | "setItem" |
| removeItem | 定义在存储对象上移除数据的方法名 | string | "removeItem" |

示例：
```js
// initOptions
{
  localInterface: {
    database: window.localStorage,
    getItem: "getItem", // method name, String
    setItem: "setItem", // method name, String
    removeItem: "removeItem", // method name, String
  },
  ...
} 
```

##### 插件选项

启用了相应的插件时才生效（部分插件默认启用）

| option      | 描述                                           | type    | default | plugin |
| ----------- | ---------------------------------------------- | ------- | ------- | ------ |
| autoNotifyTabs | 是否启用多标签页自动同步数据(基于storage事件) | Boolean  | ?: true | check.js |
| includes | 

默认启用的插件有：

`check.js`, `observer.js`(部分启用)


#### 全局选项

影响所有实例，直接在 `Lycabinet` 上设定. 
如: 全局允许打印事件：`Lycabinet.DEBUG = true`

| option      | 描述                                           | type    | default |
| ----------- | ---------------------------------------------- | ------- | ------- |
| DEBUG       | 是否允许实例在控制台打印事件输出                  | Boolean | true    |
| SeparateLog | 是否在打印事件时添加每个实例的`root`来加以区分     | Boolean | false   |

### 外部存储XHR通信配置

Lycabinet支持双路保存
即本地内置存储和云端外置存储双支持
默认云端优先级大于本地存储。

在开启了外置存储的情况下，通过 concurrent 可以配置是否继续启用本地内置存储支持

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
前面核心选项部分，其实已经放出了一个很好的示例了，请向前参考。


## Advance

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


### 安全模式

默认情况下对于实例化的 lycabinet 对象是保护起来的。

你应该通过 `set`, `get`, `delete`, `foreach`, `map`, `clear` 等方法
来读写访问其中的数据。

Lycabinet 有简单的数据状态管理功能，内置了一个[有限状态机](#有限状态机),


### Directly Modify 直改模式

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


### 有限状态机 (Finite Status Machine)

通常的状态周期如下：
```
created -> mounted
-> [Load]
loading -> idle
-> [save]
saving -> busy -> idle
-> [clear]
clearing -> idle
```

对于最频繁的保存行为，Lycabinet为保存方法`save`,`lazySave`默认根据选项`saveMutex`开启了状态保护，
也即只有处于 `idle` 状态的 Lycabinet 实例才能保存成功。
如果调用保存方法时状态为`busy`且默认启用了懒保存，那么Lycabinet将会在每个周期内重新尝试保存。

而在装载与清除行为中也通过`set`类方法对其做了保护，以免在加载中写入的数据状态被加载后的数据覆盖而丢失了。
因此在你确认当前的 cabinet 实例已经加载完毕了之前，请尽可能使用`set`,`lazySet`或者通过激活Observer插件响应性数据模式进行修改数据。

对于如何确保cabinet实例加载完毕，可以通过监听 'loaded' 事件：
```js
cabinet._on("loaded", ()=>{
  // do your jobs here!
  // ...
});
```

### 事件 (Event)

Lycabinet 内置了一套事件系统，你可以通过使用 `_on`, `_once`, 来监听事件。
用 `_off` 来取消`_on`监听的事件, 用 `_trigger` 来自定义触发事件。

普通事件:

特殊事件: (具有特定功能，带有时间执行参数、需要处理的返回值等)
```js
"localLoaded", "localCleared", "localSaved"
```
主要用于插件开发，充当函数钩子. 

主要应用：本地保存的数据原子性保持。

对于需要判断一个事件是否已经触发，可以使用 `_isHappened` 方法.

### Debug Friendly.

对于每个实例化的 Lycabinet 对象你都可以调用 `_setlog` 方法来在控制台打印其事件记录，通过事件记录你可以准确的推出其状态变更等。

注意仅在调用 `_setlog` 方法后才开始打印事件，这就导致可能发生事件遗漏尤其是：created, mouted, beforeLoad, loaded（仅使用本地存储时）

如果你需要打印全部事件，那么你只需在初始化时传递选项 `logEvent: true` 即可清晰的看到整个事件状态周期。

如果你不想在任何实例上看到打印，你可以不用把已设定的打印事件的实例选项再修改回默认，只需对构造对象的 `DEBUG` 属性设值为 `false`即可.

也即: `Lycabinet.DEBUG = false`

#### lycabinet.light.js

尽管Lycabinet编译后体积并不大，
但如果你仅仅只是想使用简单的增改保存功能，那一个内嵌的事件系统和插件群确实是不必要的。

我们也提供更轻小的版本 lycabinet.light.js, 其具有比原版本更小的体积。 
它只包含核心方法，适合需要创建大量实例的场景。

但由于去掉了事件系统，以此为基础的拓展模块都将无法工作.

虽然默认light版没有导入任何拓展模块，但其他拓展方法的插件仍然可以正常工作。

因此如果你确实需要 observer 和 filter 模块，在 src/light.ts 中将相应位置注释取消，重新编译即可。


## Plugins

（Some are in developing）

- `Observer.js`// 将数据对象变为响应式的可监视对数据对象的改动并自动调用保存方法。并可在数据对象上使用`$addListener`和`$removeListener`添加或删除响应数据变更的方法。
- `Check.js` // (available)用于
- `Filter.js` // 可通过 `excludes` 和 `includes` 来过滤筛选需要进行保存的属性值, 支持 dot-split `.` 分割子属性
- `Expire.js` // (todo...) 可模拟cookie为对象增加有效时间并自动清除过期的 Cabinet，但也不完全可靠。
- `zip.js` // (todo...) 对存储的 json 进行压缩或加密，安全性略微提高但并不可靠。

插件功能在默认的编译版本中已自动内置，需要配置相应选项或者调用相应方法启用。

### Observer

使用`initObserver(options)`来激活观察者插件，使数据对象具有响应性。
这能监听所有在数据对象上的改动并自动保存。
并且具有响应性的对象将会被额外添加`$addListener`, `$removeListener`方法用于对其进行添加自定义的监听操作。

暴露`$set`至实例对象与构造对象，用于为目标(路径)对象添加响应性。
暴露`$get`至实例对象与构造对象，用于读取目标路径的内容(相当于Utils中的curveGet方法)。


### Filter

在options中配置 `excludes` 和 `includes` 来自定义过滤或者筛选需要保存的数据对象。

关于装载时自定义部分有待开发……

```ts
Interface FilterOptions {
  excludes: Array<string>,
  includes: Array<string>,
}
```

然后对实例调用 `setFilter` 方法以激活过滤器，无参数。

<!-- 注意，每次修改 excludes 和 includes 选项后应重新应用 `setFilter` 方法以生效。 -->

### Check

用于检查数据载入初期和存储时的合法性，用于提高健壮性。

并提供了多标签页时的数据对象同步功能。
