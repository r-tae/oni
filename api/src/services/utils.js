import path from 'path';
import util from 'util';
import {first} from 'lodash';

export function firstIfArray(obj) {
  if (Array.isArray(obj)) {
    return first(obj)
  } else {
    return obj;
  }
}

export function workingPath(currentPath) {
  if (path.isAbsolute(currentPath)) {
    return currentPath;
  } else {
    return path.join(process.cwd(), currentPath);
  }
}

export function inspect(obj, depth = null) {
  const ins = util.inspect(obj, {showHidden: false, depth, colors: true})
  console.log(ins);
}

