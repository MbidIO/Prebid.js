/**
 * @module sizeMapping
 */
import * as utils from './utils';
let _win;

function mapSizes(adUnit) {
  if(!isSizeMappingValid(adUnit.sizeMapping)){
    return adUnit.sizes;
  }
  const width = getScreenWidth();
  if(!width) {
    //size not detected - get largest value set for desktop
    const mapping = adUnit.sizeMapping.reduce((prev, curr) => {
      return prev.minWidth < curr.minWidth ? curr : prev;
    });
    if(mapping.sizes) {
      return mapping.sizes;
    }
    return adUnit.sizes;
  }
  let sizes = '';
  const mapping = adUnit.sizeMapping.find(sizeMapping =>{
    return width > sizeMapping.minWidth;
  });
  if(mapping && mapping.sizes){
    sizes = mapping.sizes;
    utils.logMessage(`AdUnit : ${adUnit.code} resized based on device width to : ${sizes}`);
  }
  return sizes;

}

function isSizeMappingValid(sizeMapping) {
  if(utils.isArray(sizeMapping) && sizeMapping.length > 0){
    return true;
  }
  utils.logInfo('No size mapping defined');
  return false;
}

function getScreenWidth(win) {
  var w = win || _win || window;
  if(w.screen && w.screen.width) {
    return w.screen.width;
  }
  return 0;
}

function setWindow(win) {
  _win = win;
}

export { mapSizes, getScreenWidth, setWindow };
