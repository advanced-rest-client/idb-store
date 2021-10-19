import { assert, aTimeout } from '@open-wc/testing';
import { ArcModelEventTypes, ArcModelEvents } from '@advanced-rest-client/events';
import { DbHelper } from './db-helper.js';
import { UrlIndexer } from '../../index.js';

describe('UrlIndexer', () => {
  describe('Deleting indexes', () => {
    describe('deleteIndexedData()', () => {
      const FULL_URL = 'https://domain.com/api?a=b&c=d';
      const REQUEST_ID = 'test-id';
      const REQUEST_ID_2 = 'test-id-2';
      const REQUEST_TYPE = 'saved';

      /** @type UrlIndexer */
      let instance;
      beforeEach(async () => {
        instance = new UrlIndexer(window);
        await instance.index([
          {
            url: FULL_URL,
            id: REQUEST_ID,
            type: REQUEST_TYPE,
          },
          {
            url: FULL_URL,
            id: REQUEST_ID_2,
            type: REQUEST_TYPE,
          },
        ]);
      });

      afterEach(async () => {
        const db = await instance.openSearchStore();
        db.close();
        await DbHelper.clearData()
      });

      it('deletes index of a single request', async () => {
        await instance.deleteIndexedData([REQUEST_ID]);
        const data = await DbHelper.readAllIndexes();
        assert.lengthOf(data, 8);
      });

      it('Deletes both indexes', async () => {
        await instance.deleteIndexedData([REQUEST_ID, REQUEST_ID_2]);
        const data = await DbHelper.readAllIndexes();
        assert.lengthOf(data, 0);
      });
    });

    describe('deleteIndexedType()', () => {
      /** @type UrlIndexer */
      let instance;
      beforeEach(async () => {
        instance = new UrlIndexer(window);
        await instance.index([
          {
            url: 'https://domain.com/',
            id: 'r1',
            type: 't1',
          },
          {
            url: 'https://domain.com/',
            id: 'r2',
            type: 't2',
          },
        ]);
      });

      afterEach(async () => {
        const db = await instance.openSearchStore();
        db.close();
        await DbHelper.clearData()
      });

      it('Deletes by type only', async () => {
        await instance.deleteIndexedType('t1');
        const data = await DbHelper.readAllIndexes();
        assert.lengthOf(data, 3);
      });
    });

    describe('clearIndexedData()', () => {
      /** @type UrlIndexer */
      let instance;
      beforeEach(async () => {
        instance = new UrlIndexer(window);
        await instance.index([
          {
            url: 'https://domain.com/',
            id: 'r1',
            type: 't1',
          },
          {
            url: 'https://domain.com/',
            id: 'r2',
            type: 't2',
          },
        ]);
      });

      afterEach(async () => {
        const db = await instance.openSearchStore();
        db.close();
        await DbHelper.clearData()
      });

      it('Deletes all index data', async () => {
        await instance.clearIndexedData();
        const data = await DbHelper.readAllIndexes();
        assert.lengthOf(data, 0);
      });
    });

    describe('[deletemodelHandler]()', () => {
      /** @type UrlIndexer */
      let instance;
      beforeEach(async () => {
        instance = new UrlIndexer(window);
        await instance.index([
          {
            url: 'https://domain.com/',
            id: 'r1',
            type: 'saved',
          },
          {
            url: 'https://domain.com/',
            id: 'r2',
            type: 'history',
          },
        ]);
      });

      afterEach(async () => {
        const db = await instance.openSearchStore();
        db.close();
        await DbHelper.clearData()
      });

      it('clears saved via saved-requests type', async () => {
        await ArcModelEvents.destroyed(document.body, 'saved-requests');
        const data = await DbHelper.readAllIndexes();
        assert.lengthOf(data, 3);
      });

      it('clears saved via saved type', async () => {
        await ArcModelEvents.destroyed(document.body, 'saved');
        const data = await DbHelper.readAllIndexes();
        assert.lengthOf(data, 3);
      });

      it('clears history via history-requests type', async () => {
        await ArcModelEvents.destroyed(document.body, 'history-requests');
        const data = await DbHelper.readAllIndexes();
        assert.lengthOf(data, 3);
      });

      it('clears saved via history type', async () => {
        await ArcModelEvents.destroyed(document.body, 'history');
        const data = await DbHelper.readAllIndexes();
        assert.lengthOf(data, 3);
      });

      it('clears all requests', async () => {
        await ArcModelEvents.destroyed(document.body, 'all');
        const data = await DbHelper.readAllIndexes();
        assert.lengthOf(data, 0);
      });

      it('ignores other data stores', async () => {
        await ArcModelEvents.destroyed(document.body, 'other');
        const data = await DbHelper.readAllIndexes();
        assert.lengthOf(data, 6);
      });
    });

    describe('[requestDeleteHandler]()', () => {
      /** @type UrlIndexer */
      let instance;
      beforeEach(async () => {
        instance = new UrlIndexer(window);
        await instance.index([
          {
            url: 'https://domain.com/',
            id: 'r1',
            type: 'saved',
          },
          {
            url: 'https://domain.com/',
            id: 'r2',
            type: 'history',
          },
        ]);
      });

      afterEach(async () => {
        const db = await instance.openSearchStore();
        db.close();
        await DbHelper.clearData()
      });

      it('deletes request by id', async () => {
        ArcModelEvents.Request.State.delete(document.body, 'saved', 'r1', 'old');
        // should be enough?
        await aTimeout(200);
        const data = await DbHelper.readAllIndexes();
        assert.lengthOf(data, 3);
      });

      it('ignores cancelable events', async () => {
        document.body.dispatchEvent(
          new CustomEvent(ArcModelEventTypes.Request.State.update, {
            bubbles: true,
            cancelable: true,
            detail: {},
          })
        );
        // should be enough?
        await aTimeout(200);
        const data = await DbHelper.readAllIndexes();
        assert.lengthOf(data, 6);
      });
    });
  });
});
