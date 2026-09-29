'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const adapter = require('../admin-store.js');
function memoryStorage() {
  const data = new Map();
  return { getItem: key => data.has(key) ? data.get(key) : null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key) };
}
const password = 'Nirvivad@123';
let seed;
async function environment() {
  const localStorage = memoryStorage();
  if (seed) localStorage.setItem(adapter.storageKey, seed);
  const sessionStorage = memoryStorage();
  const store = adapter.createStore({ localStorage, sessionStorage, crypto: webcrypto });
  await store.init();
  if (!seed) seed = localStorage.getItem(adapter.storageKey);
  return { store, localStorage, sessionStorage, second: () => adapter.createStore({ localStorage, sessionStorage: memoryStorage(), crypto: webcrypto }) };
}
const signIn = (store, email = 'sa@nirvivad.example') => store.login(email, password);
const employee = (overrides = {}) => ({ name: 'New Employee', email: 'new@nirvivad.example', role: 'employee', managerId: 'user-2', password, ...overrides });

test('workbook seeds are exact; accounts expose no password material', async () => {
  const { store, localStorage } = await environment();
  assert.deepEqual(store.getState().users, []);
  assert.throws(() => store.listUsers(), /session/);
  await signIn(store);
  assert.deepEqual(Object.fromEntries(Object.keys(store.masterTypes).map(key => [key, store.listMaster(key).length])), { land: 9, building: 13, city: 7, ownership: 10, dispute: 10, unit: 9 });
  const [first, second] = store.listPlans();
  assert.deepEqual([first.durationMonths, first.propertyLimit, first.price, first.active], [12, 1, null, false]);
  assert.deepEqual([second.durationMonths, second.propertyLimit, second.price, second.active], [12, 5, null, false]);
  assert.equal(first.features.research, 'Legal reserch by NV');
  assert.equal(first.features.brokerageCollection, 'Before meeting with investor');
  assert.equal(Object.keys(first.features).length, 14);
  assert.ok(Object.values(second.features).every(value => value === ''));
  const publicJson = JSON.stringify(store.getState());
  for (const secret of ['passwordHash', 'passwordSalt', 'authVersion', password]) assert.equal(publicJson.includes(secret), false);
  const persisted = JSON.parse(localStorage.getItem(store.storageKey));
  assert.notEqual(persisted.users[0].passwordSalt, persisted.users[1].passwordSalt);
  assert.equal(localStorage.getItem(store.storageKey).includes(password), false);
});

test('login rejects invalid/inactive accounts; profile updates do not change hierarchy', async () => {
  const { store } = await environment();
  await assert.rejects(() => store.login('sa@nirvivad.example', 'WrongPass@123'), /incorrect/);
  await store.login(' SA@NIRVIVAD.EXAMPLE ', password);
  store.setUserStatus('user-3', false);
  store.logout();
  await assert.rejects(() => signIn(store, 'employee@nirvivad.example'), /inactive/);
  await signIn(store, 'subadmin@nirvivad.example');
  const result = store.updateProfile({ name: 'Vikram Updated', role: 'superadmin', managerId: null });
  assert.equal(result.name, 'Vikram Updated');
  assert.equal(result.role, 'subadmin');
  assert.equal(result.managerId, 'user-1');
});

test('Sub Admin direct-report boundaries hold inside all user mutation methods', async () => {
  const { store } = await environment();
  await signIn(store, 'subadmin@nirvivad.example');
  assert.deepEqual(store.listUsers().map(user => user.id), ['user-3']);
  assert.equal(store.currentUser().managerName, 'Ananya Sharma');
  assert.throws(() => store.getUser('user-5'), /directly/);
  await assert.rejects(() => store.saveUser({ name: 'Stolen Employee' }, 'user-5'), /directly/);
  assert.throws(() => store.setUserStatus('user-5', false), /directly/);
  assert.throws(() => store.deleteUser('user-5'), /directly/);
  await assert.rejects(() => store.saveUser(employee({ managerId: 'user-4' })), /own Employees/);
  await assert.rejects(() => store.saveUser(employee({ role: 'subadmin' })), /only Employees/);
  await assert.rejects(() => store.saveUser({ role: 'superadmin' }, 'user-3'), /Choose/);
  const created = await store.saveUser(employee());
  assert.equal(created.managerId, 'user-2');
  assert.equal(store.listUsers().length, 2);
  store.setUserStatus(created.id, false);
  assert.equal(store.getUser(created.id).active, false);
  store.deleteUser(created.id);
  assert.equal(store.listUsers().length, 1);
  assert.throws(() => store.savePermissions('user-3', { subscriptions: { edit: true } }), /permission/);
  assert.throws(() => store.saveCms('terms', { title: 'Terms', content: '<p>Test</p>', status: 'published' }), /permission/);
});

test('Super Admin hierarchy validation prevents orphans and protects Super Admin account', async () => {
  const { store } = await environment();
  await signIn(store);
  assert.throws(() => store.setUserStatus('user-1', false), /Super Admin/);
  assert.throws(() => store.deleteUser('user-1'), /Super Admin/);
  await assert.rejects(() => store.saveUser({ role: 'employee' }, 'user-1'), /own profile/);
  assert.throws(() => store.deleteUser('user-2'), /Reassign/);
  assert.throws(() => store.setUserStatus('user-2', false), /Reassign/);
  await assert.rejects(() => store.saveUser({ role: 'employee' }, 'user-2'), /Reassign/);
  await assert.rejects(() => store.saveUser({ managerId: 'user-3' }, 'user-3'), /own manager/);
  await assert.rejects(() => store.saveUser({ managerId: 'user-4' }, 'user-2'), /report to a Super Admin/);
  await store.saveUser({ managerId: 'user-4' }, 'user-3');
  const sub = await store.saveUser({ alsoEmployee: true }, 'user-2');
  assert.equal(sub.role, 'subadmin');
  assert.equal(sub.alsoEmployee, true);
  store.setUserStatus('user-2', false);
  await assert.rejects(() => store.saveUser(employee()), /active Super Admin/);
  store.deleteUser('user-2');
  assert.equal(store.getUser('user-3').managerId, 'user-4');
});

test('duplicate accounts, invalid contacts, and weak passwords cannot be persisted', async () => {
  const { store } = await environment();
  await signIn(store);
  await assert.rejects(() => store.saveUser(employee({ email: ' EMPLOYEE@NIRVIVAD.EXAMPLE ' })), /already exists/);
  await assert.rejects(() => store.saveUser(employee({ email: 'invalid' })), /valid email/);
  await assert.rejects(() => store.saveUser(employee({ phone: '+91 abc 123' })), /Phone/);
  await assert.rejects(() => store.saveUser(employee({ password: 'password' })), /Password must/);
  const created = await store.saveUser(employee({ name: ' New   Employee ', email: ' NEW@NIRVIVAD.EXAMPLE ', phone: '+91 98765 43210' }));
  assert.equal(created.name, 'New Employee');
  assert.equal(created.email, 'new@nirvivad.example');
});

test('master permissions are enforced per category and action, including status through editing', async () => {
  const { store } = await environment();
  await signIn(store);
  store.savePermissions('user-3', { land: { create: true, edit: true } });
  store.logout();
  await signIn(store, 'employee@nirvivad.example');
  assert.equal(store.can('users', 'view'), false);
  assert.throws(() => store.listUsers(), /permission/);
  assert.throws(() => store.getUser('user-3'), /permission/);
  const entry = store.saveMaster('land', { name: 'New land', code: 'NEW_LAND', sortOrder: 30, requiresDetails: true });
  assert.equal(entry.requiresDetails, true);
  assert.throws(() => store.saveMaster('building', { name: 'New building', code: 'NEW' }), /permission/);
  assert.throws(() => store.saveMaster('land', { active: false }, entry.id), /permission/);
  assert.throws(() => store.setMasterStatus('land', entry.id, false), /permission/);
  assert.throws(() => store.deleteMaster('land', entry.id), /permission/);
  assert.throws(() => store.saveMaster('land', { name: 'new LAND', code: 'OTHER' }), /name already/);
  assert.throws(() => store.saveMaster('land', { name: 'Other land', code: 'new_land' }), /code already/);
  assert.throws(() => store.saveMaster('land', { name: 'Other land', code: 'VALID', sortOrder: -1 }), /Sort order/);
});

test('permission assignments cannot bypass role ceiling and restricted resources', async () => {
  const { store } = await environment();
  await signIn(store);
  assert.throws(() => store.savePermissions('user-3', { users: { view: true } }), /hierarchy/);
  assert.throws(() => store.savePermissions('user-2', { users: { permissions: true } }), /hierarchy/);
  assert.throws(() => store.savePermissions('user-2', { cms: { edit: true } }), /hierarchy/);
  assert.throws(() => store.savePermissions('user-1', {}), /always full/);
  store.savePermissions('user-2', { users: { create: false, edit: false, status: false, delete: false }, subscriptions: { edit: true } });
  store.logout();
  await signIn(store, 'subadmin@nirvivad.example');
  assert.equal(store.can('users', 'create'), false);
  await assert.rejects(() => store.saveUser(employee()), /permission/);
  assert.equal(store.can('subscriptions', 'edit'), true);
  store.savePlan({ description: 'Changed plan text' }, 'plan-1');
  assert.throws(() => store.savePlan({ active: true, price: 20 }, 'plan-1'), /permission/);
});

test('subscription validation preserves unknown workbook values and supports configured free plans', async () => {
  const { store } = await environment();
  await signIn(store);
  assert.throws(() => store.setPlanStatus('plan-1', true), /Configure a price/);
  assert.throws(() => store.savePlan({ price: -1 }, 'plan-1'), /Price/);
  assert.throws(() => store.savePlan({ price: 12.345 }, 'plan-1'), /two decimal/);
  assert.throws(() => store.savePlan({ durationMonths: 0 }, 'plan-1'), /Duration/);
  assert.throws(() => store.savePlan({ propertyLimit: 1.5 }, 'plan-1'), /whole number/);
  assert.throws(() => store.savePlan({ name: 'plan 2' }, 'plan-1'), /name already/);
  assert.throws(() => store.savePlan({ code: 'plan-2' }, 'plan-1'), /code already/);
  assert.throws(() => store.savePlan({ features: { unknown: 'yes' } }, 'plan-1'), /Unknown/);
  const plan = store.savePlan({ price: 0, active: true }, 'plan-1');
  assert.equal(plan.active, true);
  assert.equal(plan.price, 0);
  assert.equal(plan.features.investorInteraction, '');
  store.setPlanStatus('plan-1', false);
  store.deletePlan('plan-1');
  assert.equal(store.listPlans().length, 1);
});

test('password changes keep this session but invalidate other sessions and old password', async () => {
  const { store, second } = await environment();
  await signIn(store, 'employee@nirvivad.example');
  const otherTab = second();
  await otherTab.init();
  await signIn(otherTab, 'employee@nirvivad.example');
  await assert.rejects(() => store.changePassword('incorrect', 'NewPassword@123', 'NewPassword@123'), /Current password/);
  await assert.rejects(() => store.changePassword(password, 'NewPassword@123', 'Different@123'), /confirmation/);
  await store.changePassword(password, 'NewPassword@123', 'NewPassword@123');
  assert.equal(store.currentUser().id, 'user-3');
  assert.equal(otherTab.currentUser(), null);
  await assert.rejects(() => signIn(otherTab, 'employee@nirvivad.example'), /incorrect/);
  await otherTab.login('employee@nirvivad.example', 'NewPassword@123');
  assert.equal(otherTab.currentUser().id, 'user-3');
});

test('deactivation immediately invalidates an existing session in another tab', async () => {
  const { store, second } = await environment();
  await signIn(store);
  const employeeTab = second();
  await employeeTab.init();
  await signIn(employeeTab, 'employee@nirvivad.example');
  store.setUserStatus('user-3', false);
  assert.equal(employeeTab.currentUser(), null);
  assert.throws(() => employeeTab.updateProfile({ name: 'Changed' }), /session/);
});

test('revision conflicts prevent lost updates; scope reads do not expose reassigned Employees', async () => {
  const { store, second } = await environment();
  await signIn(store);
  const subTab = second();
  await subTab.init();
  await signIn(subTab, 'subadmin@nirvivad.example');
  await store.saveUser({ managerId: 'user-4' }, 'user-3');
  assert.deepEqual(subTab.listUsers(), []);
  assert.throws(() => subTab.getUser('user-3'), /directly/);
  assert.throws(() => subTab.updateProfile({ name: 'From stale tab' }), /Data changed/);
  await subTab.init();
  assert.equal(subTab.updateProfile({ name: 'Fresh tab' }).name, 'Fresh tab');
});

test('CMS sanitizes content and preserves the last publication during draft editing', async () => {
  const { store, localStorage } = await environment();
  await signIn(store);
  const page = store.saveCms('terms', { title: 'Reviewed terms', status: 'published', content: '<h2 onclick="alert(1)">Policy</h2><p>Approved text</p><script>alert(1)</script><a href="javascript:alert(1)">Bad link</a><img src=x onerror=alert(2)>' });
  assert.equal(page.content.includes('onclick'), false);
  assert.equal(page.content.includes('script'), false);
  assert.equal(page.content.includes('javascript:'), false);
  assert.equal(page.content.includes('<img'), false);
  const published = JSON.parse(localStorage.getItem(store.publicCmsKey));
  assert.equal(published.terms.title, 'Reviewed terms');
  assert.equal(JSON.stringify(published).includes('email'), false);
  store.saveCms('terms', { title: 'Draft terms', status: 'draft', content: '<p>Unpublished changes.</p>' });
  assert.equal(store.getCms('terms').title, 'Draft terms');
  assert.deepEqual(JSON.parse(localStorage.getItem(store.publicCmsKey)), published);
  assert.throws(() => store.saveCms('terms', { title: 'Terms', status: 'published', content: '<script>alert(1)</script>' }), /some policy text/);
});

test('persistence failure never reports a successful mutation', async () => {
  const { store, localStorage } = await environment();
  await signIn(store);
  const before = localStorage.getItem(store.storageKey);
  const original = localStorage.setItem;
  localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.throws(() => store.saveMaster('city', { name: 'New city category', code: 'NEWCITY' }), /could not be saved/);
  assert.equal(localStorage.getItem(store.storageKey), before);
  localStorage.setItem = original;
  assert.equal(store.listMaster('city').length, 7);
});
