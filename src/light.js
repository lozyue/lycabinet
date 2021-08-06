/**
 * The Laction JS(lactionQueue JS) entry file.
 * Light version.
 * Only includes the core build.
 * And it do not protect member variable safety.
 */

import { InitStore } from './core/store';
import { InitEventSystem } from './core/event';
import { InitCore } from './core/lycabinet';
import { InitMixin } from "./core/mixin";

import { initImbedding } from './core/immbedding';
import { initAlias } from './extends/alias';


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

export default Lycabinet;
