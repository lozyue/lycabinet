/**
 * The Laction JS(lactionQueue JS) entry file.
 * Slight version.
 * Only includes the core build (No event system).
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
  const Protos = Lycabinet.prototype;
  const FakeFunc = new Function();

  Protos._isHappend = FakeFunc;
  Protos._setlog = FakeFunc;
  Protos._once = FakeFunc;
  Protos._trigger = FakeFunc;
  Protos._off = FakeFunc;
  Protos._on = FakeFunc;
}


function Lycabinet(...options){
  if (process.env.NODE_ENV !== 'production' && !(this instanceof Lycabinet) ) {
    (global.warn || console.warn)('Lycabinet is a constructor and should be called with the `new` keyword');
    return null;
  }
  this.__init.apply(this, options);
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
// initImbedding(Lycabinet);

// import { addFilter } from './extends/filter';
// addFilter(Lycabinet);

// import { addObserver } from './extends/observer';
// addObserver(Lycabinet);

// import { addCheck } from './extends/check';
// addCheck(Lycabinet);

// import { addZip } from './extends/zip';
// addZip(Lycabinet);

import { initAlias } from './extends/alias';
initAlias(Lycabinet);


export default Lycabinet;
