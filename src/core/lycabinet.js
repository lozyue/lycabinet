/**
 * lycabinet.js
 * A high performance JSON Object storage helper.
 * 高性能的 JSON对象 小型数据存储辅助类
 * @createdTime 2021-03-28
 */

import * as _STATUS from '../utils/status.js';
import { deepAssign, arbitraryFree, is_Defined, is_PlainObject, DEBUG, arrayIndex } from '../utils/util.js';

/**
 * Init core.
 * @param {*} root 
 * @param {Object} options => {
 *   initStorage => Object, // 初始化值
 *   outerSave => Function, // 自定义保存方法，接收一个参数，为存储的数据对象
 *   outerLoad => Function, // 自定义装载方法，返回一个对象，将Assign给数据存储对象
 * }
 * 注意：以上网络请求的外部通信方法需要返回一个Promise对象.
 */
export function InitCore(Lycabinet){
  
  /**
   * The configuration initialization.
   * @param { String } root 
   * @param { Object } options 
   */
  Lycabinet.prototype._init = function(root, {...options}={} ){

    if(options.initStorage && !is_PlainObject(options.initStorage) ){
      throw new Error("[Lycabinet]:The type of the provided option `initStorage` must be an Object!");
    }

    this.__root = (root || 'lycabinet') + ''; // The key in storage. Must be a string.

    // default options.
    const defaultOptions = {
      root: this.__root, // copy to options.
      autoload: true, // 实例化后 自动调用 __init 方法实例化. (并且此时init中会自动调用 load 方法. 默认使用 Object.assign 浅合并，可手动调用传参深度合并.)
      lazyPeriod : ~~options.lazyPeriod || 5000, // set the lazy period of lazySave methods.
      saveMutex: true, // 存储互斥 仅在 idle 状态可进行保存操作.
      autoLazy: true, // Call lazy save automaticly when the save is busy. 
      // local interfaces of storage
      localInterface: {
        database: window.localStorage,
        getItem: "getItem", // method name, String
        setItem: "setItem", // method name, String
        removeItem: "removeItem", // method name, String
      }, 
      
      // Decide weather enable local cabinet when cloud is setted. Auto judge.
      concurrence: !(options.outerLoad && options.outerSave && options.outerClear),
      // cloud loads example options. The inner pointer `this` is pointed to `cabinet.options` if not set by arrow function.
      outerLoad: ([root, cabinet], success, error)=>{
        // data = load(root)
        let data = {};
        success(data);
      },
      outerSave: ([root, cabinet], success, error)=>{
        // save(root, cabinet)
        success();
      },
      outerClear: ([root, cabinet], success, error)=>{
        // clear(root)
        success();
      },
    };
    this.options = deepAssign(defaultOptions, options);
    this.__install(this.options);
    this.status = _STATUS.CREATED; // status token
    this._trigger("created");
    // From now can have CURD manipulations.
    if(this.options.autoload) this.__init(options.initStorage || Object.create(null) );
  };

  /**
   * Initialize the cabinet storage before 'CURD' manipulation.
   * If autoload is not setted, you should call this manually.
   */
  Lycabinet.prototype.__init = function(cabinet = Object.create(null)){
    // override the options by the already existed cabinet.
    if(this.hasStore()){
      this.__storage = this.getStore();
    }
    else{
      this.__storage = this.__storage || cabinet;
      this.setStore(this.__storage);
    }

    // bind correct Object to the local methods. Replaced by call!
    // const localApi = this.options.localInterface;
    // for(let api in localApi){
    //   if(api!=='database')
    //     localApi[api].bind(localApi.database);
    // }

    this.status = _STATUS.MOUNTED;
    this._trigger("mounted");
    // Auto load.
    if(this.options.autoload) this.load(false); // default using shallow assign.
    else this.status = _STATUS.IDLE; // Amend the status error.
  }

  /**
   * Test the cabinet is busy or not.
   */
  Lycabinet.prototype.isVacant = function(){
    return this.status===_STATUS.IDLE;
  }

  /**
   * Set an item with key.
   * @param {*} key 
   * @param {*} value 
   */
  Lycabinet.prototype.set = function(key, value){
    this.__storage[key] = value;
    this._trigger('setItem', key, value);
    return this;
  };

  /**
   * Get the value of an item by key.
   * @param {*} key 
   */
  Lycabinet.prototype.get = function(key){
    let backValue = this.__storage[key];
    this._trigger('getItem', key, backValue);
    return backValue;
  }

  /**
   * Delete an item by key.
   */ 
  Lycabinet.prototype.remove = function(keys){
    arbitraryFree(keys, (k)=>{
      // Though it isn't disappeared immediately, But after JSON parse and stringify manipulations this will be cleared.
      this.set(k, void 0);
    }); 
    this._trigger('removeItem', keys);
    return this;
  }

  /**
   * Delete the cabinet directly.
   * But the data may still exist in memory.  
   * @param {Boolean} onCloud 
   * @param {Boolean} concurrent Override the default options in `this.options.concurrence`
   */
  Lycabinet.prototype.clear = function(onCloud = null, concurrent = null){
    // merge default options.
    concurrent = is_Defined(concurrent)? concurrent: this.options.concurrence;
    onCloud = is_Defined(onCloud)? onCloud: !!this.options.outerClear;
    this.status = _STATUS.LOADING;
    this._trigger('beforeClear');
    
    // Local clear
    let localClear = ()=>{
      const IgnoreLocal = onCloud && !concurrent;
      this._trigger('beforeLocalClear', IgnoreLocal); // give an status token before invoke.

      if(IgnoreLocal){
        DEBUG && console.log("[Lycabinet]: The local clear action is ignored by options: concurrence=false.");
        return this;
      }
      const localApi = this.options.localInterface;
      localApi.database[localApi.removeItem]( this.__root );
      // trigger hook event after call local database to clear the Item.
      this._trigger('localCleared', this.__root); // Give the param of the remove target. 
    }

    // Cloud clear
    const pack = [this.__root, this.__storage];
    const onSuccess = ()=>{
      this.status = _STATUS.IDLE;
    }
    const onError = (msg)=>{
      this._trigger("error", "clear", "cloudClearings");
      this.status = _STATUS.IDLE;
      throw new Error(`[Lycabinet]: Failed to Clear the cabinet "${this.__root}" on cloud. ${msg}`);
    }

    // handle this async or asyn easily.
    try{
      localClear();
      onCloud && this.options.outerClear(pack, onSuccess, onError);
      this._trigger('cleared', onCloud, concurrent);
    } catch(e){
      console.error(e);
      this._trigger("error", "clear", "unknown");
    }
    return this;
  }

  /**
   * Load the cabinet on initialization.
   * The local load is faster than cloud.
   * @param { Boolean } onCloud 
   * @param { Boolean } concurrent Override the default options in `this.options.concurrence`
   * @param { Boolean } deepMerge Using deepAssign instead of Object.assign to merge the data from local and cloud.
   */
  Lycabinet.prototype.load = function(deepMerge = false, onCloud = null, concurrent = null){
    // merge default options.
    concurrent = is_Defined(concurrent)? concurrent: this.options.concurrence;
    onCloud = is_Defined(onCloud)? onCloud: !!this.options.outerLoad;
    this.status = _STATUS.LOADING;
    this._trigger("beforeLoad");

    // Local load 
    let localLoad = ()=>{
      let localTemp = null;
      const IgnoreLocal = onCloud && !concurrent;
      this._trigger('beforeLocalLoad', IgnoreLocal); // give an status token before invoke.

      if(IgnoreLocal){
        DEBUG && console.log("[Lycabinet]: The local load action is ignored by options: concurrence=false.");
        return this;
      }
      const localApi = this.options.localInterface;
      
      let initialData = localApi.database[localApi.getItem]( this.__root );
      // trigger hook event after call local database to parse the value. Should have a return value in event. (data)=>{ return handle(data); }
      initialData = this._trigger('localLoaded', initialData); // Only take effect on the last element.

      localTemp = JSON.parse( initialData );
      if(deepMerge)
        deepAssign(this.__storage, localTemp);
      else
        Object.assign(this.__storage, localTemp);
    };

    // Cloud load
    const pack = [this.__root, this.__storage];
    const onSuccess = (data)=>{
      if(!is_Defined(data) || !is_PlainObject(data))
        throw new Error(`[Lycabinet]: Load cabinet with empty 'data' which type is ${typeof data}`);
        
      if(deepMerge)
        deepAssign(this.__storage, data);
      else 
      // shallow assign makes cloud weight heavier.
        Object.assign(this.__storage, data);
      this.status = _STATUS.IDLE;
    }
    const onError = (msg)=>{
      this._trigger("error", "load", "cloudLoadings");
      this.status = _STATUS.IDLE;
      throw new Error(`[Lycabinet]: Failed to Load the cabinet "${this.__root}" on cloud. ${msg}`);
    }

    // handle this async or asyn easily.
    try{
      localLoad();
      onCloud && this.options.outerLoad(pack, onSuccess, onError);
      this._trigger('loaded', onCloud, concurrent);
    } catch(e){
      console.error(e);
      this._trigger("error", "load", "unknown");
    }
    return this;
  }

  /**
   * Save the cabinet to database or cloud.
   * @param {*} onCloud 
   * @param {Boolean} concurrent Override the default options in `this.options.concurrence`
   */
  Lycabinet.prototype.save = function(onCloud = null, concurrent = null){
    // check the status for mutex protection
    let check = this.options.saveMutex && !this.isVacant();
    this._trigger("beforeSave", check);
    if( check ){
      DEBUG && console.log(`[Lycabinet]: The 'save' manipulation is deserted for busy. Set 'saveMutex' false to disable it.`);
      this._trigger("busy");
      this.options.autoLazy && this.lazySave(onCloud, concurrent);
      return this;
    }
    
    // merge default options.
    onCloud = is_Defined(onCloud)? onCloud: !!this.options.outerSave;
    concurrent = is_Defined(concurrent)? concurrent: this.options.concurrence;
    this.status = _STATUS.SAVING;

    // Local save 
    let localSave = ()=>{
      const IgnoreLocal = onCloud && !concurrent;
      this._trigger('beforeLocalSave', IgnoreLocal); // give an status token before invoke.

      if(IgnoreLocal){
        DEBUG && console.log("[Lycabinet]: The local save action is ignored by options: concurrence=false.");
        return this;
      }
      const localApi = this.options.localInterface;
      // trigger hook event beforeLocalSave. Should have a return value in event. (data)=>{ return handle(data); }
      let finalData = JSON.stringify(this.__storage );
      // trigger hook event after call local database to save the value. Should return a String value in event.
      finalData = this._trigger('localSaved', finalData); // Only take effect on the last element.

      localApi.database[localApi.setItem](this.__root, finalData);
    };
    

    // Cloud save
    const pack = [this.__root, this.__storage];
    const onSuccess = ()=>{
      this.status = _STATUS.IDLE;
    }
    const onError = (msg)=>{
      this._trigger("error", "save", "cloudSavings");
      this.status = _STATUS.IDLE;
      throw new Error(`[Lycabinet]: Failed to Save the cabinet "${this.__root}" on cloud. ${msg}`);
    }

    // handle this async or asyn easily.
    try{
      localSave();
      onCloud && this.options.outerSave(pack, onSuccess, onError);
      this._trigger('saved', onCloud, concurrent);
    } catch(e){
      console.error(e);
      this._trigger("error", "save", "unknown");
    }
    return this;
  }
  
  /**
   * Map methods support.
   * Iterate the first hierarchy with callback.
   * @param {Function: (item, index)=>any }} callback with two params
   */
  Lycabinet.prototype.forEach = function(callback){
    let item, index = 0;
    for(let key in this.__storage){
      item = this.__storage[key];
      callback(item, index++); // only two params.
    }
  }

  /**
   * Foreach methods support.
   * Iterate the first hierarchy with callback.
   * @param {Function: (item, index)=>any }} callback  with two params
   */
  Lycabinet.prototype.map = function(callback){
    let item, index = 0;
    for(let key in this.__storage){
      item = this.__storage[key];
      this.__storage[key] = callback(item, index++); // only two params.
    }
  }
}
