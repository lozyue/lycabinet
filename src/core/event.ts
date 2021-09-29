/**
 * Event system provided.
 * Have weak hook fundamental at same time.
 */
import { removeArrayItem, is_Function, DEBUG, arrayIndex, EnvAssociate } from '../utils/util';

export function InitEventSystem(Lycabinet){
  const subscriptions = Object.create(null);

  Lycabinet.prototype._on = function(name, func){
    if(!is_Function(func)){
      throw new Error("[Laction]:The second parameter of _on method must be a callback function!");
    }
    const actions = subscriptions[name] || (subscriptions[name] = []);
    actions.push(func);
  };
  
  Lycabinet.prototype._off = function(name, handle){
    const actions = subscriptions[name] || (subscriptions[name] = []);
    removeArrayItem(actions, handle);
  };

  Lycabinet.prototype._trigger = function(name, ...params){
    const actions = subscriptions[name] || (subscriptions[name] = []);
    // const results = actions.map(func=>{
    //   return func.apply(this, params);
    // });
    const results: Array<unknown>= [];
    params.push(results);
    for(let index=0; index< actions.length; index++){
      let temp = actions[index].apply(this, params);
      temp && results.push( temp );
    }
    // if no hook this will returns last params. We can use last params to set default value.
    return results.length? arrayIndex(results, -1): params.length? arrayIndex(params, -1): null;
    // return this._finalHandle(results);
  };

  Lycabinet.prototype._once = function(name, func){
    const _this = this;
    var handleFunc = function(...params){
      func.apply(_this, params);
      _this._off(name, handleFunc);
    }; 
    this._on(name, handleFunc);
  };

  // for Debug
  // DEBUG && 
  !EnvAssociate.Light && (Lycabinet.prototype._setlog = function(){
    const presets = [
      'created','mounted', 
      'beforeLoad', 'beforeLocalLoad', 'localLoaded', 'loaded', 
      'loadingFromCache',
      'setItem', 'writeLock', 'writeBackflow', 
      'getItem', 'removeItem', 
      'lazySave', 
      'beforeSave', 'beforeLocalSave', 'localSaved', 'saved', 'busy',
      'beforeClear', 'beforeLocalClear', 'localCleared', 'cleared',
      'error',
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
}
