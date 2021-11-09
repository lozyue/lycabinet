/**
 * Given a private variable for every set storage.
 * Basement.
 */

import { DEBUG, is_Defined, is_PlainObject } from "../utils/util";

export function InitStore(Lycabinet){
  const __cabinet = Object.create(null);

  Lycabinet.prototype.hasStore = function(){
    return is_Defined(__cabinet[this.__root]) && is_PlainObject(__cabinet[this.__root]);
  }

  /**
   * Get the cabinet access.
   * @returns {Plain Object} __cabinet ; The reference of the storage Object property.
   * Each instance is shared by the root key.
   */
  Lycabinet.prototype.getStore = function(){
    return __cabinet[this.__root];
  }
  
  /**
   * To initialize the __cabinet storage. 
   * @param {Plain Object} cabinet 
   */
  Lycabinet.prototype.setStore = function(cabinet){
    __cabinet[this.__root] = cabinet;
  }

  /**
   * To clear the inner cache of cabinet.
   */
  Lycabinet.prototype.removeStore = function(){
    __cabinet[this.__root] = void 0;
  }

  Lycabinet.$removeStore = function(root: string){
    __cabinet[root] = void 0;
  }

  DEBUG && (Lycabinet.$getStroe = function(root: string){
    return __cabinet[root];
  });
}
