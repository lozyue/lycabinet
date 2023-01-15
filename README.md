# Lycabinet

A slight JSON Type Object storage helper with good performance works in the browser.

一个性能还不错的浏览器端轻量级JSON对象数据存储辅助类.


## Description

一个性能还不错的轻量级JSON对象数据存储辅助类。

支持存储 JSON 原生支持的基本数据类型。

提供 lazy 系列方法, 可以用于频繁修改场景以提高性能。

目前支持 包括本地存储 LocalStorage / SessionStorage等 和自定义外部 API 存储以及两种并行的存储模式。

能够在有多个页面的时候自动同步修改更新数据。
甚至有简单的状态管理功能。


## Installing

Using npm:

```bash
$ npm install lycabinet
```

Using jsDelivr cdn:

```html
<!-- Full build -->
<script src="https://cdn.jsdelivr.net/npm/lycabinet/dist/lycabinet.min.js"></script>

<!-- Light version -->
<script src="https://cdn.jsdelivr.net/npm/lycabinet/dist/lycabinet.light.min.js"></script>
```

Using unpkg cdn:

```html
<!-- Full build -->
<script src="https://unpkg.com/lycabinet@0.6.1/dist/lycabinet.min.js"></script>

<!-- Light version -->
<script src="https://unpkg.com/lycabinet@0.6.1/dist/lycabinet.light.min.js"></script>
```


## Usage

用法介绍

### Init

很容易就能初始化一个存储对象：
```js
// 不带配置项的初始化
var cabinetIns=new Lycabinet("rootKey");

// 第二个参数可以进行配置
var cabinetIns=new Lycabinet("rootKey",{
  autoload: true, // 自动装载，同默认配置
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
这里就建立了一个 rootKey 为`rootKey`的存储对象。
你可以方便的对它进行读写装载保存等操作。

rootKey 用于指定存储对象类型的标识键值。

比如 Lycabinet 默认使用 LocalStorage 进行本地存储，那么这个 rootKey=`rootKey` 就会作为LocalStorage一个数据项的键名。
当然你也可以指定 存储对象 为 SessionStorage ，甚至可以额外配置一个外部数据支持，rootKey都是作为最核心的数据对象标识
（实际上保存的时候存储的都是经过JSON序列化后的字符串）。

如果将`autoload`选项禁用，则一定要手动调用`_init`方法:
```js
cabinetIns._init(); // Accept a param to replace as the initStorage in option.
```
然后示情况调用
```js
cabinetIns.load();
```

#### load / clear

使用 load 方法初始化载入数据，用于将已经存储的数据载入内存中，以防调用Save时保存的数据覆盖而丢失之前存储的数据。
在保持默认启用的autoload选项时，可以省略手动调用。

内置存储库默认基于 localStorage ,调用 load 后将载入本地已有数据，载入数据以合并的方式，可自定义合并规则(默认浅合并)。

但目前在初始化时默认的`autoload`选项为true, 也就会自动调用该方法载入数据。

当然你也可以指定外部存储，如一个Promise的异步的网络请求等，在请求结束后调用回调即可。

详见: [外部存储XHR通信配置](#外部存储xhr通信配置)

选项：
```ts
function load(option: AccessOptions): LycabinetInstance;
type AccessOptions = Partial<{
  // 指定是否保存到外部存储，需配置outerSave选项以生效。
  onCloud: boolean|null,
  // 指定是否同时保存到本地存储 (在外部存储的时候) 
  concurrent: boolean|null, 
  // 指定本次操作是否使用深度合并 (可配置 customMerge 自定义合并策略)
  deepMerge: boolean|null,
  // 指定本次操作是否不使用自定义合并策略
  disableMerge: boolean,
  // 当操作完成时调用的回调函数（异步存储时尤其有用）
  onceDone: (isSuccess: boolean, isCloud: boolean)=>unknown,
}>
```
上述选项中 `onCloud`, `concurrent`, `deepMerge` 即便在实例化时未指定也均有一个会自动根据已知选项生成的默认值，
如果在调用`load`,`save`,`clear`方法时不指定其中的选项则默认使用相应默认实例选项值。

清除数据使用`clear`方法，清除本地/外部存储，选项如下:

```ts
function clear(option: AccessOptions): LycabinetInstance;
type AccessOptions = Partial<{
  // 指定是否保存到外部存储，需配置outerSave选项以生效。
  onCloud: boolean|null,
  // 指定是否同时保存到本地存储 (在外部存储的时候) 
  concurrent: boolean|null, 
  // 当操作完成时调用的回调函数（异步存储时尤其有用）
  reset: boolean,
  onceDone: (isSuccess: boolean, isCloud: boolean)=>unknown,
}>
```

但`clear`方法默认仅清除存储的数据（本地存储和外部存储），而cabinet数据对象在内存中仍然没有改变。
而如果要将内部 cabinet 对象数据也重置为空 可以在调用`clear`的选项中添加值为 true 的 "reset" 属性。
```js
// Eliminate the value added by `set`.
cabinetIns.clear({
  reset: true, // reset inner cabinet to vacant Object
});
```

对于`load`方法，也可以临时禁用实例选项的 customMerge 规则，因为 customMerge 可能通常用于合并更多的数据。
这可能导致一些特定的情况下数据清除不掉的问题。

因此 load 方法也支持了额外的 `disableMerge` 选项，传递`true`以临时禁用自定义 customMerge 选项。

> 关于 customMerge 选项，参考 [Options](#options)

#### Read/Write Data

通过属性名读取数据使用 `get` 方法, 支持别名 `read`
```js
// 提供存储数据的 key 
cabinetIns.get("info");
// 返回 => 
// Object { age: 3, weight: 45, email: "zs@gmail.com" }
```

写数据使用 `set` 方法或者 `lazySet` 方法来指定属性来设定一个数据，
后者和前者的区别是是否自动懒保存。

也即 `lazySet(key, value, options)` 相当于 `cabinetIns.set(key,value).lazySave(options)`

注意：使用set方法进行数据写入并不会自动保存
```js
// 使用 key, value 的方式来存储数据
cabinetIns.set("name", "张三");
// 支持存储各种标准JSON支持的数据类型(标准外数据类型不保证在存储后可恢复)
cabinetIns.set("info",{
  age: 5,
  weight: 30,
  email: "zs@gmail.com",
});
```

由于上述cabinet实例对象中的`info`属性是一个对象，因此其内的`age`,`weight`等属性无法直接读写。

但你也可以使用`$get`方法传递点分对象路径来读取任意深的值，其好处是如果中间路径中某个对象不存在链断裂将返回undefined而不会报错。

注意：该方法由 Observer.js 插件提供。

```js
cabinetIns.$get("info.age");
// 返回 =>
// 30
```

如果你不在需要某个属性值如 age ，那么可以使用set方法将其设定为 undefined :
```js
cabinetIns.set("age", undefined);
```

当然你也可以使用`remove`方法来一次清除一个或多个属性, 支持别名 `delete`
```js
cabientIns.remove("age");
// Muti-remove
cabinetIns.remove(["age", "weight"]);
```

#### Save Data

`save`类的方法的选项也类似`load`,`clear`:
```ts
function save(option: AccessOptions): LycabinetInstance;
type AccessOptions = Partial<{
  // 指定是否保存到外部存储，需配置outerSave选项以生效。
  onCloud: boolean|null,
  // 指定是否同时保存到本地存储 (在外部存储的时候) 
  concurrent: boolean|null, 
  // 当操作完成时调用的回调函数（异步存储时尤其有用）
  onceDone: (isSuccess: boolean, isCloud: boolean)=>unknown,
}>
```

调用 `save` 或 `lazySave` 来存储已设定的数据到本地或者云端或两者都有。

对于lazy类方法`lazySave`方法选项也同save. 保存时自带节流防抖，适合高频率场景。

```js
// 直接调用
cabinetIns.save();
// 指定选项
cabinetIns.save({
  onCloud: true, // 保存到云端
  concurrent: false, // 不重复到本地存储
  onceDone(){
    console.log("保存到云端成功！")
  }
});
```

默认本地存储是 localStorage , 同时支持外部存储, 可自定义API回调
配置外部存储详见: [外部存储XHR通信配置](#外部存储xhr通信配置)


### Destroy

```ts
function destroy(autoClear: boolean=false);
```

为避免内存泄漏，当你不再使用一个`Lycabinet`实例时, 
你始终应该在丢弃它时手动调用 `destroy()` 方法以便于JS GC回收内存。

注意: 如果给`destory`方法传递`true`选项，这将顺带清除掉本地存储的数据。


### Options

#### Construction Options

大部分初始化选项都会被合并到`Lycabinet`实例的 `options` 属性中，并且其中大多数也支持运行时修改有效。

##### 核心选项

在生成实例时以对象的方式传递进去: `new Lycabinet(options: {...})`

| option      | 描述                                                                 | type    | default |
| ----------- | -------------------------------------------------------------------- | ------- | ------- |
| initStorage | 初始化的数据对象引用(之后的`load,set,save,clear`等方法均其上进行)      | Object  | {}      |
| autoload    | 初始化时是否自动调用加载方法, 如果设为 false 禁用后, 需要手动调用实例的_init和load方法 | Boolean | true    |
| saveMutex   | 是否启用保存动作状态互斥                                             | Boolean | true    |
| lazyPeriod | 懒保存节流周期。单位: ms,影响`lazySave`和`lazySet`方法的节流。挂载`LactionJS`后会被替换为Laction instance的周期 | Integer | 5000 |
| concurrent | 是否允许本地和外部存储并行，设置为false时且未设定外部存储将不会进行本地存储    | Boolean | true    |
| outerLoad   | 外部存储加载方法配置,详见[外部存储XHR通信配置](#外部存储xhr通信配置) | Object  | null    |
| outerSave   | 外部存储保存方法配置,详见[外部存储XHR通信配置](#外部存储xhr通信配置) | Object  | null    |
| outerClear  | 外部存储清除方法配置,详见[外部存储XHR通信配置](#外部存储xhr通信配置) | Object  | null    |
| localInterface | 配置本地存储对象及方法，可以自定义对象。详情见下                 | Object  | { ...localStorage } |
| deepMerge   | 在调用`load`装载数据时将加载的cabinet和已有的深层合并               | Boolean | false |
| customMerge | 自定义装载时数据合并规则, 接收要合并的数据返回合并结果; 仅deepMerge启用时有效 | (srcObj, dstObj)=>Object | null | 
| shareCabinet | 允许当前实例的cabinet共享到全局以便多个相同 root 的实例引用    | Boolean  | true     |
| useSharedCabinet | 当前实例将不生成新的数据对象，如果已经有共享的cabinet      | Boolean  | true     |
| logEvent  | 是否在控制台打印当前实例触发的事件流,需要全局DEBUG选项开启时才有效 | Boolean  | false    |

- 示例:
```js
new Lycabinet("rootName", {
  deepMerge: true, // For interior Object-type prop reference keep.
  concurrent: true, // always set storage both cloud and local.
  oncloud: true, // same to default
  autoload: false, // should manually load before using.
  useSharedCabinet: false, // Won't be dirtied
  shareCabinet: true, // global share.
  logEvent: true, // set completely log on.
  // Filter Options
  exclude: ["server.cloudSync"],
  // Outer Storage options
  ...getCloudConfig(),
});

function getCloudConfig(){
  return {
    outerLoad: function([rootName, cabinet], success, failed){
      // Fake ajax. fetch some data by rootName.
      ajax.post(`system/storage/get`,{
        key: rootName,
      }).then(( { data: resp} )=>{
        // If the request is successed.
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
        // If the request is successed.
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
        // If the request is successed.
        if(resp.msg==='ok')
          success( resp.data ); // Callback. No need to given the data.
      }).catch((e)=>{
        failed(e); // Call the failed callback when abort.
      });
    },
  }
}
```

- customMerge

用于 "load" 方法载入数据时自定义合并规则。
常用于对于数组属性存储的处理。

因为即使是深度合并默认的规则也碰到cabinet的属性值为数组时是直接使用新的值覆盖，
而有时候我们想要保留更多的数据比如将相同对象路径的数组属性合并去重不是直接覆盖。

我们可以在初始化时这么配置:
```js
new Lycabinet("rootName", {
  deepMerge: true, // Global defaultly enable for customMerge
  // Custom Merge strategy
  customMerge: (source, target)=>{
    const ObjArrMergeKey = 'name';
    if( Array.isArray(source) && source.length 
      && Array.isArray(target)
    ){
      // De-duplicate merge as normal data-type;
      let item;
      for(let index=0;index<target.length;index++){
        item = target[index];
        let find = 0;
        for(; find<source.length; find++){
          // Check redundant.
          if(source[find] === item)
            break;
        }
        if(source.length===find)
          source[find] = item;
      }
      return source;
    }else
      return target;
  }
});
```

- localInterface

localInterface 配置对象具体如下：
| option     | 描述                                          | type    | default |
| ----------- | -------------------------------------------- | ------- | ------- |
| database   | 存储对象的引用，可以是sessionStorage甚至自定义对象等 | Object | localStorage |
| getItem    | 定义在存储对象上读取数据的方法名 | string | "getItem" |
| setItem    | 定义在存储对象上增加和修改数据的方法名 | string | "setItem" |
| removeItem | 定义在存储对象上移除数据的方法名 | string | "removeItem" |

> 如果完全自定义内部存储对象，请始终确保自定义的内部存储对象的存储方法为同步函数，异步函数可能会造成状态混乱。

示例：将 Lycabinet 配置为使用 SessionStorage.
```js
// initOptions
{
  localInterface: {
    database: window.sessionStorage,
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
| includes | 自定义数据保存时指定包含的保存数据对象路径数组       | String[] | []      | filter.js |
| includes | 自定义数据保存时指定排除的保存数据对象路径数组       | String[] | []      | filter.js |
| lazy     | 是否启用监听数据对象自动保存                       | Boolean  |  true  | observer.js |
| initWatch | whether transform the origin property in Observer | Boolean | true | observer.js |
| deepWatch | whether consistently watch the inner Object value initial and later setted | Boolean | true|  observer.js |
| shallowWatch | whether just watch the surface of the Object | Boolean | false | observer.js |


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
  outerLoad: ([rootName, cabinet], success, failed)=>{
    // fake fetch
    var data = fetch(rootName); // fetch the data by rootName.
    // call first callback once success.
    success(data); // give the fetched data.
    // once failed
    // failed();
  },
  outerSave: ([rootName, cabinet], success, failed)=>{
    // fake save
    save(rootName, cabinet) // some ajax or fetch manipulations.
    // call first callback once success.
    success();
    // call the seconde callback function once failed
    // failed();
  },
  outerClear: ([rootName, cabinet], success, failed)=>{
    // fake clear
    clear(root); // clear the cabinet by rootName.
    // call first callback once success.
    success();
    // call the seconde callback function once failed
    // failed();
  },
});
```

对于每个选项: `outerLoad`, `outerSave`, 和`outerClear`都配置为一个函数方法。
在这个函数方法内你可以使用API请求来完成相应的工作。

这个函数方法有三个参数，第一个参数为相关信息的数组，如上例中`[rootName, cabinet]`，
数组的第一个参数是当前`Lycabinet`实例对象的标识root名称，
你可以使用它作为API存储中每个数据对象(cabinet)的存储键值。
数组中的第二个参数是当前实例中的数据对象(cabinet)，保存到外部就将它提交上去。手动获取使用`cabinetIns.getCabinet()`。

而第二个参数`success`，是一个回调函数，你应该在API请求成功后调用它。
第三个参数`failed`，是请求失败情况下的回调函数，如果保存到外部的API请求失败了，你应该仅调用它。

如果你的API请求是一个构造的Promise对象，只需要在`then`中调用`success`方法，在`catch`中调用`failed`方法即可。

前面核心选项部分，其实已经放出了一个很好的示例了，请向前参考。


## Advance

与 [LactionJS](https://github.com/lozyue/laction) 共同使用

升级 lazy 系列方法的性能表现。


在初始化仅需调用一下函数即可完成
```js
import Lycabinet from 'lycabinet';
import Laction from 'laction';
const lactionIns = new Laction(...options); // 必须先引入 LactionJS 并初始化其一个实例
lactionIns.use(Lycabinet); // And the time the lazy method period in lycabinet is depends on laction configurations and with a better performance.
```

这将改变 lycabinet 内部 lazySave 的节流防抖机制

虽然节流防抖周期将取决于 laction 实例，
但在降低了节流防抖的计算成本，能更好的应用上贴近人性化的节流防抖设置保存频率。

### Cabinet

Lycabinet内部的一切改动都是围绕一个JS Object进行的，有时候我们使用 "数据对象" 来对其进行称呼。
而通常情况下，`cabinet`就是其专有名称了。

你可以使用 `cabinetIns.getCabinet()` 来获取这个cabinet的引用。
使用 `cabinetIns.removeStore()` 来删除当前实例的cabinet。
当然，只要在使用结束后调用了 `cabinetIns.destroy()` 就会顺带删除当前实例的cabinet。

Lycabinet不仅对 cabinet 做了简单的状态保护，还对其添加了缓存。
默认相同`root`名称的 Lycabinet 实例都具有相同的`cabinet`，类似于自动单例数据对象模式的 cabinet共享。

如果你需要改变其默认模式，请在初始化时配置选项 `useSharedCabinet`, `shareCabinet`。
具体参见前段: [选项](#options)

如果不使用cabinet 共享模式，请谨慎对新的实例应用存储清除等方法，因为所有的内外部存储依赖的键值仍均为`root`,
这可能导致全局状态的不一致。


### 安全模式

默认情况下对于实例化的 Lycabinet 对象是保护起来的。

你应该通过 `set`, `get`, `delete`, `foreach`, `map`, `clear` 等方法
来读写访问其中的数据。这样才能保证 Lycabinet 内部的一些状态能正常工作。

Lycabinet 有简单的数据状态管理功能，内置了一个[有限状态机](#有限状态机),


### Directly Modify 直改模式

但有时你会觉得总是使用 
```js
lycabinet_instance.set('target_key', value);
```
set,get 的函数调用方式 太过麻烦,

那么你可以通过调用`getCabinet`方法来获得保存的数据对象的一个引用，然后你可以直接在这个Object的引用自由的读写它.

同时各种方法仍然有效。并且不妨碍任何save，load等操作.

```js
const storage = lycabinet_instance.getCabinet();
storage.key_1 = {name:'desc',value:`That's pretty!`};
lycabinet_instance.save();
```

你甚至可以配合小型响应式系统插件 `observe` plugin 来对其get和set操作来应用自动行为,

其将对数据对象进行劫持，在对数据对象进行修改后会自动调用保存方法。


### 有限状态机 (Finite Status Machine)

通常的状态周期如下：
```
[On instantiation] -> 
created -> mounted
[On load] ->  
loading -> idle
[On save] -> 
saving -> busy -> idle
[On clear] -> 
clearing -> idle
[On destroy] ->
destroyed
```

`mounted`状态对应于最早能写

对于最频繁的保存行为，Lycabinet为保存方法`save`,`lazySave`默认根据选项`saveMutex`开启了状态保护，
也即只有处于 `idle` 状态的 Lycabinet 实例才能保存成功。
如果调用保存方法时状态为`busy`且默认启用了懒保存，那么Lycabinet将会在每个周期内重新尝试保存。

而在装载与清除行为中也通过`set`类方法对其做了保护，以免在加载中写入的数据状态被加载后的数据覆盖而丢失了。
因此在你确认当前的 cabinet 实例已经加载完毕了之前，请尽可能使用`set`,`lazySet`或者通过激活Observer插件响应性数据模式进行修改数据。

对于如何确保cabinet实例加载完毕，可以通过监听 'loaded' 事件：
```js
cabinetIns._on("loaded", ()=>{
  // do your jobs here!
  // ...
});
```

### 事件 (Event)

Lycabinet 内置了一套事件系统，你可以通过使用 `_on`, `_once`, 来监听事件。
用 `_off` 来取消`_on`监听的事件, 用 `_trigger` 来自定义触发事件。

对于需要判断一个事件是否已经触发，可以使用 `_isHappened` 方法。

上述方法传递事件名称

普通事件:
```ts
type CabinetEventType =
'created'|'mounted'| 
'beforeLoad'| 'beforeLocalLoad'| 'localLoaded'| 'loaded'| 
'loadFromCache'|
'storageSync'|
'setItem'| 'writeLock'| 'writeBackflow'| 
'getItem'| 'removeItem'| 
'lazySave'| 
'beforeSave'| 'beforeLocalSave'| 'localSaved'| 'saved'| 'busy'|
'beforeClear'| 'beforeLocalClear'| 'localCleared'| 'cleared'|
'error'|
'destroyed';
```

特殊事件: (具有特定功能，带有事件执行参数、需要处理的返回值等)
```js
"localLoaded", "localCleared", "localSaved"
```
这些事件依赖监听函数的返回值。主要用于插件开发，充当钩子函数。


### Debug Friendly.

对于每个实例化的 Lycabinet 对象你都可以调用 `_setlog` 方法来在控制台打印其事件记录，通过事件记录你可以准确的推出其状态变更等。

注意仅在调用 `_setlog` 方法后才开始打印事件，这就导致可能发生事件遗漏尤其是：created, mouted, beforeLoad, loaded（仅使用本地存储时）

如果你需要打印全部事件，那么你只需在初始化时传递选项 `logEvent: true` 即可清晰的看到整个事件状态周期。

如果你不想在任何实例上看到打印，你可以不用把已设定的打印事件的实例选项再修改回默认，只需对构造对象的 `DEBUG` 属性设值为 `false`即可.

也即: `Lycabinet.DEBUG = false`

### lycabinet.light.js

If you want more slight package with just simple storage works, that an event system can not be that necessary.
you can consider this. The package size is reduced by almost half.

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
- `Check.js` // 用于增强健壮性，并提供了多标签页时的数据对象同步功能
- `Filter.js` // 可通过 `excludes` 和 `includes` 来过滤筛选需要进行保存的属性值, 支持 dot-split `.` 分割子属性
- `Expire.js` // (todo...) 可模拟cookie为对象增加有效时间并自动清除过期的 Cabinet，但也不完全可靠。
- `Zip.js` // (todo...) 对存储的 json 进行压缩或加密，安全性略微提高但并不可靠。

插件功能在默认的编译版本中已自动内置，需要配置相应选项或者调用相应方法启用。

### Observer

使用`initObserver(options)`来激活观察者插件，使数据对象具有响应性。
这能监听所有在数据对象上的改动并自动保存，默认使用`lazySave`进行懒保存。

并且具有响应性的对象将会被额外添加`$addListener`, `$removeListener`方法用于对其进行添加自定义的监听操作。

暴露`$active`至实例对象与构造对象，用于为目标(路径)对象添加响应性。
暴露`$get`至实例对象与构造对象，用于读取目标路径的内容(相当于Utils中的curveGet方法)。

还记得之前$get的用法的示例吗？继续这里给出$active的用法:
```js
cabinetIns.$active("info.private"); // 可设定一个更深的对象链上的值，不冲突时将会自动创建
// 此时内部cabinet的值为:
// {
//   "info",{
//     age: 5,
//     weight: 30,
//     email: "zs@gmail.com",
//     private: {
//     }
//   },
//   ...
// }
const prop = cabinetIns.$get("info.private");
var handle = (prop, nVal, oVal)=>{console.log(`prop ${prop} is changed from ${oVal} to ${nVal} on info.private!`)}
prop.$addListener(handle); // Add changes listener by calling the non-iterable methods.
prop.phone = 80086;
// => (auto log) 
// prop phone is changed from undefined to 80086 on info.private!
```


### Filter

在options中配置 `excludes` 和 `includes` 来自定义在保存时需要过滤或者筛选的数据对象。

```ts
Interface FilterOptions {
  excludes: Array<string>,
  includes: Array<string>,
}
```
以上选项可以只指定一个，不指定 includes 则默认包含全部数据。
不指定 excludes 则默认在保存时不排除任何数据。

excludes 与 includes 选项均支持点分对象路径定位。

比如: 
```js
new Lycabinet('filterStore', {
  initStorage: {
    server: {
      http: "192.168.0.1:2333",
      sync: false,
    },
    settings: {
      volume: 0.6,
      danmu: {
        limit: false,
        speed: 8,
      }
    }
  },
  includes: ["server", "settings.danmu"],
  excludes: ["server.http"],
}).save();
```

对于以上初始配置，在调用保存选项后得到的内部存储字符串等效于：
```js
JSON.stringify({
  server: {
    sync: false,
  },
  settings: {
    danmu: {
      limit: false,
      speed: 8,
    }
  }
})
```

只要在初始配置项中传递了以上设置，Lycabinet将会自动调用`setFilter()`方法激活插件。

如果你使用的是`light`版本，需要在处于`mounted`的状态后手动对实例调用 `setFilter()` 方法以激活过滤器。

<!-- 与保存时过滤数据相反，装载时也可以自定义默认数据。
关于装载时自定义默认数据部分有待开发…… -->


### Check

用于检查数据载入初期和存储时的合法性，用于提高健壮性。

并提供了多标签页时的数据对象同步功能。
