/**
 * The Laction JS(lactionQueue JS) entry file.
 * Light version.
 * Only includes the core build.
 * For smaller build bundle.
 */

import { EnvAssociate } from './utils/util';
import { InitStore } from './core/store';
import { InitCore } from './core/lycabinet';
import { InitLazyDepartment } from './core/lazy-support';
import { InitMixin } from "./core/mixin";


// set light on
EnvAssociate.Light = true;
/**
 * Using fake event system.
 * @param {*} Lycabinet 
 */
const InitEventSystem = function(Lycabinet){
  Lycabinet.prototype._setlog = new Function();
  Lycabinet.prototype._once = new Function();
  Lycabinet.prototype._trigger = new Function();
  Lycabinet.prototype._off = new Function();
  Lycabinet.prototype._on = new Function();
}


function Lycabinet(...options){
  if (process.env.NODE_ENV !== 'production' && !(this instanceof Lycabinet) ) {
    (global.warn || console.warn)('Lycabinet is a constructor and should be called with the `new` keyword');
    return null;
  }
  this._init.apply(this, options);
}

InitStore(Lycabinet);
InitEventSystem(Lycabinet);
InitCore(Lycabinet);
InitLazyDepartment(Lycabinet);
InitMixin(Lycabinet);

/**
 * Manually select the optional Extends modules.
 */ 
// import { initImbedding } from './core/immbedding';
// import { initAlias } from './extends/alias';
// import { addFilter } from './extends/filter';
// import { addObserver } from './extends/observer';

// initImbedding(Lycabinet);
// initAlias(Lycabinet);

// addFilter(Lycabinet);
// addObserver(Lycabinet);

export default Lycabinet;
