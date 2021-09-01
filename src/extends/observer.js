/**
 * Adding an mini observer for storage variable listening.
 * Using Object define
 */

import { deepSupplement, is_PlainObject } from "../utils/util";

export function addObserver(Lycabinet){
  Lycabinet.prototype.initObserver = function(options = {}){
    // configurate options
    deepSupplement(options, {
      lazy: true,
    });

    // init proxy Interceptor.
    const _this = this;
    onSetted = ()=>{
      _this._trigger("setItem");
      options.lazy? _this.lazySave(): _this.save();
    };
    this.__storage = setProxy(this.__storage, onSetted);
    let current = null;
    for(let item in this.__storage){
      current = this.__storage[item];
      if(is_PlainObject(current)){
        current = setProxy(current, onSetted);
      }
    };
  };
}

function setProxy(target, saveMethods){
  const handler = {
    get(target, prop, receiver){
      console.log(`getted the value with key ${prop} in Object:`, target);
      return target[prop];
    },
    set(target, prop, value, receiver) {
      console.log(`Setted the value with key ${key} which type is ${typeof target[prop]}`, value);
      if(is_PlainObject(value)){
        value = setProxy(value, saveMethods);
      }
      target[prop] = value;
      saveMethods(); // Calling the `lazySave` or `save` methods inner.
      return true;
    }
  };
  return new Proxy(target, handler);
}

/* 
function byProxy(obj){
  const handler = {
    get(target, prop, receiver){
      console.log(`getted the value with key ${prop} in Object:`, target);
      return target[prop];
    },
    set(target, prop, value, receiver) {
      console.log(`Setted the value with key ${key} which type is ${typeof target[prop]}`, value);
      target[prop] = value;
      return true;
    }
  };
  return new Proxy(obj, handler);
}

function convert(obj){
  Object.keys(obj).forEach(key=>{
    let internalValue = obj[key];
    Object.defineProperty(obj, key, {
      get(){
        console.log(`getted the value with key ${key}`);
        return internalValue;
      },
      set(newValue){
        console.log(`Setted the value with key ${key} which type is ${typeof newValue}`, newValue);
        internalValue = newValue;
      }
    })
  })
} */
