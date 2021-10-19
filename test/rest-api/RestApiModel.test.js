import { fixture, assert } from '@open-wc/testing';
import sinon from 'sinon';
import { ArcMock } from '@advanced-rest-client/arc-mock';
import { ArcModelEventTypes } from '@advanced-rest-client/events';
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

  describe('Direct API', () => {
    describe('readIndex()', () => {
      /** @type RestApiModel */
      let instance;
      /** @type Element */
      let et;
      let created;

      before(async () => {
        et = await etFixture();
        instance = new RestApiModel();
        instance.listen(et);
        const entity = generator.restApi.apiIndex();
        created = await instance.indexDb.put(entity);
      });

      after(async () => store.destroyApisAll());

      it('returns index data with the id', async () => {
        const doc = await instance.readIndex(created.id);
        assert.equal(doc._id, created.id);
      });

      it('returns index data with the rev', async () => {
        const doc = await instance.readIndex(created.id, created.rev);
        assert.equal(doc._id, created.id);
        assert.equal(doc._rev, created.rev);
      });
    });

    describe('updateIndex()', () => {
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

      it('returns the changelog', async () => {
        const result = await instance.updateIndex(entity);
        assert.typeOf(result, 'object', 'returns an object');
        assert.typeOf(result.id, 'string', 'has an id');
        assert.typeOf(result.rev, 'string', 'has a rev');
        assert.typeOf(result.item, 'object', 'has created object');
        assert.isUndefined(result.oldRev, 'has no oldRev');
      });

      it('creates new object in the data store', async () => {
        const record = await instance.updateIndex(entity);
        const result = await instance.indexDb.get(record.id);
        assert.typeOf(result, 'object');
      });

      it('returns the created entity', async () => {
        const record = await instance.updateIndex(entity);
        const { item } = record;
        assert.typeOf(item, 'object', 'is an object');
        assert.typeOf(item._id, 'string', 'has an id');
        assert.typeOf(item._rev, 'string', 'has a rev');
        assert.equal(item.title, entity.title, 'has the title');
      });

      it('dispatches change event', async () => {
        const spy = sinon.spy();
        instance.addEventListener(ArcModelEventTypes.RestApi.State.update, spy);
        await instance.updateIndex(entity);
        assert.isTrue(spy.calledOnce);
      });
    });

    describe('updateData()', () => {
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
        entity = generator.restApi.apiData(index)[0];
      });

      it('returns the changelog', async () => {
        const result = await instance.updateData(entity);
        assert.typeOf(result, 'object', 'returns an object');
        assert.typeOf(result.id, 'string', 'has an id');
        assert.typeOf(result.rev, 'string', 'has a rev');
        assert.typeOf(result.item, 'object', 'has created object');
        assert.isUndefined(result.oldRev, 'has no oldRev');
      });

      it('creates new object in the data store', async () => {
        const record = await instance.updateData(entity);
        const result = await instance.dataDb.get(record.id);
        assert.typeOf(result, 'object');
      });

      it('returns the created entity', async () => {
        const record = await instance.updateData(entity);
        const { item } = record;
        assert.typeOf(item, 'object', 'is an object');
        assert.typeOf(item._id, 'string', 'has an id');
        assert.typeOf(item._rev, 'string', 'has a rev');
        assert.equal(item.version, entity.version, 'has the version');
      });

      it('dispatches change event', async () => {
        const spy = sinon.spy();
        instance.addEventListener(ArcModelEventTypes.RestApi.State.dataUpdate, spy);
        await instance.updateData(entity);
        assert.isTrue(spy.calledOnce);
      });
    });

    describe('readData()', () => {
      /** @type RestApiModel */
      let instance;
      /** @type Element */
      let et;
      let dataEntities = /** @type ARCRestApi[] */ (null);

      before(async () => {
        et = await etFixture();
        instance = new RestApiModel();
        instance.listen(et);
        // @ts-ignore
        const result = await store.insertApis({
          size: 1,
        });
        dataEntities = /** @type ARCRestApi[] */ (result[1]);
      });

      after(() => store.destroyApisAll());

      it('reads the entity', async () => {
        const doc = await instance.readData(dataEntities[0]._id);
        assert.typeOf(doc, 'object');
      });

      it('returns the entity with the rev', async () => {
        const doc = await instance.readData(dataEntities[0]._id, dataEntities[0]._rev);
        assert.equal(doc._id, dataEntities[0]._id);
        assert.equal(doc._rev, dataEntities[0]._rev);
      });
    });

    describe('updateIndexBatch()', () => {
      /** @type RestApiModel */
      let instance;
      /** @type Element */
      let et;
      let items = /** @type ARCRestApiIndex[] */ (null);

      beforeEach(async () => {
        et = await etFixture();
        instance = new RestApiModel();
        instance.listen(et);
        // @ts-ignore
        items = /** @type ARCRestApiIndex[] */ (generator.generateApiIndexList({
          size: 10,
        }));
      });

      after(() => store.destroyApisAll());

      it('returns the changelog for each item', async () => {
        const records = await instance.updateIndexBatch(items);
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
        instance.addEventListener(ArcModelEventTypes.RestApi.State.update, spy);
        await instance.updateIndexBatch(items);
        assert.equal(spy.callCount, items.length);
      });
    });

    describe('removeVersion()', () => {
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

      it('removes a version from the index', async () => {
        await instance.removeVersion(indexEntity._id, dataEntity.version);
        const doc = await instance.indexDb.get(indexEntity._id);
        assert.notInclude(doc.versions, dataEntity.version);
      });

      it('removes the version entity', async () => {
        await instance.removeVersion(indexEntity._id, dataEntity.version);
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
        await instance.removeVersion(indexEntity._id, dataEntity.version);
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
        instance.addEventListener(ArcModelEventTypes.RestApi.State.update, spy);
        await instance.removeVersion(indexEntity._id, dataEntity.version);
        assert.isTrue(spy.calledOnce);
      });

      it('ignores when no versions', async () => {
        const doc = await instance.indexDb.get(indexEntity._id);
        delete doc.versions;
        await instance.indexDb.put(doc);
        await instance.removeVersion(indexEntity._id, dataEntity.version);
        const result = await instance.dataDb.get(`${indexEntity._id}|${dataEntity.version}`);
        assert.ok(result);
      });

      it('ignores when versions does not exists', async () => {
        const doc = await instance.indexDb.get(indexEntity._id);
        doc.versions = ['hello'];
        await instance.indexDb.put(doc);
        await instance.removeVersion(indexEntity._id, dataEntity.version);
        const result = await instance.dataDb.get(`${indexEntity._id}|${dataEntity.version}`);
        assert.ok(result);
      });

      it('updates "latest" property when removing latest version', async () => {
        const doc = await instance.indexDb.get(indexEntity._id);
        const { latest, versions } = doc;
        await instance.removeVersion(indexEntity._id, latest);
        const index = await instance.indexDb.get(indexEntity._id);
        assert.notEqual(index.latest, latest, 'latest is updated');
        assert.include(versions, index.latest, 'latest is one of the versions');
      });
    });

    describe('delete()', () => {
      /** @type RestApiModel */
      let instance;
      /** @type Element */
      let et;
      let indexEntity = /** @type ARCRestApiIndex */ (null);

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

      it('removes index entity from the store', async () => {
        await instance.delete(indexEntity._id);
        const indexes = await store.getDatastoreApiIndexData();
        assert.lengthOf(indexes, 0);
      });

      it('removes data entities from the store', async () => {
        await instance.delete(indexEntity._id);
        const indexes = await store.getDatastoreHostApiData();
        assert.lengthOf(indexes, 0);
      });

      it('returns delete record', async () => {
        const result = await instance.delete(indexEntity._id);
        assert.equal(result.id, indexEntity._id);
        assert.typeOf(result.rev, 'string');
        assert.notEqual(result.rev, indexEntity._rev);
      });

      it('dispatches index change event', async () => {
        const spy = sinon.spy();
        instance.addEventListener(ArcModelEventTypes.RestApi.State.delete, spy);
        await instance.delete(indexEntity._id);
        assert.isTrue(spy.calledOnce);
      });
    });

    describe('listIndex()', () => {
      /** @type RestApiModel */
      let instance;
      /** @type Element */
      let et;

      beforeEach(async () => {
        // @ts-ignore
        await store.insertApis({
          size: 30,
          versionSize: 1,
        });
        et = await etFixture();
        instance = new RestApiModel();
        instance.listen(et);
      });

      afterEach(() => store.destroyApisAll());

      it('returns a query result for default parameters', async () => {
        const result = await instance.list();
        assert.typeOf(result, 'object', 'result is an object');
        assert.typeOf(result.nextPageToken, 'string', 'has page token');
        assert.typeOf(result.items, 'array', 'has response items');
        assert.lengthOf(result.items, instance.defaultQueryOptions.limit, 'has default limit of items');
      });

      it('respects "limit" parameter', async () => {
        const result = await instance.list({
          limit: 5,
        });
        assert.lengthOf(result.items, 5);
      });

      it('respects "nextPageToken" parameter', async () => {
        const result1 = await instance.list({
          limit: 10,
        });
        const result2 = await instance.list({
          nextPageToken: result1.nextPageToken,
        });
        assert.lengthOf(result2.items, 20);
      });

      it('does not set "nextPageToken" when no more results', async () => {
        const result1 = await instance.list({
          limit: 40,
        });
        const result2 = await instance.list({
          nextPageToken: result1.nextPageToken,
        });
        assert.isUndefined(result2.nextPageToken);
      });
    });
  });
});
