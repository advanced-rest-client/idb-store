/* eslint-disable prefer-template */
import { fixture, assert, oneEvent } from '@open-wc/testing';
import { ArcMock } from '@advanced-rest-client/arc-mock';
import { ArcModelEventTypes, TransportEvents } from '@advanced-rest-client/events';
import { MockedStore } from '../../index.js';
import { RequestModel } from '../../src/RequestModel.js';
import {
  HistoryDataModel,
  computeHistoryStoreUrl,
  computeHistoryDataId,
  createHistoryDataModel,
  saveHistoryData,
  updateHistory,
  prepareResponseBody,
  createEmptyTimings,
} from '../../src/HistoryDataModel.js';

/** @typedef {import('@advanced-rest-client/events').HistoryData.HistoryData} HistoryData */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.TransportRequest} TransportRequest */
/** @typedef {import('@advanced-rest-client/events').ArcResponse.Response} Response */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('@advanced-rest-client/events').ARCRequestUpdatedEvent} ARCRequestUpdatedEvent */
/** @typedef {import('@advanced-rest-client/events').ArcResponse.TransformedPayload} TransformedPayload */

describe('HistoryDataModel', () => {
  const store = new MockedStore();
  const generator = new ArcMock();
  
  async function etFixture() {
    return fixture(`<div></div>`);
  }

  describe('[computeHistoryStoreUrl]()', () => {
    /** @type HistoryDataModel */
    let instance;
    /** @type Element */
    let et;
    before(async () => {
      et = await etFixture();
      instance = new HistoryDataModel();
      instance.listen(et);
    });

    it('Returns undefined for missing argument', () => {
      const result = instance[computeHistoryStoreUrl](undefined);
      assert.isUndefined(result);
    });

    it('Normalizes url for domain', () => {
      const url = 'https://domain.com';
      const result = instance[computeHistoryStoreUrl](url);
      assert.equal(result, url + '/');
    });

    it('Normalizes url for resource', () => {
      const url = 'https://domain.com/path';
      const result = instance[computeHistoryStoreUrl](url);
      assert.equal(result, url);
    });

    it('Normalizes url for path', () => {
      const url = 'https://domain.com/path/';
      const result = instance[computeHistoryStoreUrl](url);
      assert.equal(result, url);
    });

    it('Normalizes url for query parameters', () => {
      const url = 'https://domain.com/path/';
      const result = instance[computeHistoryStoreUrl](url + '?a=b');
      assert.equal(result, url);
    });

    it('Normalizes url for resource and query parameters', () => {
      const url = 'https://domain.com/path';
      const result = instance[computeHistoryStoreUrl](url + '?a=b');
      assert.equal(result, url);
    });

    it('Normalizes url for domain and query parameters', () => {
      const url = 'https://domain.com/';
      const result = instance[computeHistoryStoreUrl](url + '?a=b');
      assert.equal(result, url);
    });

    it('Normalizes url for hash', () => {
      const url = 'https://domain.com/';
      const result = instance[computeHistoryStoreUrl](url + '#abc');
      assert.equal(result, url);
    });

    it('Normalizes url for hash and query parameters', () => {
      const url = 'https://domain.com/';
      const result = instance[computeHistoryStoreUrl](url + '?a=b#abc');
      assert.equal(result, url);
    });
  });

  describe('[computeHistoryDataId]()', () => {
    /** @type HistoryDataModel */
    let instance;
    /** @type Element */
    let et;
    const URL = 'https://api.domain.com/endpoint';
    const METHOD = 'GET';
    let id;
    before(async () => {
      et = await etFixture();
      instance = new HistoryDataModel();
      instance.listen(et);
      id = instance[computeHistoryDataId](URL, METHOD);
    });

    it('Contains 3 parts', () => {
      assert.lengthOf(id.split('/'), 3);
    });

    it('Part 1 is URL encoded url', () => {
      const encoded = id.split('/')[0];
      assert.equal(encoded, encodeURIComponent(URL));
    });

    it('Part 2 is method', () => {
      const encoded = id.split('/')[1];
      assert.equal(encoded, METHOD);
    });

    it('Part 3 is UUID', () => {
      const uuid = id.split('/')[2];
      assert.match(uuid, /[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}/);
    });
  });

  describe('[createHistoryDataModel]()', () => {
    /** @type HistoryDataModel */
    let instance;
    /** @type Element */
    let et;
    let model = /** @type HistoryData */ (null);
    let request = /** @type TransportRequest */ (null);
    let response = /** @type Response */ (null);
    beforeEach(async () => {
      et = await etFixture();
      instance = new HistoryDataModel();
      instance.listen(et);
      request = generator.http.transportRequest({ payload: { force: true } });
      response = generator.http.response.arcResponse({ timings: true, ssl: true, redirects: true, noBody: false });
      model = await instance[createHistoryDataModel](request, response);
    });

    it('has the _id', () => {
      assert.typeOf(model._id, 'string');
    });

    it('has no "undefined" properties on the _id', () => {
      assert.isTrue(model._id.indexOf('undefined') === -1);
    });

    it('does not have _rev', () => {
      assert.isUndefined(model._rev);
    });

    it('has timings', () => {
      assert.typeOf(model.timings, 'object');
    });

    it('has HAR 1.2 timings', () => {
      const allowedKeys = ['blocked', 'dns', 'connect', 'send', 'wait',
        'receive', 'ssl'];
      const keys = Object.keys(model.timings);
      const otherKeys = keys.some((key) => allowedKeys.indexOf(key) === -1);
      assert.isFalse(otherKeys);
    });

    it('have values on timings', () => {
      const keys = Object.keys(model.timings);
      const otherKeys = keys.some((key) => model.timings[key] === -1);
      assert.isFalse(otherKeys);
    });

    it('has totalTime', () => {
      assert.typeOf(model.totalTime, 'number', 'totalTime is a number');
      assert.isAbove(model.totalTime, -1, 'totalTime is greater than -1');
    });

    it('has created property', () => {
      assert.typeOf(model.created, 'number', 'totalTime is a number');
      assert.equal(model.created, request.startTime, 'totalTime equals passed timings value');
    });

    it('has the request', () => {
      assert.typeOf(model.request, 'object');
    });

    it('has request.headers', () => {
      assert.typeOf(model.request.headers, 'string');
    });

    it('has request.payload', () => {
      assert.typeOf(model.request.payload, 'string');
    });

    it('has request.url', () => {
      assert.typeOf(model.request.url, 'string');
      assert.equal(model.request.url, request.url);
    });

    it('has request.method', () => {
      assert.typeOf(model.request.method, 'string');
      assert.equal(model.request.method, request.method);
    });

    it('has the response', () => {
      assert.typeOf(model.response, 'object');
    });

    it('has response.statusCode', () => {
      assert.typeOf(model.response.statusCode, 'number');
      assert.equal(model.response.statusCode, response.status);
    });

    it('has response.statusText', () => {
      assert.typeOf(model.response.statusText, 'string');
      assert.equal(model.response.statusText, response.statusText);
    });

    it('has response.headers', () => {
      assert.typeOf(model.response.headers, 'string');
    });

    it('has response.payload', () => {
      assert.typeOf(model.response.payload, 'string');
    });

    it('has stats', () => {
      assert.typeOf(model.stats, 'object');
    });

    it('has stats.request', () => {
      assert.typeOf(model.stats.request, 'object');
    });

    it('has stats.request.headersSize', () => {
      assert.typeOf(model.stats.request.headersSize, 'number');
      assert.isAbove(model.stats.request.headersSize, 1);
    });

    it('Has stats.request.requestPayloadSize', () => {
      assert.typeOf(model.stats.request.payloadSize, 'number');
      assert.isAbove(model.stats.request.payloadSize, 1);
    });

    it('Has stats.response', () => {
      assert.typeOf(model.stats.response, 'object');
    });

    it('Has stats.response.headersSize', () => {
      assert.typeOf(model.stats.response.headersSize, 'number');
      assert.isAbove(model.stats.response.headersSize, 1);
    });

    it('Has stats.response.requestPayloadSize', () => {
      assert.typeOf(model.stats.response.payloadSize, 'number');
      assert.isAbove(model.stats.response.payloadSize, 1);
    });
  });
  
  describe('[saveHistoryData]()', () => {
    /** @type HistoryDataModel */
    let instance;
    /** @type Element */
    let et;
    let request = /** @type TransportRequest */ (null);
    let response = /** @type Response */ (null);
    beforeEach(async () => {
      et = await etFixture();
      instance = new HistoryDataModel();
      instance.listen(et);
      request = generator.http.transportRequest();
      response = generator.http.response.arcResponse({ timings: true, ssl: true, redirects: true,  });
    });

    afterEach(async () => {
      await instance.db.destroy();
    });

    async function getAll() {
      const rsp = await instance.db.allDocs({ include_docs: true });
      return rsp.rows.map((i) => i.doc);
    }

    it('stores request in the history-data store', async () => {
      await instance[saveHistoryData](request, response);
      const docs = await getAll();
      assert.lengthOf(docs, 1);
    });

    it('ignores when "dataDisabled"', async () => {
      instance.dataDisabled = true;
      await instance[saveHistoryData](request, response);
      const docs = await getAll();
      assert.lengthOf(docs, 0);
    });
  });

  describe('[updateHistory]()', () => {
    /** @type HistoryDataModel */
    let instance;
    /** @type RequestModel */
    let requestModel;
    /** @type Element */
    let et;
    let request = /** @type TransportRequest */ (null);
    let response = /** @type Response */ (null);
    let source = /** @type ARCHistoryRequest */ (null);
    beforeEach(async () => {
      et = await etFixture();
      requestModel = new RequestModel();
      instance = new HistoryDataModel();
      requestModel.listen(et);
      instance.listen(et);
      request = generator.http.transportRequest();
      response = generator.http.response.arcResponse({ timings: true, ssl: true, redirects: true,  });
      source = generator.http.history();
    });

    afterEach(async () => {
      await store.destroyHistory();
    });

    it('stores history request', async () => {
      await instance[updateHistory](source, request, response);
      const docs = await store.getDatastoreHistoryData();
      assert.lengthOf(docs, 1);
    });

    it('ignores when historyDisabled', async () => {
      instance.historyDisabled = true;
      await instance[updateHistory](source, request, response);
      const docs = await store.getDatastoreHistoryData();
      assert.lengthOf(docs, 0);
    });

    it('has the response object', async () => {
      await instance[updateHistory](source, request, response);
      const docs = await store.getDatastoreHistoryData();
      // @ts-ignore
      assert.deepEqual(docs[0].response, response);
    });
  });

  describe(`the response event`, () => {
    /** @type HistoryDataModel */
    let instance;
    /** @type RequestModel */
    let requestModel;
    /** @type Element */
    let et;
    let request = /** @type TransportRequest */ (null);
    let response = /** @type Response */ (null);
    let source = /** @type ARCHistoryRequest */ (null);
    beforeEach(async () => {
      et = await etFixture();
      requestModel = new RequestModel();
      instance = new HistoryDataModel();
      requestModel.listen(et);
      instance.listen(et);
      request = generator.http.transportRequest();
      response = generator.http.response.arcResponse({ timings: true, ssl: true, redirects: true,  });
      source = generator.http.history();
    });

    afterEach(async () => {
      await store.destroyHistory();
      await instance.db.destroy();
    });

    async function getAll() {
      const rsp = await instance.db.allDocs({ include_docs: true });
      return rsp.rows.map((i) => i.doc);
    }

    it('stores history request', async () => {
      TransportEvents.response(et, 'test-id', source, request, response);
      const e = /** @type ARCRequestUpdatedEvent */ (await oneEvent(window, ArcModelEventTypes.Request.State.update));
      const { item } = e.changeRecord;
      assert.equal(item.url, source.url);
    });

    it('stores history-data entity', async () => {
      TransportEvents.response(et, 'test-id', source, request, response);
      await oneEvent(window, ArcModelEventTypes.Request.State.update);
      const items = await getAll();
      assert.lengthOf(items, 1);
    });
  });

  describe('[prepareResponseBody]()', () => {
    /** @type HistoryDataModel */
    let instance;
    /** @type Element */
    let et;
    before(async () => {
      et = await etFixture();
      instance = new HistoryDataModel();
      instance.listen(et);
    });

    it('returns undefined when no argument', () => {
      const result = instance[prepareResponseBody](undefined);
      assert.isUndefined(result);
    });

    it('returns the same string', () => {
      const result = instance[prepareResponseBody]('test');
      assert.equal(result, 'test');
    });

    it('returns object for an ArrayBuffer', () => {
      const encoder = new TextEncoder();
      const view = encoder.encode('test');
      
      const result = /** @type TransformedPayload */ (instance[prepareResponseBody](view.buffer));
      assert.equal(result.type, 'ArrayBuffer');
      assert.typeOf(result.data, 'array');
    });

    it('can convert back to ArrayBuffer', () => {
      const encoder = new TextEncoder();
      const view = encoder.encode('test');
      
      const result = /** @type TransformedPayload */ (instance[prepareResponseBody](view.buffer));
      const { buffer } = new Uint16Array(result.data);
      
      const text = String.fromCharCode.apply(null, new Uint16Array(buffer));
      assert.equal(text, 'test');
    });
  });

  describe('[createEmptyTimings]()', () => {
    /** @type HistoryDataModel */
    let instance;
    /** @type Element */
    let et;
    before(async () => {
      et = await etFixture();
      instance = new HistoryDataModel();
      instance.listen(et);
    });

    [
      ['blocked', '-1'],
      ['connect', '-1'],
      ['receive', '-1'],
      ['send', '-1'],
      ['ssl', '-1'],
      ['wait', '-1'],
      ['dns', '-1'],
    ].forEach(([prop, value]) => {
      it(`returns -1 for ${prop}`, () => {
        const result = instance[createEmptyTimings]();
        assert.equal(result[prop], Number(value));
      });
    });
  });
});
