require("regenerator-runtime/runtime");
import fs from  "fs-extra";
import {ROCrate} from "ro-crate";
import {ocfltools} from  "oni-ocfl";
import {testOCFLConf as ocfl} from "./";

let records;
let crate;

const testData = {
    roCrateDir: "../test-data/rocrates/farmstofreeways",
    roCrate: "ro-crate-metadata.json"
}

async function cleanup() {
    if (fs.pathExistsSync(ocfl.ocflPath)) {
        await fs.removeSync(ocfl.ocflPath);
    }
}

describe("Test loading the configuration", () => {

    beforeAll(async () => {
        await cleanup();
    });
    beforeAll(async () => {
        await cleanup();
    });

    test("create repo", async () => {
        const repo = await ocfltools.connectRepo(ocfl.ocflPath);
        const jsonld = fs.readJsonSync(testData.roCrateDir + "/" + testData.roCrate);
        const crate = new ROCrate(jsonld);
        crate.toGraph();
        await ocfltools.checkin({repo, rocrateDir: testData.roCrateDir, crate});
    })
    test("it should load the ocfl repo", async () => {
        records = await ocfltools.loadFromOcfl(ocfl.ocflPath);
        expect(records.length).toBeGreaterThanOrEqual(1);
    });
    test("It should load ocflobjects", () => {
        expect(records[0]['ocflObject']).not.toBeNull()
    });
    test("It should load an ro-crate", () => {
        const jsonld = records[0]['jsonld'];
        crate = new ROCrate(jsonld);
        crate.toGraph();
        const root = crate.getRootDataset();
        expect(root).not.toBe(undefined);
    });
});
