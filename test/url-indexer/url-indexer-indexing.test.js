import { assert, oneEvent } from '@open-wc/testing';
import 'pouchdb/dist/pouchdb.js';
import { ArcModelEvents, ArcModelEventTypes } from '@advanced-rest-client/events';
import { DbHelper } from './db-helper.js';
import {
  UrlIndexer,
  storeIndexes,
  getIndexedDataAll,
} from '../../src/UrlIndexer.js';

/* global PouchDB */

describe('UrlIndexer', () => {

  before(async () => {
    await DbHelper.destroy();
  });

  describe('Indexing requests', () => {
    describe('Data indexing', () => {
      describe('[storeIndexes]()', () => {
        /** @type UrlIndexer */
        let instance;
        let inserts;
        beforeEach(async () => {
          instance = new UrlIndexer(window);
          instance.listen();
          inserts = [
            {
              id: 't1',
              url: 'u1',
              requestId: 'r1',
              type: 'saved',
            },
            {
              id: 't2',
              url: 'u2',
              requestId: 'r2',
              type: 'saved',
            },
          ];
        });

        afterEach(async () => {
          instance.unlisten();
          const db = await instance.openSearchStore();
          db.close();
          await DbHelper.clearData();
        });

        it('Stores data into the data store', async () => {
          const db = await instance.openSearchStore();
          await instance[storeIndexes](db, inserts);
          const data = await DbHelper.readAllIndexes();
          assert.lengthOf(data, 2);
        });
      });

      describe('[getIndexedDataAll]()', () => {
        /** @type UrlIndexer */
        let instance;
        let inserts;
        beforeEach(async () => {
          instance = new UrlIndexer(window);
          instance.listen();
          inserts = [
            {
              id: 't1',
              url: 'u1',
              requestId: 'r1',
              type: 'saved',
            },
            {
              id: 't2',
              url: 'u2',
              requestId: 'r1',
              type: 'saved',
            },
            {
              id: 't3',
              url: 'u3',
              requestId: 'r2',
              type: 'saved',
            },
          ];
        });

        afterEach(async () => {
          instance.unlisten();
          const db = await instance.openSearchStore();
          db.close();
          await DbHelper.clearData();
        });

        it('Results to empty array when no indexes found', async () => {
          const db = await instance.openSearchStore();
          const result = await instance[getIndexedDataAll](db, ['test']);
          assert.typeOf(result, 'object');
          assert.lengthOf(Object.keys(result), 0);
        });

        it('Returns requests for given ID', async () => {
          const db = await instance.openSearchStore();
          await instance[storeIndexes](db, inserts);
          const result = await instance[getIndexedDataAll](db, ['r1']);
          assert.typeOf(result.r1, 'array');
          assert.lengthOf(result.r1, 2);
        });

        it('returns multiple requests', async () => {
          const db = await instance.openSearchStore();
          await instance[storeIndexes](db, inserts);
          const result = await instance[getIndexedDataAll](db, ['r1', 'r2']);
          assert.typeOf(result.r1, 'array');
          assert.lengthOf(result.r1, 2);
          assert.typeOf(result.r2, 'array');
          assert.lengthOf(result.r2, 1);
        });
      });

      describe('index()', () => {
        /** @type UrlIndexer */
        let instance;
        let requests;
        beforeEach(async () => {
          instance = new UrlIndexer(window);
          instance.listen();
          requests = [
            {
              id: 'test-id-1',
              url: 'https://domain.com/Api/Path?p1=1&p2=2',
              type: 'saved',
            },
            {
              id: 'test-id-2',
              url: 'https://domain.com/',
              type: 'saved',
            },
          ];
        });

        afterEach(async () => {
          instance.unlisten();
          const db = await instance.openSearchStore();
          db.close();
          await DbHelper.clearData();
        });

        it('indexes the data in the store', async () => {
          await instance.index(requests);
          const result = await DbHelper.readAllIndexes();
          assert.typeOf(result, 'array');
          assert.lengthOf(result, 11);
        });

        it('does not insert repeated data', async () => {
          await instance.index(requests);
          await instance.index(requests);
          const result = await DbHelper.readAllIndexes();
          assert.typeOf(result, 'array');
          assert.lengthOf(result, 11);
        });

        it('indexes via the event', async () => {
          ArcModelEvents.UrlIndexer.update(document.body, requests);
          await oneEvent(window, ArcModelEventTypes.UrlIndexer.State.finished);
          const result = await DbHelper.readAllIndexes();
          assert.lengthOf(result, 11);
        });
      });

      const INDEX_STORE_NAME = 'request-index';
      const INDEX_STORE_VERSION = 1;
      /**
       * Reads all URL indexes datastore
       * @return {Promise}
       */
      function readAllIndexes() {
        return new Promise((resolve, reject) => {
          const request = window.indexedDB.open(
            INDEX_STORE_NAME,
            INDEX_STORE_VERSION
          );
          request.onsuccess = (e) => {
            const results = [];
            // @ts-ignore
            const db = e.target.result;
            const tx = db.transaction('urls', 'readonly');
            tx.onerror = () => {
              reject(new Error('Get all tx error'));
            };
            tx.oncomplete = () => {
              resolve(results);
            };
            const store = tx.objectStore('urls');
            const rq = store.openCursor();
            rq.onsuccess = (ev) => {
              const cursor = ev.target.result;
              if (cursor) {
                results[results.length] = cursor.value;
                cursor.continue();
              }
            };
          };
          request.onerror = () => {
            reject(new Error('Unable to open the store'));
          };
        });
      }
      /**
       * Finds an indexed item in the list of stored items.
       * @param {String} url The url to search for
       * @param {Array} indexed List of indexed items
       * @return {Object}
       */
      function getIndexItemByUrl(url, indexed) {
        return indexed.find(
          (item) => item.url.toLowerCase() === url.toLowerCase()
        );
      }

      describe('Basic indexing', () => {
        const FULL_URL = 'https://domain.com/api?a=b&c=d';
        const REQUEST_ID = 'test-id';
        const REQUEST_TYPE = 'saved';

        /** @type UrlIndexer */
        let instance;
        beforeEach(async () => {
          instance = new UrlIndexer(window);
          instance.listen();
        });

        afterEach(async () => {
          instance.unlisten();
          const db = await instance.openSearchStore();
          db.close();
        });

        after(async () => {
          await DbHelper.clearData();
        });

        /**
         * Tests indexed item structure
         * @param {String} url
         * @param {String} name
         * @param {Array} indexed
         */
        function testIndexStructure(url, name, indexed) {
          const data = getIndexItemByUrl(url, indexed);
          assert.ok(data, `${name} URL exists`);
          assert.equal(
            data.id.indexOf(`${url}::saved::`),
            0,
            `${name} url id is set`
          );
          assert.equal(data.type, REQUEST_TYPE, ` ${name} type is stored`);
          assert.equal(data.requestId, REQUEST_ID, `${name} request id is set`);
        }

        it('Indexes single request', async () => {
          await instance.index([
            {
              url: FULL_URL,
              id: REQUEST_ID,
              type: REQUEST_TYPE,
            },
          ]);
          const data = await readAllIndexes();
          assert.lengthOf(data, 8, 'Has 8 stored instances');

          testIndexStructure(FULL_URL, 'Full url', data);
          testIndexStructure('domain.com/api?a=b&c=d', 'Authority', data);
          testIndexStructure('/api?a=b&c=d', 'Path', data);
          testIndexStructure('a=b&c=d', 'Search', data);
          testIndexStructure('a=b', 'Param #1 string', data);
          testIndexStructure('c=d', 'Param #2 string', data);
          testIndexStructure('b', 'Param #1 value', data);
          testIndexStructure('d', 'Param #2 value', data);
        });

        it('Re-Indexes existing request', async () => {
          await instance.index([
            {
              url: FULL_URL,
              id: REQUEST_ID,
              type: REQUEST_TYPE,
            },
          ]);
          const data = await readAllIndexes();
          assert.lengthOf(data, 8, 'Has 8 stored instances');
        });

        it('Creates new index for different request ID', async () => {
          const OTHER_ID = 'abc';
          await instance.index([
            {
              url: FULL_URL,
              id: OTHER_ID,
              type: REQUEST_TYPE,
            },
          ]);
          const data = await readAllIndexes();
          assert.lengthOf(data, 16, 'Has 16 stored instances');
        });

        it('Removes redundant parts of the index', async () => {
          const url = 'https://domain.com/api?a=b';
          await instance.index([
            {
              url,
              id: REQUEST_ID,
              type: REQUEST_TYPE,
            },
          ]);
          const data = await readAllIndexes();
          assert.lengthOf(data, 14, 'Has 14 stored instances');
        });
      });
    });

    describe('reindexSaved()', () => {
      const FULL_URL = 'https://domain.com/api?a=b&c=d';
      const REQUEST_ID = 'test-id';
      const REQUEST_TYPE = 'saved';

      before(async () => {
        let db = new PouchDB('saved-requests');
        await db.destroy();
        db = new PouchDB('saved-requests');
        await db.put({
          _id: REQUEST_ID,
          url: FULL_URL,
          type: REQUEST_TYPE,
        });
      });

      /** @type UrlIndexer */
      let instance;
      beforeEach(async () => {
        instance = new UrlIndexer(window);
        instance.listen();
      });

      afterEach(async () => {
        instance.unlisten();
        const db = await instance.openSearchStore();
        db.close();
        await DbHelper.clearData();
      });

      it('reindexes saved requests', async () => {
        await instance.reindexSaved();
        const result = await DbHelper.readAllIndexes();
        assert.lengthOf(result, 8);
      });

      it('reindexes via reindex()', async () => {
        await instance.reindex('saved');
        const result = await DbHelper.readAllIndexes();
        assert.lengthOf(result, 8);
      });
    });

    describe('reindexHistory()', () => {
      const FULL_URL = 'https://domain.com/api?a=b&c=d';
      const REQUEST_ID = 'test-id';
      const REQUEST_TYPE = 'history';

      before(async () => {
        let db = new PouchDB('history-requests');
        await db.destroy();
        db = new PouchDB('history-requests');
        await db.put({
          _id: REQUEST_ID,
          url: FULL_URL,
          type: REQUEST_TYPE,
        });
      });

      /** @type UrlIndexer */
      let instance;
      beforeEach(async () => {
        instance = new UrlIndexer(window);
        instance.listen();
      });

      afterEach(async () => {
        instance.unlisten();
        const db = await instance.openSearchStore();
        db.close();
        await DbHelper.clearData();
      });

      it('reindexes history requests', async () => {
        await instance.reindexHistory();
        const result = await DbHelper.readAllIndexes();
        assert.lengthOf(result, 8);
      });

      it('reindexes via reindex()', async () => {
        await instance.reindex('history');
        const result = await DbHelper.readAllIndexes();
        assert.lengthOf(result, 8);
      });
    });

    describe('reindex()', () => {
      // this tests were performed above so this only tests for error
      /** @type UrlIndexer */
      let instance;
      beforeEach(async () => {
        instance = new UrlIndexer(window);
        instance.listen();
      });

      afterEach(async () => {
        instance.unlisten();
        const db = await instance.openSearchStore();
        db.close();
        await DbHelper.clearData();
      });

      it('rejects when unknown type', async () => {
        let message;
        try {
          await instance.reindex('other');
        } catch (e) {
          message = e.message;
        }
        assert.equal(message, 'Unknown type');
      });
    });
  });
});
