import { fixture, assert } from '@open-wc/testing';
import sinon from 'sinon';
import { TelemetryEventTypes, ArcModelEventTypes, ArcModelEvents, ARCModelDeleteEvent } from '@advanced-rest-client/events';
import { ArcBaseModel, notifyDestroyed, deletemodelHandler } from '../../src/ArcBaseModel.js';

/** @typedef {import('@advanced-rest-client/events').ARCModelStateDeleteEvent} ARCModelStateDeleteEvent */

/* eslint-disable require-atomic-updates */

describe('ArcBaseModel', () => {
  const STORE_NAME = 'todo-list';

  async function etFixture() {
    return fixture(`<div></div>`);
  }

  describe('Basics', () => {
    it('sets the store name in constructor', async () => {
      const instance = new ArcBaseModel(STORE_NAME);
      assert.equal(instance.name, STORE_NAME);
    });

    it('sets the reviews limit in constructor', async () => {
      const instance = new ArcBaseModel(STORE_NAME, 21);
      assert.equal(instance.revsLimit, 21);
    });

    it('uses the default event target', async () => {
      const instance = new ArcBaseModel(STORE_NAME);
      assert.isTrue(instance.eventsTarget === window);
    });
  });

  describe('get db()', () => {
    it('Throws error when store name is not set', async () => {
      const instance = new ArcBaseModel(undefined);
      instance.name = undefined;
      assert.throws(() => instance.db);
    });

    it('returns the PouchDB instance', async () => {
      const instance = new ArcBaseModel(STORE_NAME);
      const { db } = instance;
      assert.equal(db.constructor.name, 'PouchDB');
    });
  });

  describe('read()', () => {
    const insert = {
      _id: 'test-id',
      value: 'test-value',
    };
    const updated = 'test-update';
    let rev1;
    let rev2;
    before(async () => {
      const instance = new ArcBaseModel(STORE_NAME);
      const { db } = instance;
      const result = await db.put(insert);
      rev1 = result.rev;
      insert._rev = rev1;
      insert.updated = updated;
      const result2 = await db.put(insert);
      rev2 = result2.rev;
      insert._rev = rev2;
    });

    after(async () => {
      const instance = new ArcBaseModel(STORE_NAME);
      const { db } = instance;
      await db.destroy();
    });

    it('reads the latest revision', async () => {
      const instance = new ArcBaseModel(STORE_NAME);
      const doc = await instance.read(insert._id);
      // @ts-ignore
      assert.equal(doc._rev, rev2);
    });

    it('reads a specific revision', async () => {
      const instance = new ArcBaseModel(STORE_NAME);
      const doc = await instance.read(insert._id, rev1);
      // @ts-ignore
      assert.equal(doc._rev, rev1);
    });

    it('throws when no id', async () => {
      const instance = new ArcBaseModel(STORE_NAME);
      let thrown = false;
      try {
        await instance.read(undefined);
      } catch (_) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe('_handleException()', () => {
    /** @type ArcBaseModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ArcBaseModel(STORE_NAME);
      instance.listen(et);
    });

    it('Throws the error', () => {
      assert.throws(() => {
        instance._handleException(new Error('test'));
      });
    });

    it('does not throw when noThrow is set', () => {
      instance._handleException(new Error('test'), true);
    });

    it(`dispatches ${TelemetryEventTypes.exception} event`, () => {
      const spy = sinon.spy();
      et.addEventListener(TelemetryEventTypes.exception, spy);
      instance._handleException(new Error('test'), true);
      assert.isTrue(spy.called);
    });

    it('the event has exception details', () => {
      const spy = sinon.spy();
      et.addEventListener(TelemetryEventTypes.exception, spy);
      instance._handleException(new Error('test'), true);
      assert.isTrue(spy.called);
      const { detail } = spy.args[0][0];
      assert.equal(detail.description, 'test', 'Message is set');
      assert.isTrue(detail.fatal, 'Is fatal exception');
    });

    it('Serializes non-error object', () => {
      const spy = sinon.spy();
      et.addEventListener(TelemetryEventTypes.exception, spy);
      instance._handleException({ test: true }, true);
      assert.isTrue(spy.called);
      const { detail } = spy.args[0][0];
      assert.equal(detail.description, '{"test":true}', 'Message is set');
    });
  });

  describe('[notifyDestroyed]()', () => {
    const storeName = 'test-store';
    /** @type ArcBaseModel */
    let instance;
    /** @type Element */
    let et;

    beforeEach(async () => {
      et = await etFixture();
      instance = new ArcBaseModel(STORE_NAME);
      instance.listen(et);
    });

    it('dispatches a custom event', () => {
      const spy = sinon.spy();
      et.addEventListener(ArcModelEventTypes.destroyed, spy);
      instance[notifyDestroyed](storeName);
      assert.isTrue(spy.called);
    });

    it('contains datastore on the detail object', () => {
      const spy = sinon.spy();
      et.addEventListener(ArcModelEventTypes.destroyed, spy);
      instance[notifyDestroyed](storeName);
      const e = /** @type ARCModelStateDeleteEvent */ (spy.args[0][0]);
      assert.equal(e.store, storeName);
    });

    it('is not cancelable', () => {
      const spy = sinon.spy();
      et.addEventListener(ArcModelEventTypes.destroyed, spy);
      instance[notifyDestroyed](storeName);
      const e = /** @type ARCModelStateDeleteEvent */ (spy.args[0][0]);
      assert.isFalse(e.cancelable);
    });

    it('bubbles', () => {
      const spy = sinon.spy();
      et.addEventListener(ArcModelEventTypes.destroyed, spy);
      instance[notifyDestroyed](storeName);
      const e = /** @type ARCModelStateDeleteEvent */ (spy.args[0][0]);
      assert.isTrue(e.bubbles);
    });

    it('is composed', () => {
      const spy = sinon.spy();
      et.addEventListener(ArcModelEventTypes.destroyed, spy);
      instance[notifyDestroyed](storeName);
      const e = /** @type ARCModelStateDeleteEvent */ (spy.args[0][0]);
      assert.isTrue(e.composed);
    });
  });

  describe('deleteModel()', () => {
    /** @type ArcBaseModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ArcBaseModel(STORE_NAME);
      instance.listen(et);
    });

    it('deletes the model', async () => {
      await instance.deleteModel();
    });

    it('dispatches the state event', async () => {
      const spy = sinon.spy();
      et.addEventListener(ArcModelEventTypes.destroyed, spy);
      await instance.deleteModel();
      assert.isTrue(spy.called);
      const e = /** @type ARCModelStateDeleteEvent */ (spy.args[0][0]);
      assert.equal(e.store, instance.name);
    });

    it('rejects the promise when datastore error', async () => {
      let called = false;
      instance.name = undefined;
      try {
        await instance.deleteModel();
      } catch (_) {
        called = true;
      }
      if (!called) {
        throw new Error('Not rejected');
      }
    });
  });

  describe('_eventCancelled()', () => {
    /** @type ArcBaseModel */
    let instance;
    beforeEach(async () => {
      instance = new ArcBaseModel(STORE_NAME);
    });

    it('returns true when event is canceled', () => {
      const e = new CustomEvent('test', {
        cancelable: true,
      });
      e.preventDefault();
      e.stopPropagation();
      const result = instance._eventCancelled(e);
      assert.isTrue(result);
    });

    it('returns true when event is cancelable', () => {
      const e = new CustomEvent('test');
      const result = instance._eventCancelled(e);
      assert.isTrue(result);
    });

    it('returns false otherwise', () => {
      const e = new CustomEvent('test', {
        cancelable: true,
      });
      document.body.dispatchEvent(e);
      const result = instance._eventCancelled(e);
      assert.isFalse(result);
    });
  });

  describe('[deletemodelHandler]()', () => {
    /** @type ArcBaseModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ArcBaseModel(STORE_NAME);
      instance.listen(et);
    });

    it('is ignored when cancelled', async () => {
      instance.unlisten(et);
      instance.listen(window);
      document.body.addEventListener(ArcModelEventTypes.destroy, function f(e) {
        e.preventDefault();
        document.body.removeEventListener(ArcModelEventTypes.destroy, f);
      });
      const e = new ARCModelDeleteEvent(['test']);
      document.body.dispatchEvent(e);
      instance[deletemodelHandler](e);
      instance.unlisten(window);
      assert.isUndefined(e.detail.result);
    });

    it('is ignored for different name', async () => {
      const e = new ARCModelDeleteEvent(['test']);
      et.dispatchEvent(e);
      assert.isEmpty(e.detail.result);
    });

    it('is ignored when no store names', () => {
      const e = new ARCModelDeleteEvent([]);
      et.dispatchEvent(e);
      assert.isUndefined(e.detail.result);
    });

    it('is processed with current name', async () => {
      const e = new ARCModelDeleteEvent([STORE_NAME]);
      et.dispatchEvent(e);
      assert.typeOf(e.detail.result, 'array');
      assert.lengthOf(e.detail.result, 1);
      return e.detail.result[0];
    });

    it('handles the event', async () => {
      const spy = sinon.spy(instance, 'deleteModel');
      await ArcModelEvents.destroy(et, [STORE_NAME]);
      assert.isTrue(spy.calledOnce);
    });
  });

  class EventableElement extends ArcBaseModel {
    constructor() {
      super('test');
      this._testEventHandler = this._testEventHandler.bind(this);
      this._calledCount = 0;
    }

    get called() {
      return this._calledCount > 0;
    }

    get calledOnce() {
      return this._calledCount === 1;
    }

    listen(node) {
      node.addEventListener('test-event', this._testEventHandler);
    }

    unlisten(node) {
      node.removeEventListener('test-event', this._testEventHandler);
    }

    _testEventHandler() {
      this._calledCount++;
    }
  }

  // function fire(type, bubbles, node) {
  //   const event = new CustomEvent(type, {
  //     cancelable: true,
  //     bubbles,
  //     composed: true,
  //   });
  //   (node || document.body).dispatchEvent(event);
  //   return event;
  // }

  describe('Listens on the event target', () => {
    /** @type EventableElement */
    let instance;
    /** @type Element */
    let et;

    beforeEach(async () => {
      et = await etFixture();
      instance = new EventableElement();
      instance.listen(et);
    });

    it('handles a bubbling event', () => {
      const e = new Event('test-event', { bubbles: true });
      et.dispatchEvent(e);
      assert.isTrue(instance.calledOnce);
    });

    it('does not receives an event from parent', () => {
      const e = new Event('test-event', { bubbles: true });
      document.body.parentElement.dispatchEvent(e);
      assert.isFalse(instance.calledOnce);
    });
  });

  describe('encodePageToken()', () => {
    /** @type ArcBaseModel */
    let instance;
    beforeEach(async () => {
      instance = new ArcBaseModel(STORE_NAME);
    });

    it('returns a string', () => {
      const result = instance.encodePageToken({ test: true });
      assert.typeOf(result, 'string');
    });

    it('encodes parameters', () => {
      const token = instance.encodePageToken({ test: true });
      const decoded = atob(token);
      const result = JSON.parse(decoded);
      assert.deepEqual(result, { test: true });
    });
  });

  describe('decodePageToken()', () => {
    /** @type ArcBaseModel */
    let instance;
    beforeEach(async () => {
      instance = new ArcBaseModel(STORE_NAME);
    });

    it('returns null when no argument', () => {
      const result = instance.decodePageToken(undefined);
      assert.equal(result, null);
    });

    it('returns null when invalid base64 value', () => {
      const result = instance.decodePageToken('invalid base64');
      assert.equal(result, null);
    });

    it('returns null when invalid JSON value', () => {
      const result = instance.decodePageToken(btoa('test value'));
      assert.equal(result, null);
    });

    it('returns decoded token', () => {
      const result = instance.decodePageToken(btoa('{"test":"value"}'));
      assert.deepEqual(result, { test: 'value' });
    });
  });
});
