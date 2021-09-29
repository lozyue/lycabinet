/**
 * Utils.js.
 * By lozyue.
 */

/**
 * Get the item in an array with index. Support negative index.
 * @param  {...any} objs 
 */
export const arrayIndex = function (arr, index) {
  index = (arr.length + index) % arr.length;
  if (arr[index] === undefined) {
    console.log(arr, index);
    throw new Error(`The index ${index} in array ${arr.toString()} is overflowed!`);
  }
  return arr[index];
}

/**
 * Centralized management.
 * Add a listener to window storage event.
 * @param { Function } invoke Target invoke function or handle. 
 * @param { Boolean } remove wheather the action is to remove added storage listener.
 */
export const addStoreListener = (()=>{
  const invokeQueue: Function[]= [];
  window.addEventListener("storage", (eve)=>{
    invokeQueue.forEach(func=>{
      func(eve);
    });
  }, false); // default bubble.

  return (invoke, remove = false)=>{
    if(remove) 
      removeArrayItem(invokeQueue, invoke);
    else invokeQueue.push(invoke);
  }
})();

/**
 * Deep Object.assign source to target.
 * @param target
 * @param source
 */
export const deepAssign = function (...objs) {
  let merged;
  objs.reduce((target, source) => {
    for (let item in source) {
      if (!(target[item] && is_PlainObject(target[item])) ) {
        target[item] = source[item];
      } else {
        deepAssign(target[item], source[item]);
      }
    }
    merged = target;
    return target;
  }, objs[0]); // The third param is to set default value.
  return merged;
}

/**
 * Just assign the item in supplement which not defined in target.
 * If you don't want to override the value of origin Object, supplement is the high performance choice.
 * Not deep mode.
 * @param {*} target 
 * @param {*} supplement 
 */
export function objectSupplement(target, supplement) {
  let current = null;
  for (let item in supplement) {
    current = target[item];
    if (is_Defined(current))
      continue;
    target[item] = supplement[item];
  }
  return target;
}

/**
 * Just assign the item in supplement which not defined in target.
 * If you don't want to override the value of origin Object, supplement is the high performance choice.
 * Deep mode by iterate each inner Object.
 * @param {*} target 
 * @param {*} supplement 
 */
export function deepSupplement(target, supplement) {
  let current = null;
  for (let item in supplement) {
    current = target[item];
    if (is_Defined(current)) {
      if (!is_PlainObject(current)) continue;
      deepSupplement(current, supplement[item]); // The `current` is a reference which could be assigned.
    }
    else
      // current = supplement[item];
      target[item] = supplement[item];
  }
  return target;
}


/**
 * Simple deepClone with optional Function clone
 */
export function deepClone(val, substituteObj = Object.create(null), cloneFunc = true) {
  if (is_PlainObject(val)) {
    var res = substituteObj;
    for (var key in val) {
      res[key] = deepClone(val[key]);
    }
    return res;
  } else if (is_Array(val)) {
    return val.slice()
  } else if (cloneFunc && is_Function(val)) {
    return Object.create(val.prototype).constructor;
  } else {
    return val;
  }
}

export function iterateObject(source: Object, iterate: Function){
  iterate(source);
  for(let item in source){
    if( is_PlainObject(source[item]) )
      iterate(source, iterate);
  }
}

export const is_Defined = (v: any):Boolean => (v !== undefined && v !== null);
export const is_PlainObject = (obj) => (Object.prototype.toString.call(obj) === '[object Object]');
export const is_Array = (obj) => (Array.isArray && Array.isArray(obj) || (typeof obj === 'object') && obj.constructor == Array);
export const is_String = (str) => ((typeof str === 'string') && str.constructor == String);
export const is_Function = (obj) => ((typeof obj === 'function') && obj.constructor == Function);

export const is_Empty = (val)=>{
  if(!val) return true;
  if(is_Array(val)){
    return !val.length;
  }else{
    return !Object.keys(val).length;
  }
}

/*
 * Delete the Item in an Array, returning the new Array.
 */
export var removeArrayItem = (arr, item) => {
  if (arr.length) {
    let index = arr.indexOf(item);
    if (index > -1) {
      return arr.splice(index, 1);
    }
  }
}

/**
 * Provide with a processor accept a list of stuff or single stuff
 * Give it the action to its inner iterator.
 * The original Stuff can not be an Array!
 */
export function arbitraryFree(input, func) {
  if (input.forEach) {
    return input.forEach(func);
  } else {
    return func(input, 0);
  }
}

export function storageAvailable(type) {
  var storage;
  try {
    storage = window[type];
    var x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeArrayItem(x);
    return true;
  }
  catch (e) {
    return e instanceof DOMException && (
      // everything except Firefox
      e.code === 22 ||
      // Firefox
      e.code === 1014 ||
      // test name field too, because code might not be present
      // everything except Firefox
      e.name === 'QuotaExceededError' ||
      // Firefox
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
      // acknowledge QuotaExceededError only if there's something already stored
      (storage && storage.length !== 0);
  }
}

export const DEBUG = process.env.NODE_ENV !== 'production';

export const EnvAssociate = {
  Light: false, // light mode.
};
