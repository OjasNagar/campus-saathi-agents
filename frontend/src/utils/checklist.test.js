import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildChecklist, defaultProfile, isValidSource } from './checklist.js';

const pack = JSON.parse(readFileSync(new URL('../data/documents.json', import.meta.url)));
const ids = (profile) => buildChecklist({ ...defaultProfile, ...profile }, pack).map((d) => d.id);

test('OBC-NCL and OPEN get different checklists', () => {
  assert.notDeepEqual(ids({ category: 'OBC-NCL' }), ids({ category: 'OPEN' }));
  assert.ok(ids({ category: 'OBC-NCL' }).includes('obc_certificate'));
  assert.ok(!ids({ category: 'OPEN' }).includes('obc_certificate'));
});

test('domicile only for reserved categories from outside the home state', () => {
  assert.ok(ids({ category: 'EWS', home_state: 'Bihar' }).includes('domicile'));
  assert.ok(!ids({ category: 'EWS', home_state: 'Madhya Pradesh' }).includes('domicile'));
  assert.ok(!ids({ category: 'OPEN', home_state: 'Bihar' }).includes('domicile'));
});

test('hostel form follows the hostel choice', () => {
  assert.ok(ids({ hostel_required: true }).includes('hostel_form'));
  assert.ok(!ids({ hostel_required: false }).includes('hostel_form'));
});

test('route specific documents', () => {
  assert.ok(ids({ admission_route: 'CSAB' }).includes('csab_migration'));
  assert.ok(ids({ admission_route: 'DASA' }).includes('dasa_documents'));
  assert.ok(!ids({ admission_route: 'JoSAA' }).includes('csab_migration'));
});

test('disability certificate only when needed', () => {
  assert.ok(ids({ pwd: true }).includes('pwd_certificate'));
  assert.ok(!ids({ pwd: false }).includes('pwd_certificate'));
});

test('items are numbered from 1 without gaps', () => {
  const list = buildChecklist({ ...defaultProfile, category: 'SC', home_state: 'Bihar' }, pack);
  assert.deepEqual(list.map((d) => d.number), list.map((_, i) => i + 1));
});

test('every record has a valid source link and a verified date', () => {
  for (const doc of pack.documents) {
    assert.ok(isValidSource(doc.source_url), doc.id);
    assert.ok(!Number.isNaN(Date.parse(doc.last_verified)), doc.id);
  }
});

test('no field asks for ID numbers', () => {
  assert.ok(!JSON.stringify(Object.keys(defaultProfile)).match(/aadhaar|id_number/i));
});
