import { fixture, assert } from '@open-wc/testing';
import sinon from 'sinon';
import { ArcMock } from '@advanced-rest-client/arc-mock';
import { ArcModelEventTypes, ArcModelEvents } from '@advanced-rest-client/events';
import { RequestBaseModel } from '../../src/RequestBaseModel.js';
import { MockedStore, RequestModel } from '../../index.js';

/** @typedef {import('@advanced-rest-client/events').Project.ARCProject} ARCProject */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('@advanced-rest-client/events').Model.ARCEntityChangeRecord} ARCEntityChangeRecord */

describe('RequestBaseModel', () => {
  const store = new MockedStore();
  const generator = new ArcMock();
  const dbName = 'legacy-projects';
  
  async function etFixture() {
    return fixture(`<div></div>`);
  }

  describe('get savedDb()', () => {
    /** @type RequestBaseModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestBaseModel(dbName);
      instance.listen(et);
    });

    afterEach(() => {
      instance.unlisten(et);
    });

    it('returns an instance of PouchDB', () => {
      const result = instance.savedDb;
      assert.equal(result.constructor.name, 'PouchDB');
    });

    it('Instance has name set to saved-requests', () => {
      const result = instance.savedDb;
      assert.equal(result.name, 'saved-requests');
    });
  });

  describe('get historyDb()', () => {
    /** @type RequestBaseModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestBaseModel(dbName);
      instance.listen(et);
    });

    afterEach(() => {
      instance.unlisten(et);
    });

    it('Returns instance of PouchDB', () => {
      const result = instance.historyDb;
      assert.equal(result.constructor.name, 'PouchDB');
    });

    it('Instance has name set to history-requests', () => {
      const result = instance.historyDb;
      assert.equal(result.name, 'history-requests');
    });
  });

  describe('get projectDb()', () => {
    /** @type RequestBaseModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestBaseModel(dbName);
      instance.listen(et);
    });

    afterEach(() => {
      instance.unlisten(et);
    });

    it('Returns instance of PouchDB', () => {
      const result = instance.projectDb;
      assert.equal(result.constructor.name, 'PouchDB');
    });

    it('Instance has name set to history-requests', () => {
      const result = instance.projectDb;
      assert.equal(result.name, 'legacy-projects');
    });
  });

  describe('getDatabase()', () => {
    /** @type RequestBaseModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestBaseModel(dbName);
      instance.listen(et);
    });

    afterEach(() => {
      instance.unlisten(et);
    });

    [
      ['saved-requests', 'saved-requests'],
      ['saved', 'saved-requests'],
      ['history-requests', 'history-requests'],
      ['history', 'history-requests'],
      ['legacy-projects', 'legacy-projects'],
      ['projects', 'legacy-projects']
    ].forEach((item) => {
      it(`Returns store handler for "${item[0]}"`, () => {
        const result = instance.getDatabase(item[0]);
        assert.equal(result.constructor.name, 'PouchDB');
        assert.equal(result.name, item[1]);
      });
    });

    it('Throws error for unknown store', () => {
      assert.throws(() => {
        instance.getDatabase('unknown');
      });
    });
  });

  describe('deleteModel()', () => {
    /** @type RequestBaseModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestBaseModel(dbName);
      instance.listen(et);
    });

    afterEach(() => {
      instance.unlisten(et);
    });

    it('deletes the model', async () => {
      await instance.deleteModel('saved');
    });

    it('rejects when error', async () => {
      let thrown = false;
      try {
        await instance.deleteModel('unknown');
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('dispatches the state event', async () => {
      const spy = sinon.spy();
      et.addEventListener(ArcModelEventTypes.destroyed, spy);
      await instance.deleteModel('saved');
      const e = spy.args[0][0];
      assert.equal(e.store, 'saved');
    });
  });

  describe('updateProject()', () => {
    afterEach(() => store.clearLegacyProjects());

    /** @type RequestBaseModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestBaseModel(dbName);
      instance.listen(et);
    });

    afterEach(() => {
      instance.unlisten(et);
    });

    it('returns the change record', async () => {
      const project = generator.http.project();
      const result = await instance.updateProject(project);
      assert.typeOf(result, 'object', 'returns an object');
      assert.typeOf(result.id, 'string', 'has an id');
      assert.typeOf(result.rev, 'string', 'has a rev');
      assert.typeOf(result.item, 'object', 'has created object');
      assert.isUndefined(result.oldRev, 'has no oldRev');
    });

    it('creates an entity in the store', async () => {
      const project = generator.http.project();
      const result = await instance.updateProject(project);
      const doc = instance.projectDb.get(result.id);
      assert.ok(doc);
    });

    it('updates existing entity', async () => {
      const project = generator.http.project();
      const result1 = await instance.updateProject(project);
      result1.item.name = 'test-other';
      const result2 = await instance.updateProject(result1.item);
      assert.notEqual(result2.rev, result1.rev, '_rev is regenerated');
      assert.equal(result2.id, project._id, '_id is the same');
      assert.equal(result2.item.name, 'test-other', 'the name is set');
    });

    it('dispatches change event', async () => {
      const project = generator.http.project();
      const spy = sinon.spy();
      et.addEventListener(ArcModelEventTypes.Project.State.update, spy);
      await instance.updateProject(project);
      assert.isTrue(spy.calledOnce);
    });

    it('has change record on the event', async () => {
      const project = generator.http.project();
      const spy = sinon.spy();
      et.addEventListener(ArcModelEventTypes.Project.State.update, spy);
      await instance.updateProject(project);
      const { changeRecord } = spy.args[0][0];
      assert.isUndefined(changeRecord.oldRev);
      assert.typeOf(changeRecord.item, 'object');
    });
  });

  describe('readProject()', () => {
    afterEach(() => store.clearLegacyProjects());

    /** @type RequestBaseModel */
    let instance;
    /** @type Element */
    let et;
    let record = /** @type {ARCEntityChangeRecord} */ (null);
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestBaseModel(dbName);
      instance.listen(et);
      const project = generator.http.project();
      record = await instance.updateProject(project);
    });

    afterEach(() => {
      instance.unlisten(et);
    });

    it('reads project entity by the id only', async () => {
      const result = await instance.readProject(record.id)
      assert.equal(result._id, record.id);
    });

    it('reads project entity with a revision', async () => {
      record.item.name = 'test-updated';
      await instance.updateProject(record.item);
      const result = await instance.readProject(record.id, record.rev);
      assert.notEqual(result.name, 'test-updated');
    });

    it('throws when no id', async () => {
      let thrown = false;
      try {
        await instance.readProject(undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe('removeProject()', () => {
    afterEach(() => store.clearLegacyProjects());

    /** @type RequestBaseModel */
    let instance;
    /** @type Element */
    let et;
    let record = /** @type {ARCEntityChangeRecord} */ (null);
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestBaseModel(dbName);
      instance.listen(et);
      const project = generator.http.project();
      record = await instance.updateProject(project);
    });

    afterEach(() => {
      instance.unlisten(et);
    });

    it('removes object from the datastore with id only', async () => {
      await instance.removeProject(record.id);
      const list = await store.getDatastoreProjectsData();
      assert.deepEqual(list, []);
    });

    it('dispatches the state event', async () => {
      const spy = sinon.spy();
      et.addEventListener(ArcModelEventTypes.Project.State.delete, spy);
      await instance.removeProject(record.id);
      assert.isTrue(spy.calledOnce);
    });

    it('has change record on the event', async () => {
      const spy = sinon.spy();
      et.addEventListener(ArcModelEventTypes.Project.State.delete, spy);
      await instance.removeProject(record.id);
      const { id, rev } = spy.args[0][0];
      assert.equal(id, record.id, 'has the id');
      assert.notEqual(rev, record.rev, 'has different revision');
      assert.typeOf(rev, 'string', 'has the revision');
    });

    it('throws when no id', async () => {
      let thrown = false;
      try {
        await instance.removeProject(undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('calls removeProjectRequests()', async () => {
      const spy = sinon.spy(instance, 'removeProjectRequests');
      await instance.removeProject(record.id);
      assert.isTrue(spy.called);
    });
  });

  describe('removeProjectRequests()', () => {
    after(() => store.destroySaved());

    /** @type RequestBaseModel */
    let instance;
    /** @type Element */
    let et;
    let requestModel = /** @type {RequestModel} */ (null);
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestBaseModel(dbName);
      instance.listen(et);
      requestModel = new RequestModel();
      requestModel.listen(et);
    });

    afterEach(() => {
      instance.unlisten(et);
    });

    it('does nothing when project has no requests', async () => {
      const project = generator.http.project();
      const rec = await instance.updateProject(project);
      const spyRequestsDelete = sinon.spy();
      const spyRequestsUpdate = sinon.spy();
      et.addEventListener(ArcModelEventTypes.Request.deleteBulk, spyRequestsDelete);
      et.addEventListener(ArcModelEventTypes.Request.updateBulk, spyRequestsUpdate);
      await instance.removeProjectRequests(rec.id);
      assert.isFalse(spyRequestsDelete.called);
      assert.isFalse(spyRequestsUpdate.called);
    });

    it('removes requests exclusive for the project', async () => {
      const request = generator.http.saved();
      request._id = `request-${Date.now()}`
      const project = generator.http.project();
      project._id = `project-${Date.now()}`
      project.requests = [request._id];
      request.projects = [project._id];
      await instance.updateProject(project);
      await requestModel.post('saved', request);
      const spyRequestsDelete = sinon.spy();
      const spyRequestsUpdate = sinon.spy();
      et.addEventListener(ArcModelEventTypes.Request.deleteBulk, spyRequestsDelete);
      et.addEventListener(ArcModelEventTypes.Request.updateBulk, spyRequestsUpdate);
      await instance.removeProjectRequests(project._id);
      assert.isTrue(spyRequestsDelete.called, 'remove request event called');
      assert.isFalse(spyRequestsUpdate.called, 'update request event not called');

      let thrown = false;
      try {
        await requestModel.get('saved', request._id);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown, 'request does not exist in the data store');
    });

    it('updates requests with more than one project', async () => {
      const request = generator.http.saved();
      request._id = `request-${Date.now()}`
      const project = generator.http.project();
      project._id = `project-${Date.now()}`
      project.requests = [request._id];
      request.projects = [project._id, 'other'];
      await instance.updateProject(project);
      await requestModel.post('saved', request);
      const spyRequestsDelete = sinon.spy();
      const spyRequestsUpdate = sinon.spy();
      et.addEventListener(ArcModelEventTypes.Request.deleteBulk, spyRequestsDelete);
      et.addEventListener(ArcModelEventTypes.Request.updateBulk, spyRequestsUpdate);
      await instance.removeProjectRequests(project._id);
      assert.isFalse(spyRequestsDelete.called, 'remove request event not called');
      assert.isTrue(spyRequestsUpdate.called, 'update request event called');
      const dbRequest = await requestModel.get('saved', request._id);
      // @ts-ignore
      assert.deepEqual(dbRequest.projects, ['other']);
    });

    it('ignores unknown requests', async () => {
      const project = generator.http.project();
      project._id = `project-${Date.now()}`
      project.requests = ['a', 'b', 'c'];
      await instance.updateProject(project);
      const spyRequestsDelete = sinon.spy();
      const spyRequestsUpdate = sinon.spy();
      et.addEventListener(ArcModelEventTypes.Request.deleteBulk, spyRequestsDelete);
      et.addEventListener(ArcModelEventTypes.Request.updateBulk, spyRequestsUpdate);
      await instance.removeProjectRequests(project._id);
      assert.isFalse(spyRequestsDelete.called, 'remove request event not called');
      assert.isFalse(spyRequestsUpdate.called, 'update request event not called');
    });

    it('ignores when request has no projects', async () => {
      const request = generator.http.saved();
      request._id = `request-${Date.now()}`
      const project = generator.http.project();
      project._id = `project-${Date.now()}`
      project.requests = [request._id];
      delete request.projects;
      await instance.updateProject(project);
      await requestModel.post('saved', request);
      const spyRequestsDelete = sinon.spy();
      const spyRequestsUpdate = sinon.spy();
      et.addEventListener(ArcModelEventTypes.Request.deleteBulk, spyRequestsDelete);
      et.addEventListener(ArcModelEventTypes.Request.updateBulk, spyRequestsUpdate);
      await instance.removeProjectRequests(project._id);
      assert.isFalse(spyRequestsDelete.called, 'remove request event not called');
      assert.isFalse(spyRequestsUpdate.called, 'update request event not called');
    });

    it('ignores when request has only other projects', async () => {
      const request = generator.http.saved();
      request._id = `request-${Date.now()}`
      const project = generator.http.project();
      project._id = `project-${Date.now()}`
      project.requests = [request._id];
      request.projects = ['a', 'b', 'c'];
      await instance.updateProject(project);
      await requestModel.post('saved', request);
      const spyRequestsDelete = sinon.spy();
      const spyRequestsUpdate = sinon.spy();
      et.addEventListener(ArcModelEventTypes.Request.deleteBulk, spyRequestsDelete);
      et.addEventListener(ArcModelEventTypes.Request.updateBulk, spyRequestsUpdate);
      await instance.removeProjectRequests(project._id);
      assert.isFalse(spyRequestsDelete.called, 'remove request event not called');
      assert.isFalse(spyRequestsUpdate.called, 'update request event not called');
    });
  });

  describe('[deletemodelHandler]()', () => {
    /** @type RequestBaseModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestBaseModel(dbName);
      instance.listen(et);
      await store.insertSaved();
    });
    
    afterEach(async () => {
      instance.unlisten(et);
      await store.destroySaved();
    });

    it('clears requested data', async () => {
      await ArcModelEvents.destroy(et, ['legacy-projects']);
      const items = await store.getDatastoreProjectsData();
      assert.lengthOf(items, 0);
    });

    it('calls deleteModel() with the type name', async () => {
      const spy = sinon.spy(instance, 'deleteModel');
      await ArcModelEvents.destroy(et, ['legacy-projects']);
      assert.isTrue(spy.called, 'the function was called');
      assert.equal(spy.args[0][0], 'legacy-projects', 'passes the store name');
    });

    it('notifies about data destroy', async () => {
      const spy = sinon.spy();
      et.addEventListener(ArcModelEventTypes.destroyed, spy);
      await ArcModelEvents.destroy(et, ['legacy-projects']);
      assert.isTrue(spy.called, 'the event is dispatched');
    });

    it('ignores when no stores in the request', async () => {
      const spy = sinon.spy();
      et.addEventListener(ArcModelEventTypes.destroyed, spy);
      await ArcModelEvents.destroy(et, []);
      assert.isFalse(spy.called);
    });

    it('ignores when requesting different store', async () => {
      const spy = sinon.spy();
      et.addEventListener(ArcModelEventTypes.destroyed, spy);
      await ArcModelEvents.destroy(et, ['other']);
      assert.isFalse(spy.called);
    });
  });
});
