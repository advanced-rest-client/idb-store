import { assert } from '@open-wc/testing';
import { DataTestHelper } from './DataTestHelper.js';
import { ImportNormalize } from '../../src/lib/ImportNormalize.js';
import { ImportFactory } from '../../src/lib/ImportFactory.js';
import { MockedStore } from '../../index.js';

describe('postman-data-import-v1-test', () => {
  const store = new MockedStore();

  describe('Postman import to datastore - v1', () => {
    let originalData;
    let data;
    before(async () => {
      const response = await DataTestHelper.getFile('postman/collection-v1.json');
      originalData = JSON.parse(response);
    });

    after(async () => {
      await store.destroySaved();
      await store.destroyVariables();
    });

    beforeEach(async () => {
      data = store.clone(originalData);
    });

    it('Stores the data', async () => {
      const normalizer = new ImportNormalize();
      const parsed = await normalizer.normalize(data);
      const factory = new ImportFactory();
      const errors = await factory.importData(parsed);
      assert.isUndefined(errors, 'has no storing errors');
      const requests = await store.getDatastoreRequestData();
      assert.lengthOf(requests, 2, 'has 2 requests');
      const projects = await store.getDatastoreProjectsData();
      assert.lengthOf(projects, 1, 'has a single project');
    });

    it('overrides all data', async () => {
      const normalizer = new ImportNormalize();
      const parsed = await normalizer.normalize(data);
      const factory = new ImportFactory();
      const errors = await factory.importData(parsed);
      assert.isUndefined(errors, 'has no storing errors');
      const requests = await store.getDatastoreRequestData();
      assert.lengthOf(requests, 2, 'has 2 requests');
      const projects = await store.getDatastoreProjectsData();
      assert.lengthOf(projects, 1, 'has a single project');
    });
  });
});
