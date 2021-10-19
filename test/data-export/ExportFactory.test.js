import { assert } from '@open-wc/testing';
import { ArcMock } from '@advanced-rest-client/arc-mock';
import { ExportFactory } from '../../src/lib/ExportFactory.js';
import { MockedStore } from '../../index.js'

/* global PouchDB */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ARCHistoryRequest} ARCHistoryRequest */

describe('ExportFactory', () => {
  const generator = new ArcMock();
  const store = new MockedStore();

  describe('getExportData()', () => {
    function getData(result, dataName) {
      const item = result.find(({ key }) => key === dataName);
      return item ? item.data : null;
    }

    describe('Request data', () => {
      before(async () => {
        await store.insertSaved(100, 50, {
          forceProject: true,
        });
      });

      after(async () => {
        await store.destroySaved();
      });

      let factory = /** @type ExportFactory */ (null);
      beforeEach(() => {
        factory = new ExportFactory();
      });

      it('has "requests" object in the response', async () => {
        const result = await factory.getExportData({
          requests: true,
        });
        const requests = getData(result, 'requests');
        assert.typeOf(requests, 'array', 'has array of requests');
        assert.lengthOf(requests, 100, 'has all requests');
      });

      it('adds "projects" automatically', async () => {
        const result = await factory.getExportData({
          requests: true,
        });
        const projects = getData(result, 'projects');
        assert.typeOf(projects, 'array', 'has array of requests');
        assert.lengthOf(projects, 50, 'has all projects');
      });

      it('has ARCRequest properties on a request entity', async () => {
        const result = await factory.getExportData({
          requests: true,
        });
        const requests = getData(result, 'requests');
        const [request] = requests;
        assert.typeOf(request._id, 'string', 'has the _id');
        assert.typeOf(request._rev, 'string', 'has the _rev');
        assert.typeOf(request.name, 'string', 'has the name');
        assert.typeOf(request.url, 'string', 'has the url');
      });

      it('has ARCProject properties on a request entity', async () => {
        const result = await factory.getExportData({
          requests: true,
        });
        const projects = getData(result, 'projects');
        const [project] = projects;
        assert.typeOf(project._id, 'string', 'has the _id');
        assert.typeOf(project._rev, 'string', 'has the _rev');
        assert.typeOf(project.name, 'string', 'has the name');
      });

      it('transforms legacy authorization to new authorization object', async () => {
        const db = new PouchDB('saved-requests');
        const response = await db.allDocs({
          include_docs: true,
          limit: 1,
        });
        const request = /** @type ARCSavedRequest */ (response.rows[0].doc);
        const id = request._id;
        // @ts-ignore
        request.authType = 'client certificate';
        // @ts-ignore
        request.auth = { id: 'some-id' };
        await db.put(request);
        const result = await factory.getExportData({
          requests: true,
        });
        const requests = getData(result, 'requests');
        const item = requests.find((r) => r._id, id);
        assert.isUndefined(item.authType, 'authType is removed');
        assert.isUndefined(item.auth, 'auth is removed');
        assert.typeOf(item.authorization, 'array', 'authorization is set');
      });
    });

    describe('Projects data', () => {
      before(async () => {
        await store.insertProjects(100);
      });

      after(async () => {
        await store.clearLegacyProjects();
      });

      let factory = /** @type ExportFactory */ (null);
      beforeEach(() => {
        factory = new ExportFactory();
      });

      it('has "projects" object in the response', async () => {
        const result = await factory.getExportData({
          projects: true,
        });
        const projects = getData(result, 'projects');
        assert.typeOf(projects, 'array', 'has array of projects');
        assert.lengthOf(projects, 100, 'has all requests');
      });

      it('has ARCProject properties on a request entity', async () => {
        const result = await factory.getExportData({
          projects: true,
        });
        const projects = getData(result, 'projects');
        const [project] = projects;
        assert.typeOf(project._id, 'string', 'has the _id');
        assert.typeOf(project._rev, 'string', 'has the _rev');
        assert.typeOf(project.name, 'string', 'has the name');
      });
    });

    describe('History data', () => {
      before(async () => {
        await store.insertHistory(100);
      });

      after(async () => {
        await store.destroyHistory();
      });

      let factory = /** @type ExportFactory */ (null);
      beforeEach(() => {
        factory = new ExportFactory();
      });

      it('has "history" object in the response', async () => {
        const result = await factory.getExportData({
          history: true,
        });
        const history = getData(result, 'history');
        assert.typeOf(history, 'array', 'has an array');
        assert.lengthOf(history, 100, 'has all history');
      });

      it('has ARCHistoryRequest properties on a request entity', async () => {
        const result = await factory.getExportData({
          history: true,
        });
        const history = getData(result, 'history');
        const [item] = history;
        assert.typeOf(item._id, 'string', 'has the _id');
        assert.typeOf(item._rev, 'string', 'has the _rev');
        assert.isUndefined(item.name, 'has no name');
      });

      it('transforms legacy authorization to new authorization object', async () => {
        const db = new PouchDB('history-requests');
        const response = await db.allDocs({
          include_docs: true,
          limit: 1,
        });
        const request = /** @type ARCHistoryRequest */ (response.rows[0].doc);
        const id = request._id;
        // @ts-ignore
        request.authType = 'client certificate';
        // @ts-ignore
        request.auth = { id: 'some-id' };
        await db.put(request);
        const result = await factory.getExportData({
          history: true,
        });
        const requests = getData(result, 'history');
        const item = requests.find((r) => r._id, id);
        assert.isUndefined(item.authType, 'authType is removed');
        assert.isUndefined(item.auth, 'auth is removed');
        assert.typeOf(item.authorization, 'array', 'authorization is set');
      });
    });

    describe('Auth data', () => {
      before(async () => {
        await store.insertBasicAuth(100);
      });

      after(async () => {
        await store.destroyBasicAuth();
      });

      let factory = /** @type ExportFactory */ (null);
      beforeEach(() => {
        factory = new ExportFactory();
      });

      it('has "authdata" object in the response', async () => {
        const result = await factory.getExportData({
          authdata: true,
        });
        const authdata = getData(result, 'authdata');
        assert.typeOf(authdata, 'array', 'has an array');
        assert.lengthOf(authdata, 100, 'has all items');
      });

      it('has ARCAuthData properties', async () => {
        const result = await factory.getExportData({
          authdata: true,
        });
        const authdata = getData(result, 'authdata');
        const [item] = authdata;
        assert.typeOf(item._id, 'string', 'has the _id');
        assert.typeOf(item._rev, 'string', 'has the _rev');
        assert.equal(item.type, 'basic', 'has type property');
      });
    });

    describe('Websocket history data', () => {
      before(async () => {
        await store.insertWebsockets(100);
      });

      after(async () => {
        await store.destroyWebsockets();
      });

      let factory = /** @type ExportFactory */ (null);
      beforeEach(() => {
        factory = new ExportFactory();
      });

      it('has "websocketurlhistory" object in the response', async () => {
        const result = await factory.getExportData({
          websocketurlhistory: true,
        });
        const data = getData(result, 'websocketurlhistory');
        assert.typeOf(data, 'array', 'has an array');
        assert.lengthOf(data, 100, 'has all items');
      });

      it('has entity properties', async () => {
        const result = await factory.getExportData({
          websocketurlhistory: true,
        });
        const authdata = getData(result, 'websocketurlhistory');
        const [item] = authdata;
        assert.typeOf(item._id, 'string', 'has the _id');
        assert.typeOf(item._rev, 'string', 'has the _rev');
        assert.typeOf(item.cnt, 'number', 'has cnt property');
      });
    });

    describe('URL history data', () => {
      before(async () => {
        await store.insertUrlHistory(100);
      });

      after(async () => {
        await store.destroyUrlHistory();
      });

      let factory = /** @type ExportFactory */ (null);
      beforeEach(() => {
        factory = new ExportFactory();
      });

      it('has "urlhistory" object in the response', async () => {
        const result = await factory.getExportData({
          urlhistory: true,
        });
        const data = getData(result, 'urlhistory');
        assert.typeOf(data, 'array', 'has an array');
        assert.lengthOf(data, 100, 'has all items');
      });

      it('has entity properties', async () => {
        const result = await factory.getExportData({
          urlhistory: true,
        });
        const authdata = getData(result, 'urlhistory');
        const [item] = authdata;
        assert.typeOf(item._id, 'string', 'has the _id');
        assert.typeOf(item._rev, 'string', 'has the _rev');
        assert.typeOf(item.cnt, 'number', 'has cnt property');
      });
    });

    describe('Client certificates data', () => {
      before(async () => {
        await store.insertCertificates(100);
      });

      after(async () => {
        await store.destroyClientCertificates();
      });

      let factory = /** @type ExportFactory */ (null);
      beforeEach(() => {
        factory = new ExportFactory();
      });

      it('has "clientcertificates" object in the response', async () => {
        const result = await factory.getExportData({
          clientcertificates: true,
        });
        const data = getData(result, 'clientcertificates');
        assert.typeOf(data, 'array', 'has an array');
        assert.lengthOf(data, 100, 'has all items');
      });

      it('has entity properties', async () => {
        const result = await factory.getExportData({
          clientcertificates: true,
        });
        const data = getData(result, 'clientcertificates');
        const { item, data: certData } = data[0];
        assert.typeOf(item, 'object', 'has the index object');
        assert.typeOf(certData, 'object', 'has the data object');
        assert.typeOf(item._id, 'string', 'has the _id');
        assert.typeOf(item._rev, 'string', 'has the _rev');
        assert.typeOf(certData.cert, 'object', 'has cert property');
      });
    });

    describe('Host rules data', () => {
      before(async () => {
        await store.insertHostRules(100);
      });

      after(async () => {
        await store.destroyHostRules();
      });

      let factory = /** @type ExportFactory */ (null);
      beforeEach(() => {
        factory = new ExportFactory();
      });

      it('has "hostrules" object in the response', async () => {
        const result = await factory.getExportData({
          hostrules: true,
        });
        const data = getData(result, 'hostrules');
        assert.typeOf(data, 'array', 'has an array');
        assert.lengthOf(data, 100, 'has all items');
      });

      it('has entity properties', async () => {
        const result = await factory.getExportData({
          hostrules: true,
        });
        const data = getData(result, 'hostrules');
        const [item] = data;
        assert.typeOf(item, 'object', 'has the index object');
        assert.typeOf(item._id, 'string', 'has the _id');
        assert.typeOf(item._rev, 'string', 'has the _rev');
        assert.typeOf(item.from, 'string', 'has from property');
      });
    });

    describe('Variables data', () => {
      before(async () => {
        await store.insertVariables(100);
      });

      after(async () => {
        await store.destroyVariables();
      });

      let factory = /** @type ExportFactory */ (null);
      beforeEach(() => {
        factory = new ExportFactory();
      });

      it('has "variables" object in the response', async () => {
        const result = await factory.getExportData({
          variables: true,
        });
        const data = getData(result, 'variables');
        assert.typeOf(data, 'array', 'has an array');
        assert.lengthOf(data, 100, 'has all items');
      });

      it('has entity properties', async () => {
        const result = await factory.getExportData({
          variables: true,
        });
        const data = getData(result, 'variables');
        const [item] = data;
        assert.typeOf(item, 'object', 'has the index object');
        assert.typeOf(item._id, 'string', 'has the _id');
        assert.typeOf(item._rev, 'string', 'has the _rev');
        assert.typeOf(item.name, 'string', 'has name property');
      });
    });

    describe('Cookies (via datastore) data', () => {
      before(async () => {
        await store.insertCookies(100);
      });

      after(async () => {
        await store.destroyCookies();
      });

      let factory = /** @type ExportFactory */ (null);
      beforeEach(() => {
        factory = new ExportFactory();
      });

      it('has "cookies" object in the response', async () => {
        const result = await factory.getExportData({
          cookies: true,
        });
        const data = getData(result, 'cookies');
        assert.typeOf(data, 'array', 'has an array');
        assert.lengthOf(data, 100, 'has all items');
      });

      it('has entity properties', async () => {
        const result = await factory.getExportData({
          cookies: true,
        });
        const data = getData(result, 'cookies');
        const [item] = data;
        assert.typeOf(item, 'object', 'has the index object');
        assert.typeOf(item._id, 'string', 'has the _id');
        assert.typeOf(item._rev, 'string', 'has the _rev');
        assert.typeOf(item.expires, 'number', 'has variable property');
      });
    });
  });

  describe('prepareExportData()', () => {
    before(async () => {
      await store.insertCookies(10);
      await store.insertCertificates(10);
      await store.insertUrlHistory(10);
    });

    after(async () => {
      await store.destroyCookies();
      await store.destroyClientCertificates();
      await store.destroyUrlHistory();
    });

    let factory = /** @type ExportFactory */ (null);
    beforeEach(() => {
      factory = new ExportFactory();
    });

    it('processes data url history store data', async () => {
      const data = {
        urlhistory: true,
      };
      const result = await factory.prepareExportData('urlhistory', data);
      assert.equal(result.key, 'urlhistory');
      assert.typeOf(result.data, 'array');
      assert.lengthOf(result.data, 10);
    });

    it('processes cookie data', async () => {
      const data = {
        cookies: true,
      };
      const result = await factory.prepareExportData('cookies', data);
      assert.equal(result.key, 'cookies');
      assert.typeOf(result.data, 'array');
      assert.lengthOf(result.data, 10);
    });

    it('processes client certificates data', async () => {
      const data = {
        clientcertificates: true,
      };
      const result = await factory.prepareExportData('clientcertificates', data);
      assert.equal(result.key, 'clientcertificates');
      assert.typeOf(result.data, 'array');
      assert.lengthOf(result.data, 10);
    });

    it('returns passed values', async () => {
      const value = generator.authorization.basicList(10);
      const data = {
        authdata: value,
      };
      const result = await factory.prepareExportData('authdata', data);
      assert.equal(result.key, 'authdata');
      assert.typeOf(result.data, 'array');
      assert.deepEqual(result.data, value);
    });

    it('ignores wrong values', async () => {
      const data = {
        authdata: false,
      };
      const result = await factory.prepareExportData('authdata', data);
      assert.equal(result.key, 'authdata');
      assert.typeOf(result.data, 'array');
      assert.deepEqual(result.data, []);
    });
  });
});
