/**
 * Lycabinet.js
 * Full build.
 */

import { InitStore } from './core/store';
import { InitEventSystem } from './core/event';
import { InitCore } from './core/lycabinet';
import { InitLazyDepartment } from './core/lazy-support';
import { InitMixin } from "./core/mixin";

import { initImbedding } from './core/immbedding';
import { initAlias } from './extends/alias';
import { addFilter } from './extends/filter';
import { addObserver } from './extends/observer';

import { addCheck } from './extends/check';
import { addZip } from './extends/zip';


function Lycabinet(...options){
  if (process.env.NODE_ENV !== 'production' && !(this instanceof Lycabinet) ) {
    (global.warn || console.warn)('Lycabinet is a constructor and should be called with the `new` keyword');
    return null;
  }
  this.__init.apply(this, options);
}

InitStore(Lycabinet);
InitMixin(Lycabinet);
InitEventSystem(Lycabinet);
InitCore(Lycabinet);
InitLazyDepartment(Lycabinet);

initImbedding(Lycabinet);
initAlias(Lycabinet);

addFilter(Lycabinet);
addObserver(Lycabinet);

addCheck(Lycabinet);
addZip(Lycabinet);

export default Lycabinet;
