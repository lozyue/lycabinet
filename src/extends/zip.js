/**
 * Using a preset dictionary to compress the json data for storage or transfer. 
 */

import { arrayIndex } from "../utils/util";

export function addZip(Lycabinet){
  Lycabinet.mixin(function(cabinetIns){
    cabinetIns._on("beforeLocalLoad", function(finalData, results){
      let final = results.length? arrayIndex(results, -1): finalData;
      // console.log(`beforeLocalLoad: length:${final.length}`, final, final.replaceAll(`'`, `\"`));
      return final;
    });
    cabinetIns._on("beforeLocalSave", function(finalData, results){
      let final = results.length? arrayIndex(results, -1): finalData;
      // console.log(`beforeLocalSave: length:${final.length}`, final, final.replaceAll(`\"`, `'`));
      return final;
    });
  });
}
