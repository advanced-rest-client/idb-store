import { fixture, assert } from '@open-wc/testing';
import { ArcMock } from '@advanced-rest-client/arc-mock';
import { MockedStore, RequestModel } from '../../index.js';

/* eslint-disable prefer-destructuring */

/** @typedef {import('@advanced-rest-client/events').Project.ARCProject} ARCProject */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('../../src/types').InsertSavedResult} InsertSavedResult */

describe('RequestModel', () => {
  const store = new MockedStore();
  const generator = new ArcMock();
  
  async function etFixture() {
    return fixture(`<div></div>`);
  }

  function hasFormDataSupport() {
    const fd = new FormData();
    if (!('entries' in fd)) {
      return false;
    }
    return true;
  }

  const formDataTestRun = hasFormDataSupport() ? it : it.skip;

  describe('Saving request with form data', () => {
    const defaultRequest = {
      url: 'test-url',
      method: 'test-method',
      headers: 'test-headers',
      payload: new FormData(),
      name: 'test',
      type: 'saved',
    };

    /** @type RequestModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestModel();
      instance.listen(et);
      defaultRequest.payload = new FormData();
      defaultRequest.payload.append('test', 'value');
      defaultRequest.payload.append('file', new Blob(['a'], {
        type: 'application/x-test'
      }), 'test.txt');
    });

    afterEach(async () => {
      await store.destroySaved();
    });

    it('returns the same payload property', async () => {
      const result = await instance.post('saved', { ...defaultRequest });
      const { item } = result;
      assert.deepEqual(item.payload, defaultRequest.payload);
    });

    (formDataTestRun)('adds multipart to the saved entity', async () => {
      const result = await instance.post('saved', { ...defaultRequest });
      const item = await instance.savedDb.get(result.id);
      assert.typeOf(item.multipart, 'array');
    });

    (formDataTestRun)('contains the text entry', async () => {
      const result = await instance.post('saved', { ...defaultRequest });
      const item = await instance.savedDb.get(result.id);
      assert.isFalse(item.multipart[0].isFile);
      assert.equal(item.multipart[0].name, 'test');
      assert.typeOf(item.multipart[0].value, 'string');
    });

    (formDataTestRun)('contains the file entry', async () => {
      const result = await instance.post('saved', { ...defaultRequest })
      const item = await instance.savedDb.get(result.id);
      assert.isTrue(item.multipart[1].isFile);
      assert.equal(item.multipart[1].name, 'file');
      assert.typeOf(item.multipart[1].value, 'string');
    });
  });

  describe('Save request with File data', () => {
    const defaultRequest = {
      url: 'test-url',
      method: 'test-method',
      headers: 'test-headers',
      payload: new Blob(['']),
      name: 'test',
      type: 'saved',
    };

    /** @type RequestModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestModel();
      instance.listen(et);
      const b = new Blob(['a'], {
        type: 'application/x-test'
      });
      // @ts-ignore
      b.name = 'test.txt'; // mimics file object
      defaultRequest.payload = b;
    });

    afterEach(async () => {
      await store.destroySaved();
    });

    it('returns the same payload', async () => {
      const result = await instance.post('saved', { ...defaultRequest });
      const { item } = result;
      assert.deepEqual(item.payload, defaultRequest.payload);
    });

    it('has the blob property on the stored object', async () => {
      const result = await instance.post('saved', { ...defaultRequest });
      const item = await instance.savedDb.get(result.id);
      assert.typeOf(item.blob, 'string');
    });

    function dataURLtoBlob(dataUrl) {
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], {
        type: mime
      });
    }

    it('can restore the blob entry', async () => {
      const result = await instance.post('saved', { ...defaultRequest });
      const item = await instance.savedDb.get(result.id);
      const blob = dataURLtoBlob(item.blob);
      assert.equal(blob.size, defaultRequest.payload.size);
    });
  });

  describe('Request type setup', () => {
    /** @type RequestModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestModel();
      instance.listen(et);
    });

    afterEach(async () => {
      await store.destroyHistory();
      await store.destroySaved();
    });

    it('sets type that corresponds to the operation type', async () => {
      const item = generator.http.history();
      delete item.type;
      const result = await instance.post('history', item);
      const { item: request } = result;
      assert.equal(request.type, 'history');
    });

    it('keeps type if defined', async () => {
      const item = generator.http.history();
      item.type = 'other';
      const result = await instance.post('saved', item);
      const { item: request } = result;
      assert.equal(request.type, 'other');
    });

    it('renames "drive" to "saved"', async () => {
      const item = generator.http.history();
      item.type = 'drive';
      const result = await instance.post('saved', item);
      const { item: request } = result;
      assert.equal(request.type, 'saved');
    });

    it('renames "google-drive" to "saved"', async () => {
      const item = generator.http.history();
      item.type = 'google-drive';
      const result = await instance.post('saved', item);
      const { item: request } = result;
      assert.equal(request.type, 'saved');
    });
  });

  describe('Request id and rev', () => {
    /** @type RequestModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestModel();
      instance.listen(et);
    });

    afterEach(async () => {
      await store.destroyHistory();
      await store.destroySaved();
    });

    it('Generates an ID for the request', async () => {
      const item = generator.http.history();
      delete item._id;
      const result = await instance.post('saved', item);
      const { item: request } = result;
      assert.typeOf(request._id, 'string');
    });

    it('Returns the REV property', async () => {
      const item = generator.http.history();
      const result = await instance.post('saved', item);
      const { item: request } = result;
      assert.typeOf(request._rev, 'string');
    });
  });

  describe('createRequestProjects()', () => {
    /** @type RequestModel */
    let instance;
    /** @type Element */
    let et;
    const names = ['a', 'b', 'c'];
    const requestId = 'test-id';
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestModel();
      instance.listen(et);
    });

    afterEach(async () => {
      await store.destroyHistory();
      await store.destroySaved();
    });

    it('Creates a list of projects from names', async () => {
      await instance.createRequestProjects(names)
      const list = await store.getDatastoreProjectsData();
      assert.lengthOf(list, 3, 'Has 3 items');
      for (let i = 0; i < list.length; i++) {
        assert.notEqual(names.indexOf(list[i].name), -1);
      }
    });

    it('Adds a request id to the project', async () => {
      await instance.createRequestProjects(names, requestId)
      const list = await store.getDatastoreProjectsData();
      assert.lengthOf(list, 3, 'Has 3 items');
      for (let i = 0; i < list.length; i++) {
        assert.equal(list[i].requests[0], 'test-id');
      }
    });
  });

  describe('Synchronizes projects', () => {
    /** @type RequestModel */
    let instance;
    /** @type Element */
    let et;
    let projects;
    let createProjectRequestId;
    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestModel();
      instance.listen(et);
      projects = await instance.createRequestProjects(['a', 'b', 'c'], createProjectRequestId);
    });

    afterEach(async () => {
      await store.destroyHistory();
      await store.destroySaved();
    });

    it('Sets request ID on projects', async () => {
      const item = generator.http.saved();
      item._id = 'test-projects';
      item.projects = projects;
      await instance.post('saved', item)
      const list = await store.getDatastoreProjectsData();
      for (let i = 0; i < list.length; i++) {
        assert.equal(list[i].requests[0], 'test-projects');
      }
    });

    it('Sets request ID on single project', async () => {
      const item = generator.http.saved();
      item._id = 'test-projects';
      item.projects = [projects[1]];
      await instance.post('saved', item)
      const list = await store.getDatastoreProjectsData();
      for (let i = 0; i < list.length; i++) {
        if (list[i]._id === projects[1]) {
          assert.equal(list[i].requests[0], 'test-projects');
        } else {
          assert.lengthOf(list[i].requests, 0);
        }
      }
    });

    it('Just setting a flag for the next test', async () => {
      createProjectRequestId = 'test-projects';
    });

    it('Removes request ID prom projects', async () => {
      createProjectRequestId = undefined;
      const item = generator.http.saved();
      item._id = 'test-projects';
      item.projects = [projects[1]];
      await instance.post('saved', item)
      const list = await store.getDatastoreProjectsData();
      for (let i = 0; i < list.length; i++) {
        if (list[i]._id === projects[1]) {
          assert.equal(list[i].requests[0], 'test-projects');
        } else {
          assert.lengthOf(list[i].requests, 0);
        }
      }
    });
  });

  describe('post() history', () => {
    /** @type RequestModel */
    let instance;
    /** @type Element */
    let et;
    let requests = /** @type ARCHistoryRequest[] */ (null);
    before(async () => {
      requests = await store.insertHistory();;
    });

    after(async () => {
      await store.destroyHistory();
    });

    beforeEach(async () => {
      et = await etFixture();
      instance = new RequestModel();
      instance.listen(et);
    });

    it('inserts a new item', async () => {
      const item = generator.http.history();
      const record = await instance.post('history', item);
      const { item: created } = record;
      const result = await instance.get('history', created._id);
      assert.typeOf(result, 'object');
    });

    it('returns inserted item', async () => {
      const item = generator.http.history();
      const record = await instance.post('history', item);
      const { item: created } = record;
      assert.typeOf(created, 'object', 'has the result');
      assert.typeOf(created._id, 'string', 'has _id');
      assert.typeOf(created._rev, 'string', 'has _rev');
    });

    it('adds id when missing', async () => {
      const item = generator.http.history();
      delete item._id;
      const record = await instance.post('history', item);
      const { item: created } = record;
      assert.typeOf(created._id, 'string', 'has _id');
    });

    it('updated existing item', async () => {
      const item = requests[0];
      item.url = 'x-test';
      const record = await instance.post('history', item);
      const { item: created } = record;
      assert.equal(created.url, 'x-test');
    });

    it('gets latest rev for existing item', async () => {
      const item = requests[0];
      delete item._rev;
      const record = await instance.post('history', item);
      const { item: created } = record;
      assert.typeOf(created._rev, 'string');
    });
  });
});
