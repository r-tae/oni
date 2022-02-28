import {getLogger} from './index';
import {createRecord, deleteRecords} from '../controllers/record';
import {ocfltools} from 'oni-ocfl';
import {ROCrate} from 'ro-crate';
import {firstIfArray} from "./utils";
const log = getLogger();

export async function bootstrap({configuration}) {
  await deleteRecords();
  await initOCFL({configuration});
}

export async function initOCFL({configuration}) {
  const ocfl = configuration.api.ocfl;
  const license = configuration.api.license;
  const identifier = configuration.api.identifier;
  try {
    const records = await ocfltools.loadFromOcfl(ocfl.ocflPath);
    let i = 0;
    log.info(`Loading records: ${records.length}`);
    for (let record of records) {
      log.silly(`Loading record: ${++i} : ${record['path']}`);
      const ocflObject = record['ocflObject'];
      const crate = new ROCrate(record['jsonld']);
      crate.toGraph();
      const root = crate.getRootDataset();
      let lic;
      if (root['license'] && root['license']['@id']) {
        lic = root['license']['@id']
      } else {
        lic = license['default'];
      }
      if (root['@id'] === './') {
        //TODO: Create and use an oni-ocfl validator
        log.warn('Root as ./ are not compatible with Oni, skipping');
      } else {
        const rec = {
          crateId: root['@id'],
          path: record['path'],
          diskPath: ocflObject['path'],
          license: lic,
          name: firstIfArray(root['name']),
          description: firstIfArray(root['description'])
        }
        //index the types
        //if it claims to be a memberOf !! think of sydney speaks
        //const recordCreate = await createRecordWithCrate(rec, root['hasMember'], crate.__item_by_type);
        const recordCreate = await createRecord({
          data: rec,
          memberOfs: root['memberOf'] || [],
          atTypes: root['@type'] || [],
          conformsTos: root['conformsTo'] || []
        });
        log.debug(`Created: ${recordCreate}`);
      }
    }
    log.info('Finish loading into database');
  } catch (e) {
    log.error('initOCFL error');
    log.error(e);
  }

}
