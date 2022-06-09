import {getRootConformsTos} from '../controllers/rootConformsTo';
import {getRawCrate} from '../controllers/record';
import {ROCrate} from 'ro-crate';
import {getLogger} from "../services";
import {indexFiles} from "./indexFiles";
import path from "path";
import * as fs from 'fs-extra';
import {first, isEmpty, toArray} from "lodash";

const log = getLogger();

export async function indexObjects({crateId, client, index, root, parent, _memberOf, repository, configuration}) {
  try {
    //This is the same as doing
    // http://localhost:9000/api/object?conformsTo=https://github.com/Language-Research-Technology/ro-crate-profile%23Object&memberOf=<<crateId>>
    let members = await getRootConformsTos({
      conforms: 'https://github.com/Language-Research-Technology/ro-crate-profile#Object',
      members: crateId
    });
    log.debug(`Members of ${crateId} : ${members['length'] || 0}`);
    for (let member of members) {
      //The same as doing:
      // /api/object/meta?id=<<crateId>>
      log.debug(`indexObject: member ${member['crateId']}`);
      //TODO: add version
      const rawCrate = await getRawCrate({repository, crateId: member['crateId']});
      const crate = new ROCrate(rawCrate);
      const item = crate.getRootDataset();
      if (item) {
        if (item['@type'] && item['@type'].includes('RepositoryObject')) {
          //log.debug(`Indexing RepositoryObject of ${item['@id']}`);
          //item._root = root;
          item._crateId = crateId;
          item.conformsTo = 'RepositoryObject';
          item.license = item?.license || member?.license || parent?.license || first(root)?.license;
          if (isEmpty(item.license)) {
            log.warn('No license found for indexObjects.item: ' + item._crateId);
          }
          const normalItem = crate.getTree({root: item, depth: 1, allowCycle: false});
          normalItem._memberOf = _memberOf;
          //normalItem._root = {"@value": root['@id']};
          normalItem._root = root;
          try {
            let {body} = await client.index({
              index: index,
              body: normalItem
            });
          } catch (e) {
            log.error('IndexObjects normalItem');
            //log.debug(JSON.stringify(normalFileItem));
            const logFolder = configuration.api?.log?.logFolder || '/tmp/logs/oni';
            if (!await fs.exists(logFolder)) {
              await fs.mkdir(logFolder);
            }
            const fileName = path.normalize(path.join(logFolder, member.crateId.replace(/[/\\?%*:|"<>]/g, '-') + '_normalItem.json'));
            log.error(`Verify rocrate in ${logFolder} for ${fileName}`);
            await fs.writeFile(fileName, JSON.stringify(normalItem, null, 2));
          }
          //Then get a file, same as:
          // /stream?id=<<crateId>>&path=<<pathOfFile>>
          for (let hasPart of crate.utils.asArray(item['hasPart'])) {
            await indexFiles({
              crateId: item['@id'], item, hasPart, crate, parent: item,
              client, index, root, repository, configuration,
              _memberOf
            });
          }
        } else {
          log.warn(`Skipping ${item['@id']} not a RepositoryObject`);
        }
      }
    }
  } catch (e) {
    log.error(e);
  }
}
