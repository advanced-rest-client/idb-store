import { assert } from '@open-wc/testing';
import { DataTestHelper } from './DataTestHelper.js';
import { ImportNormalize } from '../../src/lib/ImportNormalize.js';
import { ImportFactory } from '../../src/lib/ImportFactory.js';
import { MockedStore } from '../../index.js';

describe('Postman data import v2', () => {
  const store = new MockedStore();

  describe('Postman import to datastore - v2', () => {
    let originalData;
    let data;
    before(async () => {
      const response = await DataTestHelper.getFile('postman/collection-v2.json')
      originalData = JSON.parse(response);
    });

    after(async () => {
      await store.destroySaved();
    });

    beforeEach(async () => {
      data = store.clone(originalData);
    });

    it('stores the data', async () => {
      const normalizer = new ImportNormalize();
      const parsed = await normalizer.normalize(data);
      const factory = new ImportFactory();
      const errors = await factory.importData(parsed);
      assert.isUndefined(errors, 'has no storing errors');
      const requests = await store.getDatastoreRequestData();
      assert.lengthOf(requests, 5, 'has 5 requests');
      const projects = await store.getDatastoreProjectsData();
      assert.lengthOf(projects, 1, 'has 1 project');
    });

    it('overrides all data', async () => {
      const normalizer = new ImportNormalize();
      const parsed = await normalizer.normalize(data);
      const factory = new ImportFactory();
      const errors = await factory.importData(parsed);
      assert.isUndefined(errors, 'has no storing errors');
      const requests = await store.getDatastoreRequestData();
      assert.lengthOf(requests, 5, 'has 5 requests');
      const projects = await store.getDatastoreProjectsData();
      assert.lengthOf(projects, 1, 'has 1 project');
    });
  });
});
