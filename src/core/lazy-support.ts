/**
 * Lazy methods support.
 * @param {*} Lycabinet 
 */
import { DEBUG } from "@/utils/util";

export function InitLazyDepartment(Lycabinet){
  
  /**
   * Add lazySave support.
   * The params is the same to save methods.
   */
  Lycabinet.prototype.lazySave = (function(){
    var lastTime = 0; // throttle
    var timerHandle: NodeJS.Timeout; // debounce
    return function(...params){
      var nowTime = new Date().getTime();
      // The gap is not so accurate but enough.
      let judge = (nowTime - lastTime) > this.options.lazyPeriod;
      this._trigger("lazySave", judge);

      clearTimeout(timerHandle);
      if (judge) {
        // Use default settings
        DEBUG && console.log("Lazy executed!", nowTime, lastTime, judge)
        this.save(...params);
      } else {
        timerHandle = setTimeout(()=>{
          this.save(...params);
        }, nowTime - lastTime);
      }
      lastTime = nowTime;
      return this;
    }
  })();

  /**
   * Just calling lazySave after save called.
   * @param {*} key 
   * @param {*} value 
   * @param {...any} params parameters to lazySave (). 
   */
  Lycabinet.prototype.lazySet = function(key, value, ...params){
    this.set(key, value).lazySave(...params);
    return this;
  }
}