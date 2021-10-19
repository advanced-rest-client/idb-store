import { assert } from '@open-wc/testing';
import { DataTestHelper } from './DataTestHelper.js';
import { ImportNormalize } from '../../src/lib/ImportNormalize.js';
import { ImportFactory } from '../../src/lib/ImportFactory.js';
import { MockedStore } from '../../index.js';

describe('Dexie legacy import', () => {
  const store = new MockedStore();

  describe('Dexie import to datastore', () => {
    let originalData;
    let data;
    before(async () => {
      await store.destroySaved();
      const response = await DataTestHelper.getFile('dexie-data-export.json');
      originalData = JSON.parse(response);
    });

    after(() => store.destroySaved());

    beforeEach(async () => {
      data = store.clone(originalData);
    });

    it('stores the data', async () => {
      const normalizer = new ImportNormalize();
      const parsed = await normalizer.normalize(data);
      const factory = new ImportFactory();
      const errors = await factory.importData(parsed);
      assert.isUndefined(errors, 'has no data storing error');
      const requests = await store.getDatastoreRequestData();
      assert.lengthOf(requests, 6, 'Has 6 requests');
      const projects = await store.getDatastoreProjectsData();
      assert.lengthOf(projects, 2, 'Has 2 projects');
      const history = await store.getDatastoreHistoryData();
      assert.lengthOf(history, 0, 'Has no history');
    });

    // it('overrides (some) data', async () => {
    //   const parsed = await element.normalizeImportData(data);
    //   const errors = await element.storeData(parsed);
    //   assert.isUndefined(errors, 'has no data storing error');
    //   const requests = await generator.getDatastoreRequestData();
    //   // 4 requests are in a project in the test data
    //   // and this import is missing project ID so it generates IDs again
    //   // so together it should give 6 from previous import + 4 new
    //   assert.lengthOf(requests, 10, 'Has 10 requests');
    //   const projects = await generator.getDatastoreProjectsData();
    //   assert.lengthOf(projects, 4, 'Has 4 projects');
    //   const history = await generator.getDatastoreHistoryData();
    //   assert.lengthOf(history, 0, 'Has no history');
    // });
  });
});
