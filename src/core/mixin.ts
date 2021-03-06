/**
 * Lycabinet Mixin.
 */
export function InitMixin(Lycabinet){
  Lycabinet.prototype._mixins = []; // Shared by instances.

  Lycabinet.mixin = function (mixinFunc) {
    Lycabinet.prototype._mixins.push(mixinFunc);
    return this;
  };

  Lycabinet.prototype.__install = function(...options){
    options.unshift(this);
    Lycabinet.prototype._mixins.forEach(func => {
      func.apply(func, options);
    });
  };
}