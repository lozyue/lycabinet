/**
 * Argument the robustness of the JSON data process.
 * Like delete the Item in Storage if it is vacant.
 */

import { arrayIndex } from "../utils/util";


export function addCheck(Lycabinet){
  Lycabinet.mixin(function(cabinetIns){
    cabinetIns._on("beforeLocalLoad", function(finalData, results){
      let final = results.length? arrayIndex(results, -1): finalData;
      // add pre check for JSON Parse.
      if(!final) final = '{}';
      return final;
    });
    cabinetIns._on("beforeLocalSave", function(finalData, results){
      let final = results.length? arrayIndex(results, -1): finalData;
      return final;
    });
  });
}
