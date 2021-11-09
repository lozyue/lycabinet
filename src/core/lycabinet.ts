/**
 * lycabinet.js
 * A high performance JSON Object storage helper.
 * 高性能的 JSON对象 小型数据存储辅助类
 * @createdTime 2021-03-28
 */

import * as _STATUS from '../utils/status.js';
import { deepAssign, arbitraryFree, is_Defined, is_PlainObject, DEBUG, is_Empty, arrayIndex, is_String } from '../utils/util';

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
  Lycabinet.prototype._init = function(root: string, options: Record<string, unknown> = {} ){

    if(options.initStorage && !is_PlainObject(options.initStorage) ){
      throw new Error("[Lycabinet]:The type of the provided option `initStorage` must be an Object!");
    }
    if( !is_String(root)) 
      throw new Error(`[Lycabinet]: The param "root" should be an string, than type ${typeof root}!`);
    this.__root = (root || 'lycabinet') + ''; // The key in storage. Must be a string.

    // default options.
    const defaultOptions = {
      root: this.__root, // copy to options.
      autoload: true, // 实例化后 自动调用 __init 方法实例化. (并且此时init中会自动调用 load 方法. 默认使用 Object.assign 浅合并，可手动调用传参深度合并.)
      lazyPeriod : ~~(options.lazyPeriod as number) || 5000, // set the lazy period of lazySave methods.
      saveMutex: true, // 存储互斥 仅在 idle 状态可进行保存操作. （暂时未防止loading完成前修改……）
      autoLazy: true, // Call lazy save automaticly when the save is busy. 
      logEvent: false, // use this to log event globally from scratch
      useSharedCabinet: true, // use global shared cabinet
      shareCabinet: true, // share the cabinet for global
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
    
    // root event console log
    if(this.options.logEvent) this._setlog();

    this.status = _STATUS.CREATED; // status token
    this._trigger("created");
    // From now can have CURD manipulations.
    if(this.options.autoload) this.__init(options.initStorage || Object.create(null) );
  };

  /**
   * Initialize the cabinet storage before 'CURD' manipulation.
   * If autoload is not setted, you should call this manually.
   * Todo: add reduplicate __init check and warning.
   */
  Lycabinet.prototype.__init = function(cabinet = Object.create(null)){
    // write protection backflow
    const writeBackflow = function(){
      if(is_Empty(this.__tempStorage)) return;
      // backflow
      deepAssign(this.__storage, this.__tempStorage);
      this.__tempStorage = Object.create(null);
      this._trigger("writeBackflow");
    }
    this._on("loaded", writeBackflow);
    this._on("cleared", writeBackflow);

    // override the options by the already existed cabinet.
    // this is global shared with all the instance in the page.
    if(this.options.useSharedCabinet && this.hasStore()){
      // this.__storage = cabinet = this.getStore(); // That's useless cause cabinet is just a Object reference.
      this.__storage = this.getStore();
      // Sync status.
      Object.assign(cabinet, this.__storage);
      this._trigger("loadFromCache");
    }
    else{
      this.__storage = this.__storage || cabinet;
      if(this.options.shareCabinet)
        this.setStore(this.__storage);
      // Auto load. Only when the cabinet in using is private.
      if(this.options.autoload) this.load(false); // default using shallow assign.
      else this.status = _STATUS.IDLE; // Amend the status error.
    }

    this.status = _STATUS.MOUNTED;
    this._trigger("mounted");
    return this;
  }

  /**
   * Test the cabinet is busy or not.
   */
  Lycabinet.prototype.isVacant = function(){
    return this.status===_STATUS.IDLE;
  }

  /**
   * Set an item with key.
   * Added write protection on stage loading and clearing.
   * @param {*} key 
   * @param {*} value 
   */
  Lycabinet.prototype.set = function(key, value){
    const MutexStatus = [_STATUS.LOADING, _STATUS.CLEARING];
    // add write protection.    
    if(MutexStatus.indexOf(this.status) > -1){
      this._trigger("writeLock");
      this.__tempStorage = this.__tempStorage || (this.__tempStorage = Object.create(null));
      this.__tempStorage[key] = value;
      return this;
    }

    this.__storage[key] = value;
    this._trigger('setItem', key, value);
    return this;
  };

  /**
   * Get the value of an item by key.
   * Please don't read from loading and clearing stream.
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
    let removed = false;
    arbitraryFree(keys, (k)=>{
      // Though it isn't disappeared immediately, But after JSON parse and stringify manipulations this will be cleared.
      if(this.__storage.hasOwnProperty(k)){
        this.set(k, void 0);
        removed = true
      }
    }); 
    this._trigger('removeItem', keys, removed);
    return this;
  }

  /**
   * Delete the cabinet directly.
   * But the data may still exist in memory(RAM).  
   * @param {Boolean} onCloud 
   * @param {Boolean} concurrent Override the default options in `this.options.concurrence`
   */
  Lycabinet.prototype.clear = function(onCloud: boolean|null = null, concurrent: boolean|null = null){
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
      this._trigger('cleared', onCloud, concurrent);
    }
    const onError = (msg, reason='')=>{
      this._trigger("error", "clear", "cloudClearings", reason);
      this.status = _STATUS.IDLE;
      this._trigger('cleared', onCloud, concurrent);
      console.error(`[Lycabinet]: Failed to Clear the cabinet "${this.__root}" on cloud. ${msg}`);
    }

    // handle this async or asyn easily.
    try{
      localClear();
      if(onCloud) 
        this.options.outerClear(pack, onSuccess, onError);
      else {
        this.status = _STATUS.IDLE;
        this._trigger('cleared', onCloud, concurrent);
      }
    } catch(e){
      onError(e, "unknown");
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
  Lycabinet.prototype.load = function(deepMerge = false, onCloud: boolean|null = null, concurrent: boolean|null = null){
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
      this._trigger('loaded', onCloud, concurrent);
    }
    const onError = (msg, reason='')=>{
      this._trigger("error", "load", "cloudLoadings", reason);
      this.status = _STATUS.IDLE;
      this._trigger('loaded', onCloud, concurrent);
      console.error(`[Lycabinet]: Failed to Load the cabinet "${this.__root}" on cloud. ${msg}`);
    }

    // handle this async or asyn easily.
    try{
      localLoad();
      if(onCloud) 
        this.options.outerLoad(pack, onSuccess, onError);
      else {
        this.status = _STATUS.IDLE;
        this._trigger('loaded', onCloud, concurrent);
      }
    } catch(e){
      onError(e, "unknown");
    }
    return this;
  }

  /**
   * Save the cabinet to database or cloud.
   * @param {*} onCloud 
   * @param {Boolean} concurrent Override the default options in `this.options.concurrence`
   */
  Lycabinet.prototype.save = function(onCloud: boolean|null = null, concurrent: boolean|null = null){
    // check the status for mutex protection
    let check = this.options.saveMutex && !this.isVacant();
    this._trigger("beforeSave", check);
    if( check ){
      DEBUG && console.log(`[Lycabinet]: The 'save' manipulation is deserted for busy. Current Status: ${this.status} \nSet 'saveMutex' false to disable it.`);
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
      this._trigger('saved', onCloud, concurrent);
    }
    const onError = (msg, reason="cloudSavings")=>{
      this._trigger("error", "save", reason);
      this.status = _STATUS.IDLE;
      this._trigger('saved', onCloud, concurrent);
      console.error(`[Lycabinet]: Failed to Save the cabinet "${this.__root}" on cloud. ${msg}`);
    }

    // handle this async or asyn easily.
    try{
      localSave();
      if(onCloud) 
        this.options.outerSave(pack, onSuccess, onError);
      else {
        this.status = _STATUS.IDLE;
        this._trigger('saved', onCloud, concurrent);
      }
    } catch(e){
      onError(e, 'unknown')
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
