/**
 * lycabinet.js
 * A slight JSON Type Object storage helper with good performance.
 * 一个适用于JSON对象数据存储的轻量辅助类。
 * @author Lozyue
 * @createdTime 2021-03-28
 */

import { ConstructOptions, AccessOptions } from '@/typings/lycabinet';
import * as _STATUS from '@/utils/status';
import { 
  deepAssign, arbitraryFree, 
  is_Defined, is_PlainObject, is_Empty, is_String,
  LogToken, DEBUG, deepConditionalAssign, 
} from '@/utils/util';

export function InitCore(Lycabinet){
  // Constructor Options
  Lycabinet.DEBUG = true;
  Lycabinet.SeparateLog = false;

  const Proto = Lycabinet.prototype;
  /**
   * The configuration initialization.
   * @param { String } root 
   * @param { Object } options 
   */
  Proto.__init = function(root: string, options: Partial<ConstructOptions> = {} ){

    if(options.initStorage && !is_PlainObject(options.initStorage) ){
      throw new Error(`${LogToken}The type of the provided option "initStorage" must be an Object!`);
    }
    if( !is_String(root)) 
      throw new Error(`${LogToken}The param "root" should be an string, than type ${typeof root}!`);
    this.__root = (root || 'lycabinet') + ''; // The key in storage. Must be a string.

    // default options.
    const defaultOptions = {
      root: this.__root,
      autoload: true,
      lazyPeriod : ~~(options.lazyPeriod as number) || 5000, // set the lazy period of lazySave methods.
      saveMutex: true,
      autoLazy: true, // Call lazy save automaticly when the save is busy. 
      logEvent: false, // use this to log event globally from scratch
      useSharedCabinet: true, // use global shared cabinet
      shareCabinet: true, // share the cabinet for global
      // Weather use deepAssign to contact when load from outer data.
      deepMerge: false, 
      customMerge: null, // Applying just on loading.
      // local interfaces of storage
      localInterface: {
        database: window.localStorage,
        getItem: "getItem",
        setItem: "setItem",
        removeItem: "removeItem",
      }, 
      concurrent: !!(options.outerLoad || options.outerSave || options.outerClear),
      outerLoad: null,
      outerSave: null,
      outerClear: null,
    };
    this.options = deepAssign(defaultOptions, options);
    // Make the privilege.
    this.__install(defaultOptions);
    
    // root event console log
    if(defaultOptions.logEvent) this._setlog();

    this.status = _STATUS.CREATED;
    this._trigger("created");
    
    if(defaultOptions.autoload) this._init(options.initStorage || Object.create(null) );
  };

  /**
   * Initialize the cabinet storage before 'CURD' manipulation.
   * If autoload is not setted, you should call this manually.
   * Todo: add reduplicate._init check and warning.
   */
  Proto._init = function(cabinet = null){
    cabinet = cabinet || this.options.initStorage || Object.create(null);
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
    const isLoadFromCache = this.options.useSharedCabinet && this.hasStore();
    if(isLoadFromCache){
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
    }

    this.status = _STATUS.MOUNTED;
    this._trigger("mounted"); // Interior cabinet access attainable.

    if(!isLoadFromCache){
      // Auto load. Only when the cabinet in using is private.
      if(this.options.autoload) this.load(); // default using shallow assign.
      else this.status = _STATUS.IDLE; // Amend the status.
    } else {
      this.status = _STATUS.IDLE; // Amend the status.
    }
    return this;
  }

  /**
   * Test the cabinet is busy or not.
   */
  Proto.isVacant = function(){
    return this.status===_STATUS.IDLE;
  }

  /**
   * Set an item with key.
   * Added write protection on stage of loading and clearing.
   * @param {*} key 
   * @param {*} value 
   */
  Proto.set = function(key, value){
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
  Proto.get = function(key){
    let backValue = this.__storage[key];
    this._trigger('getItem', key, backValue);
    return backValue;
  }

  /**
   * Delete an item by key.
   */ 
  Proto.remove = function(keys: string|string[]){
    let removed = false;
    arbitraryFree(keys, (k)=>{
      // Though it isn't disappeared immediately, But after JSON parse and stringify manipulations this will be cleared.
      if(this.__storage.hasOwnProperty(k)){
        this.set(k, void 0);
        removed = true;
      }
    });
    removed && this._trigger('removeItem', keys, removed);
    return this;
  }

  /**
   * Delete the cabinet directly.
   * But the data may still exist in memory(RAM).  
   * @param {Boolean} onCloud 
   * @param {Boolean} concurrent Override the default options in `this.options.concurrent`
   */
  Proto.clear = function(option: AccessOptions & { reset?: boolean } = {}){
    // merge default options.
    const concurrent = is_Defined(option.concurrent)? option.concurrent: this.options.concurrent;
    const onCloud = (is_Defined(option.onCloud)? option.onCloud: !!this.options.outerClear) as boolean;
    this.status = _STATUS.LOADING;
    this._trigger('beforeClear');
    
    // Local clear
    let localClear = ()=>{
      const IgnoreLocal = onCloud && !concurrent;
      this._trigger('beforeLocalClear', IgnoreLocal); // give an status token before invoke.

      if(IgnoreLocal){
        DEBUG && console.log(`${LogToken}The local clear action is ignored by options: concurrent:false.`);
        return this;
      }
      const localApi = this.options.localInterface;
      localApi.database[localApi.removeItem]( this.__root );
      // trigger hook event after call local database to clear the Item.
      this._trigger('localCleared', this.__root); // Give the param of the remove target. 
    }

    const toEnd = (isSuccess: boolean)=>{
      this.status = _STATUS.IDLE;
      this._trigger('cleared', onCloud, concurrent);
      // Callback
      option.onceDone && option.onceDone(isSuccess, onCloud);
    };

    // Cloud clear
    const pack = [this.__root, this.__storage];
    const onSuccess = ()=>{
      toEnd(true);
    }
    const onError = (msg, reason='cloudClearings')=>{
      toEnd(false);

      if(this._trigger("error", "clear", reason) !== true ){
        onCloud && console.error(`${LogToken}Failed tfo Clear the cabinet "${this.__root}" on cloud. ${msg}`);
      }
    }

    // handle this async or asyn easily.
    try{
      // Reset the inner cabinet to vacant Object.
      if(option.reset){
        Reflect.ownKeys(this.__storage).forEach(item=>{
          delete this.__storage[item];
        });
      }

      localClear();
      if(onCloud) 
        this.options.outerClear(pack, onSuccess, onError);
      else {
        toEnd(true);
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
   * @param { Boolean } concurrent Override the default options in `this.options.concurrent`
   * @param { Boolean } deepMerge Using deepAssign instead of Object.assign to merge the data from local and cloud.
   */
  Proto.load = function(option: AccessOptions & { disableMerge?: boolean} = {}){
    // merge default options.
    const concurrent = is_Defined(option.concurrent)? option.concurrent: this.options.concurrent;
    const onCloud = (is_Defined(option.onCloud)? option.onCloud: !!this.options.outerLoad) as boolean;
    const deepMerge = is_Defined(option.deepMerge)? ~~(option.deepMerge as Boolean): this.options.deepMerge;
    this.status = _STATUS.LOADING;
    this._trigger("beforeLoad");

    // Local load 
    let localLoad = ()=>{
      let localTemp = null;
      const IgnoreLocal = onCloud && !concurrent;
      this._trigger('beforeLocalLoad', IgnoreLocal); // give an status token before invoke.

      if(IgnoreLocal){
        DEBUG && console.log("${LogToken}The local load action is ignored by options: concurrent=false.");
        return this;
      }
      const localApi = this.options.localInterface;
      
      let initialData = localApi.database[localApi.getItem]( this.__root );
      // trigger hook event after call local database to parse the value. 
      // Should have a return value in event. (data)=>{ return handle(data); }
      initialData = this._trigger('localLoaded', initialData); // Only take effect on the last element.

      localTemp = JSON.parse( initialData );
      if(deepMerge){
        if(option.disableMerge)
          deepAssign(this.__storage, localTemp);
        else
          deepConditionalAssign(this.__storage, localTemp, this.options.customMerge);
      }else
        Object.assign(this.__storage, localTemp);
    };

    const toEnd = (isSuccess: boolean)=>{
      this.status = _STATUS.IDLE;
      this._trigger('loaded', onCloud, concurrent);
      // Callback
      option.onceDone && option.onceDone(isSuccess, onCloud);
    }

    // Cloud load
    const pack = [this.__root, this.__storage];
    const onSuccess = (data)=>{
      if(!is_Defined(data) || !is_PlainObject(data))
        throw new Error(`${LogToken}Load cabinet with empty 'data' which type is ${typeof data}`);
        
      if(deepMerge){
        if(option.disableMerge)
          deepAssign(this.__storage, data);
        else
          deepConditionalAssign(this.__storage, data, this.options.customMerge);
      }else 
      // shallow assign makes cloud weight heavier.
        Object.assign(this.__storage, data);
      
      toEnd(true);
    }
    const onError = (msg, reason='cloudLoadings')=>{
      toEnd(false);

      if(this._trigger("error", "load", reason) !== true){
        onCloud && console.error(`${LogToken}Failed to Load the cabinet "${this.__root}" on cloud. ${msg}`);
      }
    }

    // handle this async or asyn easily.
    try{
      localLoad();
      if(onCloud) 
        this.options.outerLoad(pack, onSuccess, onError);
      else {
        toEnd(true);
      }
    } catch(e){
      onError(e, "unknown");
    }
    return this;
  }

  /**
   * Save the cabinet to database or cloud.
   * The event `localSaved` is called before real action for storage hook.
   * @param {*} onCloud 
   * @param {Boolean} concurrent Override the default options in `this.options.concurrent`
   */
  Proto.save = function(option: AccessOptions = {}){
    // merge default options.
    const onCloud = (is_Defined(option.onCloud)? option.onCloud: !!this.options.outerSave) as boolean;
    const concurrent = is_Defined(option.concurrent)? option.concurrent: this.options.concurrent;

    // check the status for mutex protection
    let check = this.options.saveMutex && !this.isVacant();
    this._trigger("beforeSave", check);
    if( check ){
      DEBUG && console.log(`${LogToken}The 'save' manipulation is deserted for busy. Current Status: ${this.status} .Set 'saveMutex' false to disable it.`);
      this._trigger("busy", this.status);
      this.options.autoLazy && this.lazySave(onCloud, concurrent);
      return this;
    }
    
    this.status = _STATUS.SAVING;

    // Local save 
    let localSave = ()=>{
      const IgnoreLocal = onCloud && !concurrent;
      this._trigger('beforeLocalSave', IgnoreLocal); // give an status token before invoke.

      if(IgnoreLocal){
        DEBUG && console.log("${LogToken}The local save action is ignored by options: concurrent=false.");
        return this;
      }
      // trigger hook event beforeLocalSave. Should have a return value in event. (data)=>{ return handle(data); }
      let finalData = JSON.stringify(this.__storage );
      // trigger hook event before call local database to save the value for data interceptor.
      finalData = this._trigger('localSaved', finalData); // Only take effect on the last element.

      const localApi = this.options.localInterface;
      localApi.database[localApi.setItem](this.__root, finalData);
    };
    
    const toEnd = (isSuccess: boolean)=>{
      this.status = _STATUS.IDLE;
      this._trigger('saved', onCloud, concurrent);
      // Callback
      option.onceDone && option.onceDone(isSuccess, onCloud);
    }

    // Cloud save
    const pack = [this.__root, this.__storage];
    const onSuccess = ()=>{
      toEnd(true);
    }
    const onError = (msg, reason="cloudSavings")=>{
      toEnd(false);

      if(this._trigger("error", "save", reason) !== true){
        onCloud && console.error(`${LogToken}Failed to Save the cabinet "${this.__root}" on cloud. ${msg}`);
      }
    }

    // handle this async or asyn easily.
    try{
      localSave();
      if(onCloud) 
        this.options.outerSave(pack, onSuccess, onError);
      else {
        toEnd(true);
      }
    } catch(e){
      onError(e, 'unknown');
    }
    return this;
  }
  
  /**
   * Map methods support.
   * Iterate the first hierarchy with callback.
   * @param {Function: (item, key, cabinet)=>any }} callback with two params
   */
  Proto.forEach = function(callback: (item: any, key: string, cabinet: Object)=>any){
    let item;
    const cabinet = this.__storage;
    for(let key in cabinet){
      item = cabinet[key];
      callback(item, key, cabinet); // only two params.
    }
    return this;
  }

  /**
   * Foreach methods support.
   * Iterate the first hierarchy with callback.
   * @param {Function: (item, key, cabinet)=>any }} callback  with two params
   */
  Proto.map = function(callback: (item: any, key: string, cabinet: Object)=>any){
    let item;
    const cabinet = this.__storage;
    for(let key in cabinet){
      item = cabinet[key];
      cabinet[key] = callback(item, key, cabinet); // only two params.
    }
    return this;
  }

  /**
   * For custom destroy.
   * Call it to clear the sideEffect produce by kinds of plugins.
   */
  Proto.destroy = function(autoClear = true){
    if(autoClear){
      this.clear({
        reset: true,
        onCloud: false, 
        concurrent: false,
      });
      this.removeStore();
    }

    this.status = _STATUS.DESTROYED;
    this._trigger("destroyed");
  }

}
