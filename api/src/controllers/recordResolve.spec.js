require('regenerator-runtime/runtime');

import { loadConfiguration } from "../services";
import { recordResolve } from "./recordResolve";
import { testHost, testOCFLConf } from '../services';
import { getRecord } from './record';
import { ROCrate } from 'ro-crate';

jest.setTimeout(10000);

let configuration;

describe('Test recordResolve', () => {
  beforeAll(async () => {
    configuration = await loadConfiguration();
  });
  test('it should be able to resolve a single crate', async () => {
    const crateId = 'arcp://name,farms-to-freeways/corpus/root';
    let record = await getRecord({ crateId: crateId });
    const resolvedCrate = await recordResolve({ id: crateId, getUrid: false, configuration });
    const crate = new ROCrate(resolvedCrate);
    crate.toGraph();
    const root = crate.getRootDataset();
    expect(root['@id']).toBe(crateId);
  });
  test('it should be able to resolve a crate split in OCFL', async () => {
    const crateId = 'arcp://name,sydney-speaks/corpus/root';
    let record = await getRecord({ crateId: crateId });
    const resolvedCrate = await recordResolve({ id: crateId, getUrid: false, configuration });
    const crate = new ROCrate(resolvedCrate);
    crate.toGraph();
    const root = crate.getRootDataset();
    expect(root['@id']).toBe(crateId);
  });
});
