/**
 * Argument the robustness of the JSON data process.
 * And preserve the atomicity when there is multi-tabs opened by user.
 * Like delete the Item in Storage if it is vacant.
 */

import { addStoreListener, arrayIndex, DEBUG, objectSupplement } from "../utils/util";

const ParticalToken = 'cabinetSyncTabs';

export function addCheck(Lycabinet){
  Lycabinet.mixin(function(cabinetIns){
    cabinetIns._on("localLoaded", function(finalData, results){
      let final = results.length? arrayIndex(results, -1): finalData;
      // add pre check for JSON Parse.
      if(!final) final = '{}';
      return final;
    });
    cabinetIns._on("localSaved", function(finalData, results){
      let final = results.length? arrayIndex(results, -1): finalData;
      return final;
    });
  });

  /**
   * Listening the storage event from other tabs(pages)
   * by
   */
  var context = {};
  addStoreListener( (eve)=>{
    if(!context.cabinetIns){
      console.log("cabinetIns is not mouted!");
      return true;
    }

    const { cabinetIns: cabinetIns } = context;

    // Reload. By default using deeepMerge mode.
    if([cabinetIns.__root, ParticalToken].indexOf(eve.key) > -1){
      DEBUG && console.log("[Lycabinet]: Synchronizing data from other tabs...");
      // merge data using default options.
      cabinetIns.load(true, false, true); // Considering of the latency on cloud, we only synchronize the data on local.
    }
  });

  /**
   * Add auto tab synchronize listener options.
   */
  Lycabinet.mixin(function(cabinetIns){
    // save the context
    context.cabinetIns = cabinetIns;

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
   * If the database in configuration is not `LocalStorage` 
   * You should call this method to notify the other pages or set autoNotifyTabs to true.
   */
  Lycabinet.prototype.notifyTabs = function(){
    const randomToken = new Date().getTime();
    // this will give other pages a notifycation.
    window.localStorage.setItem(ParticalToken, randomToken);
  }
}