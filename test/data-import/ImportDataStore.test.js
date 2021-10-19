import { assert } from '@open-wc/testing';
import { ArcMock } from '@advanced-rest-client/arc-mock';
import { ImportFactory, transformKeys } from '../../src/lib/ImportFactory.js';
import { MockedStore } from '../../index.js';

/* global PouchDB */

/** @typedef {import('@advanced-rest-client/events').ArcRequest.ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('@advanced-rest-client/events').Project.ARCProject} ARCProject */
/** @typedef {import('@advanced-rest-client/events').UrlHistory.ARCWebsocketUrlHistory} ARCWebsocketUrlHistory */
/** @typedef {import('@advanced-rest-client/events').UrlHistory.ARCUrlHistory} ARCUrlHistory */
/** @typedef {import('@advanced-rest-client/events').AuthData.ARCAuthData} ARCAuthData */
/** @typedef {import('@advanced-rest-client/events').HostRule.ARCHostRule} ARCHostRule */
/** @typedef {import('@advanced-rest-client/events').Variable.ARCVariable} ARCVariable */

describe('ImportDataStore', () => {
  const generator = new ArcMock();
  const store = new MockedStore();

  describe('transformKeys()', () => {
    it('deletes "kind" property', () => {
      const item = {
        kind: 'test',
      };
      const result = transformKeys([item]);
      assert.isUndefined(result[0].kind);
    });

    it('generates "_id" property', () => {
      const item = {};
      const result = transformKeys([item]);
      assert.typeOf(result[0]._id, 'string');
    });

    it('copies "key" property', () => {
      const item = {
        key: 'test-id'
      };
      const result = transformKeys([item]);
      assert.equal(result[0]._id, 'test-id', 'key is copied');
      assert.isUndefined(result[0].key);
    });
  });

  describe('#importRequests()', () => {
    afterEach(async () => {
      await store.destroySaved();
    });

    function genExportItem() {
      const request = /** @type ARCSavedRequest */ (generator.http.saved());
      const exportItem = { ...request, kind: 'ARC#HttpRequest', key: request._id };
      delete exportItem._id;
      return exportItem;
    }

    it('stores the requests data', async () => {
      const item = genExportItem();
      const factory = new ImportFactory();
      const result = await factory.importRequests([item]);
      assert.isUndefined(result, 'Has no error messages');
      const stored = await store.getDatastoreRequestData();
      assert.lengthOf(stored, 1, 'has the request in the store');
      assert.equal(stored[0]._id, item.key, 'request has the id');
    });

    it('sets "savedIndexes"', async () => {
      const item = genExportItem();
      const result = new ImportFactory();
      await result.importRequests([item]);
      assert.lengthOf(result.savedIndexes, 1);
    });

    it('handles conflicts', async () => {
      const request = /** @type ARCSavedRequest */ (generator.http.saved());
      const exportItem = { ...request, kind: 'ARC#HttpRequest', key: request._id };
      delete exportItem._id;
      const db = new PouchDB('saved-requests');
      const { rev } = await db.put(request);
      request.name = 'test-item';
      request._rev = rev;
      await db.put(request);

      const result = new ImportFactory();
      await result.importRequests([exportItem]);
      const stored = await store.getDatastoreRequestData();
      assert.notEqual(stored[0].name, 'test-item', 'has export request name');
    });
  });

  describe('#importHistory()', () => {
    afterEach(async () => {
      await store.destroyHistory();
    });

    function genExportItem() {
      const request = generator.http.history();
      const exportItem = { ...request, kind: 'ARC#HistoryData', key: request._id };
      delete exportItem._id;
      return exportItem;
    }

    it('stores the requests data', async () => {
      const item = genExportItem();
      const factory = new ImportFactory();
      const result = await factory.importHistory([item]);
      assert.isUndefined(result, 'Has no error messages');
      const stored = await store.getDatastoreHistoryData();
      assert.lengthOf(stored, 1, 'has the request in the store');
      assert.equal(stored[0]._id, item.key, 'request has the id');
    });

    it('sets "historyIndexes"', async () => {
      const item = genExportItem();
      const factory = new ImportFactory();
      await factory.importHistory([item]);
      assert.lengthOf(factory.historyIndexes, 1);
    });

    it('handles conflicts', async () => {
      const request = generator.http.history();
      const exportItem = { ...request, kind: 'ARC#HistoryData', key: request._id };
      delete exportItem._id;
      const db = new PouchDB('history-requests');
      const { rev } = await db.put(request);
      request.url = 'test-item';
      request._rev = rev;
      await db.put(request);

      const factory = new ImportFactory();
      await factory.importHistory([exportItem]);
      const stored = await store.getDatastoreHistoryData();
      assert.notEqual(stored[0].url, 'test-item', 'has export value');
    });
  });

  describe('#importProjects()', () => {
    afterEach(async () => {
      await store.destroySaved();
    });

    function genExportItem() {
      const item = generator.http.project();
      const exportItem = { ...item, kind: 'ARC#ProjectData', key: item._id };
      delete exportItem._id;
      return exportItem;
    }

    it('stores the data', async () => {
      const item = genExportItem();
      const factory = new ImportFactory();
      const result = await factory.importProjects([item]);
      assert.isUndefined(result, 'Has no error messages');
      const stored = await store.getDatastoreProjectsData();
      assert.lengthOf(stored, 1, 'has the data in the store');
      assert.equal(stored[0]._id, item.key, 'object has the id');
    });

    it('handles conflicts', async () => {
      const item = generator.http.project();
      const exportItem = { ...item, kind: 'ARC#ProjectData', key: item._id };
      delete exportItem._id;
      const db = new PouchDB('legacy-projects');
      const { rev } = await db.put(item);
      item.name = 'test-item';
      item._rev = rev;
      await db.put(item);

      const factory = new ImportFactory();
      await factory.importProjects([exportItem]);
      const stored = await store.getDatastoreProjectsData();
      assert.notEqual(stored[0].name, 'test-item', 'has export request name');
    });
  });

  describe('#importWebsocketUrls()', () => {
    afterEach(async () => {
      await store.destroyWebsockets();
    });

    function genExportItem() {
      const item = generator.urls.url();
      const exportItem = { ...item, kind: 'ARC#WebsocketHistoryData', key: item._id };
      delete exportItem._id;
      return exportItem;
    }

    it('stores the data', async () => {
      const item = genExportItem();
      const factory = new ImportFactory();
      const result = await factory.importWebsocketUrls([item]);
      assert.isUndefined(result, 'Has no error messages');
      const stored = await store.getDatastoreWebsocketsData();
      assert.lengthOf(stored, 1, 'has the data in the store');
      assert.equal(stored[0]._id, item.key, 'object has the id');
    });

    it('handles conflicts', async () => {
      const item = generator.urls.url();
      const exportItem = { ...item, kind: 'ARC#WebsocketHistoryData', key: item._id };
      delete exportItem._id;
      const db = new PouchDB('websocket-url-history');
      const { rev } = await db.put(item);
      item.url = 'test-item';
      item._rev = rev;
      await db.put(item);

      const factory = new ImportFactory();
      await factory.importWebsocketUrls([exportItem]);

      const stored = await store.getDatastoreWebsocketsData();
      assert.notEqual(stored[0].url, 'test-item', 'has export request name');
    });
  });

  describe('#importUrls()', () => {
    afterEach(async () => {
      await store.destroyUrlHistory();
    });

    function genExportItem() {
      const item = generator.urls.url();
      const exportItem = { ...item, kind: 'ARC#UrlHistoryData', key: item._id };
      delete exportItem._id;
      return exportItem;
    }

    it('stores the data', async () => {
      const item = genExportItem();
      const factory = new ImportFactory();
      const result = await factory.importUrls([item]);
      assert.isUndefined(result, 'Has no error messages');
      const stored = await store.getDatastoreUrlsData();
      assert.lengthOf(stored, 1, 'has the data in the store');
      assert.equal(stored[0]._id, item.key, 'object has the id');
    });

    it('handles conflicts', async () => {
      const item = generator.urls.url();
      const exportItem = { ...item, kind: 'ARC#UrlHistoryData', key: item._id };
      delete exportItem._id;
      const db = new PouchDB('url-history');
      const { rev } = await db.put(item);
      item.url = 'test-item';
      item._rev = rev;
      await db.put(item);

      const factory = new ImportFactory();
      await factory.importUrls([exportItem]);

      const stored = await store.getDatastoreUrlsData();
      assert.notEqual(stored[0].url, 'test-item', 'has export value');
    });
  });

  describe('#importAuthData()', () => {
    afterEach(async () => {
      await store.destroyBasicAuth();
    });

    function genExportItem() {
      const item = generator.authorization.basic();
      const exportItem = { ...item, kind: 'ARC#AuthData', key: item._id };
      delete exportItem._id;
      return exportItem;
    }

    it('stores the data', async () => {
      const item = genExportItem();
      const factory = new ImportFactory();
      const result = await factory.importAuthData([item]);
      assert.isUndefined(result, 'Has no error messages');
      const stored = await store.getDatastoreAuthData();
      assert.lengthOf(stored, 1, 'has the data in the store');
      assert.equal(stored[0]._id, item.key, 'object has the id');
    });

    it('handles conflicts', async () => {
      const item = generator.authorization.basic();
      const exportItem = { ...item, kind: 'ARC#AuthData', key: item._id };
      delete exportItem._id;
      const db = new PouchDB('auth-data');
      const { rev } = await db.put(item);
      item.username = 'test-item';
      item._rev = rev;
      await db.put(item);

      const factory = new ImportFactory();
      await factory.importAuthData([exportItem]);

      const stored = await store.getDatastoreAuthData();
      assert.notEqual(stored[0].username, 'test-item', 'has export value');
    });
  });

  describe('#importHostRules()', () => {
    afterEach(async () => {
      await store.destroyHostRules();
    });

    function genExportItem() {
      const item = generator.hostRules.rule();
      const exportItem = { ...item, kind: 'ARC#HostRule', key: item._id };
      delete exportItem._id;
      return exportItem;
    }

    it('stores the data', async () => {
      const item = genExportItem();
      const factory = new ImportFactory();
      const result = await factory.importHostRules([item]);
      assert.isUndefined(result, 'Has no error messages');
      const stored = await store.getDatastoreHostRulesData();
      assert.lengthOf(stored, 1, 'has the data in the store');
      assert.equal(stored[0]._id, item.key, 'object has the id');
    });

    it('handles conflicts', async () => {
      const item = generator.hostRules.rule();
      const exportItem = { ...item, kind: 'ARC#HostRule', key: item._id };
      delete exportItem._id;
      const db = new PouchDB('host-rules');
      const { rev } = await db.put(item);
      item.from = 'test-item';
      item._rev = rev;
      await db.put(item);

      const factory = new ImportFactory();
      await factory.importHostRules([exportItem]);

      const stored = await store.getDatastoreHostRulesData();
      assert.notEqual(stored[0].from, 'test-item', 'has export value');
    });
  });

  describe('#importVariables()', () => {
    afterEach(async () => {
      await store.destroyVariables();
    });

    function genExportItem() {
      const item = generator.variables.variable();
      const exportItem = { ...item, kind: 'ARC#Variable', key: item._id };
      delete exportItem._id;
      return exportItem;
    }

    it('stores the data', async () => {
      const item = genExportItem();
      const factory = new ImportFactory();
      const result = await factory.importVariables([item]);
      assert.isUndefined(result, 'Has no error messages');
      const stored = await store.getDatastoreVariablesData();
      assert.lengthOf(stored, 1, 'has the data in the store');
      assert.equal(stored[0]._id, item.key, 'object has the id');
    });

    it('handles conflicts', async () => {
      const item = generator.variables.variable();
      const exportItem = { ...item, kind: 'ARC#Variable', key: item._id };
      delete exportItem._id;
      const db = new PouchDB('variables');
      const { rev } = await db.put(item);
      item.value = 'test-item';
      item._rev = rev;
      await db.put(item);

      const factory = new ImportFactory();
      await factory.importVariables([exportItem]);

      const stored = await store.getDatastoreVariablesData();
      assert.notEqual(stored[0].value, 'test-item', 'has export value');
    });
  });
});
