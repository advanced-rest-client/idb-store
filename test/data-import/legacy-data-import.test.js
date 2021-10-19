import { assert } from '@open-wc/testing';
import { DataTestHelper } from './DataTestHelper.js';
import { ImportNormalize } from '../../src/lib/ImportNormalize.js';
import { ImportFactory } from '../../src/lib/ImportFactory.js';
import { MockedStore } from '../../index.js';

describe('Legacy data', () => {
  const store = new MockedStore();

  describe('Legacy import to datastore', () => {
    let originalData;
    let data;
    before(async () => {
      await store.destroySaved();
      const response = await DataTestHelper.getFile('legacy-data-import.json');
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
      assert.lengthOf(requests, 2, 'has 2 requests');
      const projects = await store.getDatastoreProjectsData();
      assert.lengthOf(projects, 1, 'Has 1 project');
    });
  });

  describe('Legacy single request to datastore', () => {
    let originalData;
    let data;
    before(async () => {
      await store.destroySaved();
      const response = await DataTestHelper.getFile('legacy-request-import.json');
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
      assert.lengthOf(requests, 1, 'has 1 request');
    });
  });
});
