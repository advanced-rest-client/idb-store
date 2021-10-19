import { assert, fixture, oneEvent } from '@open-wc/testing';
import { ArcMock } from '@advanced-rest-client/arc-mock';
import { TransportEventTypes, TransportEvents, ArcModelEventTypes, ArcModelEvents } from '@advanced-rest-client/events';
import sinon from 'sinon';
import { MockedStore, UrlHistoryModel } from '../../index.js';

/** @typedef {import('@advanced-rest-client/events').UrlHistory.ARCUrlHistory} ARCUrlHistory */

describe('UrlHistoryModel - event based', () => {
  const store = new MockedStore();
  const generator = new ArcMock();
  
  async function etFixture() {
    return fixture(`<div></div>`);
  }

  describe(`The list event`, () => {
    before(async () => {
      const et = await etFixture();
      const instance = new UrlHistoryModel();
      instance.listen(et);
      const projects = /** @type ARCUrlHistory[] */ (generator.urls.urls(30));
      await instance.db.bulkDocs(projects);
    });

    /** @type UrlHistoryModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new UrlHistoryModel();
      instance.listen(et);
    });

    after(async () => {
      await store.destroyUrlHistory();
    });

    it('returns a query result for default parameters', async () => {
      const result = await ArcModelEvents.UrlHistory.list(et);
      assert.typeOf(result, 'object', 'result is an object');
      assert.typeOf(result.nextPageToken, 'string', 'has page token');
      assert.typeOf(result.items, 'array', 'has response items');
      assert.lengthOf(result.items, instance.defaultQueryOptions.limit, 'has default limit of items');
    });

    it('respects "limit" parameter', async () => {
      const result = await ArcModelEvents.UrlHistory.list(et, {
        limit: 5,
      });
      assert.lengthOf(result.items, 5);
    });

    it('respects "nextPageToken" parameter', async () => {
      const result1 = await ArcModelEvents.UrlHistory.list(et, {
        limit: 10,
      });
      const result2 = await ArcModelEvents.UrlHistory.list(et, {
        nextPageToken: result1.nextPageToken,
      });
      assert.lengthOf(result2.items, 20);
    });

    it('does not set "nextPageToken" when no more results', async () => {
      const result1 = await ArcModelEvents.UrlHistory.list(et, {
        limit: 40,
      });
      const result2 = await ArcModelEvents.UrlHistory.list(et, {
        nextPageToken: result1.nextPageToken,
      });
      assert.isUndefined(result2.nextPageToken);
    });

    it('adds midnight to an item when not there', async () => {
      const entity = generator.urls.url();
      entity._id = 'arc://custom-no-midnight/value';
      delete entity.midnight;
      await instance.update(entity);
      const result = await ArcModelEvents.UrlHistory.list(et, {
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
      const result = await ArcModelEvents.UrlHistory.list(et, {
        limit: 32,
      });
      const item = result.items.find((i) => i._id === entity._id);
      assert.equal(item.midnight, 100);
    });
  });

  describe(`the insert event`, () => {
    /** @type UrlHistoryModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new UrlHistoryModel();
      instance.listen(et);
    });

    afterEach(async () => {
      await store.destroyUrlHistory();
    });

    it('returns the changelog', async () => {
      const entity = generator.urls.url();
      const result = await ArcModelEvents.UrlHistory.insert(et, entity._id);
      assert.typeOf(result, 'object', 'returns an object');
      assert.typeOf(result.id, 'string', 'has an id');
      assert.typeOf(result.rev, 'string', 'has a rev');
      assert.typeOf(result.item, 'object', 'has created object');
      assert.isUndefined(result.oldRev, 'has no oldRev');
    });

    it('creates an item in the data store', async () => {
      const entity = generator.urls.url();
      await ArcModelEvents.UrlHistory.insert(et, entity._id);
      const result = /** @type ARCUrlHistory */ (await instance.db.get(entity._id));
      assert.typeOf(result, 'object', 'returns an object');
      assert.equal(result._id, entity._id, 'has the id');
      assert.typeOf(result._rev, 'string', 'has a rev');
      assert.equal(result.cnt, 1, 'has default cnt property');
      assert.typeOf(result.time, 'number', 'has time property');
      assert.typeOf(result.url, 'string', 'has url property');
    });

    it('updates the counter on the same item', async () => {
      const entity = generator.urls.url();
      await ArcModelEvents.UrlHistory.insert(et, entity._id);
      await ArcModelEvents.UrlHistory.insert(et, entity._id);
      const result = /** @type ARCUrlHistory */ (await instance.db.get(entity._id));
      assert.equal(result.cnt, 2, 'has default cnt property');
    });

    it('dispatches change event', async () => {
      const entity = generator.urls.url();
      const spy = sinon.spy();
      et.addEventListener(ArcModelEventTypes.UrlHistory.State.update, spy);
      await ArcModelEvents.UrlHistory.insert(et, entity._id);
      assert.isTrue(spy.calledOnce);
    });

    it('adds midnight value', async () => {
      const entity = generator.urls.url();
      delete entity.midnight;
      const result = await ArcModelEvents.UrlHistory.insert(et, entity._id);
      assert.typeOf(result.item.midnight, 'number');
    });

    it('adds url value', async () => {
      const entity = generator.urls.url();
      delete entity.url;
      const result = await ArcModelEvents.UrlHistory.insert(et, entity._id);
      assert.typeOf(result.item.url, 'string');
    });

    it('lower-cases the _id', async () => {
      const url = 'https://API.domain.com';
      const result = await ArcModelEvents.UrlHistory.insert(et, url);
      assert.equal(result.id, url.toLowerCase());
    });
  });

  describe(`${ArcModelEventTypes.UrlHistory.query} event`, () => {
    let created = /** @type ARCUrlHistory[] */ (null)
    before(async () => {
      const et = await etFixture();
      const instance = new UrlHistoryModel();
      instance.listen(et);
      created = /** @type ARCUrlHistory[] */ (generator.urls.urls(30));
      await instance.db.bulkDocs(created);
    });

    /** @type UrlHistoryModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new UrlHistoryModel();
      instance.listen(et);
    });

    after(async () => {
      await store.destroyUrlHistory();
    });

    it('returns a list of matched results', async () => {
      const result = await ArcModelEvents.UrlHistory.query(et, 'http://');
      assert.typeOf(result, 'array', 'result is an array');
      const httpUrls = created.filter(i => i.url.startsWith('http://'));
      assert.lengthOf(result, httpUrls.length, 'has all results');
    });

    it('matches the URL', async () => {
      const result = await ArcModelEvents.UrlHistory.query(et, created[0]._id);
      assert.lengthOf(result, 1);
    });

    it('returns empty array when not found', async () => {
      const result = await ArcModelEvents.UrlHistory.query(et, 'this will not exist');
      assert.lengthOf(result, 0);
    });

    it('adds midnight to an item when not there', async () => {
      const entity = generator.urls.url();
      entity._id = 'arc://custom-no-midnight/value';
      delete entity.midnight;
      await instance.update(entity);
      const result = await ArcModelEvents.UrlHistory.query(et, entity._id);
      const [item] = result;
      assert.typeOf(item.midnight, 'number');
    });

    it('uses existing "midnight" value when set', async () => {
      const entity = generator.urls.url();
      entity._id = 'arc://custom-with-midnight/value';
      entity.midnight = 100;
      await instance.update(entity);
      const result = await ArcModelEvents.UrlHistory.query(et, entity._id);
      const [item] = result;
      assert.equal(item.midnight, 100);
    });

    it('adds url to an item when not there', async () => {
      const entity = generator.urls.url();
      entity._id = 'arc://custom-no-url/value';
      delete entity.url;
      await instance.update(entity);
      const result = await ArcModelEvents.UrlHistory.query(et, entity._id);
      const [item] = result;
      assert.typeOf(item.url, 'string');
    });

    it('uses existing "url" value when set', async () => {
      const entity = generator.urls.url();
      entity._id = 'arc://custom-with-url/value';
      entity.url = 'https://API.domain.com';
      await instance.update(entity);
      const result = await ArcModelEvents.UrlHistory.query(et, entity._id);
      const [item] = result;
      assert.equal(item.url, 'https://API.domain.com');
    });

    it('queries using lowercase keys', async () => {
      await ArcModelEvents.UrlHistory.insert(et, 'https://API.domain.com');
      const result = await ArcModelEvents.UrlHistory.query(et, 'https://api.DomaIN.com');
      const [item] = result;
      assert.equal(item.url, 'https://API.domain.com');
    });
  });

  describe(`${ArcModelEventTypes.destroy} event`, () => {
    /** @type UrlHistoryModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      const created = /** @type ARCUrlHistory[] */ (generator.urls.urls(30));
      et = await etFixture();
      instance = new UrlHistoryModel();
      instance.listen(et);
      await instance.db.bulkDocs(created);
    });

    after(async () => {
      await store.destroyUrlHistory();
    });

    it('deletes saved instance', async () => {
      await ArcModelEvents.destroy(et, ['url-history'])
      const result = await store.getDatastoreUrlsData();
      assert.deepEqual(result, []);
    });
  });

  describe(`${TransportEventTypes.transport} event`, () => {
    after(async () => {
      await store.destroyUrlHistory();
    });

    it('stores the URL when request is being transported', async () => {
      const et = await etFixture();
      const instance = new UrlHistoryModel();
      instance.listen(et);
      const request = generator.http.history();
      TransportEvents.transport(et, 'test', request);
      const e = await oneEvent(et, ArcModelEventTypes.UrlHistory.State.update);
      
      // @ts-ignore
      const record = e.changeRecord;
      assert.equal(record.item.url, request.url);
    });
  });

  describe(`The delete event`, () => {
    /** @type ARCUrlHistory */
    let dataObj;
    /** @type UrlHistoryModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new UrlHistoryModel();
      instance.listen(et);
      const doc = generator.urls.url();
      const record = await instance.update(doc);
      dataObj = record.item;
    });

    afterEach(() => store.destroyUrlHistory());

    it('ignores cancelled events', async () => {
      instance.unlisten(et);
      instance.listen(window);
      document.body.addEventListener(ArcModelEventTypes.UrlHistory.delete, function f(e) {
        document.body.removeEventListener(ArcModelEventTypes.UrlHistory.delete, f);
        e.preventDefault();
      });
      const result = await ArcModelEvents.UrlHistory.delete(document.body, dataObj._id);
      instance.unlisten(window);
      instance.listen(et);
      assert.isUndefined(result);
    });

    it('removes the entity from the datastore', async () => {
      await ArcModelEvents.UrlHistory.delete(et, dataObj._id);
      const result = await store.getDatastoreUrlsData();
      assert.deepEqual(result, []);
    });

    it('throws when no ID when constructing the event ', async () => {
      let thrown = false;
      try {
        await ArcModelEvents.UrlHistory.delete(et, undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no id when handling the event ', async () => {
      let thrown = false;
      try {
        const e = new CustomEvent(ArcModelEventTypes.UrlHistory.delete, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: { result: undefined },
        });
        et.dispatchEvent(e);
        await e.detail.result;
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });
});
