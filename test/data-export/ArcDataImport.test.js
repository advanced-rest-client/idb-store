/* eslint-disable prefer-arrow-callback */
import { assert, fixture } from '@open-wc/testing';
import sinon from 'sinon';
import { 
  RestApiEventTypes, 
  ProcessEventTypes, 
  WorkspaceEventTypes, 
  DataImportEventTypes, 
  ImportEvents,
  EncryptionEventTypes,
  ArcModelEventTypes,
} from '@advanced-rest-client/events';
import { MockedStore } from '../../index.js'
import { DataHelper } from './DataHelper.js';
import { notifyIndexer, notifyApiParser, decryptIfNeeded, ArcDataImport } from '../../src/ArcDataImport.js';

describe('ArcDataImport', () => {
  const store = new MockedStore();

  async function etFixture() {
    return fixture(`<div></div>`);
  }

  describe('handleNormalizedFileData()', () => {
    /** @type ArcDataImport */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ArcDataImport(et);
      instance.listen();
    });

    afterEach(() => {
      instance.unlisten();
    });

    it('throws when no data', () => {
      assert.throws(() => {
        // @ts-ignore
        instance.handleNormalizedFileData();
      });
    });

    it(`dispatches ${WorkspaceEventTypes.appendRequest} event`, () => {
      const spy = sinon.spy();
      et.addEventListener(WorkspaceEventTypes.appendRequest, spy);
      const request = DataHelper.generateSingleRequestImport();
      instance.handleNormalizedFileData(request);
      assert.isTrue(spy.called);
    });

    it('dispatches workspace append for project with forced open', () => {
      const spy = sinon.spy();
      et.addEventListener(WorkspaceEventTypes.appendExport, spy);
      const data = DataHelper.generateProjectImportOpen();
      instance.handleNormalizedFileData(data);
      assert.isTrue(spy.called, 'the event is called');
      assert.deepEqual(spy.args[0][0].detail.data, data);
    });

    it('removes key and kind properties', () => {
      const spy = sinon.spy();
      et.addEventListener(WorkspaceEventTypes.appendRequest, spy);
      const request = DataHelper.generateSingleRequestImport();
      instance.handleNormalizedFileData(request);
      assert.isUndefined(spy.args[0][0].detail.request.key);
      assert.isUndefined(spy.args[0][0].detail.request.kind);
    });

    it('Sets request _id', () => {
      const spy = sinon.spy();
      et.addEventListener(WorkspaceEventTypes.appendRequest, spy);
      const request = DataHelper.generateSingleRequestImport();
      instance.handleNormalizedFileData(request);
      assert.equal(spy.args[0][0].detail.request._id, '11013905-9b5a-49d9-adc8-f76ec3ead2f1');
    });

    it('Adds driveId', () => {
      const spy = sinon.spy();
      et.addEventListener(WorkspaceEventTypes.appendRequest, spy);
      const request = DataHelper.generateSingleRequestImport();
      instance.handleNormalizedFileData(request, { driveId: 'test' });
      assert.equal(spy.args[0][0].detail.request.driveId, 'test');
    });

    it('Dispatches import data inspect event', () => {
      const spy = sinon.spy();
      et.addEventListener(DataImportEventTypes.inspect, spy);
      const request = DataHelper.generateMultiRequestImport();
      instance.handleNormalizedFileData(request);
      assert.isTrue(spy.called);
      assert.deepEqual(spy.args[0][0].detail.data, request);
    });
  });

  describe('[normalizeHandler]', () => {
    /** @type ArcDataImport */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ArcDataImport(et);
      instance.listen();
    });

    afterEach(() => {
      instance.unlisten();
    });

    it('calls normalizeImportData() with arguments', async () => {
      const spy = sinon.spy(instance, 'normalizeImportData');
      const data = DataHelper.generateArcImportFile();
      await ImportEvents.normalize(et, data);
      assert.isTrue(spy.calledOnce);
      const [expData] = spy.args[0];
      assert.deepEqual(expData, data, 'data argument is set');
    });

    it('throws when no data argument', async () => {
      let thrown = false;
      try {
        await ImportEvents.normalize(et, undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('does nothing when the event is cancelled', async () => {
      const spy = sinon.spy(instance, 'normalizeImportData');
      const data = DataHelper.generateArcImportFile();
      instance.unlisten();
      instance.eventsTarget = window;
      instance.listen();
      document.body.addEventListener(DataImportEventTypes.normalize, function f(e) {
        e.preventDefault();
      });
      await ImportEvents.normalize(document.body, data);
      assert.isFalse(spy.called);
    });
  });

  describe('[importHandler]', () => {
    /** @type ArcDataImport */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ArcDataImport(et);
      instance.listen();
    });

    afterEach(() => {
      instance.unlisten();
    });

    after(async () => {
      await store.destroyAll();
    });

    it('calls storeData() with arguments', async () => {
      const spy = sinon.spy(instance, 'storeData');
      const data = DataHelper.generateMultiRequestImport();
      await ImportEvents.dataImport(et, data);
      assert.isTrue(spy.calledOnce);
      const [expData] = spy.args[0];
      assert.deepEqual(expData, data, 'data argument is set');
    });

    it('throws when no data argument', async () => {
      let thrown = false;
      try {
        await ImportEvents.dataImport(et, undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('does nothing when the event is cancelled', async () => {
      const spy = sinon.spy(instance, 'storeData');
      const data = DataHelper.generateMultiRequestImport();
      instance.unlisten();
      instance.eventsTarget = window;
      instance.listen();
      document.body.addEventListener(DataImportEventTypes.dataImport, function f(e) {
        e.preventDefault();
      });
      await ImportEvents.dataImport(document.body, data);
      assert.isFalse(spy.called);
    });
  });

  describe('[processFileHandler]', () => {
    /** @type ArcDataImport */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ArcDataImport(et);
      instance.listen();
    });

    afterEach(() => {
      instance.unlisten();
    });

    it('calls processFileData() with arguments', async () => {
      const spy = sinon.spy(instance, 'processFileData');
      const data = DataHelper.generateArcImportFile();
      await ImportEvents.processFile(et, data);
      assert.isTrue(spy.calledOnce);
      const [expData] = spy.args[0];
      assert.deepEqual(expData, data, 'data argument is set');
    });

    it('throws when no data argument', async () => {
      let thrown = false;
      try {
        await ImportEvents.processFile(et, undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('does nothing when the event is cancelled', async () => {
      const spy = sinon.spy(instance, 'processFileData');
      const data = DataHelper.generateArcImportFile();
      instance.unlisten();
      instance.eventsTarget = window;
      instance.listen();
      document.body.addEventListener(DataImportEventTypes.processFile, function f(e) {
        e.preventDefault();
      });
      await ImportEvents.processFile(document.body, data);
      assert.isFalse(spy.called);
    });
  });

  describe('[processDataHandler]', () => {
    /** @type ArcDataImport */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ArcDataImport(et);
      instance.listen();
    });

    afterEach(() => {
      instance.unlisten();
    });

    it('calls processFileData() with arguments', async () => {
      const spy = sinon.spy(instance, 'processData');
      const data = DataHelper.generateMultiRequestImport();
      await ImportEvents.processData(et, data);
      assert.isTrue(spy.calledOnce);
      const [expData] = spy.args[0];
      assert.deepEqual(expData, data, 'data argument is set');
    });

    it('throws when no data argument', async () => {
      let thrown = false;
      try {
        await ImportEvents.processData(et, undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('does nothing when the event is cancelled', async () => {
      const spy = sinon.spy(instance, 'processData');
      const data = DataHelper.generateMultiRequestImport();
      instance.unlisten();
      instance.eventsTarget = window;
      instance.listen();
      document.body.addEventListener(DataImportEventTypes.processData, function f(e) {
        e.preventDefault();
      });
      await ImportEvents.processData(document.body, data);
      assert.isFalse(spy.called);
    });
  });

  describe('processData()', () => {
    /** @type ArcDataImport */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ArcDataImport(et);
      instance.listen();
    });

    afterEach(() => {
      instance.unlisten();
    });

    it('calls normalizeImportData() with the argument', async () => {
      const spy = sinon.spy(instance, 'normalizeImportData');
      const data = DataHelper.generateArcImportFile();
      await instance.processData(data);
      assert.isTrue(spy.calledOnce);
      const [expData] = spy.args[0];
      assert.deepEqual(expData, data, 'data argument is set');
    });

    it('calls handleNormalizedFileData() with normalized data', async () => {
      const spy = sinon.spy(instance, 'handleNormalizedFileData');
      const data = DataHelper.generateArcImportFile();
      await instance.processData(data);
      assert.isTrue(spy.calledOnce);
      const [argData] = spy.args[0];
      assert.equal(argData.kind, 'ARC#Import');
    });
  });

  describe('storeData()', () => {
    /** @type ArcDataImport */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ArcDataImport(et);
      instance.listen();
    });

    afterEach(() => {
      instance.unlisten();
    });

    after(async () => {
      await store.destroyAll();
    });

    it('throws when no argument', async () => {
      let thrown = false;
      try {
        await instance.storeData(undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when not a normalized import', async () => {
      let thrown = false;
      try {
        // @ts-ignore
        await instance.storeData({});
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('imports data into the store', async () => {
      const object = DataHelper.generateMultiRequestImport();
      await instance.storeData(object);
      const imported = await store.getDatastoreRequestData();
      const r1 = imported.find((i) => i._id === '11013905-9b5a-49d9-adc8-f76ec3ead2f1');
      const r2 = imported.find((i) => i._id === '20013905-9b5a-49d9-adc8-f76ec3ead2f1');
      
      assert.ok(r1);
      assert.ok(r2);
    });

    it('calls [notifyIndexer]', async () => {
      const spy = sinon.spy(instance, notifyIndexer);
      const object = DataHelper.generateMultiRequestImport();
      await instance.storeData(object);
      assert.isTrue(spy.calledOnce);
    });

    it(`dispatches ${DataImportEventTypes.dataImported} event`, async () => {
      const spy = sinon.spy();
      et.addEventListener(DataImportEventTypes.dataImported, spy);
      const object = DataHelper.generateMultiRequestImport();
      await instance.storeData(object);
      assert.isTrue(spy.calledOnce);
    });
  });

  describe('[notifyIndexer]()', () => {
    let saved;
    let history;
    /** @type ArcDataImport */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ArcDataImport(et);
      instance.listen();
      saved = [{ id: 1, type: 'saved', url: 'https://domain.com' }];
      history = [{ id: 2, type: 'history', url: 'https://api.com' }];
    });

    afterEach(() => {
      instance.unlisten();
    });

    it('Dispatches the event', () => {
      const spy = sinon.spy();
      et.addEventListener(ArcModelEventTypes.UrlIndexer.update, spy);
      instance[notifyIndexer](saved, history);
      assert.isTrue(spy.called);
    });

    it('passes "saved" indexes only', () => {
      const spy = sinon.spy();
      et.addEventListener(ArcModelEventTypes.UrlIndexer.update, spy);
      instance[notifyIndexer](saved, []);
      const data = spy.args[0][0].requests;
      assert.typeOf(data, 'array');
      assert.lengthOf(data, 1);
    });

    it('Passes "history" indexes only', () => {
      const spy = sinon.spy();
      et.addEventListener(ArcModelEventTypes.UrlIndexer.update, spy);
      instance[notifyIndexer](undefined, history);
      const data = spy.args[0][0].requests;
      assert.typeOf(data, 'array');
      assert.lengthOf(data, 1);
    });

    it('Event is not dispatched when no indexes', () => {
      const spy = sinon.spy();
      et.addEventListener(ArcModelEventTypes.UrlIndexer.update, spy);
      instance[notifyIndexer]([], []);
      assert.isFalse(spy.called);
    });
  });

  describe('normalizeImportData()', () => {
    /** @type ArcDataImport */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ArcDataImport(et);
      instance.listen();
    });

    afterEach(() => {
      instance.unlisten();
    });

    after(async () => {
      await store.destroyAll();
    });

    it('normalizes import object', async () => {
      const postmanData = await DataHelper.getFile('postman/postman-data.json');
      const result = await instance.normalizeImportData(postmanData);
      assert.equal(result.version, 'postman-backup');
      assert.equal(result.kind, 'ARC#Import');
    });

    it('handles file object', async () => {
      const data = DataHelper.generateArcImportFile();
      const result = await instance.normalizeImportData(data);
      assert.equal(result.version, 'unknown');
      assert.equal(result.kind, 'ARC#Import');
    });

    it('calls [decryptIfNeeded] on text content', async () => {
      const spy = sinon.spy(instance, decryptIfNeeded);
      const data = DataHelper.generateArcImportFile();
      await instance.normalizeImportData(data);
      assert.isTrue(spy.calledOnce);
    });

    it('does not call [decryptIfNeeded] on object content', async () => {
      const spy = sinon.spy(instance, decryptIfNeeded);
      const data = DataHelper.generateMultiRequestImport();
      await instance.normalizeImportData(data);
      assert.isFalse(spy.called);
    });
  });

  describe('processFileData()', () => {
    /** @type ArcDataImport */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ArcDataImport(et);
      instance.listen();
    });

    afterEach(() => {
      instance.unlisten();
    });

    function apiParserHandler(e) {
      e.preventDefault();
      e.detail.result = Promise.resolve({ api: true });
    }

    function apiParserErrorHandler(e) {
      e.preventDefault();
      e.detail.result = Promise.reject(new Error('test-error'));
    }

    afterEach(() => {
      window.removeEventListener(RestApiEventTypes.processFile, apiParserHandler);
      window.removeEventListener(RestApiEventTypes.processFile, apiParserErrorHandler);
    });

    [
      'application/zip', 'application/yaml', 'application/x-yaml',
      'application/raml', 'application/x-raml', 'application/x-zip-compressed'
    ].forEach((type) => {
      it(`Calls [notifyApiParser]() for file type ${type}`, () => {
        const file = /** @type File */ ({ type });
        window.addEventListener(RestApiEventTypes.processFile, apiParserHandler);
        const spy = sinon.spy(instance, notifyApiParser);
        instance.processFileData(file);
        assert.isTrue(spy.called);
        assert.deepEqual(spy.args[0][0], file);
      });
    });

    [
      'api.raml', 'api.yaml', 'project.zip'
    ].forEach((name) => {
      it(`Calls [notifyApiParser]() for file with extension ${name}`, () => {
        const file = /** @type File */ ({ type: '', name });
        window.addEventListener(RestApiEventTypes.processFile, apiParserHandler);
        const spy = sinon.spy(instance, notifyApiParser);
        instance.processFileData(file);
        assert.isTrue(spy.called);
        assert.deepEqual(spy.args[0][0], file);
      });
    });

    it('returns a promise', () => {
      const file = DataHelper.generateArcImportFile();
      const result = instance.processFileData(file);
      assert.typeOf(result.then, 'function');
      return result;
    });

    it(`dispatches ${ProcessEventTypes.loadingstart} event`, async () => {
      const file = DataHelper.generateArcImportFile();
      const spy = sinon.spy();
      et.addEventListener(ProcessEventTypes.loadingstart, spy);
      await instance.processFileData(file);
      assert.isTrue(spy.called);
      assert.equal(spy.args[0][0].detail.message, 'Processing file data');
    });

    it('calls toString() on Electron buffer', async () => {
      const file = DataHelper.generateElectronBuffer();
      const spy = sinon.spy(file, 'toString');
      await instance.processFileData(file);
      assert.isTrue(spy.called);
    });

    it('calls [notifyApiParser]() for unknown file with RAML spec', async () => {
      const file = DataHelper.generateRamlUnknownFile();
      window.addEventListener(RestApiEventTypes.processFile, apiParserHandler);
      const spy = sinon.spy(instance, notifyApiParser);
      await instance.processFileData(file);
      assert.isTrue(spy.called);
      assert.deepEqual(spy.args[0][0].size, file.size);
    });

    it('Calls [notifyApiParser]() for unknown file with OAS 2 JSON spec', async () => {
      const file = DataHelper.generateOas2JsonUnknownFile();
      window.addEventListener(RestApiEventTypes.processFile, apiParserHandler);
      const spy = sinon.spy(instance, notifyApiParser);
      await instance.processFileData(file);
      assert.isTrue(spy.called);
      assert.deepEqual(spy.args[0][0].size, file.size);
    });

    it('rejects when JSON file is not valid', async () => {
      const file = DataHelper.generateJsonErrorFile();
      let message;
      try {
        await instance.processFileData(file);
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'Unknown file format');
    });

    it('rejects when api processor not in the DOM', async () => {
      const file = DataHelper.generateRamlUnknownFile();
      let message;
      try {
        await instance.processFileData(file);
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'API processor not available');
    });

    it('rejects when api processor error', async () => {
      window.addEventListener(RestApiEventTypes.processFile, apiParserErrorHandler);
      const file = DataHelper.generateRamlUnknownFile();
      let message;
      try {
        await instance.processFileData(file);
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'test-error');
    });

    it(`dispatches ${ProcessEventTypes.loadingstart} event on error`, async () => {
      let id;
      et.addEventListener(ProcessEventTypes.loadingstart, function f(e) {
        et.removeEventListener(ProcessEventTypes.loadingstart, f);
        // @ts-ignore
        id = e.detail.id;
      });
      const spy = sinon.spy();
      et.addEventListener(ProcessEventTypes.loadingstop, spy);
      window.addEventListener(RestApiEventTypes.processFile, apiParserHandler);
      const file = DataHelper.generateOas2JsonUnknownFile();
      try {
        await instance.processFileData(file);
      } catch (e) {
        // ...
      }
      assert.isTrue(spy.called);
      assert.equal(spy.args[0][0].detail.id, id);
    });

    it('calls normalizeImportData()', async () => {
      const file = DataHelper.generateArcImportFile();
      const spy = sinon.spy(instance, 'normalizeImportData');
      await instance.processFileData(file);
      assert.isTrue(spy.called);
      assert.deepEqual(spy.args[0][0], {
        createdAt: '2019-02-02T21:58:25.467Z',
        kind: 'ARC#Import',
        requests: [],
        version: '13.0.0-alpha.3'
      });
    });

    it(`dispatches ${ProcessEventTypes.loadingstart} event when ready`, async () => {
      let id;
      et.addEventListener(ProcessEventTypes.loadingstart, function f(e) {
        et.removeEventListener(ProcessEventTypes.loadingstart, f);
        // @ts-ignore
        id = e.detail.id;
      });
      const spy = sinon.spy();
      et.addEventListener(ProcessEventTypes.loadingstop, spy);
      const file = DataHelper.generateArcImportFile();
      try {
        await instance.processFileData(file);
      } catch (e) {
        // ...
      }

      assert.isTrue(spy.called);
      assert.equal(spy.args[0][0].detail.id, id);
    });

    it('Calls handleNormalizedFileData() with processed data', async () => {
      const spy = sinon.spy(instance, 'handleNormalizedFileData');
      const file = DataHelper.generateArcImportFile();
      try {
        await instance.processFileData(file);
      } catch (e) {
        // ...
      }

      assert.isTrue(spy.called);
    });

    it('passes options to handleNormalizedFileData()', async () => {
      const opts = { driveId: 'test' };
      const spy = sinon.spy(instance, 'handleNormalizedFileData');
      const file = DataHelper.generateArcImportFile();
      try {
        await instance.processFileData(file, opts);
      } catch (e) {
        // ...
      }
      assert.isTrue(spy.called);
      assert.deepEqual(spy.args[0][1], opts);
    });
  });

  describe('[decryptIfNeeded]()', () => {
    /** @type ArcDataImport */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ArcDataImport(et);
      instance.listen();
    });

    afterEach(() => {
      instance.unlisten();
    });

    it('ignores when content has no encryption header', async () => {
      const spy = sinon.spy();
      et.addEventListener(EncryptionEventTypes.decrypt, spy);
      await instance[decryptIfNeeded]('test data');
      assert.isFalse(spy.called)
    });

    it('dispatches decrypt event', async () => {
      const spy = sinon.spy();
      et.addEventListener(EncryptionEventTypes.decrypt, spy);
      await instance[decryptIfNeeded]('aes\ntest data');
      assert.isTrue(spy.called)
      assert.equal(spy.args[0][0].data, 'test data');
    });
  });
});
