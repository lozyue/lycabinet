// Types of Lycabinet

export type SubSet<T, K> = Pick<T, Exclude<keyof T, K>>;

export type AccessOptions = Partial<{
  onCloud: boolean|null, 
  concurrent: boolean|null,
  deepMerge: boolean|null,
  onceDone: (isSuccess: boolean, isCloud: boolean)=>unknown,
}>

export interface ConstructOptions {
  initStorage: Object,
  root: string, // The token of cabinet.
  autoload: boolean, 
  lazyPeriod : number, // set the lazy period of lazySave methods.
  saveMutex: boolean, // 存储互斥 仅在 idle 状态可进行保存操作
  autoLazy: boolean, // Call lazy save automaticly when the save is busy. 
  useSharedCabinet: true, // use global shared cabinet
  shareCabinet: true, // share the cabinet for global
  // Weather use deepAssign to contact when load from outer data.
  // (If the observer is required, it is recommend you to always keep this on to prevent reference loss.)
  deepMerge: false, 
  // local interfaces of storage
  localInterface: {
    database: Storage,
    getItem: string, // method name, String
    setItem: string, // method name, String
    removeItem: string, // method name, String
  }, 
  
  // Decide weather enable local cabinet when cloud is setted. Auto judge.
  concurrent: boolean,
  // cloud loads example options. 
  // The inner pointer `this` is pointed to `cabinet.options` if it is not arrow function.
  outerLoad: null| Function,
  outerSave: null| Function,
  outerClear: null| Function,

  // From Check.js
  autoNotifyTabs: boolean,
  // From Filter.js
  includes: string[],
  excludes: string[],
  // From Observer.js
  lazy: boolean, // whether do automatically save when the watching Object changes.
  initWatch: boolean, // whether transform the origin property in Observer.
  shallowWatch: boolean,
  deepWatch: boolean, // whether consistently watch the Object type value setted in initial data.

  logEvent: boolean, // use this to log event globally from scratch
}

export interface LycabinetInstance {
  // Constructor
  // __init(root: string, options: ConstructOptions): undefined;
  // Methods
  _init(cabinet: Object): LycabinetInstance;
  get(name: string): unknown;
  set(name: string, value: unknown): LycabinetInstance;
  lazySet(name: string, value: unknown, option: AccessOptions = {}): LycabinetInstance;
  isVacant(): boolean;
  remove(keys: string[]): LycabinetInstance;
  clear(option: AccessOptions & { reset?: boolean }): LycabinetInstance;
  load(option: AccessOptions = {}): LycabinetInstance;
  save(option: AccessOptions = {}): LycabinetInstance;
  lazySave(option: AccessOptions = {}): LycabinetInstance;
  forEach(callback: (item: any, key: string, cabinet: Object)=>any): LycabinetInstance;
  map(callback: (item: any, key: string, cabinet: Object)=>any): LycabinetInstance;
  destroy(autoClear: boolean);
  // Event hub
  _on(name: CabinetEventType, func: Function);
  _off(name: CabinetEventType, handle: Function);
  _once(name: CabinetEventType, func: Function, instantOnTriggered: number|boolean);
  _isHappened(name: CabinetEventType, counts: number);
  _trigger(name: CabinetEventType, ...params:any);
  // Cabinet
  getCabinet(): unknown; // Return cabinet of current instance.
  getStore(): unknown; // Return the global shared cabinet whose root name is same to current instance.
  isIdentical(): boolean; // Is current cabinet identical to the shared global cabinet.
  hasStore(): boolean; // Is there shared global cabinet?
  setStore(cabinet: Object): undefined; // Set the cabinet into global.

  options: ConstructOptions;
  status: string;
  __root: string;

  // When upgrade with LactionJS
  _lazyKey: string;
  getLazyKey(): string;

  // Status Token inject when plugin/check.js is enabled.
  useLoadCache: boolean;
}

export interface LycabinetStatic extends LycabinetInstance {
  SeparateLog: boolean,
  DEBUG: boolean,
  
  mixin(invoke: (ins: LycabinetInstance)=>any);
  $removeStore(root: string);
  // If plugin/observer.js is enabled
  $get(target: Object, pathList: string[]);
  $active(target: Object, pathList: string[], deep?: boolean, shallow?: boolean);
  // If plugin/filter.js is enabled
  $filter(cabinet: Object, includes: string[], excludes: string[]): Object;
}

declare const Lycabinet: LycabinetStatic;

export default Lycabinet;

export type CabinetEventType =
'created'|'mounted'| 
'beforeLoad'| 'beforeLocalLoad'| 'localLoaded'| 'loaded'| 
'loadFromCache'|
'storageSync'|
'setItem'| 'writeLock'| 'writeBackflow'| 
'getItem'| 'removeItem'| 
'lazySave'| 
'beforeSave'| 'beforeLocalSave'| 'localSaved'| 'saved'| 'busy'|
'beforeClear'| 'beforeLocalClear'| 'localCleared'| 'cleared'|
'error'|
'destroyed';

