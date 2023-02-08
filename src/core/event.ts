/**
 * Event system provided.
 * Have weak hook fundamental at same time.
 */
import { CabinetEventType } from '@/typings/lycabinet';
import { removeArrayItem, is_Function, DEBUG, arrayIndex, EnvAssociate, is_Defined } from '../utils/util';

export function InitEventSystem(Lycabinet){
  let preOwnner = null;
  Lycabinet.mixin(function(_self){
    let subscriptions: Object = null as unknown as Object; 

    if(_self!==preOwnner){
      subscriptions = Object.create(null);
    }
    preOwnner = _self;

    _self._on = function(name: CabinetEventType, func: Function){
      if(DEBUG &&!is_Function(func)){
        throw new Error("[Laction]:The second parameter of _on method must be a callback function!");
      }
      
      subscriptions||(subscriptions = Object.create(null))
      const actions = subscriptions[name] || (subscriptions[name] = []);
      actions.push(func);
    };
    
    _self._off = function(name: CabinetEventType, handle: Function){
      const actions = subscriptions[name] || (subscriptions[name] = []);
      if(actions._lock===true){
        // Postpone the remove action to nextTick.
        return Promise.resolve().then(()=>{
          return removeArrayItem(actions, handle);
        });
      }
      removeArrayItem(actions, handle);
    };
  
    _self._trigger = function(name: CabinetEventType, ...params){
      const actions = subscriptions[name] || (subscriptions[name] = []);
      // add trigger mark
      if(!actions._counter) actions._counter=0;
      actions._counter++;
      // Add triggering lock protection.
      actions._lock = true;
      
      const results: Array<unknown>= [];
      let preLen = actions.length;
      params.push(results);
      for(let index=0; index<preLen; index++){
        let temp = actions[index].apply(this, params);
        is_Defined(temp) && results.push( temp );
      }
      
      // Unlock the event;
      actions._lock = false;

      // returns last param if there is no hook. Using the last param to set the default value.
      return results.length>0
        ? arrayIndex(results, -1)
        : params.length>1
          ? arrayIndex(params, -2)
          : null;
    };
  
    _self._ready = function(name: CabinetEventType, func: Function, instantOnTriggered: number|boolean = false){
      const subs = subscriptions[name] || (subscriptions[name] = []);
      if(subs._counter && instantOnTriggered!==false 
        && _self._isHappened(name, ~~instantOnTriggered) 
      ){
        func(subs._counter);
        return ;
      }
      var handleFunc = function(...params){
        this._off(name, handleFunc);
        func.apply(this, params);
      }; 
      this._on(name, handleFunc);
    };
    
    _self._next = function(name: CabinetEventType, func: Function, instantOnTriggered: number|boolean = false){
      const subs = subscriptions[name] || (subscriptions[name] = []);
      var handleFunc = function(...params){
        this._off(name, handleFunc);
        func.apply(this, params);
      }; 
      this._on(name, handleFunc);
    };

    _self._isHappened = function(name: CabinetEventType, counts: number=1){
      const subs = (subscriptions[name] || (subscriptions[name] = []));
      return subs._counter >= counts;
    }
    
    _self._count = function(name: CabinetEventType){
      const subs = (subscriptions[name] || (subscriptions[name] = []));
      return subs._counter;
    }
  
    // for Debug
    !EnvAssociate.Light && (_self._setlog = function(){
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
    
    _self._on("destroyed", ()=>{
      for(let item in subscriptions){
        delete subscriptions[item];
      }
    });
  });
}