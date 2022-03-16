/**
 * Add alias to some methods.
 * To custom the using habit for general users.
 */

export function initAlias(Lycabinet){
  const Proto = Lycabinet.prototype;
  
  Proto.delete = Proto.remove;

  Proto.read = Proto.get;
  Proto.write = Proto.set;

  Proto.storage = Proto.getCabinet;

  Proto.isConsistent = Proto.isIdentical;
}