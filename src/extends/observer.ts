/**
 * Adding an mini observer for storage variable listening.
 * Using Object define
 */

import { DEBUG, deepSupplement, is_Defined, is_PlainObject, iterateObject, removeArrayItem } from "../utils/util";

// change methods.
let onSetted: Function| null = null;

/**
 * Targets
 * @param Lycabinet 
 */

export function addObserver(Lycabinet){
  Lycabinet.prototype.initObserver = function(options: any = {}){
    // configurate options
    deepSupplement(options, {
      lazy: true,
      initWatch: true, // whether transform the origin property in Observer.
      deepWatch: true, // whether consistently watch the Object type value setted in initial data.
      shallowWatch: false, // whether just watch the surface of the Object.
    });

    // init proxy Interceptor.
    const _this = this;
    onSetted = ()=>{
      _this._trigger("setItem");
      options.lazy? _this.lazySave(): _this.save();
    };
    
    if(!options.initWatch) return false;
    
    this.__storage = deepConvert(this.__storage, options.deepWatch, options.shallowWatch);
  };

  // Add a static methods
  Lycabinet.$set = function(target, name, deep=false, shallow){
    target[name] = convert(target[name], deep, shallow);
  };
};

/**
 * Proxy Modules.
 */
type proxyValue = Record<string, {value: any, trigger: Function[]} > & {_parent: null| proxyValue};

function deepConvert(source: Object, deepWatch=true, shallowWatch=false){
  const plainObjQueue: Array<any> = [];
  // reverse for convert
  const iterate = (current)=>{
    plainObjQueue.unshift(current);
    for(let item in current){
      if(is_PlainObject(current[item])){
        iterate(current[item]);
      }
    }
  };
  iterate(source);
  plainObjQueue.forEach((item, index, arr)=>{
    for(let ref in item){
      // convert by reference.
      if(is_PlainObject(item[ref]) )
        arr[index][ref] = convert(item[ref], deepWatch, shallowWatch);
    }
  });
  source = convert(source, deepWatch, shallowWatch);
  return source;
}

function convert(source: Object, deepWatch = false, shallowWatch = true){
  let internalValue: proxyValue = Object.create(null);
  // to do... Add trigger bubbule to its parents.
  internalValue["_parent"] = null;

  const $addListener = (trigger: Function, onProp: string)=>{
    if(internalValue[onProp] === undefined){
      if(DEBUG) throw new Error(`[Lycabinet]: The prop ${onProp} is not found on source Object!`);
      return false;
    }
    return internalValue[onProp].trigger.push(trigger);
  };
  const $removeListener = (handle: Function, onProp: string)=>{
    if(internalValue[onProp] === undefined){
      if(DEBUG) throw new Error(`[Lycabinet]: The prop ${onProp} is not found on source Object!`);
      return false;
    }
    return removeArrayItem(internalValue[onProp].trigger, handle);
  };
  const propConfig = {
    enumerable: false, // which is not enumerable in source either.
    configurable: true,
    writable: false,
  };
  // save the values
  for(let rawItem in source){
    internalValue[rawItem] = {
      value: source[rawItem],
      trigger: [],
    };
  };
  // origin definition
  ["$addListener", "$removeListener"].forEach((hook, index)=>{
    internalValue[hook] = {value: null} as {value:any, trigger: Function[]};
    Object.defineProperty(internalValue[hook], "value", {
      value: !index? $addListener: $removeListener,
      ...propConfig
    });
  });

  const HandleRules = {
    get(target, prop, receiver) {
      DEBUG && console.info("Getted", target, prop, receiver, internalValue);
      // if(['$removeListener', "$addListener"].indexOf(prop) > -1)
      return internalValue[prop]===undefined? undefined: internalValue[prop].value;
    },
    set(target, prop, newValue, receiver) {
      DEBUG && console.info("Setted", target, prop, receiver, internalValue);
      // init
      internalValue[prop] = internalValue[prop] || {
        value: newValue,
        trigger: [],
      };
      let rawValue = internalValue[prop].value;
      // consistent deepWatch observer. 
      if(deepWatch){
        if(is_PlainObject(newValue)){
          if(shallowWatch){
            internalValue[prop].value = convert(newValue, false, true);
          }else{
            internalValue[prop].value = deepConvert(newValue, deepWatch, false);
          }
        }
      }else
        internalValue[prop].value = newValue;

      if(rawValue !== newValue){
        let triggers = internalValue[prop].trigger;
        for(let index=0; index< triggers.length; index++){
          triggers[index](rawValue, newValue);
        }
      }
      return true;
    },
  };
  return new Proxy(source, HandleRules);
}
