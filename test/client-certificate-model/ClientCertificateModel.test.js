import { fixture, assert } from '@open-wc/testing';
import sinon from 'sinon';
import { ArcModelEventTypes } from '@advanced-rest-client/events';
import { ArcMock } from '@advanced-rest-client/arc-mock';
import { MockedStore } from '../../index.js';
import { ClientCertificateModel } from '../../src/ClientCertificateModel.js';

/** @typedef {import('@advanced-rest-client/events').ClientCertificate.ARCCertificateIndex} ARCCertificateIndex */
/** @typedef {import('@advanced-rest-client/events').ClientCertificate.ARCRequestCertificate} ARCRequestCertificate */
/** @typedef {import('@advanced-rest-client/events').ClientCertificate.Certificate} Certificate */

describe('ClientCertificateModel', () => {
  const store = new MockedStore();
  const generator = new ArcMock();
  
  async function etFixture() {
    return fixture(`<div></div>`);
  }

  describe('list()', () => {
    describe('With data', () => {
      before(async () => {
        await store.insertCertificates(30);
      });

      after(async () => {
        await store.destroyClientCertificates();
      });

      /** @type ClientCertificateModel */
      let instance;
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new ClientCertificateModel();
        instance.listen(et);
      });

      it('returns a query result for default parameters', async () => {
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

      it('removes dataKey from the items', async () => {
        const result = await instance.list();
        // @ts-ignore
        assert.isUndefined(result.items[0].dataKey);
      });
    });

    describe('Without data', () => {
      /** @type ClientCertificateModel */
      let instance;
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new ClientCertificateModel();
        instance.listen(et);
      });

      it('returns empty array', async () => {
        const result = await instance.list();
        assert.typeOf(result, 'object', 'result is an object');
        assert.lengthOf(result.items, 0, 'result has no items');
        assert.isUndefined(result.nextPageToken, 'nextPageToken is undefined');
      });
    });
  });

  describe('get()', () => {
    describe('String data', () => {
      let id;
      before(async () => {
        const data = await store.insertCertificates(1);
        id = data[0]._id;
      });

      after(async () => {
        await store.destroyClientCertificates();
      });

      /** @type ClientCertificateModel */
      let instance;
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new ClientCertificateModel();
        instance.listen(et);
      });

      it('returns the document', async () => {
        const doc = await instance.get(id);
        assert.typeOf(doc, 'object');
      });

      it('has the certificate', async () => {
        const doc = await instance.get(id);
        const certificate = /** @type Certificate */ (doc.cert);
        assert.typeOf(certificate, 'object', 'certificate is set');
        assert.typeOf(certificate.data, 'string', 'certificate data is set');
        assert.typeOf(certificate.passphrase, 'string', 'passphrase is set');
      });

      it('has the key', async () => {
        const doc = await instance.get(id);
        const info = /** @type Certificate */ (doc.key);
        assert.typeOf(info, 'object', 'certificate is set');
        assert.typeOf(info.data, 'string', 'certificate data is set');
        assert.typeOf(info.passphrase, 'string', 'passphrase is set');
      });

      it('throws when no ID', async () => {
        let err;
        try {
          // @ts-ignore
          await instance.get();
        } catch (e) {
          err = e;
        }
        assert.equal(err.message, 'The "id" argument is missing');
      });
    });

    describe('Binary data', () => {
      let id;
      before(async () => {
        const data = await store.insertCertificates(1, { binary: true });
        id = data[0]._id;
      });

      after(async () => {
        await store.destroyClientCertificates();
      });

      /** @type ClientCertificateModel */
      let instance;
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new ClientCertificateModel();
        instance.listen(et);
      });

      it('has the certificate', async () => {
        const doc = await instance.get(id);
        const info = /** @type Certificate */ (doc.cert);
        assert.typeOf(info, 'object', 'certificate is set');
        assert.typeOf(info.data, 'Uint8Array', 'certificate data is set');
        assert.typeOf(info.passphrase, 'string', 'passphrase is set');
      });

      it('has the key', async () => {
        const doc = await instance.get(id);
        const info = /** @type Certificate */ (doc.key);
        assert.typeOf(info, 'object', 'certificate is set');
        assert.typeOf(info.data, 'Uint8Array', 'certificate data is set');
        assert.typeOf(info.passphrase, 'string', 'passphrase is set');
      });
    });

    describe('No key data', () => {
      let id;
      before(async () => {
        const data = await store.insertCertificates(1, { noKey: true });
        id = data[0]._id;
      });

      after(async () => {
        await store.destroyClientCertificates();
      });

      /** @type ClientCertificateModel */
      let instance;
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new ClientCertificateModel();
        instance.listen(et);
      });

      it('has no key', async () => {
        const doc = await instance.get(id);
        assert.isUndefined(doc.key);
      });
    });
  });

  describe('delete()', () => {
    let id;
    /** @type ClientCertificateModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      const data = await store.insertCertificates(1);
      id = data[0]._id;
      et = await etFixture();
      instance = new ClientCertificateModel();
      instance.listen(et);
    });

    afterEach(async () => {
      await store.destroyClientCertificates();
    });

    it('deletes the document', async () => {
      await instance.delete(id);
      const all = await instance.list();
      assert.lengthOf(all.items, 0);
    });

    it('throws when no ID', async () => {
      let err;
      try {
        await instance.delete(undefined);
      } catch (e) {
        err = e;
      }
      assert.equal(err.message, 'The "id" argument is missing');
    });
  });

  describe('insert()', () => {
    /** @type ClientCertificateModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ClientCertificateModel();
      instance.listen(et);
    });

    afterEach(async () => {
      await store.destroyClientCertificates();
    });

    it('inserts an item to the "index" store', async () => {
      const item = generator.certificates.clientCertificate();
      await instance.insert(item);
      const all = await instance.list();
      assert.lengthOf(all.items, 1);
    });

    it('returns chnagerecord of the "index" store', async () => {
      const item = generator.certificates.clientCertificate();
      const result = await instance.insert(item);
      assert.typeOf(result, 'object', 'returns an object');
      assert.typeOf(result.id, 'string', 'has an id');
      assert.typeOf(result.rev, 'string', 'has a rev');
      assert.typeOf(result.item, 'object', 'has created object');
      assert.isUndefined(result.oldRev, 'has no oldRev');
    });

    it('inserts an item to the "data" store', async () => {
      const item = generator.certificates.clientCertificate();
      const record = await instance.insert(item);
      const saved = await instance.get(record.id);
      assert.typeOf(saved.cert, 'object');
    });

    it('inserts both object with the same id', async () => {
      const item = generator.certificates.clientCertificate();
      const record = await instance.insert(item);
      const dataObj = await instance.dataDb.get(record.id);
      const indexObj = await instance.db.get(record.id);
      assert.ok(dataObj, 'Data object is stored');
      assert.ok(indexObj, 'Index object is stored');
    });

    it('stores binary data', async () => {
      const item = generator.certificates.clientCertificate({
        binary: true,
      });
      const record = await instance.insert(item);
      const doc = await instance.get(record.id);
      const info = /** @type Certificate */ (doc.cert);
      assert.typeOf(info, 'object', 'certificate is set');
      assert.typeOf(info.data, 'Uint8Array', 'certificate data is set');
      assert.typeOf(info.passphrase, 'string', 'passphrase is set');
    });

    it('throws when no cert', async () => {
      let err;
      try {
        // @ts-ignore
        await instance.insert({});
      } catch (e) {
        err = e;
      }
      assert.equal(err.message, 'The "cert" property is required.');
    });

    it('throws when no type', async () => {
      const item = generator.certificates.clientCertificate();
      delete item.type;
      let err;
      try {
        await instance.insert(item);
      } catch (e) {
        err = e;
      }
      assert.equal(err.message, 'The "type" property is required.');
    });

    it('dispatches change event', async () => {
      const item = generator.certificates.clientCertificate();
      const spy = sinon.spy();
      et.addEventListener(ArcModelEventTypes.ClientCertificate.State.update, spy);
      const record = await instance.insert(item);
      assert.isTrue(spy.called, 'Event is dispatched');
      const e = spy.args[0][0];
      const { changeRecord } = e;
      assert.typeOf(changeRecord, 'object', 'returns an object');
      assert.equal(changeRecord.id, record.id, 'has an id');
      assert.typeOf(changeRecord.rev, 'string', 'has a rev');
      assert.typeOf(changeRecord.item, 'object', 'has created object');
      assert.isUndefined(changeRecord.oldRev, 'has no oldRev');
    });

    it('adds "created" property when not set', async () => {
      const item = generator.certificates.clientCertificate();
      delete item.created;
      const record = await instance.insert(item);
      assert.typeOf(record.item.created, 'number');
    });

    it('ignores the key if not set', async () => {
      const item = generator.certificates.clientCertificate({
        noKey: true,
      });
      const record = await instance.insert(item);
      const data = await instance.get(record.id);
      assert.isUndefined(data.key);
    });
  });

  describe('deleteModel()', () => {
    beforeEach(async () => {
      await store.insertCertificates(1);
    });

    afterEach(async () => {
      await store.destroyClientCertificates();
    });

    /** @type ClientCertificateModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ClientCertificateModel();
      instance.listen(et);
    });

    it('clears the data', async () => {
      await instance.deleteModel();
      const all = await instance.list();
      assert.lengthOf(all.items, 0);
    });
  });

  describe('certificateToStore()', () => {
    /** @type ClientCertificateModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ClientCertificateModel();
      instance.listen(et);
    });

    afterEach(async () => {
      await store.destroyClientCertificates();
    });

    it('returns the same certificate when has string data', () => {
      const cert = generator.certificates.certificate({
        binary: false,
      });
      assert.typeOf(cert.data, 'string');
      const result = /** @type Certificate */ (instance.certificateToStore(cert));
      assert.typeOf(result.data, 'string');
    });

    it('converts binary data to safe string', () => {
      const cert = generator.certificates.certificate({
        binary: true,
      });
      assert.notTypeOf(cert.data, 'string');
      const result = /** @type Certificate */ (instance.certificateToStore(cert));
      assert.typeOf(result.data, 'string', 'has the string data');
      assert.equal(result.type, 'buffer');
    });

    it('processes a list of certificates', () => {
      const cert = generator.certificates.certificate({
        binary: true,
      });
      assert.notTypeOf(cert.data, 'string');
      const result = /** @type Certificate[] */ (instance.certificateToStore([cert]));
      assert.typeOf(result, 'array', 'the result is an array');
      assert.lengthOf(result, 1, 'has the same number of items');
      assert.typeOf(result[0].data, 'string', 'has the string data');
    });

    it('throws when no data property', () => {
      const cert = generator.certificates.certificate({
        binary: true,
      });
      delete cert.data;
      assert.throws(() => {
        instance.certificateToStore(cert);
      });
    });
  });

  describe('certificateFromStore()', () => {
    /** @type ClientCertificateModel */
    let instance;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      instance = new ClientCertificateModel();
      instance.listen(et);
    });

    afterEach(async () => {
      await store.destroyClientCertificates();
    });

    it('returns the same certificate when has no type', () => {
      const cert = generator.certificates.certificate({
        binary: false,
      });
      assert.typeOf(cert.data, 'string');
      const result = /** @type Certificate */ (instance.certificateFromStore(cert));
      assert.typeOf(result.data, 'string');
    });

    it('converts string back to the binary data', () => {
      const cert = generator.certificates.certificate({
        binary: true,
      });
      // @ts-ignore
      cert.data = instance.bufferToBase64(cert.data);
      cert.type = 'buffer';
      const result = /** @type Certificate */ (instance.certificateFromStore(cert));
      assert.typeOf(result.data, 'Uint8Array');
    });

    it('processes a list of certificates', () => {
      const cert = generator.certificates.certificate({
        binary: false,
      });
      const result = /** @type Certificate[] */ (instance.certificateFromStore([cert]));
      assert.typeOf(result, 'array', 'the result is an array');
      assert.lengthOf(result, 1, 'has the same number of items');
    });
  });
});
