import 'regenerator-runtime';
import fetch from "node-fetch";

import {testHost as host, testOCFLConf as ocfl} from '../common';
import {getRecord, getUridCrate} from './record';
import {transformURIs} from '../common/ro-crate-utils';
import {OcflObject} from 'ocfl';
import {ROCrate} from 'ro-crate';

jest.setTimeout(10000);

describe('Test load records', () => {
  test('it should be able to retrieve records', async () => {
    const id = 'arcp://name,ATAP/uts.edu.au';
    const record = await getRecord({recordId: id});
    const ocflObject = new OcflObject(record['diskPath']);
    const newCrate = await transformURIs({
      host,
      recordId: id,
      ocflObject,
      uridTypes: ['File'],
      catalogFilename: ocfl.catalogFilename
    });
    const crate = new ROCrate(newCrate);
    crate.toGraph();
    const interview427 = crate.getItem('#interview-#427');
    const hasFiles = interview427['hasFile'];
    const anId = hasFiles[hasFiles.length - 1];
    expect(anId['@id'].startsWith('http')).toBe(true)
  });

});
