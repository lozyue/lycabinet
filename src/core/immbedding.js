/**
 * 提供接口利用 laction 作为支持
 * 利用Laction 进行 lazySave性能进一步优化和增强为节流防抖双支持模式.
 * 需要抽离后置执行挂载插件
 * 不影响单独使用
 * 需要在注册LactionJS实例后才能install成功
 * 不能加prototype，仅声明成构造器属性即可
 */

export function initImbedding(Lycabinet){
  // Provide as a Laction plugins.
  Lycabinet.install = function(lactionIns){
    // Add mixin.
    Lycabinet.mixin(function(){
      // 注册事件消息
      lactionIns.registerHook(
        {
          name: this.__root+'_lazysave',
          // apply period throttle.s
          once: true, 
          // apply period debounce.
          debounce: true, 
          // level: 3, // 1 Root 消息级钩子 // 默认普通消息
          actions: ()=>{ this.save() }, // 防抖保证 
        },
      );
    });
    // Rewrite lazy methods with laction instances. And give it better performance and even visualizaztion.
    Lycabinet.prototype.lazySave = function(){
      // bubble with auto period throttle and debounce.
      lactionIns.bubble(this.__root+'_lazysave');
      return this;
    };
  };
}
