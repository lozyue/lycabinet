/**
 * Observer Plugin for Lycabinet
 * Adding an mini observer for storage variable listening.
 */

import { 
  curveGet, curveSet, 
  removeArrayItem, deepSupplement, is_PlainObject,  
  DEBUG,
  is_Function,
  LogToken
} from "../utils/util";

// change methods.
let onSetted: Function| null = null;

/**
 * Targets
 * @param Lycabinet 
 */

export function addObserver(Lycabinet){
  const Proto = Lycabinet.prototype;
  Proto.initObserver = function(options: any = {}){
    // Override the default options
    Object.assign(options, {
      deepMerge: true,
    });
    // configurate options
    deepSupplement(options, {
      lazy: true,
      initWatch: true, // whether transform the origin property in Observer.
      deepWatch: true, // whether consistently watch the Object type value setted in initial data.
      shallowWatch: false, // whether just watch the surface of the Object.
    });

    // init proxy Interceptor.
    onSetted = ()=>{
      // this._trigger("setItem");
      options.lazy? this.lazySave(): this.save();
    };
    
    if(!options.initWatch) return false;
    
    this.__storage = deepConvert(this.__storage, options.deepWatch, options.shallowWatch);
    this.setStore(this.__storage);
  };

  // Convert the path target to be reactive. Check redundant Prevent by default.
  Lycabinet.$set = function(target: Object, pathList: string[], deep=false, shallow =true){

    // CurveSet the target value.
    return curveSet(target, pathList, (innerTarget, kname)=>{
      // If target is not existed, set to plain Object; Reset the value if it has been converted.
      if(!is_PlainObject(innerTarget[kname])){
        innerTarget[kname] = {};
      }
      if(DEBUG && innerTarget[kname]["$addListener"]){
        console.warn(`${LogToken}The target have been converted before!`, innerTarget[kname]);
      }
      innerTarget[kname] = convert(innerTarget[kname], deep, shallow);
    });
  };

  Lycabinet.$get = function(target: Object, pathList: string[]){
    return curveGet(target, pathList);
  }

  /**
   * Makes the target to be reactive
   * If the target path is not defined,
   *  it will be assigned as an Object.
   * Warning: If the value in path end is assigned with non-PlainObject type value previously,
   *  the value will be override by `{}`
   */ 
  Proto.$set = function(pathName: string, deep=false, shallow =true){
    return Lycabinet.$set(this.__storage, pathName.split('.'), deep, shallow);
  }
  // Makes the target to be reactive
  Proto.$get = function(pathName: string){
    return curveGet(this.__storage, pathName.split('.') );
  }
};

/**
 * Proxy Modules.
 * @author lozyue
 * @time 2021
 */

// Convert the Object and its descendant Object from bottom to top.
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
  return convert(source, deepWatch, shallowWatch);
}

/**
 * Convert the normal data to be reactive.
 *  todo: add the Array type support.
 * @param source 
 * @param deepWatch 
 * @param shallowWatch 
 */
type OnValueChange = (prop:symbol|string, newValue, oldValue)=>unknown;
type InternalValueType = {
  _parent: null | unknown,
  $addListener: (t:OnValueChange, onProp: string)=>unknown,
  $removeListener: (h:OnValueChange, onProp: string)=>unknown,
  // trigger: Record<string|symbol, OnValueChange[]>,
  triggers: OnValueChange[],
  value: Object,
};
function convert(source: Object, deepWatch = false, shallowWatch = true){
  let internalValue: InternalValueType = Object.create(null);
  // to do... Add trigger bubbule to its parents.
  internalValue._parent = null;
  internalValue.triggers = [];
  // save the values
  internalValue.value = source;
  // Config it!
  const propConfig = {
    enumerable: false, // which is not enumerable in source either.
    configurable: true,
    writable: false,
  };
  const $addListener = (onchange: OnValueChange)=>{    
    return internalValue.triggers.push(onchange);
  };
  const $removeListener = (handle: Function)=>{
    return removeArrayItem(internalValue.triggers, handle);
  };
  // Origin Accessable definition
  const AccessQueue = ["$addListener", "$removeListener"];
  AccessQueue.forEach((hook, index)=>{
    internalValue[hook] = {value: null} as {value: unknown, trigger: Function[]};
    Object.defineProperty(internalValue, hook, {
      value: !index? $addListener: $removeListener,
      ...propConfig
    });
  });

  const refValue = internalValue.value; // For reader accel.
  const HandleRules = {
    get(target, prop, receiver) {
      DEBUG && console.info("Getted", target, prop, receiver, internalValue);
      if(AccessQueue.indexOf(prop) > -1){
        return internalValue[prop];
      }
      return refValue[prop];
    },
    set(target, prop, newValue, receiver) {
      DEBUG && console.info("Setted", target, prop, receiver, internalValue);
      const rawValue = refValue[prop];
      // consistent deepWatch observer. 
      if(deepWatch){
        if(is_PlainObject(newValue)){
          if(shallowWatch){
            refValue[prop] = convert(newValue, false, true);
          }else{
            refValue[prop] = deepConvert(newValue, deepWatch, false);
          }
        }
      }else
        refValue[prop] = newValue;

      if(newValue !== rawValue){
        let triggers = internalValue.triggers;
        for(let index=0; index< triggers.length; index++){
          // Check it!
          if(!is_Function(triggers[index]) ){
            throw new Error(`The get proxy handler listener added in target is Not a Function which type is ${typeof triggers[index]}`);
          }
          triggers[index](prop, newValue, rawValue);
        }
        if(onSetted!==null) onSetted();
      }
      return true;
    },
  };
  return new Proxy(source, HandleRules);
}
