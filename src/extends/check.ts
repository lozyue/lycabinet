/**
 * Argument the robustness of the JSON data process.
 * And preserve the atomicity when there is multi-tabs opened by user.
 * Like delete the Item in Storage if it is vacant.
 */

import { LycabinetStatic } from "@/typings/lycabinet";
import { addStoreListener, arrayIndex, DEBUG, objectSupplement, removeArrayItem } from "../utils/util";

const ParticalToken = 'cabinetSyncTabs';
const TokenSeparator = '|';

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
   * Add a dirty flag.
   */
  Lycabinet.mixin(function(cabinetIns){
    // This is not that precious. Since user can directly modify the __storage Object without a record.
    cabinetIns._on("setItem", function(){
      this._dirty = true;
    });
    cabinetIns._on("saved", function(){
      this._dirty = false;
    })
  });

  /**
   * Listening the storage event from other tabs(pages)
   *  Custom Events: `storageSync`
   */
  var localContext: Array<LycabinetStatic> = [];
  const cabinetSyncTab = (eve)=>{
    let cabinetIns: LycabinetStatic;

    let toMatchRoot = eve.key; 
    if(ParticalToken===eve.key){
      toMatchRoot = eve.newValue.slice( - eve.newValue.lastIndexOf(TokenSeparator) );
    };

    for(let index=0; index<localContext.length; index++){
      cabinetIns = localContext[index];
      if(!cabinetIns.options.autoNotifyTabs){
        DEBUG && console.log("TabSync is disabled!");
        return;
      }

      // Do not do redundant reload if current cabinet is shared by another.
      // We think that in one page the cabinet has the same root is always shared, but there are troubles if
      //  the first instance is collected by GC.
      if(cabinetIns.useLoadCache) continue;

      // Reload. By default using deeepMerge mode.
      if([cabinetIns.__root].indexOf(toMatchRoot) > -1){
        DEBUG && console.log("[Lycabinet]: Synchronizing data from other tabs...");
        // merge data using default options.
        (cabinetIns.load as Function)({
          onCloud: false, 
          concurrent: true, 
          deepMerge: true,
          disableMerge: true,
        }); // Considering of the latency on cloud, we only synchronize the data locally.
        (cabinetIns._trigger as Function)("storageSync");
        break;
      }
    }
  };
  addStoreListener( cabinetSyncTab );
  

  /**
   * Add auto tab synchronize listener options.
   */
  Lycabinet.mixin(function(cabinetIns){
    // save the localContext
    localContext.push(cabinetIns);
    // Remove the context.
    cabinetIns._on("destroyed", ()=>{
      removeArrayItem( localContext, cabinetIns);
    });

    // Add cache check token.
    cabinetIns._on("loadFromCache", function(){
      this.useLoadCache = true; 
    });

    // add options for custom database which is not localStorage.
    objectSupplement(cabinetIns.options, {
      autoNotifyTabs: true,
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
   * If the database in configuration is not `LocalStorage` (eg Env `sessionStorage`)
   * You should call this method to notify the other pages or set prop `autoNotifyTabs` to true.
   */
  Lycabinet.prototype.notifyTabs = function(){
    const randomToken = new Date().getTime();
    // this will give other pages a notifycation.
    const storage = window.localStorage;
    try{
      storage.setItem(ParticalToken, `${this.__root}${TokenSeparator}${randomToken}`);
    } catch(err){
      if(err instanceof DOMException && (
        // everything except Firefox
        err.code === 22 ||
        // Firefox
        err.code === 1014 ||
        // test name field too, because code might not be present
        // everything except Firefox
        err.name === 'QuotaExceededError' ||
        // Firefox
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
        // acknowledge QuotaExceededError only if there's something already stored
        (storage && storage.length !== 0)
      )
        console.error("[lycabinet]: Sync storage from tabs failed cause LocalStorage is not supportted!", err);
    }
  }
}
