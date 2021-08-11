/**
 * The Laction JS(lactionQueue JS) entry file.
 * Light version.
 * Only includes the core build.
 * And it do not protect member variable safety.
 */

import { InitStore } from './core/store';
import { InitCore } from './core/lycabinet';
import { InitMixin } from "./core/mixin";


// import { addFilter } from './extends/filter';
// import { addObserver } from './extends/observer';

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
    warn('Lycabinet is a constructor and should be called with the `new` keyword');
    return null;
  }
  this._init.apply(this, options);
}

InitStore(Lycabinet);
InitEventSystem(Lycabinet);
InitCore(Lycabinet);
InitMixin(Lycabinet);

initImbedding(Lycabinet);
initAlias(Lycabinet);

// Extends modules optional.

// import { initImbedding } from './core/immbedding';
// import { initAlias } from './extends/alias';

// addFilter(Lycabinet);
// addObserver(Lycabinet);

export default Lycabinet;
