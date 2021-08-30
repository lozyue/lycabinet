/**
 * Event system provided.
 */
import { removeItem, is_Function, DEBUG } from '../utils/util';

export function InitEventSystem(Lycabinet){
  const subscriptions = Object.create(null);

  Lycabinet.prototype._on = function(name, func){
    if(!is_Function(func)){
      throw new Error("[Laction]:The second parameter of _on method must be a callback function!");
    }
    const actions = subscriptions[name] || (subscriptions[name] = []);
    actions.push(func);
  }
  
  Lycabinet.prototype._off = function(name, handle){
    const actions = subscriptions[name] || (subscriptions[name] = []);
    removeItem(actions, handle);
  }

  Lycabinet.prototype._trigger = function(name, ...params){
    const actions = subscriptions[name] || (subscriptions[name] = []);
    actions.forEach(func=>{
      func.apply(this, params);
    });
  }

  Lycabinet.prototype._once = function(name, func){
    const _this = this;
    var handleFunc = function(...params){
      func.apply(this, params);
      _this._off(name, handleFunc);
    }; 
    this._on(name, handleFunc);
  }

  // for Debug
  DEBUG && (Lycabinet.prototype._setlog = function(){
    const presets = [
      'created','mounted', 
      'getItem', 'removeItem', 'setItem', 
      'lazySave', 
      'saved', 'beforeSave', 
      'beforeLoad', 'loaded', 
      'beforeClear', 'cleared',
    ];

    new Set(Object.keys(subscriptions).concat(presets) ).forEach(item=>{
      let testHandle = subscriptions[item] && subscriptions[item].logHandle;
      if(testHandle){
        this._off(item, testHandle)
      }
      // give a handle
      const logHandle = ()=>{
        console.log(`[Lycabinet]: Triggered the event: '${item}'`);
      };
      this._on(item, logHandle);
      // add handle
      testHandle = logHandle;
    });
  });
}
