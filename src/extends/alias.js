/**
 * Add alias to some methods.
 * To custom the using habit for general users.
 */

export function initAlias(Lycabinet){
  
  Lycabinet.prototype.delete = Lycabinet.prototype.remove;

  Lycabinet.prototype.get = Lycabinet.prototype.read;

  Lycabinet.prototype.storage = Lycabinet.prototype.getStorage;
}