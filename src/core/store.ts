/**
 * Given a private cabinet for every set storage.
 * Cabinet Basement.
 */

import { DEBUG, is_Defined, is_PlainObject } from "../utils/util";

export function InitStore(Lycabinet){
  const __cabinet = Object.create(null);
  const __insTable = Object.create(null);
  DEBUG && (window["__cabinet"] = __cabinet);
  const Proto = Lycabinet.prototype;

  /**
   * Get the exact cabinet of current instance.
   */
  Proto.getCabinet = function(){
    return this.__storage;
  }

  /**
   * Check cache consistent.
   * Conclude whether the current cabinet is consistent with the inner cache.
   * @returns { Boolean }
   */
  Proto.isIdentical = function(){
    return this.__storage === __cabinet[this.__root];
  }

  Proto.hasStore = function(){
    return is_Defined(__cabinet[this.__root]) && is_PlainObject(__cabinet[this.__root]);
  }

  /**
   * Get the cached cabinet access.
   * @returns {Plain Object} __cabinet ; The reference of the storage Object property been cached.
   * Each instance is shared by the root key.
   */
  Proto.getStore = function(){
    return __cabinet[this.__root];
  }
  
  /**
   * To initialize the cabinet cache. 
   * @param {Plain Object} cabinet 
   */
  Proto.setStore = function(cabinet){
    __cabinet[this.__root] = cabinet;
  }

  /**
   * To clear the inner cache of cabinet.
   * Defaultly prevent sharing elimination.
   */
  Proto.removeStore = function(){
    if(this.options.useSharedCabinet 
      || !this.options.shareCabinet 
      || !this.isIdentical()
      || __insTable[this.__root].size<=0
    ) return false;
    __cabinet[this.__root] = void 0;
    return true;
  }

  Lycabinet.$removeStore = function(root: string){
    __cabinet[root] = void 0;
  }

  DEBUG && (Lycabinet.$getStore = function(root: string){
    return __cabinet[root];
  });

  Lycabinet.mixin((cabinetIns)=>{
    cabinetIns._on("created", ()=>{
      if(!__insTable[cabinetIns.__root])
        __insTable[cabinetIns.__root] = new Set();
      __insTable[cabinetIns.__root].add(cabinetIns);
    });
    
    cabinetIns._on("destoryed", ()=>{
      __insTable[cabinetIns.__root].delete(cabinetIns);
      if(__insTable[cabinetIns.__root].size<=0)
        __insTable[cabinetIns.__root] = void 0;
    });
  });
}
