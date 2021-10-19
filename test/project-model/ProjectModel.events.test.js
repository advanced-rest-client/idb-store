import { fixture, assert } from '@open-wc/testing';
import { ArcMock } from '@advanced-rest-client/arc-mock';
import sinon from 'sinon';
import { v4 } from '@advanced-rest-client/uuid';
import { ArcModelEventTypes, ArcModelEvents } from '@advanced-rest-client/events';
import { MockedStore } from '../../index.js';
import { RequestModel } from '../../src/RequestModel.js';
import { ProjectModel } from '../../src/ProjectModel.js';

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

  describe('Events API', () => {
    before(async () => {
      await store.destroySaved();
    });

    describe(ArcModelEventTypes.Project.update, () => {
      /** @type ProjectModel */
      let instance;
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new ProjectModel();
        instance.listen(et);
      });

      afterEach(() => {
        instance.unlisten(et);
      });

      after(async () => {
        await store.destroySaved();
      });

      it('returns an insert result', async () => {
        const project = generator.http.project();
        const result = await ArcModelEvents.Project.update(et, project);
        assert.typeOf(result, 'object', 'returns an object');
        assert.typeOf(result.id, 'string', 'has an id');
        assert.typeOf(result.rev, 'string', 'has a rev');
        assert.typeOf(result.item, 'object', 'has created object');
        assert.isUndefined(result.oldRev, 'has no oldRev');
      });

      it('calls post() function', async () => {
        const spy = sinon.spy(instance, 'post');
        const project = generator.http.project();
        await ArcModelEvents.Project.update(et, project);
        assert.isTrue(spy.called);
      });

      it('ignores the event when cancelled', async () => {
        instance.unlisten(et);
        instance.listen(window);
        document.body.addEventListener(ArcModelEventTypes.Project.update, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.Project.update, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.Project.update, {
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

    describe('The update bulk event', () => {
      /** @type ProjectModel */
      let instance;
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new ProjectModel();
        instance.listen(et);
      });

      afterEach(() => {
        instance.unlisten(et);
      });

      after(async () => {
        await store.destroySaved();
      });

      it('returns a list of insert result', async () => {
        const projects = generator.http.listProjects(2);
        const results = await ArcModelEvents.Project.updateBulk(et, projects);
        assert.typeOf(results, 'array', 'returns an array');
        assert.lengthOf(results, 2, 'returns an array');
        const [result] = results;
        assert.typeOf(result.id, 'string', 'has an id');
        assert.typeOf(result.rev, 'string', 'has a rev');
        assert.typeOf(result.item, 'object', 'has created object');
        assert.isUndefined(result.oldRev, 'has no oldRev');
      });

      it('calls postBulk() function', async () => {
        const spy = sinon.spy(instance, 'postBulk');
        const projects = generator.http.listProjects();
        await ArcModelEvents.Project.updateBulk(et, projects);
        assert.isTrue(spy.called);
      });

      it('ignores the event when cancelled', async () => {
        instance.unlisten(et);
        instance.listen(window);
        document.body.addEventListener(ArcModelEventTypes.Project.updateBulk, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.Project.updateBulk, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.Project.updateBulk, {
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

    describe(ArcModelEventTypes.Project.read, () => {
      let created = /** @type ARCProject[] */ (null);
      before(async () => {
        const et = await etFixture();
        const instance = new ProjectModel();
        instance.listen(et);
        const projects = generator.http.listProjects();
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

      afterEach(() => {
        instance.unlisten(et);
      });

      after(async () => {
        await store.destroySaved();
      });

      it('returns an item with the latest revision', async () => {
        const result = await ArcModelEvents.Project.read(et, created[0]._id);
        assert.deepEqual(result, created[0]);
      });

      it('calls readProject() function', async () => {
        const spy = sinon.spy(instance, 'readProject');
        await ArcModelEvents.Project.read(et, created[0]._id);
        assert.isTrue(spy.called);
      });

      it('ignores the event when cancelled', async () => {
        instance.unlisten(et);
        instance.listen(window);
        document.body.addEventListener(ArcModelEventTypes.Project.read, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.Project.read, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.Project.read, {
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

    describe(ArcModelEventTypes.Project.readBulk, () => {
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

      afterEach(() => {
        instance.unlisten(et);
      });

      after(async () => {
        await store.destroySaved();
      });

      it('returns the list of requested items', async () => {
        const ids = [created[0]._id, created[1]._id];
        const result = await ArcModelEvents.Project.readBulk(et, ids);
        const p1 = await instance.get(created[0]._id);
        const p2 = await instance.get(created[1]._id);
        assert.deepEqual(result[0], p1);
        assert.deepEqual(result[1], p2);
      });

      it('ignores the event when cancelled', async () => {
        instance.unlisten(et);
        instance.listen(window);
        document.body.addEventListener(ArcModelEventTypes.Project.readBulk, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.Project.readBulk, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.Project.readBulk, {
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

    describe(ArcModelEventTypes.Project.list, () => {
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

      afterEach(() => {
        instance.unlisten(et);
      });

      after(async () => {
        await store.destroySaved();
      });

      it('returns a list result for default parameters', async () => {
        const result = await ArcModelEvents.Project.list(et);
        assert.typeOf(result, 'object', 'result is an object');
        assert.typeOf(result.nextPageToken, 'string', 'has page token');
        assert.typeOf(result.items, 'array', 'has response items');
        assert.lengthOf(result.items, instance.defaultQueryOptions.limit, 'has default limit of items');
      });

      it('calls list() function', async () => {
        const spy = sinon.spy(instance, 'list');
        await ArcModelEvents.Project.list(et);
        assert.isTrue(spy.called);
      });

      it('ignores the event when cancelled', async () => {
        instance.unlisten(et);
        instance.listen(window);
        document.body.addEventListener(ArcModelEventTypes.Project.list, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.Project.list, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.Project.list, {
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

    describe(`${ArcModelEventTypes.Project.listAll} event`, () => {
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

      afterEach(() => {
        instance.unlisten(et);
      });

      after(async () => {
        await store.destroySaved();
      });

      it('returns all projects', async () => {
        const result = await ArcModelEvents.Project.listAll(et);
        assert.typeOf(result, 'array', 'result is an array');
        assert.lengthOf(result, 30, 'has all results');
      });

      it('returns only projects defined in keys', async () => {
        const result = await ArcModelEvents.Project.listAll(et, [created[0].id, created[1].id]);
        assert.typeOf(result, 'array', 'result is an array');
        assert.lengthOf(result, 2, 'has all results');
      });

      it('returns all when keys is empty', async () => {
        const result = await ArcModelEvents.Project.listAll(et, []);
        assert.typeOf(result, 'array', 'result is an array');
        assert.lengthOf(result, 30, 'has all results');
      });

      it('returns empty array when empty', async () => {
        await store.destroySaved();
        const result = await ArcModelEvents.Project.listAll(et);
        assert.typeOf(result, 'array', 'result is an array');
        assert.lengthOf(result, 0, 'has no results');
      });
    });

    describe(ArcModelEventTypes.Project.delete, () => {
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

      afterEach(() => {
        instance.unlisten(et);
      });

      after(async () => {
        await store.destroySaved();
      });

      it('deletes an entity', async () => {
        const info = created[0];
        const { id } = info;
        await ArcModelEvents.Project.delete(et, id);
        let thrown = false;
        try {
          await instance.get(id);
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown, 'Has no entity');
      });

      it('calls removeProject() function', async () => {
        const info = created[1];
        const { id } = info;
        const spy = sinon.spy(instance, 'removeProject');
        await ArcModelEvents.Project.delete(et, id);
        assert.isTrue(spy.called);
      });

      it('ignores the event when cancelled', async () => {
        instance.unlisten(et);
        instance.listen(window);
        document.body.addEventListener(ArcModelEventTypes.Project.delete, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.Project.delete, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.Project.delete, {
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
  
    describe(`${ArcModelEventTypes.Project.addTo} event`, () => {
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

      afterEach(() => {
        instance.unlisten(et);
      });

      after(async () => {
        await store.destroySaved();
      });

      it('adds request to a project', async () => {
        const request = generator.http.saved();
        const project = generator.http.project();
        const pRecord = await instance.updateProject(project);
        const rRecord = await requestModel.post('saved', request);

        await ArcModelEvents.Project.addTo(et, pRecord.id, rRecord.id, 'saved');

        const dbRequest = /** @type ARCSavedRequest */ (await requestModel.get('saved', rRecord.id));
        const { projects } = dbRequest;
        assert.deepEqual(projects, [pRecord.id]);
      });
  
      it('adds project to the request', async () => {
        const request = generator.http.saved();
        const project = generator.http.project();
        const pRecord = await instance.updateProject(project);
        const rRecord = await requestModel.post('saved', request);
        
        await ArcModelEvents.Project.addTo(et, pRecord.id, rRecord.id, 'saved');

        const dbProject = await instance.get(pRecord.id);
        const { requests } = dbProject;
        assert.deepEqual(requests, [rRecord.id]);
      });

      it('adds request to a project at specified position', async () => {
        const request = generator.http.saved();
        request._id = v4();
        const project = generator.http.project();
        project._id = v4();
        project.requests = ['a', 'b', 'c', 'd', 'e'];
        await instance.updateProject(project);
        await requestModel.post('saved', request);
        
        await ArcModelEvents.Project.addTo(et, project._id, request._id, 'saved', 2);

        const dbProject = await instance.get(project._id);
        const { requests } = dbProject;
        assert.deepEqual(requests, ['a', 'b', request._id, 'c', 'd', 'e']);
      });
    });

    describe(`${ArcModelEventTypes.Project.moveTo} event`, () => {
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

      afterEach(() => {
        instance.unlisten(et);
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

        await ArcModelEvents.Project.moveTo(et, targetProject._id, request._id, 'saved');

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
        
        await ArcModelEvents.Project.moveTo(et, targetProject._id, request._id, 'saved');

        const project = await instance.get(targetProject._id);
        assert.deepEqual(project.requests, [request._id]);
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
        
        await ArcModelEvents.Project.moveTo(et, targetProject._id, request._id, 'saved');

        const dbRequest = /** @type ARCSavedRequest */ (await requestModel.get('saved', request._id));
        assert.deepEqual(dbRequest.projects, [targetProject._id]);
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
  
        await ArcModelEvents.Project.moveTo(et, targetProject._id, request._id, 'saved', 3);
        
        const project = await instance.get(targetProject._id);
        assert.deepEqual(project.requests, ['a', 'b', 'c', request._id, 'd', 'e']);
      });
    });
  
    describe(`${ArcModelEventTypes.Project.removeFrom} event`, () => {
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

      afterEach(() => {
        instance.unlisten(et);
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

        await ArcModelEvents.Project.removeFrom(et, sourceProject._id, request._id);

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
        
        await ArcModelEvents.Project.removeFrom(et, sourceProject._id, request._id);

        const dbRequest = /** @type ARCSavedRequest */ (await requestModel.get('saved', request._id));
        assert.deepEqual(dbRequest.projects, []);
      });
    });
  });
});
