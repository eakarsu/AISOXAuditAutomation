const test = require('node:test');
const assert = require('node:assert/strict');

const { __test: soxOps } = require('./soxOps');

test('every SOX Ops module includes at least fifteen meaningful records', () => {
  const entries = Object.entries(soxOps.modules);
  assert.equal(entries.length, 12);

  for (const [moduleKey, module] of entries) {
    assert.ok(module.rows.length >= soxOps.minimumModuleRecords, moduleKey);
    assert.equal(new Set(module.rows.map((row) => row.id)).size, module.rows.length, `${moduleKey} duplicate ids`);
    for (const row of module.rows) {
      for (const column of module.columns) {
        assert.notEqual(row[column], undefined, `${moduleKey} row ${row.id} missing ${column}`);
        assert.notEqual(row[column], '', `${moduleKey} row ${row.id} has empty ${column}`);
      }
    }
  }
});

test('SOX Ops summary reports the complete 180-record fixture set', () => {
  const summary = soxOps.moduleList();
  assert.equal(summary.length, 12);
  assert.equal(summary.reduce((total, module) => total + module.count, 0), 180);
  assert.ok(summary.every((module) => module.count === 15));
  assert.ok(summary.every((module) => module.attention > 0 && module.attention < module.count));
});
