/**
 * Event system provided.
 * Have weak hook fundamental at same time.
 */
import { CabinetEventType } from '@/typings/lycabinet';
import { removeArrayItem, is_Function, DEBUG, arrayIndex, EnvAssociate, is_Defined } from '../utils/util';

export function InitEventSystem(Lycabinet){
  let preOwnner = null;
  Lycabinet.mixin(function(self){
    let subscriptions: Object = null as unknown as Object; 

    if(self!==preOwnner){
      subscriptions = Object.create(null);
    }
    preOwnner = self;

    self._on = function(name: CabinetEventType, func: Function){
      if(DEBUG &&!is_Function(func)){
        throw new Error("[Laction]:The second parameter of _on method must be a callback function!");
      }
      
      subscriptions||(subscriptions = Object.create(null))
      const actions = subscriptions[name] || (subscriptions[name] = []);
      actions.push(func);
    };
    
    self._off = function(name: CabinetEventType, handle: Function){
      const actions = subscriptions[name] || (subscriptions[name] = []);
      removeArrayItem(actions, handle);
    };
  
    self._trigger = function(name: CabinetEventType, ...params){
      const actions = subscriptions[name] || (subscriptions[name] = []);
      // add trigger mark
      if(!actions.counter) actions.counter=0;
      actions.counter++;
      
      const results: Array<unknown>= [];
      let preLen = actions.length;
      params.push(results);
      for(let index=0; index<preLen; index++){
        let temp = actions[index].apply(this, params);
        is_Defined(temp) && results.push( temp );
        if(preLen !== actions.length){
          index--;
          preLen = actions.length;
        }
      }
      // returns last param if there is no hook. Using the last param to set the default value.
      return results.length>0
        ? arrayIndex(results, -1)
        : params.length>1
          ? arrayIndex(params, -2)
          : null;
    };
  
    self._once = function(name: CabinetEventType, func: Function, instantOnTriggered: number|boolean = 0){
      const subs = subscriptions[name] || (subscriptions[name] = []);
      if(subs.counter && instantOnTriggered!==false && ~~instantOnTriggered <= subs.counter ){
        func(subs.counter);
        return ;
      }
      var handleFunc = function(...params){
        func.apply(this, params);
        this._off(name, handleFunc);
      }; 
      this._on(name, handleFunc);
    };

    self._isHappend = function(name: CabinetEventType, counts: number=0){
      return (subscriptions[name] || (subscriptions[name] = [])).counter > counts;
    }
  
    // for Debug
    !EnvAssociate.Light && (self._setlog = function(){
      if(!Lycabinet.DEBUG) return false;

      const presets: CabinetEventType[] = [
        'created','mounted', 
        'beforeLoad', 'beforeLocalLoad', 'localLoaded', 'loaded', 
        'loadFromCache',
        'storageSync',
        'setItem', 'writeLock', 'writeBackflow', 
        'getItem', 'removeItem', 
        'lazySave', 
        'beforeSave', 'beforeLocalSave', 'localSaved', 'saved', 'busy',
        'beforeClear', 'beforeLocalClear', 'localCleared', 'cleared',
        'error', 'destroyed',
      ];
  
      new Set(Object.keys(subscriptions).concat(presets) ).forEach(item=>{
        let testHandle = subscriptions[item] && subscriptions[item]._logHandle;
        if(testHandle){
          this._off(item, testHandle)
        }
        const logHandle = ()=>{
          Lycabinet.DEBUG &&
          console.log(`[Lycabinet${Lycabinet.SeparateLog?'-'+this.__root:''}]:Triggered the event: '${item}'`);
        };

        this._on(item, logHandle);
        subscriptions[item]._logHandle = logHandle;
      });
      return true;
    });
    
  });
}