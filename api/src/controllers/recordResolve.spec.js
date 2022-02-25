import {recordResolve} from "./recordResolve";

require('regenerator-runtime/runtime');

import { testHost, testOCFLConf } from '../services';
import { getRecord } from './record';
import { ROCrate } from 'ro-crate';

jest.setTimeout(10000);

describe('Test load records', () => {
  test('it should be able to resolve a crate', async () => {
    const crateId = 'arcp://name,farms-to-freeways/corpus/root';
    let record = await getRecord({crateId: col.crateId});
    const resolvedCrate = await recordResolve({id: col.crateId, getUrid: false, configuration});
    const crate = new ROCrate(resolvedCrate);
    crate.toGraph();
    const root = crate.getRootDataset();
  });
});
