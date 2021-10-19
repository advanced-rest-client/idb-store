import { fixture, assert } from '@open-wc/testing';
import sinon from 'sinon';
import { ArcMock } from '@advanced-rest-client/arc-mock';
import { ArcModelEventTypes, ArcModelEvents } from '@advanced-rest-client/events';
import { MockedStore, RestApiModel } from '../../index.js';

/* eslint-disable prefer-destructuring */

/** @typedef {import('@advanced-rest-client/events').RestApi.ARCRestApiIndex} ARCRestApiIndex */
/** @typedef {import('@advanced-rest-client/events').RestApi.ARCRestApi} ARCRestApi */

describe('RestApiModel', () => {
  const store = new MockedStore();
  const generator = new ArcMock();
  
  async function etFixture() {
    return fixture(`<div></div>`);
  }

  describe('Events API', () => {
    describe(`the read event`, () => {
      let created;
      /** @type RestApiModel */
      let instance;
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new RestApiModel();
        instance.listen(et);
        const entity = generator.restApi.apiIndex();
        created = await instance.indexDb.put(entity);
      });

      afterEach(async () => store.destroyApisAll());

      it('returns the index data with the id', async () => {
        const doc = await ArcModelEvents.RestApi.read(et, created.id);
        assert.equal(doc._id, created.id);
      });

      it('returns index data with the rev', async () => {
        const doc = await ArcModelEvents.RestApi.read(et, created.id, created.rev);
        assert.equal(doc._id, created.id);
        assert.equal(doc._rev, created.rev);
      });

      it('ignores the event when cancelled', async () => {
        instance.unlisten(et);
        instance.listen(window);
        document.body.addEventListener(ArcModelEventTypes.RestApi.read, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.RestApi.read, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.RestApi.read, {
          bubbles: true,
          cancelable: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        instance.unlisten(window);
        instance.listen(et);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(`the update event`, () => {
      after(() => store.destroyApisAll());

      /** @type RestApiModel */
      let instance;
      /** @type Element */
      let et;
      let entity = /** @type ARCRestApiIndex */ (null);
      beforeEach(async () => {
        et = await etFixture();
        instance = new RestApiModel();
        instance.listen(et);
        entity = generator.restApi.apiIndex();
      });

      afterEach(() => {
        instance.unlisten(et);
      });

      it('returns the changelog', async () => {
        const result = await ArcModelEvents.RestApi.update(et, entity);
        assert.typeOf(result, 'object', 'returns an object');
        assert.typeOf(result.id, 'string', 'has an id');
        assert.typeOf(result.rev, 'string', 'has a rev');
        assert.typeOf(result.item, 'object', 'has created object');
        assert.isUndefined(result.oldRev, 'has no oldRev');
      });

      it('creates new object in the data store', async () => {
        const record = await ArcModelEvents.RestApi.update(et, entity);
        const result = await instance.indexDb.get(record.id);
        assert.typeOf(result, 'object');
      });

      it('returns the created entity', async () => {
        const record = await ArcModelEvents.RestApi.update(et, entity);
        const { item } = record;
        assert.typeOf(item, 'object', 'is an object');
        assert.typeOf(item._id, 'string', 'has an id');
        assert.typeOf(item._rev, 'string', 'has a rev');
        assert.equal(item.title, entity.title, 'has the title');
      });

      it('dispatches change event', async () => {
        const spy = sinon.spy();
        et.addEventListener(ArcModelEventTypes.RestApi.State.update, spy);
        await ArcModelEvents.RestApi.update(et, entity);
        assert.isTrue(spy.calledOnce);
      });

      it('ignores the event when cancelled', async () => {
        instance.unlisten(et);
        instance.listen(window);
        document.body.addEventListener(ArcModelEventTypes.RestApi.update, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.RestApi.update, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.RestApi.update, {
          bubbles: true,
          cancelable: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        instance.unlisten(window);
        instance.listen(et);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(`The data update event`, () => {
      after(() => store.destroyApisAll());

      /** @type RestApiModel */
      let instance;
      /** @type Element */
      let et;
      let entity = /** @type ARCRestApi */ (null);;
      beforeEach(async () => {
        et = await etFixture();
        instance = new RestApiModel();
        instance.listen(et);
        const index = generator.restApi.apiIndex();
        entity = /** @type ARCRestApi */ (generator.restApi.apiData(index)[0]);
      });

      afterEach(() => {
        instance.unlisten(et);
      });

      it('returns the changelog', async () => {
        const result = await ArcModelEvents.RestApi.dataUpdate(et, entity);
        assert.typeOf(result, 'object', 'returns an object');
        assert.typeOf(result.id, 'string', 'has an id');
        assert.typeOf(result.rev, 'string', 'has a rev');
        assert.typeOf(result.item, 'object', 'has created object');
        assert.isUndefined(result.oldRev, 'has no oldRev');
      });

      it('creates new object in the data store', async () => {
        const record = await ArcModelEvents.RestApi.dataUpdate(et, entity);
        const result = await instance.dataDb.get(record.id);
        assert.typeOf(result, 'object');
      });

      it('returns the created entity', async () => {
        const record = await ArcModelEvents.RestApi.dataUpdate(et, entity);
        const { item } = record;
        assert.typeOf(item, 'object', 'is an object');
        assert.typeOf(item._id, 'string', 'has an id');
        assert.typeOf(item._rev, 'string', 'has a rev');
        assert.equal(item.version, entity.version, 'has the version');
      });

      it('dispatches change event', async () => {
        const spy = sinon.spy();
        et.addEventListener(ArcModelEventTypes.RestApi.State.dataUpdate, spy);
        await ArcModelEvents.RestApi.dataUpdate(et, entity);
        assert.isTrue(spy.calledOnce);
      });

      it('ignores the event when cancelled', async () => {
        instance.unlisten(et);
        instance.listen(window);
        document.body.addEventListener(ArcModelEventTypes.RestApi.dataUpdate, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.RestApi.dataUpdate, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.RestApi.dataUpdate, {
          bubbles: true,
          cancelable: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        instance.unlisten(window);
        instance.listen(et);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(`The data read event`, () => {
      let dataEntities = /** @type ARCRestApi[] */ (null);
      /** @type RestApiModel */
      let instance;
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new RestApiModel();
        instance.listen(et);
        const result = await store.insertApis(1);
        dataEntities = /** @type ARCRestApi[] */ (result[1]);
      });

      afterEach(() => store.destroyApisAll());

      afterEach(() => {
        instance.unlisten(et);
      });

      it('reads the entity', async () => {
        const doc = await ArcModelEvents.RestApi.dataRead(et, dataEntities[0]._id);
        assert.typeOf(doc, 'object');
      });

      it('returns the entity with the rev', async () => {
        const doc = await ArcModelEvents.RestApi.dataRead(et, dataEntities[0]._id, dataEntities[0]._rev);
        assert.equal(doc._id, dataEntities[0]._id);
        assert.equal(doc._rev, dataEntities[0]._rev);
      });

      it('ignores the event when cancelled', async () => {
        instance.unlisten(et);
        instance.listen(window);
        document.body.addEventListener(ArcModelEventTypes.RestApi.dataRead, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.RestApi.dataRead, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.RestApi.dataRead, {
          bubbles: true,
          cancelable: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        instance.unlisten(window);
        instance.listen(et);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(`The update bulk event`, () => {
      /** @type RestApiModel */
      let instance;
      /** @type Element */
      let et;
      let items = /** @type ARCRestApiIndex[] */ (null);

      beforeEach(async () => {
        et = await etFixture();
        instance = new RestApiModel();
        instance.listen(et);
        items = generator.restApi.apiIndexList(10);
      });

      afterEach(() => {
        instance.unlisten(et);
      });

      after(() => store.destroyApisAll());

      it('returns the changelog for each item', async () => {
        const records = await ArcModelEvents.RestApi.updateBulk(et, items);
        assert.typeOf(records, 'array', 'returns an array');
        assert.lengthOf(records, items.length, 'has the same number of items');
        const [result] = records;
        assert.typeOf(result, 'object', 'returns an object');
        assert.typeOf(result.id, 'string', 'has an id');
        assert.typeOf(result.rev, 'string', 'has a rev');
        assert.typeOf(result.item, 'object', 'has created object');
        assert.isUndefined(result.oldRev, 'has no oldRev');
      });

      it('dispatches change event', async () => {
        const spy = sinon.spy();
        et.addEventListener(ArcModelEventTypes.RestApi.State.update, spy);
        await ArcModelEvents.RestApi.updateBulk(et, items);
        assert.equal(spy.callCount, items.length);
      });

      it('ignores the event when cancelled', async () => {
        instance.unlisten(et);
        instance.listen(window);
        document.body.addEventListener(ArcModelEventTypes.RestApi.update, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.RestApi.update, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.RestApi.update, {
          bubbles: true,
          cancelable: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        instance.unlisten(window);
        instance.listen(et);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(`The version delete event`, () => {
      /** @type RestApiModel */
      let instance;
      /** @type Element */
      let et;
      let indexEntity = /** @type ARCRestApiIndex */ (null);
      let dataEntity = /** @type ARCRestApi */ (null);

      beforeEach(async () => {
        const result = await store.insertApis(1, {
          versionSize: 5,
          order: 1,
        });
        indexEntity = /** @type ARCRestApiIndex */ (result[0][0]);
        dataEntity = /** @type ARCRestApi */ (result[1][0]);
        et = await etFixture();
        instance = new RestApiModel();
        instance.listen(et);
      });

      afterEach(() => store.destroyApisAll());
      afterEach(() => {
        instance.unlisten(et);
      });

      it('removes a version from the index', async () => {
        await ArcModelEvents.RestApi.versionDelete(et, indexEntity._id, dataEntity.version);
        const doc = await instance.indexDb.get(indexEntity._id);
        assert.notInclude(doc.versions, dataEntity.version);
      });

      it('removes the version entity', async () => {
        await ArcModelEvents.RestApi.versionDelete(et, indexEntity._id, dataEntity.version);
        let thrown = false;
        try {
          await instance.dataDb.get(`${indexEntity._id}|${dataEntity.version}`);
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('removes the index if has no more versions', async () => {
        const doc = await instance.indexDb.get(indexEntity._id);
        doc.versions = [dataEntity.version];
        await instance.indexDb.put(doc);
        await ArcModelEvents.RestApi.versionDelete(et, indexEntity._id, dataEntity.version);
        let thrown = false;
        try {
          await instance.indexDb.get(indexEntity._id);
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('dispatches index change event', async () => {
        const spy = sinon.spy();
        et.addEventListener(ArcModelEventTypes.RestApi.State.update, spy);
        await ArcModelEvents.RestApi.versionDelete(et, indexEntity._id, dataEntity.version);
        assert.isTrue(spy.calledOnce);
      });

      it('ignores when no versions', async () => {
        const doc = await instance.indexDb.get(indexEntity._id);
        delete doc.versions;
        await instance.indexDb.put(doc);
        await ArcModelEvents.RestApi.versionDelete(et, indexEntity._id, dataEntity.version);
        const result = await instance.dataDb.get(`${indexEntity._id}|${dataEntity.version}`);
        assert.ok(result);
      });

      it('ignores when versions does not exists', async () => {
        const doc = await instance.indexDb.get(indexEntity._id);
        doc.versions = ['hello'];
        await instance.indexDb.put(doc);
        await ArcModelEvents.RestApi.versionDelete(et, indexEntity._id, dataEntity.version);
        const result = await instance.dataDb.get(`${indexEntity._id}|${dataEntity.version}`);
        assert.ok(result);
      });

      it('updates "latest" property when removing latest version', async () => {
        const doc = await instance.indexDb.get(indexEntity._id);
        const { latest, versions } = doc;
        await ArcModelEvents.RestApi.versionDelete(et, indexEntity._id, latest);
        const index = await instance.indexDb.get(indexEntity._id);
        assert.notEqual(index.latest, latest, 'latest is updated');
        assert.include(versions, index.latest, 'latest is one of the versions');
      });

      it('ignores the event when cancelled', async () => {
        instance.unlisten(et);
        instance.listen(window);
        document.body.addEventListener(ArcModelEventTypes.RestApi.versionDelete, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.RestApi.versionDelete, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.RestApi.versionDelete, {
          bubbles: true,
          cancelable: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        instance.unlisten(window);
        instance.listen(et);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(`The delete event`, () => {
      let indexEntity = /** @type ARCRestApiIndex */ (null);
      /** @type RestApiModel */
      let instance;
      /** @type Element */
      let et;
      beforeEach(async () => {
        const result = await store.insertApis(1, {
          versionSize: 5,
          order: 1,
        });
        indexEntity = /** @type ARCRestApiIndex */ (result[0][0]);
        et = await etFixture();
        instance = new RestApiModel();
        instance.listen(et);
      });

      afterEach(() => store.destroyApisAll());
      afterEach(() => {
        instance.unlisten(et);
      });

      it('removes index entity from the store', async () => {
        await ArcModelEvents.RestApi.delete(et, indexEntity._id);
        const indexes = await store.getDatastoreApiIndexData();
        assert.lengthOf(indexes, 0);
      });

      it('returns delete record', async () => {
        const result = await ArcModelEvents.RestApi.delete(et, indexEntity._id);
        assert.equal(result.id, indexEntity._id);
        assert.typeOf(result.rev, 'string');
        assert.notEqual(result.rev, indexEntity._rev);
      });

      it('ignores the event when cancelled', async () => {
        instance.unlisten(et);
        instance.listen(window);
        document.body.addEventListener(ArcModelEventTypes.RestApi.delete, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.RestApi.delete, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.RestApi.delete, {
          bubbles: true,
          cancelable: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        instance.unlisten(window);
        instance.listen(et);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(`The list event`, () => {
      /** @type RestApiModel */
      let instance;
      /** @type Element */
      let et;
      beforeEach(async () => {
        await store.insertApis(30, {
          versionSize: 1,
        });
        et = await etFixture();
        instance = new RestApiModel();
        instance.listen(et);
      });

      afterEach(() => store.destroyApisAll());

      it('returns a query result for default parameters', async () => {
        const result = await ArcModelEvents.RestApi.list(et);
        assert.typeOf(result, 'object', 'result is an object');
        assert.typeOf(result.nextPageToken, 'string', 'has page token');
        assert.typeOf(result.items, 'array', 'has response items');
        assert.lengthOf(result.items, instance.defaultQueryOptions.limit, 'has default limit of items');
      });

      it('respects "limit" parameter', async () => {
        const result = await ArcModelEvents.RestApi.list(et, {
          limit: 5,
        });
        assert.lengthOf(result.items, 5);
      });

      it('respects "nextPageToken" parameter', async () => {
        const result1 = await ArcModelEvents.RestApi.list(et, {
          limit: 10,
        });
        const result2 = await ArcModelEvents.RestApi.list(et, {
          nextPageToken: result1.nextPageToken,
        });
        assert.lengthOf(result2.items, 20);
      });

      it('does not set "nextPageToken" when no more results', async () => {
        const result1 = await ArcModelEvents.RestApi.list(et, {
          limit: 40,
        });
        const result2 = await ArcModelEvents.RestApi.list(et, {
          nextPageToken: result1.nextPageToken,
        });
        assert.isUndefined(result2.nextPageToken);
      });

      it('ignores the event when cancelled', async () => {
        instance.unlisten(et);
        instance.listen(window);
        document.body.addEventListener(ArcModelEventTypes.RestApi.list, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.RestApi.list, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.RestApi.list, {
          bubbles: true,
          cancelable: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        instance.unlisten(window);
        instance.listen(et);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(`The DB destroy event`, () => {
      /** @type RestApiModel */
      let instance;
      /** @type Element */
      let et;
      beforeEach(async () => {
        await store.insertApis(10, {
          versionSize: 1,
        });
        et = await etFixture();
        instance = new RestApiModel();
        instance.listen(et);
      });

      afterEach(() => store.destroyApisAll());
      afterEach(() => {
        instance.unlisten(et);
      });

      it('clears index data', async () => {
        const indexBefore = await store.getDatastoreApiIndexData();
        assert.lengthOf(indexBefore, 10, 'has index data');
        await ArcModelEvents.destroy(et, ['rest-apis']);
        const index = await store.getDatastoreApiIndexData();
        assert.lengthOf(index, 0, 'index is cleared');
      });

      it('clears api data store', async () => {
        const indexBefore = await store.getDatastoreHostApiData();
        assert.lengthOf(indexBefore, 10, 'has api data');
        await ArcModelEvents.destroy(et, ['rest-apis']);
        const index = await store.getDatastoreHostApiData();
        assert.lengthOf(index, 0, 'api is cleared');
      });

      it('clears on "all" store', async () => {
        const indexBefore = await store.getDatastoreHostApiData();
        assert.lengthOf(indexBefore, 10, 'has api data');
        await ArcModelEvents.destroy(et, ['all']);
        const index = await store.getDatastoreHostApiData();
        assert.lengthOf(index, 0, 'api is cleared');
      });

      it('dispatches store clear events', async () => {
        const spy = sinon.spy();
        et.addEventListener(ArcModelEventTypes.destroyed, spy);
        await ArcModelEvents.destroy(et, ['rest-apis']);
        assert.equal(spy.callCount, 2);
      });

      it('ignores the event when cancelled', async () => {
        instance.unlisten(et);
        instance.listen(window);
        document.body.addEventListener(ArcModelEventTypes.destroyed, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.destroyed, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.destroyed, {
          bubbles: true,
          cancelable: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        instance.unlisten(window);
        instance.listen(et);
        assert.isUndefined(e.detail.result);
      });
    });
  });
});
