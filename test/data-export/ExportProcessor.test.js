import { assert } from '@open-wc/testing';
import { ArcMock } from '@advanced-rest-client/arc-mock';
import { ExportProcessor } from '../../src/lib/ExportProcessor.js';

/** @typedef {import('@advanced-rest-client/events').ClientCertificate.Certificate} Certificate */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('@advanced-rest-client/events').Project.ARCProject} ARCProject */
/** @typedef {import('@advanced-rest-client/arc-mock').GenerateSavedResult} GenerateSavedResult */


describe('ExportProcessor', () => {
  const generator = new ArcMock();

  function mockRev(data) {
    return data.map((item) => {
      // @ts-ignore
      item._rev = generator.types.string();
      return item;
    });
  }

  describe('prepareRequestsList()', () => {
    /** @type ARCSavedRequest[] */
    let data;
    /** @type ExportProcessor */
    let instance;
    beforeEach(async () => {
      instance = new ExportProcessor(false);
      const projects = generator.http.listProjects(20);
      const insert = generator.http.savedData(20, 20, { projects }).requests;
      data = mockRev(insert);
    });

    it('returns an array', () => {
      const result = instance.prepareRequestsList(data);
      assert.typeOf(result, 'array');
    });

    it('_rev and _id is removed', () => {
      const result = instance.prepareRequestsList(data);
      for (let i = 0, len = result.length; i < len; i++) {
        if (result[i]._id) {
          throw new Error('_id is set');
        }
        if (result[i]._rev) {
          throw new Error('_rev is set');
        }
      }
    });

    it('key is set', () => {
      const result = instance.prepareRequestsList(data);
      for (let i = 0, len = result.length; i < len; i++) {
        assert.typeOf(result[i].key, 'string');
      }
    });

    it('removes the legacyProject', () => {
      // @ts-ignore
      data[0].legacyProject = 'abc';
      delete data[0].projects;
      const result = instance.prepareRequestsList(data);
      // @ts-ignore
      assert.isUndefined(result[0].legacyProject);
    });

    it('creates projects from a legacyProject', () => {
      // @ts-ignore
      data[0].legacyProject = 'abc';
      delete data[0].projects;
      const result = instance.prepareRequestsList(data);
      assert.typeOf(result[0].projects, 'array');
      assert.equal(result[0].projects[0], 'abc');
    });

    it('adds to projects from the legacyProject', () => {
      data[0].projects = ['test'];
      // @ts-ignore
      data[0].legacyProject = 'abc';
      const result = instance.prepareRequestsList(data);
      // @ts-ignore
      assert.isUndefined(result[0].legacyProject);
      assert.lengthOf(result[0].projects, 2);
    });

    it('kind property is set', () => {
      const result = instance.prepareRequestsList(data);
      assert.equal(result[0].kind, 'ARC#HttpRequest');
    });
  });

  describe('prepareProjectsList()', () => {
    /** @type ARCProject[] */
    let data;
    /** @type ExportProcessor */
    let instance;

    beforeEach(() => {
      instance = new ExportProcessor(false);
      data = generator.http.listProjects(5);
      data = mockRev(data);
    });

    it('Result is an array', () => {
      const result = instance.prepareProjectsList(data);
      assert.typeOf(result, 'array');
    });

    it('_rev and _id is removed', () => {
      const result = instance.prepareProjectsList(data);
      for (let i = 0, len = result.length; i < len; i++) {
        if (result[i]._id) {
          throw new Error('_id is set');
        }
        if (result[i]._rev) {
          throw new Error('_rev is set');
        }
      }
    });

    it('key is set', () => {
      const ids = data.map((item) => item._id);
      const result = instance.prepareProjectsList(data);
      for (let i = 0, len = result.length; i < len; i++) {
        if (result[i].key !== ids[i]) {
          throw new Error('Key is not set');
        }
      }
    });

    it('kind property is set', () => {
      const result = instance.prepareProjectsList(data);
      assert.equal(result[0].kind, 'ARC#ProjectData');
    });
  });

  describe('prepareHistoryDataList()', () => {
    let result;

    beforeEach(async () => {
      const instance = new ExportProcessor(false);
      let data = generator.http.listHistory();
      data = mockRev(data);
      // @ts-ignore
      result = instance.prepareHistoryDataList(data);
    });

    it('Result is an array', () => {
      assert.typeOf(result, 'array');
    });

    it('_rev and _id is removed', () => {
      for (let i = 0, len = result.length; i < len; i++) {
        if (result[i]._id) {
          throw new Error('_id is set');
        }
        if (result[i]._rev) {
          throw new Error('_rev is set');
        }
      }
    });

    it('kind property is set', () => {
      assert.equal(result[0].kind, 'ARC#HttpRequest');
    });
  });

  describe('prepareWsUrlHistoryData()', () => {
    let result;

    beforeEach(async () => {
      const instance = new ExportProcessor(false);
      let data = generator.urls.urls();
      data = mockRev(data);
      // @ts-ignore
      result = instance.prepareWsUrlHistoryData(data);
    });

    it('Result is an array', () => {
      assert.typeOf(result, 'array');
    });

    it('_rev and _id is removed', () => {
      for (let i = 0, len = result.length; i < len; i++) {
        if (result[i]._id) {
          throw new Error('_id is set');
        }
        if (result[i]._rev) {
          throw new Error('_rev is set');
        }
      }
    });

    it('kind property is set', () => {
      assert.equal(result[0].kind, 'ARC#WebsocketHistoryData');
    });
  });

  describe('prepareUrlHistoryData()', () => {
    let result;

    beforeEach(async () => {
      const instance = new ExportProcessor(false);
      let data = generator.urls.urls();
      data = mockRev(data);
      // @ts-ignore
      result = instance.prepareUrlHistoryData(data);
    });

    it('Result is an array', () => {
      assert.typeOf(result, 'array');
    });

    it('_rev and _id is removed', () => {
      for (let i = 0, len = result.length; i < len; i++) {
        if (result[i]._id) {
          throw new Error('_id is set');
        }
        if (result[i]._rev) {
          throw new Error('_rev is set');
        }
      }
    });

    it('kind property is set', () => {
      assert.equal(result[0].kind, 'ARC#UrlHistoryData');
    });
  });

  describe('prepareVariablesData()', () => {
    let result;
    let removed;
    beforeEach(async () => {
      const instance = new ExportProcessor(false);
      let data = generator.variables.listVariables();
      data = mockRev(data);
      // @ts-ignore
      data[1].environment = false;
      removed = data[1];
      // @ts-ignore
      result = instance.prepareVariablesData(data);
    });

    it('Result is an array', () => {
      assert.typeOf(result, 'array');
    });

    it('_rev and _id is removed', () => {
      for (let i = 0, len = result.length; i < len; i++) {
        if (result[i]._id) {
          throw new Error('_id is set');
        }
        if (result[i]._rev) {
          throw new Error('_rev is set');
        }
      }
    });

    it('kind property is set', () => {
      assert.equal(result[0].kind, 'ARC#Variable');
    });

    it('ignores items that have no environment', () => {
      const item = result.find((v) => v.key === removed._id);
      assert.notOk(item);
    });
  });

  describe('prepareAuthData()', () => {
    let result;

    beforeEach(async () => {
      const instance = new ExportProcessor(false);
      let data = generator.authorization.basicList();
      data = mockRev(data);
      // @ts-ignore
      result = instance.prepareAuthData(data);
    });

    it('Result is an array', () => {
      assert.typeOf(result, 'array');
    });

    it('_rev and _id is removed', () => {
      for (let i = 0, len = result.length; i < len; i++) {
        if (result[i]._id) {
          throw new Error('_id is set');
        }
        if (result[i]._rev) {
          throw new Error('_rev is set');
        }
      }
    });

    it('kind property is set', () => {
      assert.equal(result[0].kind, 'ARC#AuthData');
    });
  });

  describe('prepareCookieData()', () => {
    let result;

    beforeEach(async () => {
      const instance = new ExportProcessor(false);
      let data = generator.cookies.cookies();
      data = mockRev(data);
      // @ts-ignore
      result = instance.prepareCookieData(data);
    });

    it('Result is an array', () => {
      assert.typeOf(result, 'array');
    });

    it('_rev and _id is removed', () => {
      for (let i = 0, len = result.length; i < len; i++) {
        if (result[i]._id) {
          throw new Error('_id is set');
        }
        if (result[i]._rev) {
          throw new Error('_rev is set');
        }
      }
    });

    it('kind property is set', () => {
      assert.equal(result[0].kind, 'ARC#Cookie');
    });
  });

  describe('prepareCookieData() with electron cookies', () => {
    let result;

    beforeEach(async () => {
      const instance = new ExportProcessor(true);
      let data = generator.cookies.cookies();
      data = mockRev(data);
      // @ts-ignore
      result = instance.prepareCookieData(data);
    });

    it('Result is an array', () => {
      assert.typeOf(result, 'array');
    });

    it('does not set key', () => {
      for (let i = 0, len = result.length; i < len; i++) {
        assert.isUndefined(result[i].key);
      }
    });

    it('kind property is set', () => {
      assert.equal(result[0].kind, 'ARC#Cookie');
    });
  });

  describe('prepareHostRulesData()', () => {
    let result;

    beforeEach(async () => {
      const instance = new ExportProcessor(false);
      let data = generator.hostRules.rules();
      data = mockRev(data);
      // @ts-ignore
      result = instance.prepareHostRulesData(data);
    });

    it('Result is an array', () => {
      assert.typeOf(result, 'array');
    });

    it('_rev and _id is removed', () => {
      for (let i = 0, len = result.length; i < len; i++) {
        if (result[i]._id) {
          throw new Error('_id is set');
        }
        if (result[i]._rev) {
          throw new Error('_rev is set');
        }
      }
    });

    it('kind property is set', () => {
      assert.equal(result[0].kind, 'ARC#HostRule');
    });
  });

  describe('createExportObject()', () => {
    let instance = /** @type ExportProcessor */ (null);

    beforeEach(() => {
      instance = new ExportProcessor(true);
    });

    it('returns an object', () => {
      const result = instance.createExportObject([], { appVersion: '123', provider: 'xyz' });
      assert.typeOf(result, 'object');
    });

    it('has export time', () => {
      const result = instance.createExportObject([], { appVersion: '123', provider: 'xyz' });
      assert.typeOf(result.createdAt, 'string');
    });

    it('has application version', () => {
      const result = instance.createExportObject([], {
        appVersion: '1.2.3',
        provider: 'xyz',
      });
      assert.equal(result.version, '1.2.3');
    });

    it('has export kind', () => {
      const result = instance.createExportObject([], {
        appVersion: '123',
        kind: 'ARC#test',
        provider: 'xyz',
      });
      assert.equal(result.kind, 'ARC#test');
    });

    it('has loadToWorkspace property', () => {
      const result = instance.createExportObject([], {
        appVersion: '123',
        skipImport: true,
        provider: 'xyz',
      });
      assert.isTrue(result.loadToWorkspace);
    });
  });

  describe('prepareItem()', () => {
    describe('cookies', () => {
      let data;
      let instance = /** @type ExportProcessor */ (null);
      beforeEach(async () => {
        instance = new ExportProcessor(false);
        const cookies = generator.cookies.cookies();
        data = mockRev(cookies);
      });

      it('prepares cookie data', () => {
        const result = instance.prepareItem('cookies', data);
        assert.equal(result[0].kind, 'ARC#Cookie');
      });
    });

    describe('clientcertificates', () => {
      let data;
      let instance = /** @type ExportProcessor */ (null);
      beforeEach(async () => {
        instance = new ExportProcessor(false);
        let certs = generator.certificates.clientCertificates(2);
        certs = mockRev(certs);
        data = [];
        certs.forEach((obj) => {
          const item = obj;
          const certificate = /** @type Certificate */ (item.cert);
          const keyCertificate = /** @type Certificate */ (item.key);
          const dataDoc = {
            cert: generator.certificates.toStore(certificate),
          };
          delete item.cert;
          if (item.key) {
            dataDoc.key = generator.certificates.toStore(keyCertificate);
            delete item.key;
          }
          // @ts-ignore
          item._id = `index-id-${Date.now()}`;
          dataDoc._id = `data-id-${Date.now()}`;
          // @ts-ignore
          item.dataKey = `data-${Date.now()}`;
          data.push({ item, data: dataDoc });
        });
      });

      it('prepares client certificates data', () => {
        const result = instance.prepareItem('clientcertificates', data);
        assert.equal(result[0].kind, 'ARC#ClientCertificate');
      });
    });

    describe('default', () => {
      let instance = /** @type ExportProcessor */ (null);
      beforeEach(async () => {
        instance = new ExportProcessor(false);
      });

      it('returns undefined', () => {
        // @ts-ignore
        const result = instance.prepareItem('unknown', []);
        assert.isUndefined(result);
      });
    });
  });
});
