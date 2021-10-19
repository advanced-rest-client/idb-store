import { fixture, assert } from '@open-wc/testing';
import sinon from 'sinon';
import { ArcMock } from '@advanced-rest-client/arc-mock';
import { ArcModelEventTypes } from '@advanced-rest-client/events';
import { MockedStore, HostRulesModel } from '../../index.js';

/** @typedef {import('@advanced-rest-client/events').HostRule.ARCHostRule} ARCHostRule */
/* eslint-disable no-param-reassign */

describe('<host-rules-model>', () => {
  const store = new MockedStore();
  const generator = new ArcMock();
  
  async function etFixture() {
    return fixture(`<div></div>`);
  }

  describe('Static methods', () => {
    describe('update()', () => {
      afterEach(() => store.destroyHostRules());

      /** @type {HostRulesModel} */
      let instance;
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new HostRulesModel();
        instance.listen(et);
      });

      afterEach(() => {
        instance.unlisten(et);
      });

      it('returns a change record', async () => {
        const item = generator.hostRules.rule();
        const result = await instance.update(item);
        assert.typeOf(result.rev, 'string', 'rev is set');
        assert.typeOf(result.id, 'string', 'id is set');
        assert.typeOf(result.item, 'object', 'item is set');
      });

      it('creates a new object in the datastore', async () => {
        const hr = generator.hostRules.rule();
        const result = await instance.update(hr);
        const { item } = result;
        assert.typeOf(item._rev, 'string', '_rev is set');
        assert.equal(item._id, hr._id, '_id is set');
        assert.equal(item.from, hr.from, 'from is set');
      });

      it('updates created object', async () => {
        const hr = generator.hostRules.rule();
        const result = await instance.update(hr);
        const originalRev = result.rev;
        result.item.comment = 'test-2';
        const result2 = await instance.update(result.item);
        assert.notEqual(result2.rev, originalRev, 'rev is regenerated');
        assert.equal(result2.id, hr._id, 'id is the same');
        assert.equal(result2.item.comment, 'test-2', 'comment is set');
        assert.equal(result2.item.from, hr.from, 'from is set');
      });

      it('dispatches change event', async () => {
        const spy = sinon.spy();
        et.addEventListener(ArcModelEventTypes.HostRules.State.update, spy);
        const hr = generator.hostRules.rule();
        await instance.update(hr);
        assert.isTrue(spy.calledOnce);
      });

      it('change event has a change record', async () => {
        const spy = sinon.spy();
        et.addEventListener(ArcModelEventTypes.HostRules.State.update, spy);
        const hr = generator.hostRules.rule();
        await instance.update(hr);
        // @ts-ignore
        const { changeRecord } = spy.args[0][0];
        assert.typeOf(changeRecord.rev, 'string', 'rev is set');
        assert.typeOf(changeRecord.id, 'string', 'id is set');
        assert.typeOf(changeRecord.item, 'object', 'item is set');
      });
    });

    describe('read()', () => {
      afterEach(() => store.destroyHostRules());

      /** @type {HostRulesModel} */
      let instance;
      /** @type Element */
      let et;
      let dataObj;
      beforeEach(async () => {
        et = await etFixture();
        instance = new HostRulesModel();
        instance.listen(et);
        const hr = generator.hostRules.rule();
        const record = await instance.update(hr);
        dataObj = record.item;
      });

      afterEach(() => {
        instance.unlisten(et);
      });

      it('Reads project object by id only', async () => {
        const result = await instance.read(dataObj._id);
        assert.equal(result._id, dataObj._id);
      });

      it('reads a revision', async () => {
        const hr1 = await instance.read(dataObj._id);
        hr1.comment = 'test-2';
        const record = await instance.update(hr1);
        const hr2 = await instance.read(dataObj._id, hr1._rev);
        assert.equal(hr2.comment, dataObj.comment);
        assert.notEqual(hr1._rev, record.rev);
      });
    });

    describe('delete()', () => {
      afterEach(() => store.destroyHostRules());

      /** @type {HostRulesModel} */
      let instance;
      /** @type Element */
      let et;
      let dataObj;
      beforeEach(async () => {
        et = await etFixture();
        instance = new HostRulesModel();
        instance.listen(et);
        const hr = generator.hostRules.rule();
        const record = await instance.update(hr);
        dataObj = record.item;
      });

      afterEach(() => {
        instance.unlisten(et);
      });

      it('removes object from the datastore', async () => {
        await instance.delete(dataObj._id, dataObj._rev);
        let thrown = false;
        try {
          await instance.read(dataObj._id);
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('dispatches the state event', async () => {
        const spy = sinon.spy();
        et.addEventListener(ArcModelEventTypes.HostRules.State.delete, spy);
        await instance.delete(dataObj._id, dataObj._rev);
        assert.isTrue(spy.calledOnce);
      });

      it('has change record on the state event', async () => {
        const spy = sinon.spy();
        et.addEventListener(ArcModelEventTypes.HostRules.State.delete, spy);
        await instance.delete(dataObj._id, dataObj._rev);
        const { id, rev } = spy.args[0][0];

        assert.equal(id, dataObj._id);
        assert.typeOf(rev, 'string');
        assert.notEqual(rev, dataObj._rev);
      });
    });

    describe('list()', () => {
      before(() => store.insertHostRules());
      after(() => store.destroyHostRules());

      /** @type {HostRulesModel} */
      let instance;
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new HostRulesModel();
        instance.listen(et);
      });

      afterEach(() => {
        instance.unlisten(et);
      });

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
        assert.lengthOf(result2.items, 15);
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

    describe('updateBulk()', () => {
      afterEach(() => store.destroyHostRules());
      /** @type {HostRulesModel} */
      let instance;
      /** @type Element */
      let et;
      /** @type ARCHostRule[] */
      let data;
      beforeEach(async () => {
        et = await etFixture();
        instance = new HostRulesModel();
        instance.listen(et);
        data = generator.hostRules.rules();
      });

      afterEach(() => {
        instance.unlisten(et);
      });

      it('inserts data to the store', async () => {
        await instance.updateBulk(data);
        const result = await store.getDatastoreHostRulesData();
        assert.lengthOf(result, data.length);
      });

      it('returns change record for each item', async () => {
        const result = await instance.updateBulk(data)
        assert.typeOf(result, 'array');
        assert.lengthOf(result, data.length);
        const [record] = result;
        assert.typeOf(record.rev, 'string', 'rev is set');
        assert.typeOf(record.id, 'string', 'id is set');
        assert.typeOf(record.item, 'object', 'item is set');
      });
    });
  });
});
