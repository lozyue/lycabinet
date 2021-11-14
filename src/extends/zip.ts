/**
 * Using a preset dictionary to compress the json data for storage or transfer. 
 */

import { arrayIndex } from "../utils/util";

export function addZip(Lycabinet){
  Lycabinet.mixin(function(cabinetIns){
    cabinetIns._on("localLoaded", function(finalData, results){
      let final = results.length? arrayIndex(results, -1): finalData;
      // todo...
      // console.log(`beforeLocalLoad: length:${final.length}`, final, final.replaceAll(`'`, `\"`));
      return final;
    });
    cabinetIns._on("localSaved", function(finalData, results){
      let final = results.length? arrayIndex(results, -1): finalData;
      // todo...
      // console.log(`beforeLocalSave: length:${final.length}`, final, final.replaceAll(`\"`, `'`));
      return final;
    });
  });
}
