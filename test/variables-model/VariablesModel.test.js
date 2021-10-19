import { assert, fixture, oneEvent } from '@open-wc/testing';
import { ArcMock } from '@advanced-rest-client/arc-mock';
import sinon from 'sinon';
import { ArcModelEventTypes, ArcModelEvents } from '@advanced-rest-client/events';
import { VariablesModel, currentValue } from '../../src/VariablesModel.js';
import { MockedStore } from '../../index.js';

/* global PouchDB */

/** @typedef {import('@advanced-rest-client/events').Variable.ARCVariable} ARCVariable */
/** @typedef {import('@advanced-rest-client/events').Variable.ARCEnvironment} ARCEnvironment */

describe('VariablesModel', () => {
  const store = new MockedStore();
  const generator = new ArcMock();
  
  async function etFixture() {
    return fixture(`<div></div>`);
  }

  describe('direct API', () => {
    describe('#environmentDb', () => {
      /** @type VariablesModel */
      let instance;
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new VariablesModel();
        instance.listen(et);
      });

      it('returns the handler to the data store', () => {
        assert.equal(instance.environmentDb.name, 'variables-environments');
      });
    });

    describe('#variableDb', () => {
      /** @type VariablesModel */
      let instance;
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new VariablesModel();
        instance.listen(et);
      });

      it('returns the handler to the data store', () => {
        assert.equal(instance.variableDb.name, 'variables');
      });
    });

    describe('constructor()', () => {
      /** @type VariablesModel */
      let instance;
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new VariablesModel();
        instance.listen(et);
      });

      it('does not set the name', () => {
        assert.isUndefined(instance.name);
      });
    });

    describe('updateEnvironment()', () => {
      /** @type VariablesModel */
      let instance;
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new VariablesModel();
        instance.listen(et);
      });

      after(async () => {
        await store.destroyVariables();
      });

      it('returns the changelog', async () => {
        const entity = {
          name: 'test1',
          created: 1234,
        };
        const result = await instance.updateEnvironment(entity);
        assert.typeOf(result, 'object', 'returns an object');
        assert.typeOf(result.id, 'string', 'has an id');
        assert.typeOf(result.rev, 'string', 'has a rev');
        assert.typeOf(result.item, 'object', 'has created object');
        assert.isUndefined(result.oldRev, 'has no oldRev');
      });

      it('returns the created entity', async () => {
        const entity = {
          name: 'test2',
          created: 1234,
        };
        const result = await instance.updateEnvironment(entity);
        const { item } = result;
        assert.typeOf(item, 'object', 'is an object');
        assert.typeOf(item._id, 'string', 'has an id');
        assert.typeOf(item._rev, 'string', 'has a rev');
        assert.equal(item.name, 'test2', 'has the name');
        assert.equal(item.created, 1234, 'has the created');
      });

      it('updates created entity without the revision', async () => {
        const entity = {
          name: 'test3',
        };
        const r1 = await instance.updateEnvironment(entity);
        entity._id = r1.id;
        entity.name = 'other';
        const r2 = await instance.updateEnvironment(entity);
        assert.equal(r2.id, r1.id, 'has the id');
        assert.typeOf(r2.rev, 'string', 'has a new rev');
        assert.notEqual(r2.rev, r1.rev, 'has updated rev');
        assert.equal(r2.item.name, 'other', 'has updated name');
      });

      it('updates created entity with the revision', async () => {
        const entity = {
          name: 'test4',
        };
        const r1 = await instance.updateEnvironment(entity);
        entity._id = r1.id;
        entity._rev = r1.rev;
        entity.name = 'other';
        const r2 = await instance.updateEnvironment(entity);
        assert.equal(r2.id, r1.id, 'has the id');
        assert.typeOf(r2.rev, 'string', 'has a new rev');
        assert.notEqual(r2.rev, r1.rev, 'has updated rev');
        assert.equal(r2.item.name, 'other', 'has updated name');
      });

      it('dispatches change event', async () => {
        const entity = {
          name: 'test5',
        };
        const spy = sinon.spy();
        et.addEventListener(ArcModelEventTypes.Environment.State.update, spy);
        await instance.updateEnvironment(entity);
        assert.isTrue(spy.calledOnce);
      });

      it('changes the name on related variables', async () => {
        const entity = {
          name: 'test6',
        };
        const spy = sinon.spy();
        et.addEventListener(ArcModelEventTypes.Environment.State.update, spy);
        const record1 = await instance.updateEnvironment(entity);
        const variable = generator.variables.variable();
        variable.environment = entity.name;
        const response1 = await instance.variableDb.post(variable);
        entity._id = record1.id;
        entity.name = 'other name';
        await instance.updateEnvironment(entity);
        const doc = /** @type ARCVariable */ (await instance.variableDb.get(response1.id));
        assert.equal(doc.environment, 'other name');
      });

      it('ignores related variables name change when no name change', async () => {
        const entity = {
          name: 'test7',
        };
        const spy = sinon.spy();
        et.addEventListener(ArcModelEventTypes.Environment.State.update, spy);
        const record1 = await instance.updateEnvironment(entity);
        const variable = generator.variables.variable();
        variable.environment = entity.name;
        const response1 = await instance.variableDb.post(variable);
        entity._id = record1.id;
        entity.created = 1234;
        await instance.updateEnvironment(entity);
        const doc = /** @type ARCVariable */ (await instance.variableDb.get(response1.id));
        assert.equal(doc.environment, 'test7');
      });

      it('throws when no name', async () => {
        let thrown = false;
        try {
          const entity = {
            created: 1234,
          };
          // @ts-ignore
          await instance.updateEnvironment(entity);
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('removes unknown id from the entity', async () => {
        const entity = {
          name: 'test2',
          created: 1234,
          _id: 'unknown'
        };
        const result = await instance.updateEnvironment(entity);
        assert.notEqual(result.id, 'unknown');
      });
    });

    describe('readEnvironment()', () => {
      /** @type VariablesModel */
      let instance;
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new VariablesModel();
        instance.listen(et);
      });

      let created = /** @type ARCEnvironment */ (null);
      before(async () => {
        const vars = /** @type ARCVariable[] */ (await store.insertVariables(1));
        const entity = {
          name: vars[0].environment,
        };
        const model = new VariablesModel();
        const record = await model.updateEnvironment(entity);
        created = record.item;
      });

      after(async () => {
        await store.destroyVariables();
      });

      it('reads existing environment by its name', async () => {
        const result = await instance.readEnvironment(created.name);
        assert.typeOf(result, 'object');
        assert.equal(result.name, created.name);
      });

      it('returns undefined if the environment is unknown', async () => {
        const result = await instance.readEnvironment('some random value');
        assert.isUndefined(result);
      });
    });

    describe('deleteEnvironment()', () => {
      /** @type VariablesModel */
      let instance;
      /** @type Element */
      let et;
      let created = /** @type ARCEnvironment */ (null);
      beforeEach(async () => {
        const vars = /** @type ARCVariable[] */ (await store.insertVariables(1, {
          randomEnv: true,
        }));
        const entity = {
          name: vars[0].environment,
        };
        et = await etFixture();
        instance = new VariablesModel();
        instance.listen(et);
        const model = new VariablesModel();
        const record = await model.updateEnvironment(entity);
        created = record.item;
      });

      afterEach(async () => {
        await store.destroyVariables();
      });

      it('removes an entity from the data store', async () => {
        await instance.deleteEnvironment(created._id);
        const result = await instance.readEnvironment(created.name);
        assert.isUndefined(result);
      });

      it('returns a delete record', async () => {
        const result = await instance.deleteEnvironment(created._id);
        assert.equal(result.id, created._id, 'has the id');
        assert.typeOf(result.rev, 'string', 'has a rev');
        assert.notEqual(result.rev, created._rev, 'has updated rev');
      });

      it('dispatches the change event', async () => {
        const spy = sinon.spy();
        et.addEventListener(ArcModelEventTypes.Environment.State.delete, spy);
        await instance.deleteEnvironment(created._id);
        assert.isTrue(spy.called);
      });

      it('throws when no id', async () => {
        let thrown = false;
        try {
          await instance.deleteEnvironment(undefined);
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('removes environment variables', async () => {
        const variable = generator.variables.variable();
        variable.environment = created.name;
        const response1 = await instance.variableDb.post(variable);
        await instance.deleteEnvironment(created._id);
        let thrown = false;
        try {
          await instance.variableDb.get(response1.id)
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('ignores unknown environments', async () => {
        await instance.deleteEnvironment('other id');
      });
    });

    describe('listEnvironments()', () => {
      before(async () => {
        const model = new VariablesModel();
        const items = Array(30).fill(0).map(() => ({
            name: 'a name',
          }));
        await model.environmentDb.bulkDocs(items);
      });

      /** @type VariablesModel */
      let instance;
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new VariablesModel();
        instance.listen(et);
      });

      after(async () => {
        await store.destroyVariables();
      });

      it('returns a query result for default parameters', async () => {
        const result = await instance.listEnvironments();
        assert.typeOf(result, 'object', 'result is an object');
        assert.typeOf(result.nextPageToken, 'string', 'has page token');
        assert.typeOf(result.items, 'array', 'has response items');
        assert.lengthOf(result.items, instance.defaultQueryOptions.limit, 'has default limit of items');
      });

      it('respects "limit" parameter', async () => {
        const result = await instance.listEnvironments({
          limit: 5,
        });
        assert.lengthOf(result.items, 5);
      });

      it('respects "nextPageToken" parameter', async () => {
        const result1 = await instance.listEnvironments({
          limit: 10,
        });
        const result2 = await instance.listEnvironments({
          nextPageToken: result1.nextPageToken,
        });
        assert.lengthOf(result2.items, 20);
      });

      it('does not set "nextPageToken" when no more results', async () => {
        const result1 = await instance.listEnvironments({
          limit: 40,
        });
        const result2 = await instance.listEnvironments({
          nextPageToken: result1.nextPageToken,
        });
        assert.isUndefined(result2.nextPageToken);
      });
    });

    describe('listAllEnvironments()', () => {
      before(async () => {
        const model = new VariablesModel();
        const items = Array(32).fill(0).map(() => ({
            name: 'a name',
          }));
        await model.environmentDb.bulkDocs(items);
      });

      /** @type VariablesModel */
      let instance;
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new VariablesModel();
        instance.listen(et);
      });

      after(async () => {
        await store.destroyVariables();
      });

      it('returns model list result', async () => {
        const result = await instance.listAllEnvironments();
        assert.typeOf(result, 'object', 'is an object');
        assert.typeOf(result.items, 'array', 'has items');
      });

      it('returns all items from the data store', async () => {
        const result = await instance.listAllEnvironments();
        assert.lengthOf(result.items, 32, 'has all results');
      });
    });

    describe('updateVariable()', () => {
      /** @type VariablesModel */
      let instance;
      /** @type Element */
      let et;
      beforeEach(async () => {
        et = await etFixture();
        instance = new VariablesModel();
        instance.listen(et);
      });

      after(async () => {
        await store.destroyVariables();
      });

      it('returns the changelog', async () => {
        const entity = generator.variables.variable();
        const result = await instance.updateVariable(entity);
        assert.typeOf(result, 'object', 'returns an object');
        assert.typeOf(result.id, 'string', 'has an id');
        assert.typeOf(result.rev, 'string', 'has a rev');
        assert.typeOf(result.item, 'object', 'has created object');
        assert.isUndefined(result.oldRev, 'has no oldRev');
      });

      it('creates a new variable in the data store', async () => {
        const entity = generator.variables.variable();
        const record = await instance.updateVariable(entity);
        const result = await instance.variableDb.get(record.id);
        assert.typeOf(result, 'object');
        assert.equal(result.name, entity.name);
        assert.equal(result.value, entity.value);
        assert.equal(result.environment, entity.environment);
      });

      it('throws when no variable', async () => {
        const entity = generator.variables.variable();
        delete entity.name;
        let thrown = false;
        try {
          await instance.updateVariable(entity);
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('ignores unknown id', async () => {
        const entity = generator.variables.variable();
        entity._id = 'some id';
        const result = await instance.updateVariable(entity);
        assert.typeOf(result, 'object', 'returns an object');
      });

      it('updated existing entity', async () => {
        const entity = generator.variables.variable();
        const result1 = await instance.updateVariable(entity);
        entity._id = result1.id;
        entity._rev = result1.rev;
        entity.value = 'other value';
        const result2 = await instance.updateVariable(entity);
        assert.notEqual(result2.rev, result1.rev, 'has different rev');
        assert.equal(result2.id, result1.id, 'has the same id');
        assert.equal(result2.item.value, 'other value', 'has other name');
      });
    });

    describe('deleteVariable()', () => {
      /** @type VariablesModel */
      let instance;
      /** @type Element */
      let et;
      let created = /** @type ARCVariable[] */ (null);
      beforeEach(async () => {
        et = await etFixture();
        instance = new VariablesModel();
        instance.listen(et);
        created = await store.insertVariables(1);
      });

      afterEach(async () => {
        await store.destroyVariables();
      });

      it('throws when no id', async () => {
        let thrown = false;
        try {
          await instance.deleteVariable(undefined);
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('deletes a variable from the store', async () => {
        await instance.deleteVariable(created[0]._id);
        let thrown = false;
        try {
          await instance.variableDb.get(created[0]._id);
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('returns delete record', async () => {
        const result = await instance.deleteVariable(created[0]._id);
        assert.equal(result.id, created[0]._id);
        assert.typeOf(result.rev, 'string');
      });

      it('dispatches the change event', async () => {
        const spy = sinon.spy();
        et.addEventListener(ArcModelEventTypes.Variable.State.delete, spy);
        await instance.deleteVariable(created[0]._id);
        assert.isTrue(spy.called);
      });
    });

    describe('listAllVariables()', () => {
      /** @type VariablesModel */
      let instance;
      /** @type Element */
      let et;
      let created = /** @type ARCVariable[] */ (null);
      beforeEach(async () => {
        created = await store.insertVariables(32);
        const entity = generator.variables.variable();
        entity.environment = created[0].environment;
        et = await etFixture();
        instance = new VariablesModel();
        instance.listen(et);
        await instance.updateVariable(entity);
        await instance.updateVariable({
          environment: '',
          name: 'x',
          value: 'y',
          enabled: true,
        });
      });

      afterEach(async () => {
        await store.destroyVariables();
      });

      it('returns no results for unknown environment', async () => {
        const result = await instance.listAllVariables('some unknown environment');
        assert.lengthOf(result.items, 0);
      });

      it('returns all results for an environment', async () => {
        const result = await instance.listAllVariables(created[0].environment);
        assert.isAbove(result.items.length, 1);
      });

      it('is case insensitive', async () => {
        const result = await instance.listAllVariables(created[0].environment.toUpperCase());
        assert.isAbove(result.items.length, 1);
      });

      it('ignores variables without environment', async () => {
        const result = await instance.listAllVariables('');
        assert.lengthOf(result.items, 0);
      });
    });

    describe('listVariables()', () => {
      /** @type VariablesModel */
      let instance;
      /** @type Element */
      let et;
      let created = /** @type ARCVariable[] */ (null);
      beforeEach(async () => {
        created = await store.insertVariables(32);
        const entity = generator.variables.variable();
        entity.environment = created[0].environment;
        et = await etFixture();
        instance = new VariablesModel();
        instance.listen(et);
        await instance.updateVariable(entity);
      });

      afterEach(async () => {
        await store.destroyVariables();
      });

      it('returns a query result for default parameters', async () => {
        const result = await instance.listVariables(created[0].environment);
        assert.typeOf(result, 'object', 'result is an object');
        assert.typeOf(result.nextPageToken, 'string', 'has page token');
        assert.typeOf(result.items, 'array', 'has response items');
        assert.isAbove(result.items.length, 1, 'has items');
      });

      it('respects "limit" parameter', async () => {
        const result = await instance.listVariables(created[0].environment, {
          limit: 3,
        });
        assert.isAtLeast(result.items.length, 2);
      });

      it('respects "nextPageToken" parameter', async () => {
        const result1 = await instance.listVariables(created[0].environment, {
          limit: 1,
        });
        const result2 = await instance.listVariables(created[0].environment, {
          nextPageToken: result1.nextPageToken,
        });
        assert.isAtLeast(result2.items.length, 1);
      });
    });

    /**
     * @returns {Promise<ARCVariable[]>}
     */
    async function generateVarsAndEnvs() {
      const created = await store.insertVariables(32);
      const items = [];
      created.forEach((variable) => {
        if (variable.environment !== 'default') {
          items.push({
            name: variable.environment,
            created: Date.now(),
          });
        }
      });
      const db = new PouchDB('variables-environments');
      await db.bulkDocs(items);
      return created;
    }
  
    describe('readCurrent()', () => {
      /** @type VariablesModel */
      let instance;
      /** @type Element */
      let et;
      let created = /** @type ARCVariable[] */ (null);
      before(async () => {
        created = await generateVarsAndEnvs();
      });

      after(async () => {
        await store.destroyVariables();
      });

      beforeEach(async () => {
        et = await etFixture();
        instance = new VariablesModel();
        instance.listen(et);
      });

      it('returns default environment', async () => {
        const result = await instance.readCurrent();
        assert.typeOf(result, 'object', 'result is an object');
        assert.equal(result.environment, null, 'the environment property is not set');
        const defaultVars = created.filter((item) => item.environment === 'default');
        assert.equal(result.variables.length, defaultVars.length, 'has all variables');
      });

      it('returns non-default environment', async () => {
        const first = created.find((item) => item.environment !== 'default');
        const env = await instance.readEnvironment(first.environment);
        instance[currentValue] = env._id;
        const result = await instance.readCurrent();
        assert.typeOf(result, 'object', 'result is an object');
        assert.typeOf(result.environment, 'object', 'the environment property is set');
        const defaultVars = created.filter((item) => item.environment === env.name);
        assert.equal(result.variables.length, defaultVars.length, 'has all variables');
      });

      it('reads the current via the event', async () => {
        const result = await ArcModelEvents.Environment.current(et);
        assert.typeOf(result, 'object', 'result is an object');
        assert.equal(result.environment, null, 'the environment property is not set');
        const defaultVars = created.filter((item) => item.environment === 'default');
        assert.equal(result.variables.length, defaultVars.length, 'has all variables');
      });
    });

    describe('setVariable()', () => {
      /** @type VariablesModel */
      let instance;
      /** @type Element */
      let et;
      let created = /** @type ARCVariable[] */ (null);
      before(async () => {
        created = await store.insertVariablesAndEnvironments(2, {
          defaultEnv: true,
        });
      });

      after(async () => {
        await store.destroyVariables();
      });

      beforeEach(async () => {
        et = await etFixture();
        instance = new VariablesModel();
        instance.listen(et);
      });

      it('creates a new variable', async () => {
        const record = await instance.setVariable('veryRandomVariable', 'with value');
        assert.typeOf(record, 'object', 'returns the change record');
        const result = await instance.variableDb.get(record.id);
        assert.typeOf(result, 'object', 'has created variable');
        assert.equal(result.name, 'veryRandomVariable', 'the variable has the name');
        assert.equal(result.value, 'with value', 'the variable has the value');
      });

      it('updates existing variable', async () => {
        const { _id, name } = created[0];
        const record = await instance.setVariable(name, 'updated value');
        assert.typeOf(record, 'object', 'returns the change record');
        assert.equal(record.id, _id, 'updated the existing variable');
        const result = await instance.variableDb.get(_id);
        assert.equal(result.value, 'updated value', 'the variable has the value');
      });
    });

    describe('#currentEnvironment', () => {
      /** @type VariablesModel */
      let instance;
      /** @type Element */
      let et;
      let created = /** @type ARCVariable[] */ (null);
      before(async () => {
        created = await generateVarsAndEnvs();
      });

      after(async () => {
        await store.destroyVariables();
      });

      beforeEach(async () => {
        et = await etFixture();
        instance = new VariablesModel();
        instance.listen(et);
      });

      it('returns null when environment is not set', () => {
        const result = instance.currentEnvironment;
        assert.equal(result, null);
      });

      it('reads the current state and dispatches event when changes', async () => {
        const first = created.find((item) => item.environment !== 'default');
        const env = await instance.readEnvironment(first.environment);
        instance.currentEnvironment = env._id;
        const e = await oneEvent(et, ArcModelEventTypes.Environment.State.select);
        const { detail } = e;
        assert.typeOf(detail, 'object', 'detail is an object');
        assert.typeOf(detail.environment, 'object', 'the environment property is set');
        const defaultVars = created.filter((item) => item.environment === env.name);
        assert.equal(detail.variables.length, defaultVars.length, 'has all variables');
      });

      it('selects an environment via the event', async () => {
        const first = created.find((item) => item.environment !== 'default');
        const env = await instance.readEnvironment(first.environment);
        ArcModelEvents.Environment.select(et, env._id);
        const e = await oneEvent(et, ArcModelEventTypes.Environment.State.select);
        const { detail } = e;
        assert.typeOf(detail, 'object', 'detail is an object');
        assert.typeOf(detail.environment, 'object', 'the environment property is set');
        const defaultVars = created.filter((item) => item.environment === env.name);
        assert.equal(detail.variables.length, defaultVars.length, 'has all variables');
      });
    });
  });
});
