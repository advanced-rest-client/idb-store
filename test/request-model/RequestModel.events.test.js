import { fixture, assert } from '@open-wc/testing';
import { ArcMock } from '@advanced-rest-client/arc-mock';
import sinon from 'sinon';
import { ArcModelEventTypes, ArcModelEvents } from '@advanced-rest-client/events';
import { MockedStore, RequestModel, UrlIndexer } from '../../index.js';

/* eslint-disable prefer-destructuring */

/** @typedef {import('@advanced-rest-client/events').Project.ARCProject} ARCProject */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('../../src/types').InsertSavedResult} InsertSavedResult */

describe('RequestModel Events API', () => {
  const store = new MockedStore();
  const generator = new ArcMock();
  
  async function etFixture() {
    return fixture(`<div></div>`);
  }

  describe(`the read event`, () => {
    let requests = /** @type ARCSavedRequest[] */ (null);
    before(async () => {
      const data = await store.insertSaved();
      requests = data.requests;
    });

    after(() => store.destroySaved());

    /** @type RequestModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestModel();
      instance.listen(et);
    });

    afterEach(() => {
      instance.unlisten(et);
    });

    it('ignores cancelled events', async () => {
      instance.unlisten(et);
      instance.listen(window);
      document.body.addEventListener(ArcModelEventTypes.Request.read, function f(e) {
        e.preventDefault();
        document.body.removeEventListener(ArcModelEventTypes.Request.read, f);
      });
      const e = new CustomEvent(ArcModelEventTypes.Request.read, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { result: undefined },
      });
      // @ts-ignore
      e.requestType = 'saved';
      // @ts-ignore
      e.id = 'test123';
      document.body.dispatchEvent(e);
      instance.unlisten(window);
      instance.listen(et);
      assert.isUndefined(e.detail.result);
    });

    it('returns a request', async () => {
      const result = await ArcModelEvents.Request.read(et, 'saved', requests[0]._id);
      assert.deepEqual(result, requests[0]);
    });

    it('adds computed midnight value', async () => {
      const result = await ArcModelEvents.Request.read(et, 'saved', requests[0]._id);
      assert.typeOf(result.midnight, 'number');
    });

    it('passes rev option', async () => {
      const [request] = requests;
      const rev = request._rev;
      const oldName = request.name;
      request.name = 'xyz';
      const record = await instance.post('saved', request);
      request._rev = record.rev;
      const result = await ArcModelEvents.Request.read(et, 'saved', requests[0]._id, {
        rev,
      });
      // @ts-ignore
      assert.deepEqual(result.name, oldName);
    });

    it('throws when no id when constructing the event', async () => {
      let thrown = false;
      try {
        await ArcModelEvents.Request.read(et, 'saved', undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no id when receiving the event', async () => {
      let thrown = false;
      try {
        const e = new CustomEvent(ArcModelEventTypes.Request.read, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: { result: undefined },
        });
        // @ts-ignore
        e.requestType = 'saved';
        et.dispatchEvent(e);
        await e.detail.result;
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no requestType when constructing the event', async () => {
      let thrown = false;
      try {
        await ArcModelEvents.Request.read(et, undefined, 'id');
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no requestType when receiving the event', async () => {
      let thrown = false;
      try {
        const e = new CustomEvent(ArcModelEventTypes.Request.read, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: { result: undefined },
        });
        // @ts-ignore
        e.id = 'test-id';
        et.dispatchEvent(e);
        await e.detail.result;
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no result', async () => {
      let thrown = false;
      try {
        await ArcModelEvents.Request.read(et, 'saved', 'random-id');
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe(`the read bulk event`, () => {
    let requests = /** @type ARCSavedRequest[] */ (null);
    before(async () => {
      const data = await store.insertSaved();
      requests = data.requests;
    });

    after(() => store.destroySaved());

    /** @type RequestModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestModel();
      instance.listen(et);
    });

    afterEach(() => {
      instance.unlisten(et);
    });

    it('ignores cancelled events', async () => {
      instance.unlisten(et);
      instance.listen(window);
      document.body.addEventListener(ArcModelEventTypes.Request.readBulk, function f(e) {
        e.preventDefault();
        document.body.removeEventListener(ArcModelEventTypes.Request.readBulk, f);
      });
      const e = new CustomEvent(ArcModelEventTypes.Request.readBulk, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { result: undefined },
      });
      // @ts-ignore
      e.requestType = 'saved';
      // @ts-ignore
      e.ids = ['test123'];
      document.body.dispatchEvent(e);
      instance.unlisten(window);
      instance.listen(et);
      assert.isUndefined(e.detail.result);
    });

    it('returns a list of requests', async () => {
      const result = await ArcModelEvents.Request.readBulk(et, 'saved', [requests[0]._id, requests[1]._id]);
      assert.deepEqual(result, [requests[0], requests[1]]);
    });

    it('adds computed midnight value', async () => {
      const result = await ArcModelEvents.Request.readBulk(et, 'saved', [requests[0]._id, requests[1]._id]);
      assert.typeOf(result[0].midnight, 'number');
      assert.typeOf(result[1].midnight, 'number');
    });

    it('throws when no ids when constructing the event', async () => {
      let thrown = false;
      try {
        await ArcModelEvents.Request.readBulk(et, 'saved', undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no requestType when constructing the event', async () => {
      let thrown = false;
      try {
        await ArcModelEvents.Request.readBulk(et, undefined, ['id']);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no ids when receiving the event', async () => {
      let thrown = false;
      try {
        const e = new CustomEvent(ArcModelEventTypes.Request.readBulk, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: { result: undefined },
        });
        // @ts-ignore
        e.requestType = 'saved';
        et.dispatchEvent(e);
        await e.detail.result;
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no requestType when receiving the event', async () => {
      let thrown = false;
      try {
        const e = new CustomEvent(ArcModelEventTypes.Request.readBulk, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: { result: undefined },
        });
        // @ts-ignore
        e.ids = [requests[0]._id, requests[1]._id];
        et.dispatchEvent(e);
        await e.detail.result;
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('ignores missing requests', async () => {
      const result = await ArcModelEvents.Request.readBulk(et, 'saved', [requests[0]._id, 'random-id']);
      assert.lengthOf(result, 1);
    });
  });

  describe(`the update event`, () => {
    after(async () => {
      await store.destroySaved();
      await store.destroyHistory();
    });

    /** @type RequestModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestModel();
      instance.listen(et);
    });

    afterEach(() => {
      instance.unlisten(et);
    });

    it('ignores cancelled events', async () => {
      instance.unlisten(et);
      instance.listen(window);
      document.body.addEventListener(ArcModelEventTypes.Request.update, function f(e) {
        e.preventDefault();
        document.body.removeEventListener(ArcModelEventTypes.Request.update, f);
      });
      const e = new CustomEvent(ArcModelEventTypes.Request.update, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { result: undefined },
      });
      // @ts-ignore
      e.requestType = 'saved';
      // @ts-ignore
      e.request = generator.http.saved();
      document.body.dispatchEvent(e);
      instance.unlisten(window);
      instance.listen(et);
      assert.isUndefined(e.detail.result);
    });

    it('saves a "history" item', async () => {
      const request = generator.http.history();
      const result = await ArcModelEvents.Request.update(et, 'history', request);
      assert.typeOf(result, 'object', 'result is an object');
      assert.typeOf(result.id, 'string', 'has created ID');
      assert.typeOf(result.rev, 'string', 'has created rev');
      assert.typeOf(result.item, 'object', 'has updated object');
      assert.equal(result.item._id, result.id, 'the id of the change record and the entity match');
      assert.equal(result.item._rev, result.rev, 'the revision of the change record and the entity match');
    });

    it('saves a "saved" item', async () => {
      const request = generator.http.saved();
      const result = await ArcModelEvents.Request.update(et, 'saved', request);
      assert.typeOf(result, 'object', 'result is an object');
      assert.typeOf(result.id, 'string', 'has created ID');
      assert.typeOf(result.rev, 'string', 'has created rev');
      assert.typeOf(result.item, 'object', 'has updated object');
      assert.equal(result.item._id, result.id, 'the id of the change record and the entity match');
      assert.equal(result.item._rev, result.rev, 'the revision of the change record and the entity match');
    });

    it('throws when no requestType when constructing the event', async () => {
      const request = generator.http.saved();
      let thrown = false;
      try {
        await ArcModelEvents.Request.update(et, undefined, request);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no requestType when receiving the event', async () => {
      let thrown = false;
      try {
        const e = new CustomEvent(ArcModelEventTypes.Request.update, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: { result: undefined },
        });
        // @ts-ignore
        e.request = generator.http.saved();
        et.dispatchEvent(e);
        await e.detail.result;
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no request when constructing the event', async () => {
      let thrown = false;
      try {
        await ArcModelEvents.Request.update(et, 'saved', undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no requestType when receiving the event', async () => {
      let thrown = false;
      try {
        const e = new CustomEvent(ArcModelEventTypes.Request.update, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: { result: undefined },
        });
        // @ts-ignore
        e.requestType = 'saved';
        et.dispatchEvent(e);
        await e.detail.result;
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when unknown type', async () => {
      const request = generator.http.saved();
      let thrown = false;
      try {
        await ArcModelEvents.Request.update(et, 'unknown', request);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe(`the update bulk event`, () => {
    after(async () => {
      await store.destroySaved();
      await store.destroyHistory();
    });

    /** @type RequestModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestModel();
      instance.listen(et);
    });

    afterEach(() => {
      instance.unlisten(et);
    });

    it('ignores cancelled events', async () => {
      instance.unlisten(et);
      instance.listen(window);
      document.body.addEventListener(ArcModelEventTypes.Request.updateBulk, function f(e) {
        e.preventDefault();
        document.body.removeEventListener(ArcModelEventTypes.Request.updateBulk, f);
      });
      const e = new CustomEvent(ArcModelEventTypes.Request.updateBulk, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { result: undefined },
      });
      // @ts-ignore
      e.requestType = 'saved';
      // @ts-ignore
      e.requests = generator.http.savedData();
      document.body.dispatchEvent(e);
      instance.unlisten(window);
      instance.listen(et);
      assert.isUndefined(e.detail.result);
    });

    it('saves a "history" item', async () => {
      const requests = generator.http.listHistory();
      const result = await ArcModelEvents.Request.updateBulk(et, 'history', requests);
      assert.typeOf(result, 'array', 'result is an array');
      const [change] = result;
      assert.typeOf(change.id, 'string', 'has created ID');
      assert.typeOf(change.rev, 'string', 'has created rev');
      assert.typeOf(change.item, 'object', 'has updated object');
      assert.equal(change.item._id, change.id, 'the id of the change record and the entity match');
      assert.equal(change.item._rev, change.rev, 'the revision of the change record and the entity match');
    });

    it('saves a "saved" item', async () => {
      const generated = generator.http.savedData();
      // @ts-ignore
      const requests = /** @type ARCSavedRequest[] */ (generated.requests);
      const result = await ArcModelEvents.Request.updateBulk(et, 'saved', requests);
      assert.typeOf(result, 'array', 'result is an array');
      const [change] = result;
      assert.typeOf(change.id, 'string', 'has created ID');
      assert.typeOf(change.rev, 'string', 'has created rev');
      assert.typeOf(change.item, 'object', 'has updated object');
      assert.equal(change.item._id, change.id, 'the id of the change record and the entity match');
      assert.equal(change.item._rev, change.rev, 'the revision of the change record and the entity match');
    });

    it('throws when no requestType when constructing the event', async () => {
      const requests = /** @type ARCSavedRequest[] */ (generator.http.savedData().requests);
      let thrown = false;
      try {
        await ArcModelEvents.Request.updateBulk(et, undefined, requests);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no requestType when receiving the event', async () => {
      let thrown = false;
      try {
        const e = new CustomEvent(ArcModelEventTypes.Request.updateBulk, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: { result: undefined },
        });
        // @ts-ignore
        e.requests = generator.http.savedData();
        et.dispatchEvent(e);
        await e.detail.result;
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no requests when constructing the event', async () => {
      let thrown = false;
      try {
        await ArcModelEvents.Request.updateBulk(et, 'saved', undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no requestType when receiving the event', async () => {
      let thrown = false;
      try {
        const e = new CustomEvent(ArcModelEventTypes.Request.updateBulk, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: { result: undefined },
        });
        // @ts-ignore
        e.requestType = 'saved';
        et.dispatchEvent(e);
        await e.detail.result;
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe(`the delete event`, () => {
    let requests = /** @type ARCSavedRequest[] */ (null);
    before(async () => {
      const data = await store.insertSaved(undefined, undefined, {
        forceProject: true,
      });
      requests = data.requests;
    });

    after(async () => {
      await store.destroySaved();
      await store.destroyHistory();
    });

    /** @type RequestModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestModel();
      instance.listen(et);
    });

    afterEach(() => {
      instance.unlisten(et);
    });

    it('ignores cancelled events', async () => {
      instance.unlisten(et);
      instance.listen(window);
      document.body.addEventListener(ArcModelEventTypes.Request.delete, function f(e) {
        e.preventDefault();
        document.body.removeEventListener(ArcModelEventTypes.Request.delete, f);
      });
      const e = new CustomEvent(ArcModelEventTypes.Request.delete, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { result: undefined },
      });
      // @ts-ignore
      e.requestType = 'saved';
      // @ts-ignore
      e.requests = generator.http.savedData();
      document.body.dispatchEvent(e);
      instance.unlisten(window);
      instance.listen(et);
      assert.isUndefined(e.detail.result);
    });

    it('removes an item from the data store', async () => {
      const request = requests[0];
      await ArcModelEvents.Request.delete(et, 'saved', request._id);
      let thrown = false;
      try {
        await ArcModelEvents.Request.read(et, 'saved', request._id);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no requestType', async () => {
      const request = requests[1];
      let thrown = false;
      try {
        await ArcModelEvents.Request.delete(et, undefined, request._id);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no entity in the data store', async () => {
      let thrown = false;
      try {
        await ArcModelEvents.Request.delete(et, 'saved', 'random-id-123');
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('returns delete record', async () => {
      const request = requests[1];
      const record = await ArcModelEvents.Request.delete(et, 'saved', request._id);
      assert.equal(record.id, request._id, 'has the id');
      assert.typeOf(record.rev, 'string', 'has a revision');
    });

    it('throws when no id when receiving the event', async () => {
      let thrown = false;
      try {
        const e = new CustomEvent(ArcModelEventTypes.Request.delete, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: { result: undefined },
        });
        // @ts-ignore
        e.requestType = 'saved';
        et.dispatchEvent(e);
        await e.detail.result;
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no requestType when receiving the event', async () => {
      const request = requests[2];
      let thrown = false;
      try {
        const e = new CustomEvent(ArcModelEventTypes.Request.delete, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: { result: undefined },
        });
        // @ts-ignore
        e.id = request._id;
        et.dispatchEvent(e);
        await e.detail.result;
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe(`the delete bulk event`, () => {
    let requests = /** @type ARCSavedRequest[] */ (null);
    before(async () => {
      const data = await store.insertSaved(undefined, undefined, {
        forceProject: true,
      });
      requests = data.requests;
    });

    after(async () => {
      await store.destroySaved();
      await store.destroyHistory();
    });

    /** @type RequestModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestModel();
      instance.listen(et);
    });

    afterEach(() => {
      instance.unlisten(et);
    });

    it('ignores cancelled events', async () => {
      instance.unlisten(et);
      instance.listen(window);
      document.body.addEventListener(ArcModelEventTypes.Request.deleteBulk, function f(e) {
        e.preventDefault();
        document.body.removeEventListener(ArcModelEventTypes.Request.deleteBulk, f);
      });
      const e = new CustomEvent(ArcModelEventTypes.Request.deleteBulk, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { result: undefined },
      });
      // @ts-ignore
      e.requestType = 'saved';
      // @ts-ignore
      e.requests = generator.http.savedData();
      document.body.dispatchEvent(e);
      instance.unlisten(window);
      instance.listen(et);
      assert.isUndefined(e.detail.result);
    });

    it('removes items from the data store', async () => {
      const request = requests[0];
      await ArcModelEvents.Request.deleteBulk(et, 'saved', [request._id]);
      let thrown = false;
      try {
        await ArcModelEvents.Request.read(et, 'saved', request._id);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no requestType', async () => {
      const request = requests[1];
      let thrown = false;
      try {
        await ArcModelEvents.Request.deleteBulk(et, undefined, [request._id]);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no ids', async () => {
      let thrown = false;
      try {
        await ArcModelEvents.Request.deleteBulk(et, 'saved', undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('ignores unknown entities', async () => {
      const request = requests[2];
      const result = await ArcModelEvents.Request.deleteBulk(et, 'saved', [request._id, 'random-id-123']);
      assert.lengthOf(result, 1);
    });

    it('returns delete record', async () => {
      const request = requests[3];
      const result = await ArcModelEvents.Request.deleteBulk(et, 'saved', [request._id, 'random-id-123']);
      const [record] = result;
      assert.equal(record.id, request._id, 'has the id');
      assert.typeOf(record.rev, 'string', 'has a revision');
    });

    it('throws when no id when receiving the event', async () => {
      let thrown = false;
      try {
        const e = new CustomEvent(ArcModelEventTypes.Request.deleteBulk, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: { result: undefined },
        });
        // @ts-ignore
        e.requestType = 'saved';
        et.dispatchEvent(e);
        await e.detail.result;
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no requestType when receiving the event', async () => {
      const request = requests[4];
      let thrown = false;
      try {
        const e = new CustomEvent(ArcModelEventTypes.Request.delete, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: { result: undefined },
        });
        // @ts-ignore
        e.id = [request._id];
        et.dispatchEvent(e);
        await e.detail.result;
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe(`The undelete bulk event`, () => {
    let doc = /** @type ARCSavedRequest */ (null);
    const type = 'saved';

    after(async () => {
      await store.destroySaved();
      await store.destroyHistory();
    });

    /** @type RequestModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestModel();
      instance.listen(et);
      const request = generator.http.saved();
      const record = await instance.post(type, request);
      doc = /** @type ARCSavedRequest */ (record.item);
      const result = await instance.delete(type, doc._id, doc._rev);
      doc._rev = result.rev;
    });

    afterEach(() => {
      instance.unlisten(et);
    });

    function deleted(d) {
      return {
        id: d._id,
        rev: d._rev,
      }
    }

    it('ignores cancelled events', async () => {
      instance.unlisten(et);
      instance.listen(window);
      document.body.addEventListener(ArcModelEventTypes.Request.undeleteBulk, function f(e) {
        e.preventDefault();
        document.body.removeEventListener(ArcModelEventTypes.Request.undeleteBulk, f);
      });
      const e = new CustomEvent(ArcModelEventTypes.Request.undeleteBulk, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { result: undefined },
      });
      // @ts-ignore
      e.requestType = 'saved';
      // @ts-ignore
      e.requests = generator.http.savedData();
      document.body.dispatchEvent(e);
      instance.unlisten(window);
      instance.listen(et);
      assert.isUndefined(e.detail.result);
    });

    it('restores deleted items', async () => {
      const result = await ArcModelEvents.Request.undeleteBulk(et, 'saved', [deleted(doc)]);
      const updatedRev = result[0].item._rev;
      assert.equal(updatedRev.indexOf('3-'), 0, 'The rev property is updated.');
      const data = await store.getDatastoreRequestData();
      const [item] = data;
      assert.equal(item._id, doc._id, 'is the same item');
      assert.equal(item._rev, updatedRev, 'has new revision');
    });

    it('throws when no requests when receiving the event', async () => {
      let thrown = false;
      try {
        const e = new CustomEvent(ArcModelEventTypes.Request.undeleteBulk, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: { result: undefined },
        });
        // @ts-ignore
        e.requestType = 'saved';
        et.dispatchEvent(e);
        await e.detail.result;
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no requestType when receiving the event', async () => {
      let thrown = false;
      try {
        const e = new CustomEvent(ArcModelEventTypes.Request.undeleteBulk, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: { result: undefined },
        });
        // @ts-ignore
        e.requests = [deleted(doc)];
        et.dispatchEvent(e);
        await e.detail.result;
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe(`The store event`, () => {
    after(async () => {
      await store.destroyHistory();
      await store.destroySaved();
    });

    /** @type RequestModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestModel();
      instance.listen(et);
    });

    afterEach(() => {
      instance.unlisten(et);
    });

    it('ignores cancelled events', async () => {
      instance.unlisten(et);
      instance.listen(window);
      document.body.addEventListener(ArcModelEventTypes.Request.store, function f(e) {
        e.preventDefault();
        document.body.removeEventListener(ArcModelEventTypes.Request.store, f);
      });
      const e = new CustomEvent(ArcModelEventTypes.Request.store, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { result: undefined },
      });
      // @ts-ignore
      e.requestType = 'saved';
      // @ts-ignore
      e.request = generator.http.saved();
      document.body.dispatchEvent(e);
      instance.unlisten(window);
      instance.listen(et);
      assert.isUndefined(e.detail.result);
    });

    it('returns the change record for a history entity', async () => {
      const request = generator.http.history();
      const result = await ArcModelEvents.Request.store(et, 'history', request);
      assert.typeOf(result, 'object', 'has the change record');
      assert.typeOf(result.id, 'string', 'has the id');
      assert.typeOf(result.rev, 'string', 'has the rev');
    });

    it('returns the change record for a saved entity', async () => {
      const request = generator.http.saved();
      const result = await ArcModelEvents.Request.store(et, 'saved', request);
      assert.typeOf(result, 'object', 'has the change record');
      assert.typeOf(result.id, 'string', 'has the id');
      assert.typeOf(result.rev, 'string', 'has the rev');
    });

    it('stores request with a new project', async () => {
      const request = generator.http.saved();
      const result = await ArcModelEvents.Request.store(et, 'saved', request, ['test']);
      // @ts-ignore
      assert.lengthOf(result.item.projects, 1, 'has project id');
      const projects = await store.getDatastoreProjectsData();
      assert.lengthOf(projects, 1, 'has created project');
    });

    it('throws when unknown type', async () => {
      const request = generator.http.saved();
      let thrown = false;
      try {
        await ArcModelEvents.Request.store(et, 'other', request);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe(`The projects list event`, () => {
    let project;
    let projects = /** @type ARCProject[] */ (null);
    before(async () => {
      const data = await store.insertSaved(undefined, undefined, {
        forceProject: true,
      });
      projects = /** @type ARCProject[] */ (data.projects);
      for (let i = 0; i < data.projects.length; i++) {
        if (projects[i].requests && projects[i].requests.length) {
          project = data.projects[i];
          break;
        }
      }
      if (!project) {
        throw new Error('Unable to find a project with requests.');
      }
    });

    after(async () => {
      await store.destroySaved();
    });

    /** @type RequestModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestModel();
      instance.listen(et);
    });

    afterEach(() => {
      instance.unlisten(et);
    });

    it('ignores cancelled events', async () => {
      instance.unlisten(et);
      instance.listen(window);
      document.body.addEventListener(ArcModelEventTypes.Request.projectlist, function f(e) {
        e.preventDefault();
        document.body.removeEventListener(ArcModelEventTypes.Request.projectlist, f);
      });
      const e = new CustomEvent(ArcModelEventTypes.Request.projectlist, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { result: undefined },
      });
      // @ts-ignore
      e.requestType = 'saved';
      // @ts-ignore
      e.request = generator.http.saved();
      document.body.dispatchEvent(e);
      instance.unlisten(window);
      instance.listen(et);
      assert.isUndefined(e.detail.result);
    });

    it('returns project requests', async () => {
      const result = await ArcModelEvents.Request.projectlist(et, project._id);
      assert.typeOf(result, 'array');
      assert.lengthOf(result, project.requests.length);
    });
  });

  describe(`The query event`, () => {
    let requests = /** @type ARCSavedRequest[] */ (null);
    before(async () => {
      const data = await store.insertSaved(3);
      requests = data.requests;
      const indexer = new UrlIndexer(window);
      const indexable = requests.map((r) => ({
          id: r._id,
          type: r.type,
          url: r.url,
        }));
      await indexer.index(indexable);
    });

    after(async () => {
      await store.destroySaved();
      await store.destroyHistory();
      const indexer = new UrlIndexer(window);
      await indexer.clearIndexedData();
    });

    /** @type RequestModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestModel();
      instance.listen(et);
    });

    afterEach(() => {
      instance.unlisten(et);
    });

    it('ignores cancelled events', async () => {
      instance.unlisten(et);
      instance.listen(window);
      document.body.addEventListener(ArcModelEventTypes.Request.query, function f(e) {
        e.preventDefault();
        document.body.removeEventListener(ArcModelEventTypes.Request.query, f);
      });
      const e = new CustomEvent(ArcModelEventTypes.Request.query, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { result: undefined },
      });
      // @ts-ignore
      e.requestType = 'saved';
      // @ts-ignore
      e.term = 'test';
      document.body.dispatchEvent(e);
      instance.unlisten(window);
      instance.listen(et);
      assert.isUndefined(e.detail.result);
    });

    it('returns query requests', async () => {
      const result = await ArcModelEvents.Request.query(et, requests[0].name);
      assert.typeOf(result, 'array');
      assert.isAbove(result.length, 0);
    });
  });

  describe(`The list event`, () => {
    before(async () => {
      const data = await store.insertSaved(30);
      const indexer = new UrlIndexer(window);
      const indexable = data.requests.map((r) => ({
          id: r._id,
          type: r.type,
          url: r.url,
        }));
      await indexer.index(indexable);
    });

    after(async () => {
      await store.destroySaved();
      await store.destroyHistory();
      const indexer = new UrlIndexer(window);
      await indexer.clearIndexedData();
    });

    /** @type RequestModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestModel();
      instance.listen(et);
    });

    afterEach(() => {
      instance.unlisten(et);
    });

    it('ignores cancelled events', async () => {
      instance.unlisten(et);
      instance.listen(window);
      document.body.addEventListener(ArcModelEventTypes.Request.list, function f(e) {
        e.preventDefault();
        document.body.removeEventListener(ArcModelEventTypes.Request.list, f);
      });
      const e = new CustomEvent(ArcModelEventTypes.Request.list, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { result: undefined },
      });
      // @ts-ignore
      e.requestType = 'saved';
      // @ts-ignore
      e.term = 'test';
      document.body.dispatchEvent(e);
      instance.unlisten(window);
      instance.listen(et);
      assert.isUndefined(e.detail.result);
    });

    it('returns list result record', async () => {
      const result = await ArcModelEvents.Request.list(et, 'saved');
      assert.typeOf(result, 'object', 'the result is an object');
      assert.typeOf(result.items, 'array', 'has the items array');
      assert.typeOf(result.nextPageToken, 'string', 'has the page token');
    });

    it('respects "limit" parameter', async () => {
      const result = await ArcModelEvents.Request.list(et, 'saved', {
        limit: 5,
      });
      assert.lengthOf(result.items, 5);
    });

    it('respects "nextPageToken" parameter', async () => {
      const result1 = await ArcModelEvents.Request.list(et, 'saved', {
        limit: 10,
      });
      const result2 = await ArcModelEvents.Request.list(et, 'saved', {
        nextPageToken: result1.nextPageToken,
      });
      assert.lengthOf(result2.items, 20);
    });

    it('throws when no requestType when receiving the event', async () => {
      let thrown = false;
      try {
        const e = new CustomEvent(ArcModelEventTypes.Request.list, {
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

    it('throws when no requestType when constructing the event', async () => {
      let thrown = false;
      try {
        await ArcModelEvents.Request.list(et, undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe(`The destroy event`, () => {
    /** @type RequestModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestModel();
      instance.listen(et);
    });

    afterEach(() => {
      instance.unlisten(et);
    });

    it('calls deleteModel() with data store name', async () => {
      const spy = sinon.spy(instance, 'deleteModel');
      await ArcModelEvents.destroy(et, ['saved-requests']);
      assert.isTrue(spy.calledOnce, 'function was called');
      // argument is normalized
      assert.equal(spy.args[0][0], 'saved', 'passes the argument');
    });

    it('ignores when no stores in the request', async () => {
      const spy = sinon.spy(instance, 'deleteModel');
      await ArcModelEvents.destroy(et, []);
      assert.isFalse(spy.called);
    });

    it('ignores when requesting different store', async () => {
      const spy = sinon.spy(instance, 'deleteModel');
      await ArcModelEvents.destroy(et, ['other']);
      assert.isFalse(spy.called);
    });
  });
});
