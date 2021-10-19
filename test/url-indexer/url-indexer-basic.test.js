import { assert } from '@open-wc/testing';
import { DbHelper } from './db-helper.js';
import {
  UrlIndexer,
  generateId,
  indexDebounce,
  indexDebounceValue,
  indexRequestQueueValue,
  deleteIndexDebounce,
  deleteIndexDebounceValue,
  deleteRequestQueueValue,
  prepareRequestIndexData,
  createIndexIfMissing,
  getUrlObject,
  getAuthorityPath,
  getPathQuery,
  getQueryString,
  appendQueryParams,
  STORE_NAME,
  STORE_VERSION,
} from '../../src/UrlIndexer.js';


describe('UrlIndexer', () => {
  const hasUrlSupport = typeof URL !== 'undefined';

  after(async () => {
    await DbHelper.destroy();
  });

  describe('openSearchStore()', () => {
    /** @type UrlIndexer */
    let instance;
    beforeEach(async () => {
      instance = new UrlIndexer(window);
    });

    afterEach(async () => {
      const db = await instance.openSearchStore();
      db.close();
    });

    it('eventually opens the data store', async () => {
      const result = await instance.openSearchStore();
      // @ts-ignore
      assert.isTrue(result instanceof window.IDBDatabase);
    });

    it('always returns the same database instance', async () => {
      const db1 = await instance.openSearchStore();
      const db2 = await instance.openSearchStore();
      assert.isTrue(db1 === db2);
    });
  });

  describe('[generateId]()', () => {
    /** @type UrlIndexer */
    let instance;
    const type = 'test-type';
    const url = 'test-url';

    beforeEach(async () => {
      instance = new UrlIndexer(window);
    });

    it('Returns a string', () => {
      const result = instance[generateId](url, type);
      assert.typeOf(result, 'string');
    });

    it('Contains URL', () => {
      const result = instance[generateId](url, type);
      assert.equal(result.indexOf(url), 0);
    });

    it('Contains type', () => {
      const result = instance[generateId](url, type);
      assert.isAbove(result.indexOf(type), 1);
    });

    it('Contains uuid', () => {
      const result = instance[generateId](url, type);
      const parts = result.split('::');
      assert.typeOf(parts[2], 'string');
    });
  });

  describe('constants', () => {
    it('indexStoreName is string', () => {
      assert.typeOf(STORE_NAME, 'string');
    });

    it('indexStoreName is store name', () => {
      assert.equal(STORE_NAME, 'request-index');
    });

    it('indexStoreVersion is a number', () => {
      assert.typeOf(STORE_VERSION, 'number');
    });

    it('indexStoreVersion is version number', () => {
      assert.equal(STORE_VERSION, 1);
    });
  });

  describe('[indexDebounce]()', () => {
    /** @type UrlIndexer */
    let instance;
    const id = 'test-id';
    const url = 'test-url';
    const type = 'test-type';

    beforeEach(async () => {
      instance = new UrlIndexer(window);
    });

    it('sets [indexDebounceValue] property', () => {
      instance[indexDebounce](id, url, type);
      assert.typeOf(instance[indexDebounceValue], 'number');
      clearTimeout(instance[indexDebounceValue]);
      instance[indexRequestQueueValue] = [];
    });

    it('sets [indexRequestQueueValue] property', () => {
      instance[indexDebounce](id, url, type);
      assert.typeOf(instance[indexRequestQueueValue], 'array', 'Array is set');
      assert.lengthOf(instance[indexRequestQueueValue], 1, 'Has single item');
      clearTimeout(instance[indexDebounceValue]);
      instance[indexRequestQueueValue] = [];
    });

    it('[indexRequestQueueValue] item has all properties', () => {
      instance[indexDebounce](id, url, type);
      const item = instance[indexRequestQueueValue][0];
      assert.equal(item.id, id);
      assert.equal(item.url, url);
      assert.equal(item.type, type);
      clearTimeout(instance[indexDebounceValue]);
      instance[indexRequestQueueValue] = [];
    });

    it('Updates URL if the same request is called before queue flush', (done) => {
      instance[indexDebounce](id, url, type);
      setTimeout(() => {
        instance[indexDebounce](id, 'url-2', 'type-2');
        const item = instance[indexRequestQueueValue][0];
        assert.equal(item.url, 'url-2');
        clearTimeout(instance[indexDebounceValue]);
        instance[indexRequestQueueValue] = [];
        done();
      }, 1);
    });

    it('Updates type if the same request is called before flush', (done) => {
      instance[indexDebounce](id, url, type);
      setTimeout(() => {
        instance[indexDebounce](id, 'url-2', 'type-2');
        const item = instance[indexRequestQueueValue][0];
        assert.equal(item.type, 'type-2');
        clearTimeout(instance[indexDebounceValue]);
        instance[indexRequestQueueValue] = [];
        done();
      }, 1);
    });

    it('Flushes the queue', (done) => {
      instance[indexDebounce](id, url, type);
      instance.index = () => {
        done();
        return Promise.resolve();
      };
    });

    it('Calls index with params', (done) => {
      instance[indexDebounce](id, url, type);
      instance.index = (data) => {
        assert.typeOf(data, 'array');
        assert.lengthOf(data, 1, 'Has single item');
        done();
        return Promise.resolve();
      };
    });

    it('Calls index with params', (done) => {
      instance[indexDebounce](id, url, type);
      instance.index = (data) => {
        assert.typeOf(data, 'array');
        assert.lengthOf(data, 1, 'Has single item');
        const item = data[0];
        assert.equal(item.id, id);
        assert.equal(item.url, url);
        assert.equal(item.type, type);
        done();
        return Promise.resolve();
      };
    });

    it('clears [indexDebounceValue]', (done) => {
      instance[indexDebounce](id, url, type);
      instance.index = () => {
        assert.isUndefined(instance[indexDebounceValue]);
        done();
        return Promise.resolve();
      };
    });

    it('clears [indexRequestQueueValue]', (done) => {
      instance[indexDebounce](id, url, type);
      instance.index = () => {
        assert.deepEqual(instance[indexRequestQueueValue], []);
        done();
        return Promise.resolve();
      };
    });
  });

  describe('[deleteIndexDebounce]()', () => {
    /** @type UrlIndexer */
    let instance;
    const id = 'test-id';
    beforeEach(async () => {
      instance = new UrlIndexer(window);
    });

    it('Sets [deleteIndexDebounceValue] property', () => {
      instance[deleteIndexDebounce](id);
      assert.typeOf(instance[deleteIndexDebounceValue], 'number');
      clearTimeout(instance[deleteIndexDebounceValue]);
      instance[deleteRequestQueueValue] = undefined;
    });

    it('Sets [deleteRequestQueueValue] property', () => {
      instance[deleteIndexDebounce](id);
      assert.typeOf(instance[deleteRequestQueueValue], 'array', 'Array is set');
      assert.lengthOf(instance[deleteRequestQueueValue], 1, 'Has single item');
      clearTimeout(instance[deleteIndexDebounceValue]);
      instance[deleteRequestQueueValue] = undefined;
    });

    it('[deleteRequestQueueValue] item has the id', () => {
      instance[deleteIndexDebounce](id);
      const result = instance[deleteRequestQueueValue][0];
      clearTimeout(instance[deleteIndexDebounceValue]);
      instance[deleteRequestQueueValue] = undefined;
      assert.equal(result, id);
    });

    it('does nothing if repeats the call', (done) => {
      instance[deleteIndexDebounce](id);
      setTimeout(() => {
        instance[deleteIndexDebounce](id);
        assert.typeOf(instance[deleteRequestQueueValue], 'array', 'array is set');
        assert.lengthOf(instance[deleteRequestQueueValue], 1, 'has single item');
        const result = instance[deleteRequestQueueValue][0];
        assert.equal(result, id);
        clearTimeout(instance[deleteIndexDebounceValue]);
        instance[deleteRequestQueueValue] = undefined;
        done();
      }, 1);
    });

    it('flushes the queue', (done) => {
      instance[deleteIndexDebounce](id);
      instance.deleteIndexedData = () => {
        done();
        return Promise.resolve();
      };
    });

    it('Calls deleteIndexedData with params', (done) => {
      instance[deleteIndexDebounce](id);
      instance.deleteIndexedData = (data) => {
        assert.typeOf(data, 'array');
        assert.lengthOf(data, 1, 'Has single item');
        done();
        return Promise.resolve();
      };
    });

    it('Calls index with params', (done) => {
      instance[deleteIndexDebounce](id);
      instance.deleteIndexedData = (data) => {
        assert.typeOf(data, 'array');
        assert.lengthOf(data, 1, 'Has single item');
        const result = data[0];
        assert.equal(result, id);
        done();
        return Promise.resolve();
      };
    });

    it('clears [deleteIndexDebounce]', (done) => {
      instance[deleteIndexDebounce](id);
      instance.deleteIndexedData = () => {
        assert.isUndefined(instance[deleteIndexDebounceValue]);
        done();
        return Promise.resolve();
      };
    });

    it('clears [deleteRequestQueueValue]', (done) => {
      instance[deleteIndexDebounce](id);
      instance.deleteIndexedData = () => {
        assert.deepEqual(instance[deleteRequestQueueValue], []);
        done();
        return Promise.resolve();
      };
    });
  });

  describe('[prepareRequestIndexData]()', () => {
    /** @type UrlIndexer */
    let instance;
    let request;
    beforeEach(async () => {
      instance = new UrlIndexer(window);
      request = {
        id: 'test-id',
        url: 'https://domain.com/Api/Path?p1=1&p2=2',
        type: 'saved',
      };
    });

    it('Always returns an array', () => {
      const result = instance[prepareRequestIndexData](request, []);
      assert.typeOf(result, 'array');
    });

    (hasUrlSupport ? it : it.skip)('returns 8 items', () => {
      const result = instance[prepareRequestIndexData](request, []);
      assert.lengthOf(result, 8);
    });

    (hasUrlSupport ? it : it.skip)('skips already indexed items', () => {
      const result = instance[prepareRequestIndexData](request, [
        {
          url: 'p1=1&p2=2',
          fullUrl: 0,
          requestId: 'test',
          id: 'test',
          type: 'saved',
        },
        {
          url: '/api/path?p1=1&p2=2',
          fullUrl: 0,
          requestId: 'test',
          id: 'test',
          type: 'saved',
        },
        {
          url: '/notexist',
          fullUrl: 0,
          requestId: 'test',
          id: 'test',
          type: 'saved',
        },
      ]);
      assert.lengthOf(result, 6);
    });

    (hasUrlSupport ? it : it.skip)('Items has required structure', () => {
      const result = instance[prepareRequestIndexData](request, []);
      for (let i = 0; i < result.length; i++) {
        const item = result[i];
        assert.equal(item.type, 'saved');
        assert.typeOf(item.url, 'string');
        assert.equal(
          item.id.indexOf(`${item.url.toLowerCase()}::${item.type}`),
          0
        );
      }
    });

    it('Returns empty array for invalid URL', () => {
      const rq = {
        id: 'test-id',
        url: 'Path?p1=1&p2=2',
        type: 'saved',
      };
      const result = instance[prepareRequestIndexData](rq, []);
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 0);
    });
  });

  describe('[createIndexIfMissing]()', () => {
    /** @type UrlIndexer */
    let instance;
    const id = 'test-id';
    const url = 'test-url';
    const type = 'test-type';
    let indexed;
    beforeEach(async () => {
      instance = new UrlIndexer(window);
      indexed = [];
    });

    it('Creates datastore entry if not exists', () => {
      const result = instance[createIndexIfMissing](url, id, type, indexed);
      assert.typeOf(result, 'object');
    });

    it('Datastore entry has id', () => {
      const result = instance[createIndexIfMissing](url, id, type, indexed);
      assert.typeOf(result.id, 'string');
    });

    it('Datastore entry has url', () => {
      const result = instance[createIndexIfMissing](url, id, type, indexed);
      assert.equal(result.url, url);
    });

    it('Datastore entry has requestId', () => {
      const result = instance[createIndexIfMissing](url, id, type, indexed);
      assert.equal(result.requestId, id);
    });

    it('Datastore entry has type', () => {
      const result = instance[createIndexIfMissing](url, id, type, indexed);
      assert.equal(result.type, type);
    });

    it('Datastore entry has fullUrl', () => {
      const result = instance[createIndexIfMissing](url, id, type, indexed);
      assert.strictEqual(result.fullUrl, 0);
    });

    it('Returns undefined if the item is already indexed', () => {
      indexed = [
        {
          url,
          fullUrl: 0,
          requestId: 'test',
          id: 'test',
          type: 'saved',
        },
      ];
      const result = instance[createIndexIfMissing](url, id, type, indexed);
      assert.isUndefined(result);
    });
  });

  describe('[getUrlObject]()', () => {
    /** @type UrlIndexer */
    let instance;
    const id = 'test-id';
    const url = 'test-url';
    const type = 'test-type';
    let indexed;
    let request;
    beforeEach(async () => {
      instance = new UrlIndexer(window);
      indexed = [];
      request = {
        id,
        url,
        type,
      };
    });

    it('creates index entity when not indexed', () => {
      const result = instance[getUrlObject](request, indexed);
      assert.typeOf(result, 'object');
    });

    it('returns undefined if already indexed', () => {
      indexed = [
        {
          url,
          fullUrl: 0,
          requestId: 'test',
          id: 'test',
          type: 'saved',
        },
      ];
      const result = instance[getUrlObject](request, indexed);
      assert.isUndefined(result);
    });
  });

  describe('[getAuthorityPath]()', () => {
    /** @type UrlIndexer */
    let instance;
    const id = 'test-id';
    const requestUrl = 'https://domain.com';
    const type = 'test-type';
    let indexed;
    let parser;
    beforeEach(async () => {
      instance = new UrlIndexer(window);
      indexed = [];
      parser = new URL(requestUrl);
    });

    it('Creates index entity when not indexed', () => {
      if (!hasUrlSupport) {
        return;
      }
      const result = instance[getAuthorityPath](parser, id, type, indexed);
      assert.typeOf(result, 'object');
    });

    it('Returns undefined if already indexed', () => {
      if (!hasUrlSupport) {
        return;
      }
      const { url } = instance[getAuthorityPath](parser, id, type, indexed);
      indexed = [
        {
          url,
          fullUrl: 0,
          requestId: 'test',
          id: 'test',
          type: 'saved',
        },
      ];
      const result = instance[getAuthorityPath](parser, id, type, indexed);
      assert.isUndefined(result);
    });
  });

  describe('[getPathQuery]()', () => {
    /** @type UrlIndexer */
    let instance;
    const id = 'test-id';
    const requestUrl = 'https://domain.com?a=b';
    const type = 'test-type';
    let indexed;
    let parser;
    beforeEach(async () => {
      instance = new UrlIndexer(window);
      indexed = [];
      parser = new URL(requestUrl);
    });

    it('Creates index entity when not indexed', () => {
      if (!hasUrlSupport) {
        return;
      }
      const result = instance[getPathQuery](parser, id, type, indexed);
      assert.typeOf(result, 'object');
    });

    it('Returns undefined if already indexed', () => {
      if (!hasUrlSupport) {
        return;
      }
      const { url } = instance[getPathQuery](parser, id, type, indexed);
      indexed = [
        {
          url,
          fullUrl: 0,
          requestId: 'test',
          id: 'test',
          type: 'saved',
        },
      ];
      const result = instance[getPathQuery](parser, id, type, indexed);
      assert.isUndefined(result);
    });
  });

  describe('[getQueryString]()', () => {
    /** @type UrlIndexer */
    let instance;
    const id = 'test-id';
    const requestUrl = 'https://domain.com?a=b';
    const type = 'test-type';
    let indexed;
    let parser;
    beforeEach(async () => {
      instance = new UrlIndexer(window);
      indexed = [];
      parser = new URL(requestUrl);
    });

    it('Creates index entity when not indexed', () => {
      if (!hasUrlSupport) {
        return;
      }
      const result = instance[getQueryString](parser, id, type, indexed);
      assert.typeOf(result, 'object');
    });

    it('Returns undefined if already indexed', () => {
      if (!hasUrlSupport) {
        return;
      }
      const { url } = instance[getQueryString](parser, id, type, indexed);
      indexed = [
        {
          url,
          fullUrl: 0,
          requestId: 'test',
          id: 'test',
          type: 'saved',
        },
      ];
      const result = instance[getQueryString](parser, id, type, indexed);
      assert.isUndefined(result);
    });
  });

  describe('[appendQueryParams]()', () => {
    /** @type UrlIndexer */
    let instance;
    const id = 'test-id';
    const requestUrl = 'https://domain.com?a=b';
    const type = 'test-type';
    let indexed;
    let parser;
    let target;
    beforeEach(async () => {
      instance = new UrlIndexer(window);
      indexed = [];
      target = [];
      parser = new URL(requestUrl);
    });

    it('Adds index entity when not indexed', () => {
      if (!hasUrlSupport) {
        return;
      }
      instance[appendQueryParams](parser, id, type, indexed, target);
      assert.lengthOf(target, 2);
    });

    it('Returns undefined if already indexed', () => {
      if (!hasUrlSupport) {
        return;
      }
      instance[appendQueryParams](parser, id, type, indexed, target);
      indexed = [
        {
          url: target[0].url,
          fullUrl: 0,
          requestId: 'test',
          id: 'test',
          type: 'saved',
        },
        {
          url: target[1].url,
          fullUrl: 0,
          requestId: 'test',
          id: 'test',
          type: 'saved',
        },
      ];
      target = [];
      instance[appendQueryParams](parser, id, type, indexed, target);
      assert.lengthOf(target, 0);
    });
  });
});
