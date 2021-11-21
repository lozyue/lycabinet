/**
 * Event system provided.
 * Have weak hook fundamental at same time.
 */
import { removeArrayItem, is_Function, DEBUG, arrayIndex, EnvAssociate } from '../utils/util';

export function InitEventSystem(Lycabinet){
  // let subscriptions = Object.create(null);
  
  // Private way of Function Clone with more memory cost(About three than normal prototype mode).
  let preOwnner = null;
  Lycabinet.mixin(function(self){
    let subscriptions: Object = null as unknown as Object; 

    if(self!==preOwnner){
      subscriptions = Object.create(null);
    }
    preOwnner = self;

    self._on = function(name: CabinetEventType, func){
      if(DEBUG &&!is_Function(func)){
        throw new Error("[Laction]:The second parameter of _on method must be a callback function!");
      }
      // console.log(this, , subscriptions)
      subscriptions||(subscriptions = Object.create(null))
      const actions = subscriptions[name] || (subscriptions[name] = []);
      actions.push(func);
    };
    
    self._off = function(name: CabinetEventType, handle){
      const actions = subscriptions[name] || (subscriptions[name] = []);
      removeArrayItem(actions, handle);
    };
  
    self._trigger = function(name: CabinetEventType, ...params){
      const actions = subscriptions[name] || (subscriptions[name] = []);
      const results: Array<unknown>= [];
      params.push(results);
      for(let index=0; index< actions.length; index++){
        let temp = actions[index].apply(this, params);
        temp && results.push( temp );
      }
      // add trigger mark
      if(!actions.counter) actions.counter=0;
      actions.counter++;
      // if no hook this will returns last params. We can use last params to set default value.
      return results.length? arrayIndex(results, -1): params.length? arrayIndex(params, -1): null;
    };
  
    self._once = function(name: CabinetEventType, func, instantOnTriggered: number|boolean = 0){
      const subs = subscriptions[name] || (subscriptions[name] = []);
      if(subs.counter && ~~instantOnTriggered <= subs.counter ){
        func(subs.counter);
        return ;
      }
      var handleFunc = function(...params){
        func.apply(this, params);
        this._off(name, handleFunc);
      }; 
      this._on(name, handleFunc);
    };
  
    // for Debug
    // DEBUG && 
    !EnvAssociate.Light && (self._setlog = function(){
      const presets: CabinetEventType[] = [
        'created','mounted', 
        'beforeLoad', 'beforeLocalLoad', 'localLoaded', 'loaded', 
        'loadFromCache',
        'setItem', 'writeLock', 'writeBackflow', 
        'getItem', 'removeItem', 
        'lazySave', 
        'beforeSave', 'beforeLocalSave', 'localSaved', 'saved', 'busy',
        'beforeClear', 'beforeLocalClear', 'localCleared', 'cleared',
        'error', 'destroied',
      ];
  
      new Set(Object.keys(subscriptions).concat(presets) ).forEach(item=>{
        let testHandle = subscriptions[item] && subscriptions[item]._logHandle;
        if(testHandle){
          this._off(item, testHandle)
        }
        // give a handle
        const logHandle = ()=>{
          console.log(`[Lycabinet]: Triggered the event: '${item}'`);
        };
        this._on(item, logHandle);
        // add handle
        subscriptions[item]._logHandle = logHandle;
      });

    });
    
  });

  // Private way of WeakMap with confined compatibility.
  // let subscriptions = new WeakMap();

  // Lycabinet.mixin(function(self){
    // subscriptions.set(self, Object.create(null));
  // });

  // Lycabinet.prototype._on = function(name: CabinetEventType, func){
  //   if(DEBUG &&!is_Function(func)){
  //     throw new Error("[Laction]:The second parameter of _on method must be a callback function!");
  //   }
  //   subscriptions[this] || (subscriptions[this] = Object.create(null) );
  //   const actions = subscriptions[this][name] || (subscriptions[this][name] = []);
  //   actions.push(func);
  // };
  
  // Lycabinet.prototype._off = function(name: CabinetEventType, handle){
  //   const actions = subscriptions[this][name] || (subscriptions[this][name] = []);
  //   removeArrayItem(actions, handle);
  // };

  // Lycabinet.prototype._trigger = function(name: CabinetEventType, ...params){
  //   const actions = subscriptions[this][name] || (subscriptions[this][name] = []);
  //   const results: Array<unknown>= [];
  //   params.push(results);
  //   for(let index=0; index< actions.length; index++){
  //     let temp = actions[index].apply(this, params);
  //     temp && results.push( temp );
  //   }
  //   // add trigger mark
  //   if(!actions.counter) actions.counter=0;
  //   actions.counter++;
  //   // if no hook this will returns last params. We can use last params to set default value.
  //   return results.length? arrayIndex(results, -1): params.length? arrayIndex(params, -1): null;
  // };

  // Lycabinet.prototype._once = function(name: CabinetEventType, func, instantOnTriggered: number|boolean = 0){
  //   const subs = subscriptions[this][name] || (subscriptions[this][name] = []);
  //   if(subs.counter && ~~instantOnTriggered <= subs.counter ){
  //     func(subs.counter);
  //     return ;
  //   }
  //   var handleFunc = function(...params){
  //     func.apply(this, params);
  //     this._off(name, handleFunc);
  //   }; 
  //   this._on(name, handleFunc);
  // };

  // // for Debug
  // // DEBUG && 
  // !EnvAssociate.Light && (Lycabinet.prototype._setlog = function(){
  //   const presets: CabinetEventType[] = [
  //     'created','mounted', 
  //     'beforeLoad', 'beforeLocalLoad', 'localLoaded', 'loaded', 
  //     'loadFromCache',
  //     'setItem', 'writeLock', 'writeBackflow', 
  //     'getItem', 'removeItem', 
  //     'lazySave', 
  //     'beforeSave', 'beforeLocalSave', 'localSaved', 'saved', 'busy',
  //     'beforeClear', 'beforeLocalClear', 'localCleared', 'cleared',
  //     'error',
  //   ];

  //   new Set(Object.keys(subscriptions[this]).concat(presets) ).forEach(item=>{
  //     let testHandle = subscriptions[this][item] && subscriptions[this][item]._logHandle;
  //     if(testHandle){
  //       this._off(item, testHandle)
  //     }
  //     // give a handle
  //     const logHandle = ()=>{
  //       console.log(`[Lycabinet]: Triggered the event: '${item}'`);
  //     };
  //     this._on(item, logHandle);
  //     // add handle
  //     subscriptions[this][item]._logHandle = logHandle;
  //   });
  // });
}

export type CabinetEventType =
'created'|'mounted'| 
'beforeLoad'| 'beforeLocalLoad'| 'localLoaded'| 'loaded'| 
'loadFromCache'|
'setItem'| 'writeLock'| 'writeBackflow'| 
'getItem'| 'removeItem'| 
'lazySave'| 
'beforeSave'| 'beforeLocalSave'| 'localSaved'| 'saved'| 'busy'|
'beforeClear'| 'beforeLocalClear'| 'localCleared'| 'cleared'|
'error'|
'destroied';
