/**
 * Add a filter before save the storage.
 * You should give a value to the options : includes & excludes.
 * (Via to JSON hook)
 * @param {*} Lycabinet 
 */
import { DEBUG, deepClone, deepSupplement, is_Defined } from '../utils/util';

export function addFilter(Lycabinet){
  const Proto = Lycabinet.prototype;
  /**
   * Set a filter by options
   * Support dot `.` selection expression
   * @param {Object} cabinetIns {includes: [], excludes:[] }
   */
  Lycabinet.mixin(function(cabinetIns){
    const opt = cabinetIns.options;
    if(opt.includes || opt.excludes){
      cabinetIns._once("mounted", ()=>{
        cabinetIns.setFilter(); // auto set.
      });
    }
    deepSupplement(opt, {
      includes: [], // vacant equals to all!
      excludes: [], // vacant equals to none.
    });
  });

  Proto.setFilter = function(){
    const _this = this;

    Object.defineProperty(this.getCabinet(), 'toJSON', {
      configurable: true,
      enumerable: false, // hide in enumeration.
      value: function(){
        const cabinet = _this.getCabinet();
        // set the basement includes.
        const Includes = _this.options.includes;
        const Excludes = _this.options.excludes;
        return CustomFilter(cabinet, Includes, Excludes);
      },
    });
  };

  /**
   * Allow you appointed the specific Storage Object and 
   *  temporary Includes/Excludes options.
   */
  Lycabinet.$filter = CustomFilter;
}

/**
 * Helper Function.
 */
function CustomFilter(cabinet, Includes, Excludes){
  let filtered = Object.create(null);
  if(Includes.length>0){
    let includesKeyMap: number[]= [];
    Includes.forEach( (associatedKey,index)=>{
      let current = includesKeyMap[index] = associatedKey.split(".");
      let currentStore = cabinet;
      let targetStore = filtered;
      current.forEach((item, i )=>{
        currentStore = currentStore[item];
        // Compliment the non-final selection. 
        if( i +1 < current.length && is_Defined( currentStore )){
          if(!is_Defined(targetStore[item]) )
            targetStore[item] = {};
          // else
          //   targetStore[item] = currentStore;
        }else
          targetStore[item] = currentStore;
        targetStore = targetStore[item];
      });

    });
  // if the configuration of `includes` option is not designed, it will mean exactly includes all by default. 
  }else Object.assign(filtered, cabinet);
  // caculating the exclude filtering.
  let excludesKeyMap: Array<number>= [];
  let currentStore = deepClone(filtered);
  Excludes.forEach( (associatedKey, index, arr)=>{
    let current = excludesKeyMap[index] = associatedKey.split(".");
    let pointer = currentStore;
    for(let i=0; i<current.length; i++){
      DEBUG && console.log({pointer, current: current[i]});
      
      if(is_Defined(pointer[current[i]]) ){
        // find the target.
        if(i === current.length-1){
          pointer[current[i]] = void 0;
        }
        // continue
        pointer = pointer[current[i]];
      }else
        break ;
    };
  });
  filtered = currentStore;
  return filtered;
}
