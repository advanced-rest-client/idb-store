import { assert } from '@open-wc/testing';
import { DataTestHelper } from './DataTestHelper.js';
import { ImportNormalize } from '../../src/lib/ImportNormalize.js';
import { ImportFactory } from '../../src/lib/ImportFactory.js';
import { MockedStore } from '../../index.js';

describe('PouchDB import to datastore', () => {
  const store = new MockedStore();

  let originalData;
  let data;
  before(async () => {
    const response = await DataTestHelper.getFile('pouch-data-export.json');
    originalData = JSON.parse(response);
  });

  describe('storing data', () => {
    beforeEach(async () => {
      data = store.clone(originalData);
      const normalizer = new ImportNormalize();
      const parsed = await normalizer.normalize(data);
      const factory = new ImportFactory();
      const errors = await factory.importData(parsed);
      assert.isUndefined(errors, 'No errors while importing');
    });

    afterEach(() => store.destroyAll());

    it('stores saved request data', async () => {
      const result = await store.getDatastoreRequestData();
      assert.lengthOf(result, 5, 'Has 5 requests');
    });

    it('stores projects data', async () => {
      const result = await store.getDatastoreProjectsData();
      assert.lengthOf(result, 2, 'Has 2 projects');
    });

    it('stores variables data', async () => {
      const result = await store.getDatastoreVariablesData();
      assert.lengthOf(result, 4, 'Has 4 variables');
    });

    it('stores environments data', async () => {
      const result = await store.getDatastoreEnvironmentsData();
      assert.lengthOf(result, 2, 'Has 2 environments');
    });

    it('stores history request data', async () => {
      const result = await store.getDatastoreHistoryData();
      assert.lengthOf(result, 3, 'Has 3 history');
    });

    it('stores cookies data', async () => {
      const result = await store.getDatastoreCookiesData();
      assert.lengthOf(result, 2, 'Has 2 cookies');
    });

    it('stores websocket url data', async () => {
      const result = await store.getDatastoreWebsocketsData();
      assert.lengthOf(result, 1, 'Has 1 WS history');
    });

    it('stores url history data', async () => {
      const result = await store.getDatastoreUrlsData();
      assert.lengthOf(result, 5, 'Has 5 URL history');
    });

    it('stores auth data', async () => {
      const result = await store.getDatastoreAuthData();
      assert.lengthOf(result, 1, 'Has 1 auth data');
    });

    it('stores host rules data', async () => {
      const result = await store.getDatastoreHostRulesData();
      assert.lengthOf(result, 1, 'Has 1 host rule');
      assert.equal(result[0]._id, 'host-rule');
    });

    it('stores client certificates', async () => {
      const [indexes, certs] = await store.getDatastoreClientCertificates();
      assert.lengthOf(indexes, 1, 'has 1 certificate index document');
      assert.lengthOf(certs, 1, 'has 1 certificate data document');
    });
  });

  describe('overriding data', () => {
    after(() => store.destroyAll());

    before(async () => {
      data = store.clone(originalData);
      const normalizer = new ImportNormalize();
      const parsed = await normalizer.normalize(data);
      const factory = new ImportFactory();
      const errors = await factory.importData(parsed);
      assert.isUndefined(errors, 'No errors while importing');
      const parsed2 = await normalizer.normalize(store.clone(originalData));
      const errors2 = await factory.importData(parsed2);
      assert.isUndefined(errors2, 'No errors while importing again');
    });

    it('stores variables data', async () => {
      const result = await store.getDatastoreVariablesData();
      // variables in the old system have no keys
      assert.lengthOf(result, 8, 'Has 8 variables');
    });

    it('stores saved request data', async () => {
      const result = await store.getDatastoreRequestData();
      // 1 request is in a project in the test data
      // and this import is missing project ID so it generates IDs again
      // so together it should give 2 from previous import + 1 new
      assert.lengthOf(result, 5, 'Has 5 requests');
    });

    it('stores projects data', async () => {
      const result = await store.getDatastoreProjectsData();
      assert.lengthOf(result, 4, 'Has 4 projects');
    });

    it('stores environments data', async () => {
      const result = await store.getDatastoreEnvironmentsData();
      assert.lengthOf(result, 2, 'Has 2 environments');
    });

    it('stores client certificates', async () => {
      const [indexes, certs] = await store.getDatastoreClientCertificates();
      assert.lengthOf(indexes, 1, 'has 1 certificate index document');
      assert.lengthOf(certs, 1, 'has 1 certificate data document');
    });
  });
});
