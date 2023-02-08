/**
 * 提供接口利用 laction 作为支持, 影响后续所有实例
 * 利用Laction 进行 lazySave 性能进一步优化和增强为节流防抖双支持模式.
 * 
 * // Usage:
 * import Lycabinet
 * // Existed instance of Laction
 * lactionIns.use(Lycabinet);
 * 
 * When immbedding enabled, you should manually call the `destroy` method
 *  to discard the instance(Especially there is more than one instance).
 */

import { DEBUG, deepSupplement } from "../utils/util";

export function initImbedding(Lycabinet){
  // Provide as a Laction plugins.
  Lycabinet.install = function(lactionIns, options){
    // Add mixin. Should be called before lycabinet instantiation.
    Lycabinet.mixin(function(lycabinetIns){
      // add some actions for laction conjunction.
      deepSupplement(lycabinetIns.options, {
        useLaction:{
          // the target orbit of bubbled lazy message 
          lazyOrbitId: -1, // the last orbit. see: https://github.com/lozyue/laction.git
        }
      });

      let LazyRootKey = lycabinetIns.__root+'_lazy';
      // Accept pre-redundant postfix.
      const LazyKey = lactionIns.testHookName(LazyRootKey, true);
      lycabinetIns.getLazyKey = ()=>LazyKey;
      lycabinetIns._lazyKey = LazyKey;

      // Register the lazy methods hook.
      lactionIns.registerHook(
        {
          name: LazyKey,
          // apply period throttle.s
          once: true, 
          // apply period debounce.
          debounce: true, 
          // level: 3, // 1 Root 消息级钩子 // 默认普通消息
          action: (...params)=>{            
            lycabinetIns.save(...params) 
          },
        },
      );

      lycabinetIns._on("destroyed", ()=>{
        lactionIns.unregisterHook(LazyKey);
      });
    });

    /**
     * lazySave method update
     * OverWrite lazy methods with laction instances. 
     *  And give it better performance and even visualizaztion.
     * @param {*} lazyOrbitId the added params for laction. 
     */
    Lycabinet.prototype.lazySave = function(...params){
      // Get the key of Auto generated.
      params.unshift( this._lazyKey );
      // bubble with auto period throttle and debounce.
      
      lactionIns.bubble(params, this.options.useLaction.lazyOrbitId, false);
      this._trigger("lazySave");
      return this;
    };
  };
}
