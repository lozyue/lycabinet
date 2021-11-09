/**
 * Argument the robustness of the JSON data process.
 * And preserve the atomicity when there is multi-tabs opened by user.
 * Like delete the Item in Storage if it is vacant.
 */

import { addStoreListener, arrayIndex, DEBUG, objectSupplement } from "../utils/util";

const ParticalToken = 'cabinetSyncTabs';

export function addCheck(Lycabinet){
  /**
   * JSON analysis argumented.
   */
  Lycabinet.mixin(function(cabinetIns){
    cabinetIns._on("localLoaded", function(finalData, results){
      let final = results.length? arrayIndex(results, -1): finalData;
      // add pre-check for JSON Parse.
      if(!final) final = '{}';
      return final;
    });
    cabinetIns._on("localSaved", function(finalData, results){
      let final = results.length? arrayIndex(results, -1): finalData;
      return final;
    });
  });

  /**
   * Add a dirty flag for judging.
   */
  Lycabinet.mixin(function(cabinetIns){
    // This is not so precious. Because user can manually set the __storage Object whose action is not recorded.
    cabinetIns._on("setItem", function(){
      this._dirty = true;
    });
    cabinetIns._on("saved", function(){
      this._dirty = false;
    })
  });

  /**
   * Listening the storage event from other tabs(pages)
   * by
   */
  var localContext: {cabinetIns?: Record<string, unknown>} = {};
  addStoreListener( (eve)=>{
    if(!localContext.cabinetIns){
      console.warn("cabinetIns is not mouted!");
      return true;
    }

    const { cabinetIns: cabinetIns } = localContext;
    
    // Do not reload if current cabinet has shared cabinet.
    if(cabinetIns.useLoadCache) return true;

    // Reload. By default using deeepMerge mode.
    if([cabinetIns.__root, ParticalToken].indexOf(eve.key) > -1){
      DEBUG && console.log("[Lycabinet]: Synchronizing data from other tabs...");
      // merge data using default options.
      (cabinetIns.load as Function)(true, false, true); // Considering of the latency on cloud, we only synchronize the data on local.
    }
  });

  /**
   * Add auto tab synchronize listener options.
   */
  Lycabinet.mixin(function(cabinetIns){
    // save the localContext
    localContext.cabinetIns = cabinetIns;
    cabinetIns._on("loadFromCache", function(){
      this.useLoadCache = true; 
    });

    // add options for custom database which is not localStorage.
    objectSupplement(cabinetIns.options, {
      autoNotifyTabs: false,
    });

    cabinetIns._on("saved", function(onCloud, concurrent){
      if(this.options.autoNotifyTabs){
        const IgnoreLocal = onCloud && !concurrent;
        if(IgnoreLocal){
          return false;
        }

        this.notifyTabs();
      }
    });
  });

  /**
   * If the database in configuration is not `LocalStorage` (like Env is `sessionStorage`)
   * You should call this method to notify the other pages or set autoNotifyTabs to true.
   */
  Lycabinet.prototype.notifyTabs = function(){
    const randomToken = new Date().getTime();
    // this will give other pages a notifycation.
    window.localStorage.setItem(ParticalToken, randomToken+'');
  }
}
