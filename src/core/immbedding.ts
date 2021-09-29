/**
 * 提供接口利用 laction 作为支持
 * 利用Laction 进行 lazySave性能进一步优化和增强为节流防抖双支持模式.
 * 需要抽离后置执行挂载插件
 * 不影响单独使用
 * 需要在注册LactionJS实例后才能install成功
 * 不能加prototype，仅声明成构造器属性即可
 */

import { deepSupplement } from "../utils/util";

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

      // Register the lazy methods hook.
      lactionIns.registerHook(
        {
          name: lycabinetIns.__root+'_lazysave',
          // apply period throttle.s
          once: true, 
          // apply period debounce.
          debounce: true, 
          // level: 3, // 1 Root 消息级钩子 // 默认普通消息
          actions: (...params)=>{ 
            lycabinetIns.save(...params) 
          }, 
        },
      );
    });

    /**
     * lazySave method update
     * OverWrite lazy methods with laction instances. And give it better performance and even visualizaztion.
     * @param {*} lazyOrbitId the added params for laction. 
     */
    Lycabinet.prototype.lazySave = function(...params){
      params.unshift(`${this.__root}_lazysave`)
      // bubble with auto period throttle and debounce.
      lactionIns.bubble(params, this.options.useLaction.lazyOrbitId);
      return this;
    };
  };
}
