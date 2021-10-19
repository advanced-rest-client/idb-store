import { fixture, assert } from '@open-wc/testing';
import { ArcMock } from '@advanced-rest-client/arc-mock';
import sinon from 'sinon';
import { ArcModelEventTypes, ArcModelEvents } from '@advanced-rest-client/events';
import { WebsocketUrlHistoryModel } from '../../src/WebsocketUrlHistoryModel.js';
import { MockedStore } from '../../index.js';

/* eslint-disable require-atomic-updates */
/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */

/** @typedef {import('@advanced-rest-client/events').UrlHistory.ARCWebsocketUrlHistory} ARCWebsocketUrlHistory */

describe('WebsocketUrlHistoryModel - Events API', () => {
  const store = new MockedStore();
  const generator = new ArcMock();
  
  async function etFixture() {
    return fixture(`<div></div>`);
  }
  describe(`${ArcModelEventTypes.WSUrlHistory.list} event`, () => {
    before(async () => {
      const model = new WebsocketUrlHistoryModel();
      const projects = generator.urls.urls(30);
      await model.db.bulkDocs(projects);
    });

    /** @type WebsocketUrlHistoryModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new WebsocketUrlHistoryModel();
      instance.listen(et);
    });

    after(async () => {
      await store.destroyWebsockets();
    });

    it('returns a query result for default parameters', async () => {
      const result = await ArcModelEvents.WSUrlHistory.list(document.body);
      assert.typeOf(result, 'object', 'result is an object');
      assert.typeOf(result.nextPageToken, 'string', 'has page token');
      assert.typeOf(result.items, 'array', 'has response items');
      assert.lengthOf(result.items, instance.defaultQueryOptions.limit, 'has default limit of items');
    });

    it('respects "limit" parameter', async () => {
      const result = await ArcModelEvents.WSUrlHistory.list(document.body, {
        limit: 5,
      });
      assert.lengthOf(result.items, 5);
    });

    it('respects "nextPageToken" parameter', async () => {
      const result1 = await ArcModelEvents.WSUrlHistory.list(document.body, {
        limit: 10,
      });
      const result2 = await ArcModelEvents.WSUrlHistory.list(document.body, {
        nextPageToken: result1.nextPageToken,
      });
      assert.lengthOf(result2.items, 20);
    });

    it('does not set "nextPageToken" when no more results', async () => {
      const result1 = await ArcModelEvents.WSUrlHistory.list(document.body, {
        limit: 40,
      });
      const result2 = await ArcModelEvents.WSUrlHistory.list(document.body, {
        nextPageToken: result1.nextPageToken,
      });
      assert.isUndefined(result2.nextPageToken);
    });

    it('adds midnight to an item when not there', async () => {
      const entity = generator.urls.url();
      entity._id = 'arc://custom-no-midnight/value';
      delete entity.midnight;
      await instance.update(entity);
      const result = await ArcModelEvents.WSUrlHistory.list(document.body, {
        limit: 31,
      });
      const item = result.items.find((i) => i._id === entity._id);
      assert.typeOf(item.midnight, 'number');
    });

    it('uses existing "midnight" value when set', async () => {
      const entity = generator.urls.url();
      entity._id = 'arc://custom-with-midnight/value';
      entity.midnight = 100;
      await instance.update(entity);
      const result = await ArcModelEvents.WSUrlHistory.list(document.body, {
        limit: 32,
      });
      const item = result.items.find((i) => i._id === entity._id);
      assert.equal(item.midnight, 100);
    });
  });

  describe(`${ArcModelEventTypes.WSUrlHistory.insert} event`, () => {
    /** @type WebsocketUrlHistoryModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new WebsocketUrlHistoryModel();
      instance.listen(et);
    });

    afterEach(async () => {
      await store.destroyWebsockets();
    });

    it('returns the changelog', async () => {
      const entity = generator.urls.url();
      const result = await ArcModelEvents.WSUrlHistory.insert(document.body, entity._id);
      assert.typeOf(result, 'object', 'returns an object');
      assert.typeOf(result.id, 'string', 'has an id');
      assert.typeOf(result.rev, 'string', 'has a rev');
      assert.typeOf(result.item, 'object', 'has created object');
      assert.isUndefined(result.oldRev, 'has no oldRev');
    });

    it('creates an item in the data store', async () => {
      const entity = generator.urls.url();
      await ArcModelEvents.WSUrlHistory.insert(document.body, entity._id);
      const result = /** @type ARCWebsocketUrlHistory */ (await instance.db.get(entity._id));
      assert.typeOf(result, 'object', 'returns an object');
      assert.equal(result._id, entity._id, 'has the id');
      assert.typeOf(result._rev, 'string', 'has a rev');
      assert.equal(result.cnt, 1, 'has default cnt property');
      assert.typeOf(result.time, 'number', 'has time property');
    });

    it('updates the counter on the same item', async () => {
      const entity = generator.urls.url();
      await ArcModelEvents.WSUrlHistory.insert(document.body, entity._id);
      await ArcModelEvents.WSUrlHistory.insert(document.body, entity._id);
      const result = /** @type ARCWebsocketUrlHistory */ (await instance.db.get(entity._id));
      assert.equal(result.cnt, 2, 'has default cnt property');
    });

    it('dispatches change event', async () => {
      const entity = generator.urls.url();
      const spy = sinon.spy();
      instance.addEventListener(ArcModelEventTypes.WSUrlHistory.State.update, spy);
      await ArcModelEvents.WSUrlHistory.insert(document.body, entity._id);
      assert.isTrue(spy.calledOnce);
    });

    it('throws when no url', async () => {
      let thrown = false;
      try {
        await ArcModelEvents.WSUrlHistory.insert(document.body, undefined);
      } catch (_) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('adds midnight value', async () => {
      const entity = generator.urls.url();
      const result = await ArcModelEvents.WSUrlHistory.insert(document.body, entity._id);
      assert.typeOf(result.item.midnight, 'number');
    });

    it('adds url value', async () => {
      const entity = generator.urls.url();
      delete entity.url;
      const result = await ArcModelEvents.WSUrlHistory.insert(document.body, entity._id);
      assert.typeOf(result.item.url, 'string');
    });

    it('lowercases the _id', async () => {
      const url = 'https://API.domain.com';
      const result = await ArcModelEvents.WSUrlHistory.insert(document.body, url);
      assert.equal(result.id, url.toLowerCase());
    });
  });

  describe(`${ArcModelEventTypes.WSUrlHistory.query} event`, () => {
    let created = /** @type ARCWebsocketUrlHistory[] */ (null)
    before(async () => {
      const model = new WebsocketUrlHistoryModel();
      created = generator.urls.urls(30);
      await model.db.bulkDocs(created);
    });

    /** @type WebsocketUrlHistoryModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new WebsocketUrlHistoryModel();
      instance.listen(et);
    });

    after(async () => {
      await store.destroyWebsockets();
    });

    it('returns a list of matched results', async () => {
      const result = await ArcModelEvents.WSUrlHistory.query(document.body, 'http://');
      assert.typeOf(result, 'array', 'result is an array');
      assert.lengthOf(result, 30, 'has all results');
    });

    it('matches the URL', async () => {
      const result = await ArcModelEvents.WSUrlHistory.query(document.body, created[0]._id);
      assert.lengthOf(result, 1);
    });

    it('returns empty array when not found', async () => {
      const result = await ArcModelEvents.WSUrlHistory.query(document.body, 'this will not exist');
      assert.lengthOf(result, 0);
    });

    it('adds midnight to an item when not there', async () => {
      const entity = generator.urls.url();
      entity._id = 'arc://custom-no-midnight/value';
      delete entity.midnight;
      await instance.update(entity);
      const result = await ArcModelEvents.WSUrlHistory.query(document.body, entity._id);
      const [item] = result;
      assert.typeOf(item.midnight, 'number');
    });

    it('uses existing "midnight" value when set', async () => {
      const entity = generator.urls.url();
      entity._id = 'arc://custom-with-midnight/value';
      entity.midnight = 100;
      await instance.update(entity);
      const result = await ArcModelEvents.WSUrlHistory.query(document.body, entity._id);
      const [item] = result;
      assert.equal(item.midnight, 100);
    });

    it('adds url to an item when not there', async () => {
      const entity = generator.urls.url();
      entity._id = 'arc://custom-no-url/value';
      delete entity.url;
      await instance.update(entity);
      const result = await ArcModelEvents.WSUrlHistory.query(document.body, entity._id);
      const [item] = result;
      assert.typeOf(item.url, 'string');
    });

    it('uses existing "url" value when set', async () => {
      const entity = generator.urls.url();
      entity._id = 'arc://custom-with-url/value';
      entity.url = 'https://API.domain.com';
      await instance.update(entity);
      const result = await ArcModelEvents.WSUrlHistory.query(document.body, entity._id);
      const [item] = result;
      assert.equal(item.url, 'https://API.domain.com');
    });

    it('queries using lowercase keys', async () => {
      await ArcModelEvents.WSUrlHistory.insert(document.body, 'https://API.domain.com');
      const result = await ArcModelEvents.WSUrlHistory.query(document.body, 'https://api.DomaIN.com');
      const [item] = result;
      assert.equal(item.url, 'https://API.domain.com');
    });
  });

  describe(`${ArcModelEventTypes.destroy} event`, () => {
    /** @type WebsocketUrlHistoryModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      const created = generator.urls.urls(30);
      et = await etFixture();
      instance = new WebsocketUrlHistoryModel();
      instance.listen(et);
      await instance.db.bulkDocs(created);
    });

    after(async () => {
      await store.destroyWebsockets();
    });

    it('deletes saved model', async () => {
      await ArcModelEvents.destroy(document.body, ['websocket-url-history'])
      const result = await store.getDatastoreWebsocketsData();
      assert.deepEqual(result, []);
    });
  });
});
