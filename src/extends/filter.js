/**
 * Add a filter before save the storage.
 * (Via to JSON hook)
 * @param {*} Lycabinet 
 */
import { deepSupplement, is_Defined } from '../utils/util';

export function addFilter(Lycabinet){
  /**
   * Set a filter by options
   * Support dot `.` selection expression
   * @param {Object} options {includes: [], excludes:[] }
   */
  Lycabinet.mixin(function(options){
    options = deepSupplement(options, {
      includes: [], // vacant equal to all!
      excludes: [],
    });
  });

  Lycabinet.prototype.CustomToJSON = function (){
    const _this = this;
    Object.defineProperty(this.getStore(), 'toJSON', {
      configurable: true,
      enumerable: false, // hide in enumeration.
      value: function(){
        let filtered = Object.create(null);
        // set the basement includes.
        if(_this.options.includes.length>0){
          let includesKeyMap = [];
          _this.options.includes.forEach( (associatedKey,index)=>{
            let current = includesKeyMap[index] = associatedKey.split(".");
            let currentStorage = _this.__storage;
            current.forEach((item, i )=>{
              currentStorage = currentStorage[current[i]];
              // Compliment the non-final selection. 
              if( i +1 < current.length && is_Defined( currentStorage )){
                if(!is_Defined(filtered[current[ i ]]) )
                  filtered[current[i]] = {};
                else
                  Object.assign(filtered[current[i]], currentStorage);
              }else
                filtered[current[i]] = currentStorage;
            });
          });
        // if the `includes` option is not configuratted designed, it will mean includes all by default. 
        }else Object.assign(filtered, _this.__storage);
        // caculating the exclude filtering.
        let excludesKeyMap = [];
        _this.options.excludes.forEach( (associatedKey, index)=>{
          let current = excludesKeyMap[index] = associatedKey.split(".");
          let currentStorage = filtered;
          // instead of forEach to control logical better.
          for(let i=0; i<current.length; i++){
            if(!is_Defined(filtered[current[0]]) ) break;

            if(is_Defined(currentStorage[current[i]]) )
              currentStorage = currentStorage[current[i]];
            else
              break ;
            // find the target.
            if(i === arr.length-1)
              currentStorage = void 0;
          };
        });
        return filtered;
      },
    });
  }
}