/* eslint-disable prefer-arrow-callback */
import { assert, fixture } from '@open-wc/testing';
import sinon from 'sinon';
import { ArcMock } from '@advanced-rest-client/arc-mock';
import {
  DataExportEventTypes,
  SessionCookieEventTypes,
  GoogleDriveEventTypes,
  EncryptionEventTypes,
  ExportEvents,
} from '@advanced-rest-client/events';
import { MockedStore } from '../../index.js';
import { exportFile, exportDrive, encryptData, ArcDataExport } from '../../src/ArcDataExport.js';

/** @typedef {import('@advanced-rest-client/events').Cookies.ARCCookie} ARCCookie */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('@advanced-rest-client/events').ClientCertificate.ARCCertificateIndex} ARCCertificateIndex */

describe('ArcDataExport', () => {
  const generator = new ArcMock();
  const store = new MockedStore();

  async function etFixture() {
    return fixture(`<div></div>`);
  }

  before(async () => {
    await store.destroyAll();
  });

  describe('createExport()', () => {
    const options = { provider: 'file' }; 
    describe('Request data', () => {
      before(async () => {
        await store.insertSaved(100, 50, {
          forceProject: true,
        });
      });

      after(async () => {
        await store.destroySaved();
      });

      let instance = /** @type ArcDataExport */ (null);
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new ArcDataExport(et);
        instance.listen();
      });
  
      afterEach(() => {
        instance.unlisten();
      });

      it('has "requests" object in the response', async () => {
        const result = await instance.createExport({ requests: true, }, options);
        assert.typeOf(result.requests, 'array', 'has array of requests');
        assert.lengthOf(result.requests, 100, 'has all requests');
      });

      it('adds "projects" automatically', async () => {
        const result = await instance.createExport({
          requests: true,
        }, options);
        const { projects } = result;
        assert.typeOf(projects, 'array', 'has array of requests');
        assert.lengthOf(projects, 50, 'has all projects');
      });

      it('has ARCRequest properties on a request entity', async () => {
        const result = await instance.createExport({
          requests: true,
        }, options);
        const saved = result.requests;
        const [request] = saved;
        assert.equal(request.kind, 'ARC#HttpRequest', 'has the kind');
        assert.typeOf(request.key, 'string', 'has the key');
        assert.typeOf(request.name, 'string', 'has the name');
        assert.typeOf(request.url, 'string', 'has the url');
      });

      it('has ARCProject properties on a request entity', async () => {
        const result = await instance.createExport({
          requests: true,
        }, options);
        const { projects } = result;
        const [project] = projects;
        assert.equal(project.kind, 'ARC#ProjectData', 'has the kind');
        assert.typeOf(project.key, 'string', 'has the key');
        assert.typeOf(project.name, 'string', 'has the name');
      });
    });

    describe('Projects data', () => {
      before(async () => {
        await store.insertProjects(100);
      });

      after(async () => {
        await store.clearLegacyProjects();
      });

      let instance = /** @type ArcDataExport */ (null);
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new ArcDataExport(et);
        instance.listen();
      });
  
      afterEach(() => {
        instance.unlisten();
      });

      it('has "projects" object in the response', async () => {
        const result = await instance.createExport({
          projects: true,
        }, options);
        const { projects } = result;
        assert.typeOf(projects, 'array', 'has array of projects');
        assert.lengthOf(projects, 100, 'has all requests');
      });

      it('has ARCProject properties on a request entity', async () => {
        const result = await instance.createExport({
          projects: true,
        }, options);
        const { projects } = result;
        const [project] = projects;
        assert.equal(project.kind, 'ARC#ProjectData', 'has the kind');
        assert.typeOf(project.key, 'string', 'has the key');
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

      let instance = /** @type ArcDataExport */ (null);
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new ArcDataExport(et);
        instance.listen();
      });
  
      afterEach(() => {
        instance.unlisten();
      });

      it('has "history" object in the response', async () => {
        const result = await instance.createExport({
          history: true,
        }, options);
        const { history } = result;
        assert.typeOf(history, 'array', 'has an array');
        assert.lengthOf(history, 100, 'has all history');
      });

      it('has ARCHistoryRequest properties on a request entity', async () => {
        const result = await instance.createExport({
          history: true,
        }, options);
        const { history } = result;
        const [item] = history;
        assert.typeOf(item.key, 'string', 'has the key');
        assert.equal(item.kind, 'ARC#HttpRequest', 'has the kind');
        // @ts-ignore
        assert.isUndefined(item.name, 'has no name');
      });
    });

    describe('Auth data', () => {
      before(async () => {
        await store.insertBasicAuth(100);
      });

      after(async () => {
        await store.destroyBasicAuth();
      });

      let instance = /** @type ArcDataExport */ (null);
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new ArcDataExport(et);
        instance.listen();
      });
  
      afterEach(() => {
        instance.unlisten();
      });

      it('has "authdata" object in the response', async () => {
        const result = await instance.createExport({
          authdata: true,
        }, options);
        const { authdata } = result;
        assert.typeOf(authdata, 'array', 'has an array');
        assert.lengthOf(authdata, 100, 'has all items');
      });

      it('has ARCAuthData properties', async () => {
        const result = await instance.createExport({ authdata: true, }, options);
        const { authdata } = result;
        const [item] = authdata;
        assert.typeOf(item.key, 'string', 'has the key');
        assert.equal(item.kind, 'ARC#AuthData');
      });
    });

    describe('Websocket history data', () => {
      before(async () => {
        await store.insertWebsockets(100);
      });

      after(async () => {
        await store.destroyWebsockets();
      });

      let instance = /** @type ArcDataExport */ (null);
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new ArcDataExport(et);
        instance.listen();
      });
  
      afterEach(() => {
        instance.unlisten();
      });

      it('has "websocketurlhistory" object in the response', async () => {
        const result = await instance.createExport({
          websocketurlhistory: true,
        }, options);
        const data = result.websocketurlhistory;
        assert.typeOf(data, 'array', 'has an array');
        assert.lengthOf(data, 100, 'has all items');
      });

      it('has entity properties', async () => {
        const result = await instance.createExport({
          websocketurlhistory: true,
        }, options);
        const data = result.websocketurlhistory;
        const [item] = data;
        assert.typeOf(item.key, 'string', 'has the key');
        assert.equal(item.kind, 'ARC#WebsocketHistoryData', 'has the kind');
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

      let instance = /** @type ArcDataExport */ (null);
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new ArcDataExport(et);
        instance.listen();
      });
  
      afterEach(() => {
        instance.unlisten();
      });

      it('has "urlhistory" object in the response', async () => {
        const result = await instance.createExport({
          urlhistory: true,
        }, options);
        const data = result.urlhistory;
        assert.typeOf(data, 'array', 'has an array');
        assert.lengthOf(data, 100, 'has all items');
      });

      it('has entity properties', async () => {
        const result = await instance.createExport({
          urlhistory: true,
        }, options);
        const data = result.urlhistory;
        const [item] = data;
        assert.typeOf(item.key, 'string', 'has the key');
        assert.equal(item.kind, 'ARC#UrlHistoryData', 'has the kind');
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

      let instance = /** @type ArcDataExport */ (null);
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new ArcDataExport(et);
        instance.listen();
      });
  
      afterEach(() => {
        instance.unlisten();
      });

      it('has "clientcertificates" object in the response', async () => {
        const result = await instance.createExport({
          clientcertificates: true,
        }, options);
        const data = result.clientcertificates;
        assert.typeOf(data, 'array', 'has an array');
        assert.lengthOf(data, 100, 'has all items');
      });

      it('has entity properties', async () => {
        const result = await instance.createExport({
          clientcertificates: true,
        }, options);
        const data = result.clientcertificates;
        const [item] = data;
        assert.typeOf(item, 'object', 'has the cert object');
        assert.typeOf(item.key, 'string', 'has the key');
        assert.equal(item.kind, 'ARC#ClientCertificate', 'has the kind');
        assert.typeOf(item.type, 'string', 'has the type');
        assert.typeOf(item.name, 'string', 'has the name');
        assert.typeOf(item.created, 'number', 'has the created');
        assert.typeOf(item.cert, 'object', 'has the cert');
        assert.typeOf(item.pKey, 'object', 'has the pKey');
      });
    });

    describe('Host rules data', () => {
      before(async () => {
        await store.insertHostRules(100);
      });

      after(async () => {
        await store.destroyHostRules();
      });

      let instance = /** @type ArcDataExport */ (null);
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new ArcDataExport(et);
        instance.listen();
      });
  
      afterEach(() => {
        instance.unlisten();
      });

      it('has "hostrules" object in the response', async () => {
        const result = await instance.createExport({
          hostrules: true,
        }, options);
        const data = result.hostrules;
        assert.typeOf(data, 'array', 'has an array');
        assert.lengthOf(data, 100, 'has all items');
      });

      it('has entity properties', async () => {
        const result = await instance.createExport({
          hostrules: true,
        }, options);
        const data = result.hostrules;
        const [item] = data;
        assert.typeOf(item, 'object', 'has the index object');
        assert.typeOf(item.key, 'string', 'has the key');
        assert.equal(item.kind, 'ARC#HostRule', 'has the kind');
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

      let instance = /** @type ArcDataExport */ (null);
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new ArcDataExport(et);
        instance.listen();
      });
  
      afterEach(() => {
        instance.unlisten();
      });

      it('has "variables" object in the response', async () => {
        const result = await instance.createExport({
          variables: true,
        }, options);
        const data = result.variables;
        assert.typeOf(data, 'array', 'has an array');
        assert.lengthOf(data, 100, 'has all items');
      });

      it('has entity properties', async () => {
        const result = await instance.createExport({
          variables: true,
        }, options);
        const data = result.variables;
        const [item] = data;
        assert.typeOf(item, 'object', 'has the index object');
        assert.typeOf(item.key, 'string', 'has the key');
        assert.equal(item.kind, 'ARC#Variable', 'has the kind');
        assert.typeOf(item.name, 'string', 'has variable property');
      });
    });

    describe('Cookies (via datastore) data', () => {
      before(async () => {
        await store.insertCookies(100);
      });

      after(async () => {
        await store.destroyCookies();
      });

      let instance = /** @type ArcDataExport */ (null);
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new ArcDataExport(et);
        instance.listen();
      });
  
      afterEach(() => {
        instance.unlisten();
      });

      it('has "cookies" object in the response', async () => {
        const result = await instance.createExport({
          cookies: true,
        }, options);
        const data = result.cookies;
        assert.typeOf(data, 'array', 'has an array');
        assert.lengthOf(data, 100, 'has all items');
      });

      it('has entity properties', async () => {
        const result = await instance.createExport({
          cookies: true,
        }, options);
        const data = result.cookies;
        const [item] = data;
        assert.typeOf(item, 'object', 'has the index object');
        assert.typeOf(item.key, 'string', 'has the key');
        assert.equal(item.kind, 'ARC#Cookie', 'has the kind');
        assert.typeOf(item.expires, 'number', 'has variable property');
      });
    });

    describe('Cookies (via electron event) data', () => {
      let instance = /** @type ArcDataExport */ (null);
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new ArcDataExport(et);
        instance.electronCookies = true;
      });

      /**
       * @param {Element} elm 
       */
      function listenCookies(elm) {
        elm.addEventListener(SessionCookieEventTypes.listAll, function f(e) {
          e.preventDefault();
          elm.removeEventListener(SessionCookieEventTypes.listAll, f);
          const data = /** @type ARCCookie[] */ (generator.cookies.cookies(10));
          // @ts-ignore
          e.detail.result = Promise.resolve(data);
        });
      }

      it('has "cookies" object in the response', async () => {
        listenCookies(et);
        const result = await instance.createExport({
          cookies: true,
        }, options);
        const data = result.cookies;
        assert.typeOf(data, 'array', 'has an array');
        assert.lengthOf(data, 10, 'has all items');
      });

      it('has entity properties', async () => {
        listenCookies(et);
        const result = await instance.createExport({
          cookies: true,
        }, options);
        const data = result.cookies;
        const [item] = data;
        assert.equal(item.kind, 'ARC#Cookie', 'has the kind');
        assert.typeOf(item, 'object', 'has the index object');
        assert.typeOf(item.domain, 'string', 'has the domain');
      });

      it('silently quits when no session provider', async () => {
        const result = await instance.createExport({
          cookies: true,
        }, options);
        const data = result.cookies;
        assert.lengthOf(data, 0);
      });
    });
  });

  describe('createExportObject()', () => {
    let instance = /** @type ArcDataExport */ (null);
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ArcDataExport(et);
      instance.listen();
    });

    afterEach(() => {
      instance.unlisten();
    });

    it('returns export object', () => {
      const result = instance.createExportObject([], { provider: 'file' });
      assert.typeOf(result, 'object');
    });

    it('has export object properties', () => {
      const result = instance.createExportObject([], { provider: 'file' });
      assert.typeOf(result.createdAt, 'string', 'has createdAt');
      assert.typeOf(result.version, 'string', 'has version');
      assert.typeOf(result.kind, 'string', 'has kind');
    });

    it('uses default kind', () => {
      const result = instance.createExportObject([], { provider: 'file' });
      assert.equal(result.kind, 'ARC#AllDataExport');
    });

    it('uses passed kind', () => {
      const result = instance.createExportObject([], { provider: 'file', kind: 'test-kind' });
      assert.equal(result.kind, 'test-kind');
    });

    it('uses default version', () => {
      const result = instance.createExportObject([], { provider: 'file' });
      assert.equal(result.version, 'Unknown version');
    });

    it('uses app version attribute', () => {
      instance.appVersion = '1.0.0';
      const result = instance.createExportObject([], { provider: 'file' });
      assert.equal(result.version, '1.0.0');
    });
  });

  describe('[exportFile]()', () => {
    let instance = /** @type ArcDataExport */ (null);
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ArcDataExport(et);
    });

    it('dispatches export event', async () => {
      const spy = sinon.spy();
      et.addEventListener(DataExportEventTypes.fileSave, spy);
      et.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await instance[exportFile]('test', { file: 'test' });
      assert.isTrue(spy.called);
    });

    it('adds content type when missing', async () => {
      const spy = sinon.spy();
      et.addEventListener(DataExportEventTypes.fileSave, spy);
      et.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await instance[exportFile]('test', { file: 'test' });
      assert.equal(spy.args[0][0].providerOptions.contentType, 'application/json');
    });

    it('respects added content type', async () => {
      const spy = sinon.spy();
      et.addEventListener(DataExportEventTypes.fileSave, spy);
      et.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await instance[exportFile]('test', { file: 'test', contentType: 'xxxx' });
      assert.equal(spy.args[0][0].providerOptions.contentType, 'xxxx');
    });

    it('has the export data', async () => {
      const spy = sinon.spy();
      et.addEventListener(DataExportEventTypes.fileSave, spy);
      et.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await instance[exportFile]('test-data', { file: 'test' });
      assert.equal(spy.args[0][0].data, 'test-data');
    });

    it('throws when event not handled', async () => {
      let thrown = false;
      try {
        await instance[exportFile]('test', { file: 'test' });
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe('[exportDrive]()', () => {
    let instance = /** @type ArcDataExport */ (null);
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ArcDataExport(et);
    });

    it('dispatches export event', async () => {
      const spy = sinon.spy();
      et.addEventListener(GoogleDriveEventTypes.save, spy);
      et.addEventListener(GoogleDriveEventTypes.save, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await instance[exportDrive]('test', { file: 'test' });
      assert.isTrue(spy.called);
    });

    it('adds content type when missing', async () => {
      const spy = sinon.spy();
      et.addEventListener(GoogleDriveEventTypes.save, spy);
      et.addEventListener(GoogleDriveEventTypes.save, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await instance[exportDrive]('test', { file: 'test' });
      assert.equal(spy.args[0][0].providerOptions.contentType, 'application/restclient+data');
    });

    it('respects added content type', async () => {
      const spy = sinon.spy();
      et.addEventListener(GoogleDriveEventTypes.save, spy);
      et.addEventListener(GoogleDriveEventTypes.save, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await instance[exportDrive]('test', { file: 'test', contentType: 'xxxx' });
      assert.equal(spy.args[0][0].providerOptions.contentType, 'xxxx');
    });

    it('has the export data', async () => {
      const spy = sinon.spy();
      et.addEventListener(GoogleDriveEventTypes.save, spy);
      et.addEventListener(GoogleDriveEventTypes.save, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await instance[exportDrive]('test-data', { file: 'test' });
      assert.equal(spy.args[0][0].data, 'test-data');
    });

    it('throws when event not handled', async () => {
      let thrown = false;
      try {
        await instance[exportDrive]('test', { file: 'test' });
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe('[encryptData]()', () => {
    let instance = /** @type ArcDataExport */ (null);
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ArcDataExport(et);
    });

    it('dispatches encrypt event', async () => {
      const spy = sinon.spy();
      et.addEventListener(EncryptionEventTypes.encrypt, spy);
      et.addEventListener(EncryptionEventTypes.encrypt, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve('encoded');
      });
      await instance[encryptData]('test', 'test');
      assert.isTrue(spy.called);
    });

    it('adds passphrase to the event', async () => {
      const spy = sinon.spy();
      et.addEventListener(EncryptionEventTypes.encrypt, spy);
      et.addEventListener(EncryptionEventTypes.encrypt, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve('encoded');
      });
      await instance[encryptData]('test', 'test-passphrase');
      assert.equal(spy.args[0][0].passphrase, 'test-passphrase');
    });

    it('adds method to the event', async () => {
      const spy = sinon.spy();
      et.addEventListener(EncryptionEventTypes.encrypt, spy);
      et.addEventListener(EncryptionEventTypes.encrypt, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve('encoded');
      });
      await instance[encryptData]('test', 'test-passphrase');
      assert.equal(spy.args[0][0].method, 'aes');
    });

    it('has the export data', async () => {
      const spy = sinon.spy();
      et.addEventListener(EncryptionEventTypes.encrypt, spy);
      et.addEventListener(EncryptionEventTypes.encrypt, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve('encoded');
      });
      await instance[encryptData]('test-data', 'test');
      assert.equal(spy.args[0][0].data, 'test-data');
    });

    it('returns method with encoded data', async () => {
      et.addEventListener(EncryptionEventTypes.encrypt, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve('encoded');
      });
      const result = await instance[encryptData]('test-data', 'test');
      assert.equal(result, 'aes\nencoded');
    });

    it('throws when event not handled', async () => {
      let thrown = false;
      try {
        await instance[encryptData]('test', 'test');
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when event has no passphrase', async () => {
      et.addEventListener(EncryptionEventTypes.encrypt, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve('encoded');
      });
      let thrown = false;
      try {
        await instance[encryptData]('test', undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe('arcExport()', () => {
    before(async () => {
      await store.insertSaved(10, 5, {
        forceProject: true,
      });
      await store.insertHistory(2);
      await store.insertBasicAuth(9);
      await store.insertWebsockets(7);
      await store.insertUrlHistory(1);
      await store.insertCertificates(6);
      await store.insertHostRules(4);
      await store.insertVariables(8);
      await store.insertCookies(12);
    });

    after(async () => {
      await store.destroySaved();
      await store.destroyHistory();
      await store.destroyBasicAuth();
      await store.destroyWebsockets();
      await store.destroyUrlHistory();
      await store.destroyClientCertificates();
      await store.destroyHostRules();
      await store.destroyVariables();
      await store.destroyCookies();
    });

    let instance = /** @type ArcDataExport */ (null);
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ArcDataExport(et);
      instance.listen();
    });

    afterEach(() => {
      instance.unlisten();
    });

    it('throws when event no exportOptions', async () => {
      let message = null;
      try {
        await instance.arcExport({}, undefined, { file: 'test' });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'The "exportOptions" property is not set.');
    });

    it('throws when event no providerOptions', async () => {
      let message = null;
      try {
        await instance.arcExport({}, { provider: 'file' }, undefined);
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'The "providerOptions" property is not set.');
    });

    it('throws when the file provider not found', async () => {
      let message = null;
      try {
        await instance.arcExport({}, { provider: 'file' }, { file: 'test' });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'The file export provider not found.');
    });

    it('throws when Drive provider not found', async () => {
      let message = null;
      try {
        await instance.arcExport({}, { provider: 'drive' }, { file: 'test' });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'The Google Drive export provider not found.');
    });

    it('throws when unknown provider', async () => {
      let message = null;
      try {
        await instance.arcExport({}, { provider: 'other' }, { file: 'test' });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'Unknown export provider other.');
    });

    it('throws when no provider', async () => {
      let message = null;
      try {
        // @ts-ignore
        await instance.arcExport({}, { }, { file: 'test' });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'The "options.provider" property is not set.');
    });

    it('throws when no file', async () => {
      let message = null;
      try {
        // @ts-ignore
        await instance.arcExport({}, { provider: 'other' }, { });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'The "options.file" property is not set.');
    });

    it('dispatches file export event', async () => {
      const spy = sinon.spy();
      et.addEventListener(DataExportEventTypes.fileSave, spy);
      et.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await instance.arcExport({}, { provider: 'file' }, { file: 'test' });
      assert.isTrue(spy.called);
    });

    it('dispatches drive export event', async () => {
      const spy = sinon.spy();
      et.addEventListener(GoogleDriveEventTypes.save, spy);
      et.addEventListener(GoogleDriveEventTypes.save, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await instance.arcExport({}, { provider: 'drive' }, { file: 'test' });
      assert.isTrue(spy.called);
    });

    it('has export data on the event', async () => {
      const spy = sinon.spy();
      et.addEventListener(DataExportEventTypes.fileSave, spy);
      et.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await instance.arcExport({ requests: true, }, { provider: 'file' }, { file: 'test' });
      assert.typeOf(spy.args[0][0].data, 'string');
    });

    it('encrypts the data', async () => {
      const spy = sinon.spy();
      et.addEventListener(DataExportEventTypes.fileSave, spy);
      et.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      et.addEventListener(EncryptionEventTypes.encrypt, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve('encoded');
      });
      await instance.arcExport({ }, { provider: 'file', encrypt: true, passphrase: 'test' }, { file: 'test' });
      assert.equal(spy.args[0][0].data, 'aes\nencoded');
    });

    it('throws when missing a passphrase provider', async () => {
      et.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      et.addEventListener(EncryptionEventTypes.encrypt, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve('encoded');
      });

      let message = null;
      try {
        await instance.arcExport({}, { provider: 'other', encrypt: true, }, { file: 'test' });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'Encryption passphrase needs to be a string.');
    });

    [
      ['requests', 'requests', 'requests', 10],
      ['requests', 'projects', 'projects', 5],
      ['history', 'history', 'history', 2],
      ['websocket', 'websocketurlhistory', 'websocketurlhistory', 7],
      ['url history', 'urlhistory', 'urlhistory', 1],
      ['variables', 'variables', 'variables', 8],
      ['authorization', 'authdata', 'authdata', 9],
      ['client certificates', 'clientcertificates', 'clientcertificates', 6],
      ['host rules', 'hostrules', 'hostrules', 4],
      ['cookies', 'cookies', 'cookies', 12],
    ].forEach(([label, exportName, key, size]) => {
      it(`generates ${label} data`, async () => {
        const spy = sinon.spy();
        et.addEventListener(DataExportEventTypes.fileSave, spy);
        et.addEventListener(DataExportEventTypes.fileSave, function f(e) {
          e.preventDefault();
          // @ts-ignore
          e.detail.result = Promise.resolve({});
        });
        const data = {};
        data[exportName] = true;
        await instance.arcExport(data, { provider: 'file' }, { file: 'test' });
        const value = JSON.parse(spy.args[0][0].data);
        assert.typeOf(value[key], 'array');
        assert.lengthOf(value[key], Number(size));
      });
    });

    it('returns the result from the provider', async () => {
      const response = {
        success: true,
        interrupted: false,
        parentId: '/home/me/Documents',
        fileId: 'export-file.json',
      };
      const spy = sinon.spy();
      et.addEventListener(DataExportEventTypes.fileSave, spy);
      et.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve(response);
      });
      const result = await instance.arcExport({ requests: true, }, { provider: 'file' }, { file: 'test' });
      assert.deepEqual(result, response);
    });

    it('returns the result via the event', async () => {
      const response = {
        success: true,
        interrupted: false,
        parentId: '/home/me/Documents',
        fileId: 'export-file.json',
      };
      window.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        window.removeEventListener(DataExportEventTypes.fileSave, f);
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve(response);
      });
      const result = await ExportEvents.nativeData(et, { requests: true, }, { provider: 'file' }, { file: 'test' });
      assert.deepEqual(result, response);
    });
  });

  describe('dataExport()', () => {
    let instance = /** @type ArcDataExport */ (null);
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ArcDataExport(et);
      instance.listen();
    });

    afterEach(() => {
      instance.unlisten();
    });

    it('throws when event no exportOptions', async () => {
      let message = null;
      try {
        await instance.dataExport({}, undefined, { file: 'test' });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'The "exportOptions" property is not set.');
    });

    it('throws when event no providerOptions', async () => {
      let message = null;
      try {
        await instance.dataExport({}, { provider: 'file' }, undefined);
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'The "providerOptions" property is not set.');
    });

    it('throws when the file provider not found', async () => {
      let message = null;
      try {
        await instance.dataExport({}, { provider: 'file' }, { file: 'test' });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'The file export provider not found.');
    });

    it('throws when Drive provider not found', async () => {
      let message = null;
      try {
        await instance.dataExport({}, { provider: 'drive' }, { file: 'test' });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'The Google Drive export provider not found.');
    });

    it('throws when unknown provider', async () => {
      let message = null;
      try {
        await instance.dataExport({}, { provider: 'other' }, { file: 'test' });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'Unknown export provider other.');
    });

    it('throws when no provider', async () => {
      let message = null;
      try {
        // @ts-ignore
        await instance.dataExport({}, { }, { file: 'test' });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'The "options.provider" property is not set.');
    });

    it('throws when no file', async () => {
      let message = null;
      try {
        // @ts-ignore
        await instance.dataExport({}, { provider: 'other' }, { });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'The "options.file" property is not set.');
    });

    it('dispatches file export event', async () => {
      const spy = sinon.spy();
      et.addEventListener(DataExportEventTypes.fileSave, spy);
      et.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await instance.dataExport('test', { provider: 'file' }, { file: 'test' });
      assert.isTrue(spy.called);
    });

    it('dispatches drive export event', async () => {
      const spy = sinon.spy();
      et.addEventListener(GoogleDriveEventTypes.save, spy);
      et.addEventListener(GoogleDriveEventTypes.save, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await instance.dataExport('test', { provider: 'drive' }, { file: 'test' });
      assert.isTrue(spy.called);
    });

    it('has export data on the event', async () => {
      const spy = sinon.spy();
      et.addEventListener(DataExportEventTypes.fileSave, spy);
      et.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await instance.dataExport('test-data', { provider: 'file' }, { file: 'test' });
      assert.equal(spy.args[0][0].data, 'test-data');
    });

    it('encrypts the data', async () => {
      const spy = sinon.spy();
      et.addEventListener(DataExportEventTypes.fileSave, spy);
      et.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      et.addEventListener(EncryptionEventTypes.encrypt, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve('encoded');
      });
      await instance.dataExport({ }, { provider: 'file', encrypt: true, passphrase: 'test' }, { file: 'test' });
      assert.equal(spy.args[0][0].data, 'aes\nencoded');
    });

    it('throws when missing a passphrase provider', async () => {
      et.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      et.addEventListener(EncryptionEventTypes.encrypt, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve('encoded');
      });

      let message = null;
      try {
        await instance.dataExport({}, { provider: 'other', encrypt: true, }, { file: 'test' });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'Encryption passphrase needs to be a string.');
    });

    it('returns the result from the provider', async () => {
      const response = {
        success: true,
        interrupted: false,
        parentId: '/home/me/Documents',
        fileId: 'export-file.json',
      };
      const spy = sinon.spy();
      et.addEventListener(DataExportEventTypes.fileSave, spy);
      et.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve(response);
      });
      const result = await instance.dataExport({ saved: true, }, { provider: 'file' }, { file: 'test' });
      assert.deepEqual(result, response);
    });

    it('returns the result via the event', async () => {
      const response = {
        success: true,
        interrupted: false,
        parentId: '/home/me/Documents',
        fileId: 'export-file.json',
      };
      window.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        window.removeEventListener(DataExportEventTypes.fileSave, f);
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve(response);
      });
      const result = await ExportEvents.customData(et, 'test', { provider: 'file' }, { file: 'test' });
      assert.deepEqual(result, response);
    });
  });

  describe('Client certificate on the request object', () => {
    let request = /** @type ARCSavedRequest */ (null);
    before(async () => {
      const created = await store.insertSaved(1, 0, {
        forceProject: false,
      });
      [request] = created.requests;
      const ccs = /** @type ARCCertificateIndex[] */ (/** @type unknown */ (await store.insertCertificates(2)));
      const [cc] = ccs;
      
      request.authorization = [{ type: 'client certificate', valid: true, enabled: true, config: { id: cc._id } }];
      await store.updateObject('saved-requests', request);
    });

    after(async () => {
      await store.destroySaved();
      await store.destroyClientCertificates();
    });

    let instance = /** @type ArcDataExport */ (null);
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ArcDataExport(et);
      instance.listen();
    });

    afterEach(() => {
      instance.unlisten();
    });

    it('automatically adds client certificates when request has authorization', async () => {
      const result = await instance.createExport({ requests: true }, { provider: 'file' });
      const certs = result.clientcertificates;
      assert.lengthOf(certs, 1);
    });

    it('adds client certificates when requested', async () => {
      const result = await instance.createExport({ requests: true, clientcertificates: true }, { provider: 'file' });
      const certs = result.clientcertificates;
      assert.lengthOf(certs, 2);
    });
  });

  describe('[nativeExportHandler]()', () => {
    let instance = /** @type ArcDataExport */ (null);
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ArcDataExport(et);
      instance.listen();
    });

    afterEach(() => {
      instance.unlisten();
    });

    it('calls arcExport() with arguments', async () => {
      const spy = sinon.spy(instance, 'arcExport');
      const data = { requests: true };
      const exportOptions = { provider: 'file' };
      const providerOptions = { file: 'test.file' };
      et.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({});
      });
      await ExportEvents.nativeData(et, data, exportOptions, providerOptions);
      assert.isTrue(spy.calledOnce);
      const [expData, exOpts, provOpts] = spy.args[0];
      assert.deepEqual(expData, data, 'data argument is set');
      assert.deepEqual(exOpts, exportOptions, 'exportOptions argument is set');
      assert.deepEqual(provOpts, providerOptions, 'providerOptions argument is set');
    });

    it('does nothing when the event is cancelled', async () => {
      const spy = sinon.spy(instance, 'arcExport');
      const data = { requests: true };
      const exportOptions = { provider: 'file' };
      const providerOptions = { file: 'test.file' };
      const target = document.createElement('span');
      document.body.appendChild(target);
      target.addEventListener(DataExportEventTypes.nativeData, function f(e) {
        e.preventDefault();
      });
      await ExportEvents.nativeData(target, data, exportOptions, providerOptions);
      document.body.removeChild(target);
      assert.isFalse(spy.called);
    });
  });

  describe('[exportHandler]()', () => {
    let instance = /** @type ArcDataExport */ (null);
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ArcDataExport(et);
      instance.listen();
    });

    afterEach(() => {
      instance.unlisten();
    });

    it('calls dataExport() with arguments', async () => {
      const spy = sinon.spy(instance, 'dataExport');
      const data = { test: true };
      const exportOptions = { provider: 'file' };
      const providerOptions = { file: 'test.file' };
      et.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({});
      });
      await ExportEvents.customData(et, data, exportOptions, providerOptions);
      assert.isTrue(spy.calledOnce);
      const [expData, exOpts, provOpts] = spy.args[0];
      assert.deepEqual(expData, data, 'data argument is set');
      assert.deepEqual(exOpts, exportOptions, 'exportOptions argument is set');
      assert.deepEqual(provOpts, providerOptions, 'providerOptions argument is set');
    });

    it('does nothing when the event is cancelled', async () => {
      const spy = sinon.spy(instance, 'dataExport');
      const data = { requests: true };
      const exportOptions = { provider: 'file' };
      const providerOptions = { file: 'test.file' };
      const target = document.createElement('span');
      document.body.appendChild(target);
      target.addEventListener(DataExportEventTypes.customData, function f(e) {
        e.preventDefault();
      });
      await ExportEvents.customData(target, data, exportOptions, providerOptions);
      document.body.removeChild(target);
      assert.isFalse(spy.called);
    });
  });
});
