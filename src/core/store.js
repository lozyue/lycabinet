/**
 * Given a private variable for every set storage.
 * Basement.
 */

import { is_Defined } from "../utils/util";

export function InitStore(Lycabinet){
  const __cabinet = Object.create(null);
  // var __cabinet = Object.create(null); // Replaceable.

  Lycabinet.prototype.hasStore = function(){
    return is_Defined(__cabinet[this.__root]);
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
}
