import { fixture, assert, oneEvent } from '@open-wc/testing';
import { ArcMock } from '@advanced-rest-client/arc-mock';
import { v4 } from '@advanced-rest-client/uuid';
import { ArcModelEventTypes } from '@advanced-rest-client/events';
import sinon from 'sinon';
import { MockedStore } from '../../index.js';
import { RequestModel } from '../../src/RequestModel.js';
import { ProjectModel } from '../../src/ProjectModel.js';

/** @typedef {import('@advanced-rest-client/events').ARCProjectUpdatedEvent} ARCProjectUpdatedEvent */
/** @typedef {import('@advanced-rest-client/events').ARCProjectDeleteEvent} ARCProjectDeleteEvent */
/** @typedef {import('@advanced-rest-client/events').Project.ARCProject} ARCProject */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('@advanced-rest-client/events').Model.ARCEntityChangeRecord} ARCEntityChangeRecord */

describe('ProjectModel', () => {
  const store = new MockedStore();
  const generator = new ArcMock();
  
  async function etFixture() {
    return fixture(`<div></div>`);
  }

  describe('post()', () => {
    /** @type ProjectModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ProjectModel();
      instance.listen(et);
    });

    after(async () => {
      await store.destroySaved();
    });

    it('returns an insert result', async () => {
      const project = generator.http.project();
      const result = await instance.post(project);
      assert.typeOf(result, 'object', 'returns an object');
      assert.typeOf(result.id, 'string', 'has an id');
      assert.typeOf(result.rev, 'string', 'has a rev');
      assert.typeOf(result.item, 'object', 'has created object');
      assert.isUndefined(result.oldRev, 'has no oldRev');
    });

    it('returns id and rev from created entity', async () => {
      const project = generator.http.project();
      const result = await instance.post(project);
      const { item, id, rev } = result;
      assert.equal(item._id, id, 'has item id');
      assert.equal(item._rev, rev, 'has item rev');
    });

    it('updates existing entity', async () => {
      const project = generator.http.project();
      const result1 = await instance.post(project);
      const { item: updated } = result1;
      updated.name = 'test';
      const result2 = await instance.post(updated);
      assert.equal(result2.item.name, 'test', 'has updated name');
    });

    it('updates revision', async () => {
      const project = generator.http.project();
      const result1 = await instance.post(project);
      const { item: updated } = result1;
      updated.name = 'test';
      const result2 = await instance.post(updated);
      assert.notEqual(result2.rev, result1.rev);
    });

    it('sets old revision when updating an entity', async () => {
      const project = generator.http.project();
      const result1 = await instance.post(project);
      const { item: updated, rev } = result1;
      updated.name = 'test';
      const result2 = await instance.post(updated);
      assert.equal(result2.oldRev, rev);
    });

    it('dispatches project update event', async () => {
      const project = generator.http.project();
      instance.post(project);
      const { changeRecord } = /** @type ARCProjectUpdatedEvent */ (await oneEvent(instance, ArcModelEventTypes.Project.State.update));
      assert.typeOf(changeRecord, 'object');
    });

    it('has change record values on the event', async () => {
      const project = generator.http.project();
      instance.post(project);
      const { changeRecord } = /** @type ARCProjectUpdatedEvent */ (await oneEvent(instance, ArcModelEventTypes.Project.State.update));
      assert.typeOf(changeRecord.id, 'string', 'has an id');
      assert.typeOf(changeRecord.rev, 'string', 'has a rev');
      assert.typeOf(changeRecord.item, 'object', 'has created object');
      assert.isUndefined(changeRecord.oldRev, 'has no oldRev');
    });

    it('throws when no project', async () => {
      let thrown = false;
      try {
        await instance.post(undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('generates a project id', async () => {
      const project = generator.http.project();
      delete project._id;
      const record = await instance.post(project);
      assert.typeOf(record.id, 'string');
    });

    it('updates already existing item with the rev value', async () => {
      const project = generator.http.project();
      await instance.post(project);
      project.name = 'test';
      delete project._rev;
      const result = await instance.post(project);
      assert.equal(result.item.name, 'test');
    });
  });

  describe('postBulk()', () => {
    /** @type ProjectModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ProjectModel();
      instance.listen(et);
    });

    after(async () => {
      await store.destroySaved();
    });

    it('returns a list of insert result', async () => {
      const projects = generator.http.listProjects(2);
      const results = await instance.postBulk(projects);
      assert.typeOf(results, 'array', 'returns an array');
      assert.lengthOf(results, 2, 'returns an array');
      const [result] = results;
      assert.typeOf(result.id, 'string', 'has an id');
      assert.typeOf(result.rev, 'string', 'has a rev');
      assert.typeOf(result.item, 'object', 'has created object');
      assert.isUndefined(result.oldRev, 'has no oldRev');
    });

    it('updates entities in bulk', async () => {
      const projects = generator.http.listProjects(2);
      const results1 = await instance.postBulk(projects);
      const updated = [ results1[0].item, results1[1].item ];
      const results2 = await instance.postBulk(updated);
      assert.typeOf(results2, 'array', 'returns an array');
      assert.lengthOf(results2, 2, 'returns an array');
      assert.notEqual(results2[0].rev, results1[0].rev, 'revision #1 is different');
      assert.notEqual(results2[1].rev, results1[1].rev, 'revision #2 is different');
    });

    it('dispatches change event for each updated object', async () => {
      const projects = generator.http.listProjects(2);
      const spy = sinon.spy();
      instance.addEventListener(ArcModelEventTypes.Project.State.update, spy);
      await instance.postBulk(projects);
      assert.equal(spy.callCount, 2);
    });

    it('throws when no projects', async () => {
      let thrown = false;
      try {
        await instance.postBulk(undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when empty projects', async () => {
      let thrown = false;
      try {
        await instance.postBulk([]);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe('get()', () => {
    let created = /** @type ARCProject[] */ (null);
    before(async () => {
      const et = await etFixture();
      const instance = new ProjectModel();
      instance.listen(et);
      const projects = generator.http.listProjects(2);
      const results = await instance.postBulk(projects);
      created = results.map((item) => item.item);
    });

    /** @type ProjectModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ProjectModel();
      instance.listen(et);
    });

    after(async () => {
      await store.destroySaved();
    });

    it('returns an item with the latest revision', async () => {
      const result = await instance.get(created[0]._id);
      assert.deepEqual(result, created[0]);
    });

    it('returns an item with specified revision', async () => {
      const result = await instance.get(created[0]._id, created[0]._rev);
      assert.deepEqual(result, created[0]);
    });

    it('returns an item with old revision', async () => {
      const { _rev, _id } = created[0];
      const update = await instance.post(created[0]);
      created[0] = update.item;
      const result = await instance.get(_id, _rev);
      assert.equal(result._rev, _rev);
    });
  });

  describe('getBulk()', () => {
    let created = /** @type ARCProject[] */ (null);
    before(async () => {
      const et = await etFixture();
      const instance = new ProjectModel();
      instance.listen(et);
      const projects = generator.http.listProjects(5);
      const results = await instance.postBulk(projects);
      created = results.map((item) => item.item);
    });

    /** @type ProjectModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ProjectModel();
      instance.listen(et);
    });

    after(async () => {
      await store.destroySaved();
    });

    it('returns the list of requested items', async () => {
      const ids = [created[0]._id, created[1]._id];
      const result = await instance.getBulk(ids);
      const p1 = await instance.get(created[0]._id);
      const p2 = await instance.get(created[1]._id);
      assert.deepEqual(result[0], p1);
      assert.deepEqual(result[1], p2);
    });

    it('throws when no arguments', async () => {
      let thrown = false;
      try {
        await instance.getBulk(undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe('list()', () => {
    before(async () => {
      const et = await etFixture();
      const instance = new ProjectModel();
      instance.listen(et);
      const projects = generator.http.listProjects(30);
      await instance.postBulk(projects);
    });

    /** @type ProjectModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ProjectModel();
      instance.listen(et);
    });

    after(async () => {
      await store.destroySaved();
    });

    it('returns a list result for default parameters', async () => {
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

  describe('listAll()', () => {
    let created;
    before(async () => {
      const et = await etFixture();
      const instance = new ProjectModel();
      instance.listen(et);
      const projects = generator.http.listProjects(30);
      created = await instance.postBulk(projects);
    });

    /** @type ProjectModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ProjectModel();
      instance.listen(et);
    });

    after(async () => {
      await store.destroySaved();
    });

    it('returns all projects', async () => {
      const result = await instance.listAll();
      assert.typeOf(result, 'array', 'result is an array');
      assert.lengthOf(result, 30, 'has all results');
    });

    it('returns only projects defined in keys', async () => {
      const result = await instance.listAll([created[0].id, created[1].id]);
      assert.typeOf(result, 'array', 'result is an array');
      assert.lengthOf(result, 2, 'has all results');
    });

    it('returns all when keys is empty', async () => {
      const result = await instance.listAll([]);
      assert.typeOf(result, 'array', 'result is an array');
      assert.lengthOf(result, 30, 'has all results');
    });

    it('returns empty array when empty', async () => {
      await store.destroySaved();
      const result = await instance.listAll();
      assert.typeOf(result, 'array', 'result is an array');
      assert.lengthOf(result, 0, 'has no results');
    });
  });

  describe('delete()', () => {
    let created = /** @type ARCEntityChangeRecord[] */ (null);
    before(async () => {
      const et = await etFixture();
      const instance = new ProjectModel();
      instance.listen(et);
      const projects = generator.http.listProjects(30);
      created = await instance.postBulk(projects);
    });

    /** @type ProjectModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ProjectModel();
      instance.listen(et);
    });

    after(async () => {
      await store.destroySaved();
    });

    it('deletes an entity', async () => {
      const [info] = created;
      const { id } = info;
      await instance.delete(id);
      let thrown = false;
      try {
        await instance.get(id);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown, 'Has no entity');
    });

    it('dispatches deleted events', async () => {
      const info = created[1];
      const { id } = info;
      instance.delete(id);
      const { id: deleteId, rev } = /** @type ARCProjectDeleteEvent */ (await oneEvent(instance, ArcModelEventTypes.Project.State.delete));
      assert.equal(deleteId, id);
      assert.typeOf(rev, 'string');
    });

    it('deletes an entity with revision', async () => {
      const info = created[2];
      const { id, rev } = info;
      await instance.delete(id, rev);
      let thrown = false;
      try {
        await instance.get(id);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown, 'Has no entity');
    });
  });

  describe('addRequest()', () => {
    /** @type ProjectModel */
    let instance;
    /** @type Element */
    let et;
    /** @type RequestModel */
    let requestModel;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ProjectModel();
      instance.listen(et);
      requestModel = new RequestModel(); 
      requestModel.listen(et);
    });

    after(async () => {
      await store.destroySaved();
    });

    it('adds request to a project', async () => {
      const request = generator.http.saved();
      const project = generator.http.project();
      const pRecord = await instance.updateProject(project);
      const rRecord = await requestModel.post('saved', request);
      await instance.addRequest(pRecord.id, rRecord.id, 'saved');
      const dbRequest = /** @type ARCSavedRequest */ (await requestModel.get('saved', rRecord.id));
      const { projects } = dbRequest;
      assert.deepEqual(projects, [pRecord.id]);
    });

    it('adds project to the request', async () => {
      const request = generator.http.saved();
      const project = generator.http.project();
      const pRecord = await instance.updateProject(project);
      const rRecord = await requestModel.post('saved', request);
      await instance.addRequest(pRecord.id, rRecord.id, 'saved');
      const dbProject = await instance.get(pRecord.id);
      const { requests } = dbProject;
      assert.deepEqual(requests, [rRecord.id]);
    });

    it('adds request to a project only once', async () => {
      const request = generator.http.saved();
      const project = generator.http.project();
      const pRecord = await instance.updateProject(project);
      const rRecord = await requestModel.post('saved', request);
      // @ts-ignore
      rRecord.item.projects = [pRecord.id];
      await requestModel.post('saved', rRecord.item);

      await instance.addRequest(pRecord.id, rRecord.id, 'saved');
      const dbRequest = /** @type ARCSavedRequest */ (await requestModel.get('saved', rRecord.id));
      const { projects } = dbRequest;
      assert.deepEqual(projects, [pRecord.id]);
    });

    it('adds project to the request only once', async () => {
      const request = generator.http.saved();
      const project = generator.http.project();
      const pRecord = await instance.updateProject(project);
      const rRecord = await requestModel.post('saved', request);

      pRecord.item.requests = [rRecord.id];
      await instance.post(pRecord.item);

      await instance.addRequest(pRecord.id, rRecord.id, 'saved');
      const dbProject = await instance.get(pRecord.id);
      const { requests } = dbProject;
      assert.deepEqual(requests, [rRecord.id]);
    });

    it('transforms history request to saved request', async () => {
      const request = generator.http.history();
      const project = generator.http.project();
      const pRecord = await instance.updateProject(project);
      const rRecord = await requestModel.post('history', request);
      
      const spy = sinon.spy();
      instance.addEventListener(ArcModelEventTypes.Request.State.update, spy);

      await instance.addRequest(pRecord.id, rRecord.id, 'history');
      const { changeRecord } = spy.args[0][0];

      const dbRequest = /** @type ARCSavedRequest */ (await requestModel.get('saved', changeRecord.id));
      assert.equal(dbRequest.name, 'Unnamed request');
      assert.equal(dbRequest.type, 'saved');
      const { projects } = dbRequest;
      assert.deepEqual(projects, [pRecord.id]);
    });

    it('adds request to a project at specified position', async () => {
      const request = generator.http.saved();
      request._id = v4();
      const project = generator.http.project();
      project._id = v4();
      project.requests = ['a', 'b', 'c', 'd', 'e'];
      await instance.updateProject(project);
      await requestModel.post('saved', request);
      
      await instance.addRequest(project._id, request._id, 'saved', 2);
      const dbProject = await instance.get(project._id);
      const { requests } = dbProject;
      assert.deepEqual(requests, ['a', 'b', request._id, 'c', 'd', 'e']);
    });
  });

  describe('moveRequest()', () => {
    /** @type ProjectModel */
    let instance;
    /** @type Element */
    let et;
    /** @type RequestModel */
    let requestModel;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ProjectModel();
      instance.listen(et);
      requestModel = new RequestModel(); 
      requestModel.listen(et);
    });

    after(async () => {
      await store.destroySaved();
    });

    it('removes the request from an existing projects', async () => {
      const request = generator.http.saved();
      request._id = v4();
      const sourceProject = generator.http.project();
      sourceProject._id = v4();
      const targetProject = generator.http.project();
      targetProject._id = v4();
      sourceProject.requests = [request._id];
      request.projects = [sourceProject._id];
      await instance.updateProject(sourceProject);
      await instance.updateProject(targetProject);
      await requestModel.post('saved', request);
      await instance.moveRequest(targetProject._id, request._id, 'saved');
      const project = await instance.get(sourceProject._id);
      assert.deepEqual(project.requests, []);
    });

    it('adds the request to another project', async () => {
      const request = generator.http.saved();
      request._id = v4();
      const sourceProject = generator.http.project();
      sourceProject._id = v4();
      const targetProject = generator.http.project();
      targetProject._id = v4();
      sourceProject.requests = [request._id];
      request.projects = [sourceProject._id];
      await instance.updateProject(sourceProject);
      await instance.updateProject(targetProject);
      await requestModel.post('saved', request);
      await instance.moveRequest(targetProject._id, request._id, 'saved');
      const project = await instance.get(targetProject._id);
      assert.deepEqual(project.requests, [request._id]);
    });

    it('adds the request at specific position', async () => {
      const request = generator.http.saved();
      request._id = v4();
      const sourceProject = generator.http.project();
      sourceProject._id = v4();
      const targetProject = generator.http.project();
      targetProject._id = v4();
      sourceProject.requests = [request._id];
      targetProject.requests = ['a', 'b', 'c', 'd', 'e'];
      request.projects = [sourceProject._id];
      await instance.updateProject(sourceProject);
      await instance.updateProject(targetProject);
      await requestModel.post('saved', request);

      await instance.moveRequest(targetProject._id, request._id, 'saved', 3);
      
      const project = await instance.get(targetProject._id);
      assert.deepEqual(project.requests, ['a', 'b', 'c', request._id, 'd', 'e']);
    });

    it('replaces projects in the request', async () => {
      const request = generator.http.saved();
      request._id = v4();
      const sourceProject = generator.http.project();
      sourceProject._id = v4();
      const targetProject = generator.http.project();
      targetProject._id = v4();
      sourceProject.requests = [request._id];
      request.projects = [sourceProject._id];
      await instance.updateProject(sourceProject);
      await instance.updateProject(targetProject);
      await requestModel.post('saved', request);
      await instance.moveRequest(targetProject._id, request._id, 'saved');
      const dbRequest = /** @type ARCSavedRequest */ (await requestModel.get('saved', request._id));
      assert.deepEqual(dbRequest.projects, [targetProject._id]);
    });

    it('adds to a target project only once', async () => {
      const request = generator.http.saved();
      request._id = v4();
      const sourceProject = generator.http.project();
      sourceProject._id = v4();
      const targetProject = generator.http.project();
      targetProject._id = v4();
      sourceProject.requests = [request._id];
      targetProject.requests = [request._id];
      request.projects = [sourceProject._id];
      await instance.updateProject(sourceProject);
      await instance.updateProject(targetProject);
      await requestModel.post('saved', request);
      await instance.moveRequest(targetProject._id, request._id, 'saved');
      const project = await instance.get(targetProject._id);
      assert.deepEqual(project.requests, [request._id]);
    });

    it('adds non-project request to a project', async () => {
      const request = generator.http.saved();
      request._id = v4();
      const sourceProject = generator.http.project();
      sourceProject._id = v4();
      const targetProject = generator.http.project();
      targetProject._id = v4();
      await instance.updateProject(sourceProject);
      await instance.updateProject(targetProject);
      await requestModel.post('saved', request);
      await instance.moveRequest(targetProject._id, request._id, 'saved');
      const project = await instance.get(targetProject._id);
      assert.deepEqual(project.requests, [request._id]);
      const dbRequest = /** @type ARCSavedRequest */ (await requestModel.get('saved', request._id));
      assert.deepEqual(dbRequest.projects, [targetProject._id]);
    });

    it('adds history request to a project', async () => {
      const request = generator.http.history();
      request._id = v4();
      const targetProject = generator.http.project();
      targetProject._id = v4();
      await instance.updateProject(targetProject);
      await requestModel.post('history', request);

      const spy = sinon.spy();
      instance.addEventListener(ArcModelEventTypes.Request.State.update, spy);
      await instance.moveRequest(targetProject._id, request._id, 'history');

      const { changeRecord } = spy.args[0][0];

      const dbRequest = /** @type ARCSavedRequest */ (await requestModel.get('saved', changeRecord.id));
      assert.equal(dbRequest.name, 'Unnamed request');
      assert.equal(dbRequest.type, 'saved');
      const { projects } = dbRequest;
      assert.deepEqual(projects, [targetProject._id]);

      const project = await instance.get(targetProject._id);
      assert.deepEqual(project.requests, [changeRecord.id]);
    });
  });

  describe('removeRequest()', () => {
    /** @type ProjectModel */
    let instance;
    /** @type Element */
    let et;
    /** @type RequestModel */
    let requestModel;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ProjectModel();
      instance.listen(et);
      requestModel = new RequestModel(); 
      requestModel.listen(et);
    });

    after(async () => {
      await store.destroySaved();
    });

    it('removes the request from a projects', async () => {
      const request = generator.http.saved();
      request._id = v4();
      const sourceProject = generator.http.project();
      sourceProject._id = v4();
      sourceProject.requests = [request._id];
      request.projects = [sourceProject._id];
      await instance.updateProject(sourceProject);
      await requestModel.post('saved', request);
      await instance.removeRequest(sourceProject._id, request._id);
      const project = await instance.get(sourceProject._id);
      assert.deepEqual(project.requests, []);
    });

    it('removes the project from the request', async () => {
      const request = generator.http.saved();
      request._id = v4();
      const sourceProject = generator.http.project();
      sourceProject._id = v4();
      sourceProject.requests = [request._id];
      request.projects = [sourceProject._id];
      await instance.updateProject(sourceProject);
      await requestModel.post('saved', request);
      await instance.removeRequest(sourceProject._id, request._id);
      const dbRequest = /** @type ARCSavedRequest */ (await requestModel.get('saved', request._id));
      assert.deepEqual(dbRequest.projects, []);
    });

    it('ignores when the project has no requests', async () => {
      const request = generator.http.saved();
      request._id = v4();
      const sourceProject = generator.http.project();
      sourceProject._id = v4();
      request.projects = [sourceProject._id];
      await instance.updateProject(sourceProject);
      await requestModel.post('saved', request);
      await instance.removeRequest(sourceProject._id, request._id);
      const project = await instance.get(sourceProject._id);
      assert.deepEqual(project.requests, []);
    });

    it('ignores when the request has no projects', async () => {
      const request = generator.http.saved();
      request._id = v4();
      const sourceProject = generator.http.project();
      sourceProject._id = v4();
      sourceProject.requests = [request._id];
      request.projects = [];
      await instance.updateProject(sourceProject);
      await requestModel.post('saved', request);
      await instance.removeRequest(sourceProject._id, request._id);
      const dbRequest = /** @type ARCSavedRequest */ (await requestModel.get('saved', request._id));
      assert.deepEqual(dbRequest.projects, []);
    });
  });
});
