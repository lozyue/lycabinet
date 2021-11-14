/**
 * Add alias to some methods.
 * To custom the using habit for general users.
 */

export function initAlias(Lycabinet){
  
  Lycabinet.prototype.delete = Lycabinet.prototype.remove;

  Lycabinet.prototype.read = Lycabinet.prototype.get;

  Lycabinet.prototype.storage = Lycabinet.prototype.getStore;

  Lycabinet.prototype.getCabinet = Lycabinet.prototype.getStore;
}