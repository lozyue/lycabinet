/**
 * Lazy methods support.
 * @param {*} Lycabinet 
 */
export function InitLazyDepartment(Lycabinet){
  
  /**
   * Add lazySave support.
   * The params is the same to save methods.
   */
  Lycabinet.prototype.lazySave = function(){
    var lastTime = 0;
    return function(...params){
      var nowTime = new Date().getTime();
      // The gap is not so accurate but enough.
      let judge = nowTime - lastTime > this.options.lazyPeriod;
      this._trigger("lazySave", judge);
      if (judge) {
        // Use default settings
        this.save(...params);
        lastTime = nowTime;
      }
      return this;
    }
  }();

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