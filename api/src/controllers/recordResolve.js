import { ROCrate } from 'ro-crate';
import { getRawCrate, getRecord, getUridCrate } from './record';
import { getRootMemberOfs } from './rootMemberOf';
import { getLogger } from '../services';

const log = getLogger();

export async function recordResolve({ id, getUrid, configuration }) {
  try {
    log.debug(`Get resolve-parts: ${ id }`);
    let response = [];
    response = await resolveProfile({
      crateId: id,
      response: response,
      getUrid: getUrid,
      configuration: configuration
    });
    if (response.length < 1) {
      return null;
    } else {
      const rocrate = new ROCrate();
      rocrate.toGraph();
      return rocrate.getJson();
    }
  } catch (e) {
    log.error(e);
    log.error('Error trying to resolve links');
    throw new Error(e);
  }
}

async function resolveProfile({ crateId, response, configuration, getUrid }) {
  const recordMeta = await getRecord({ crateId });
  if (!recordMeta.data) {
    return response;
  }
  const member = recordMeta.data['crateId'];
  const diskPath = recordMeta.data['diskPath'];
  let record;
  if (getUrid) {
    record = await getUridCrate({
      host: configuration.api.host,
      crateId: member,
      diskPath: diskPath,
      catalogFilename: configuration.api.ocfl.catalogFilename,
      typesTransform: configuration.api.rocrate.dataTransform.types
    });
  } else {
    record = await getRawCrate({
      diskPath: recordMeta.data['diskPath'],
      catalogFilename: configuration.api.ocfl.catalogFilename
    });
  }
  response.push(record);
  let memberOfs = await getRootMemberOfs({ crateId: member });
  for (let memberOf of memberOfs['data']) {
    if (memberOf['dataValues']) {
      const mO = memberOf['dataValues'];
      await resolveProfile({ crateId: mO['crateId'], response, configuration, getUrid: true });
    }
  }
  return response;
}

function findAndReplace(object, value, replacevalue) {
  for (let x in object) {
    if (typeof object[x] === typeof {}) {
      findAndReplace(object[x], value, replacevalue);
    }
    if (object['@id'] === value) {
      object['@id'] = replacevalue;
      break;
    }
  }
}
