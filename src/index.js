/**
 * Lycabinet.js
 * Full build.
 */

import { InitStore } from './core/store';
import { InitEventSystem } from './core/event';
import { InitCore } from './core/lycabinet';
import { InitMixin } from "./core/mixin";

import { initImbedding } from './core/immbedding';
import { initAlias } from './extends/alias';
import { addFilter } from './extends/filter';
import { addObserver } from './extends/observer';


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

addFilter(Lycabinet);
addObserver(Lycabinet);

export default Lycabinet;
