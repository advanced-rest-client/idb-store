import { fixture, assert } from '@open-wc/testing';
import { ArcMock } from '@advanced-rest-client/arc-mock';
import { ArcModelEventTypes, ArcModelEvents } from '@advanced-rest-client/events';
import { MockedStore, HostRulesModel } from '../../index.js';

/** @typedef {import('@advanced-rest-client/events').HostRule.ARCHostRule} ARCHostRule */

describe('<host-rules-model> - Events based', () => {
  const store = new MockedStore();
  const generator = new ArcMock();
  
  async function etFixture() {
    return fixture(`<div></div>`);
  }

  describe(`the update event`, () => {
    /** @type HostRulesModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new HostRulesModel();
      instance.listen(et);
    });

    afterEach(async () => {
      instance.unlisten(et);
      await store.destroyHostRules();
    });

    it('ignores cancelled events', async () => {
      instance.unlisten(et);
      instance.listen(window);
      const hr = generator.hostRules.rule();
      document.body.addEventListener(ArcModelEventTypes.HostRules.update, function f(e) {
        document.body.removeEventListener(ArcModelEventTypes.HostRules.update, f);
        e.preventDefault();
      });
      const e = new CustomEvent(ArcModelEventTypes.HostRules.update, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { result: undefined },
      });
      // @ts-ignore
      e.rule = hr;
      document.body.dispatchEvent(e);
      instance.unlisten(window);
      instance.listen(et);
      assert.isUndefined(e.detail.result);
    });

    it('returns the change record', async () => {
      const hr = generator.hostRules.rule();
      const result = await ArcModelEvents.HostRules.update(et, hr);
      assert.typeOf(result.rev, 'string', 'rev is set');
      assert.typeOf(result.id, 'string', 'id is set');
      assert.typeOf(result.item, 'object', 'item is set');
    });

    it('updates created object', async () => {
      const hr = generator.hostRules.rule();
      const result = await ArcModelEvents.HostRules.update(et, hr);
      const originalRev = result.rev;
      result.item.comment = 'test-2';
      const result2 = await ArcModelEvents.HostRules.update(et, result.item);
      assert.notEqual(result2.rev, originalRev, 'rev is regenerated');
      assert.equal(result2.id, hr._id, 'id is the same');
      assert.equal(result2.item.comment, 'test-2', 'comment is set');
      assert.equal(result2.item.from, hr.from, 'from is set');
    });

    it('updates an object without "_rev" property', async () => {
      const hr = generator.hostRules.rule();
      const result = await ArcModelEvents.HostRules.update(et, hr);
      const originalRev = result.rev;
      result.item.comment = 'test-2';
      delete result.item._rev;
      const result2 = await ArcModelEvents.HostRules.update(et, result.item);
      assert.notEqual(result2.rev, originalRev, 'rev is regenerated');
      assert.equal(result2.id, hr._id, 'id is the same');
      assert.typeOf(result2.item._rev, 'string', 'has new rev');
    });

    it('throws when no update object when constructing the event', async () => {
      let thrown = false;
      try {
        await ArcModelEvents.HostRules.update(et, undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no update object when handling the event ', async () => {
      let thrown = false;
      try {
        const e = new CustomEvent(ArcModelEventTypes.HostRules.update, {
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

  describe(`the update bulk event`, () => {
    /** @type HostRulesModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new HostRulesModel();
      instance.listen(et);
    });

    afterEach(async () => {
      instance.unlisten(et);
      await store.destroyHostRules();
    });

    it('ignores cancelled events', async () => {
      instance.unlisten(et);
      instance.listen(window);
      const hrs = generator.hostRules.rules();
      document.body.addEventListener(ArcModelEventTypes.HostRules.updateBulk, function f(e) {
        document.body.removeEventListener(ArcModelEventTypes.HostRules.updateBulk, f);
        e.preventDefault();
      });
      const e = new CustomEvent(ArcModelEventTypes.HostRules.updateBulk, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { result: undefined },
      });
      // @ts-ignore
      e.rules = hrs;
      document.body.dispatchEvent(e);
      instance.unlisten(window);
      instance.listen(et);
      assert.isUndefined(e.detail.result);
    });

    it('returns a change record', async () => {
      const hrs = generator.hostRules.rules();
      const result = await ArcModelEvents.HostRules.updateBulk(et, hrs);
      assert.typeOf(result, 'array');
      const [item] = result;
      assert.typeOf(item.rev, 'string', 'rev is set');
      assert.typeOf(item.id, 'string', 'id is set');
      assert.typeOf(item.item, 'object', 'item is set');
    });

    it('updates created object', async () => {
      const hrs = generator.hostRules.rules();
      const result = await ArcModelEvents.HostRules.updateBulk(et, hrs);
      const originalRev = result[0].rev;
      result[0].item.comment = 'test-2';
      const result2 = await ArcModelEvents.HostRules.update(et, result[0].item);
      assert.notEqual(result2.rev, originalRev, 'rev is regenerated');
      assert.equal(result2.id, hrs[0]._id, 'id is the same');
      assert.equal(result2.item.comment, 'test-2', 'comment is set');
      assert.equal(result2.item.from, hrs[0].from, 'from is set');
    });

    it('throws when no rules when constructing the event ', async () => {
      let thrown = false;
      try {
        await ArcModelEvents.HostRules.updateBulk(et, undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no rules when handling the event ', async () => {
      let thrown = false;
      try {
        const e = new CustomEvent(ArcModelEventTypes.HostRules.updateBulk, {
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

  describe(`the delete event`, () => {
    let dataObj;
    /** @type HostRulesModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new HostRulesModel();
      instance.listen(et);
      const hr = generator.hostRules.rule();
      const record = await instance.update(hr)
      dataObj = record.item;
    });

    afterEach(async () => {
      instance.unlisten(et);
      await store.destroyHostRules();
    });

    it('ignores cancelled events', async () => {
      instance.unlisten(et);
      instance.listen(window);
      document.body.addEventListener(ArcModelEventTypes.HostRules.delete, function f(e) {
        document.body.removeEventListener(ArcModelEventTypes.HostRules.delete, f);
        e.preventDefault();
      });
      const e = new CustomEvent(ArcModelEventTypes.HostRules.delete, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { result: undefined },
      });
      // @ts-ignore
      e.id = dataObj._id;
      document.body.dispatchEvent(e);
      instance.unlisten(window);
      instance.listen(et);
      assert.isUndefined(e.detail.result);
    });

    it('removes the entity from the datastore', async () => {
      await ArcModelEvents.HostRules.delete(et, dataObj._id, dataObj._rev);
      const result = await store.getDatastoreHostRulesData();
      assert.deepEqual(result, []);
    });

    it('removes the entity without rev', async () => {
      await ArcModelEvents.HostRules.delete(et, dataObj._id);
      const result = await store.getDatastoreHostRulesData();
      assert.deepEqual(result, []);
    });

    it('throws when no ID when constructing the event ', async () => {
      let thrown = false;
      try {
        await ArcModelEvents.HostRules.delete(et, undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no id when handling the event ', async () => {
      let thrown = false;
      try {
        const e = new CustomEvent(ArcModelEventTypes.HostRules.delete, {
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

  describe(`the list event`, () => {
    before(async () => {
      await store.insertHostRules();
    });

    after(async () => {
      await store.destroyHostRules();
    });

    /** @type HostRulesModel */
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

    it('ignores cancelled events', async () => {
      instance.unlisten(et);
      instance.listen(window);
      document.body.addEventListener(ArcModelEventTypes.HostRules.list, function f(e) {
        e.preventDefault();
        document.body.removeEventListener(ArcModelEventTypes.HostRules.list, f);
      });
      const e = new CustomEvent(ArcModelEventTypes.HostRules.list, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { result: undefined },
      });
      document.body.dispatchEvent(e);
      instance.unlisten(window);
      instance.listen(et);
      assert.isUndefined(e.detail.result);
    });

    it('returns a query result for default parameters', async () => {
      const result = await ArcModelEvents.HostRules.list(et);
      assert.typeOf(result, 'object', 'result is an object');
      assert.typeOf(result.nextPageToken, 'string', 'has page token');
      assert.typeOf(result.items, 'array', 'has response items');
      assert.lengthOf(result.items, 25, 'has default limit of items');
    });

    it('respects "limit" parameter', async () => {
      const result = await ArcModelEvents.HostRules.list(et, {
        limit: 5,
      });
      assert.lengthOf(result.items, 5);
    });

    it('respects "nextPageToken" parameter', async () => {
      const result1 = await ArcModelEvents.HostRules.list(et, {
        limit: 10,
      });
      const result2 = await ArcModelEvents.HostRules.list(et, {
        nextPageToken: result1.nextPageToken,
      });
      assert.lengthOf(result2.items, 15);
    });

    it('does not set "nextPageToken" when no more results', async () => {
      const result1 = await ArcModelEvents.HostRules.list(et, {
        limit: 40,
      });
      const result2 = await ArcModelEvents.HostRules.list(et, {
        nextPageToken: result1.nextPageToken,
      });
      assert.isUndefined(result2.nextPageToken);
    });
  });
});
