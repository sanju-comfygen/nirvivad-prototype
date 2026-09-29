/* Administration prototype: browser-local persistence only. Server authentication and
 * authorization are required before using this adapter with real personal data. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(globalThis);
  else root.AdminStore = factory(root);
}(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';
  const STORAGE_KEY = 'nirvivad-administration-v1';
  const SESSION_KEY = 'nirvivad-admin-session-v1';
  const PUBLIC_CMS_KEY = 'nirvivad-public-cms-v1';
  const roles = Object.freeze({ superadmin: 'Super Admin', subadmin: 'Sub Admin', employee: 'Employee' });
  const masterSeeds = {
    land: ['Agriculture Land', 'Industrial Land', 'Institutional Land', 'Forest Land', 'Ecological Zone Land', 'Individual Residential Plot', 'Group Housing Plot', 'Commercial Plot', 'Others (Mention detail)'],
    building: ['Residential House', 'Bungalow', 'Multistory Building', 'Chawl', 'Haveli/Fort/Castle/Palace', 'Hotel', 'Flat', 'Warehouse', 'Shop', 'Showroom', 'Office', 'Industrial Shed', 'Others (Mention detail)'],
    city: ['Metro City', 'Tier-1 City', 'Tier-2 City', 'Tier-3 City', 'Town', 'Village', 'Others (Mention detail)'],
    ownership: ['Single Ownership', 'Joint Owner', 'Company / Firm Ownership', 'Inheritance', 'Possession Holder', 'Foreign Ownership', 'Leased Property', 'Acquired Property', 'Trust / HUF (Hindu Undivided Family)', 'Others (Mention detail)'],
    dispute: ['Title Dispute', 'Co-Ownership Dispute', 'Possession Dispute', 'Revenue Record Dispute', 'Nuisance Issues', 'Boundary Dispute', 'Encroachment', 'Tenancy Dispute', 'Mortgage/Lien Dispute', 'Others (Mention detail)'],
    unit: ['Acre', 'Hectare', 'Bigha', 'Square Meter', 'Square Yard', 'Square Foot', 'Guntha', 'Kanal', 'Marla']
  };
  const masterTypes = Object.freeze({ land: { label: 'Land Type' }, building: { label: 'Building Type' }, city: { label: 'City Type' }, ownership: { label: 'Ownership Type' }, dispute: { label: 'Dispute Type' }, unit: { label: 'Unit of Measure' } });
  const ordinaryActions = ['view', 'create', 'edit', 'delete', 'status'];
  const permissionResources = {
    users: { label: 'Admin users', actions: [...ordinaryActions, 'assign', 'permissions'] },
    ...Object.fromEntries(Object.entries(masterTypes).map(([key, value]) => [key, { label: value.label, actions: [...ordinaryActions] }])),
    subscriptions: { label: 'Subscriptions', actions: [...ordinaryActions] },
    cms: { label: 'CMS policies', actions: ['view', 'edit'] }
  };
  const planFeatures = Object.freeze({ research: 'Research', meetings: 'No. of meeting with NV', listingPromotion: 'Listing and Promotion', investorInteraction: 'Investor interaction', rankingCheck: 'Ranking check', courtCaseTracking: 'Court case tracking', consultation: 'Consultation', valuationEstimation: 'Valuation estimation', whatsappUpdate: 'Whatsapp update', confidentiality: 'Confidentiality', relationshipManager: 'Relationship manager', disputeAnalysis: 'Dispute analysis', brokerageCollection: 'Brokerage collection', viabilityCheck: 'Viability check' });
  const demoAccounts = Object.freeze([
    { name: 'Ananya Sharma', role: 'superadmin', email: 'sa@nirvivad.example', password: 'Nirvivad@123' },
    { name: 'Vikram Rao', role: 'subadmin', email: 'subadmin@nirvivad.example', password: 'Nirvivad@123' },
    { name: 'Ritika Sharma', role: 'employee', email: 'employee@nirvivad.example', password: 'Nirvivad@123' },
    { name: 'Meera Shah', role: 'subadmin', email: 'meera@nirvivad.example', password: 'Nirvivad@123' },
    { name: 'Arjun Patel', role: 'employee', email: 'arjun@nirvivad.example', password: 'Nirvivad@123' }
  ]);
  const clone = value => JSON.parse(JSON.stringify(value));
  const fail = message => { throw new Error(message); };
  const escapeHtml = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  function sanitizeHtml(input) {
    const allowed = new Set(['p', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'br', 'blockquote', 'a']);
    const raw = String(input || '');
    if (root.document && root.document.createElement) {
      const template = root.document.createElement('template');
      template.innerHTML = raw;
      const sanitize = parent => {
        for (const node of [...parent.childNodes]) {
          if (node.nodeType === 8) { node.remove(); continue; }
          if (node.nodeType !== 1) continue;
          const tag = node.tagName.toLowerCase();
          if (['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'template'].includes(tag)) { node.remove(); continue; }
          sanitize(node);
          if (!allowed.has(tag)) { node.replaceWith(...node.childNodes); continue; }
          const href = tag === 'a' ? node.getAttribute('href') : null;
          for (const attribute of [...node.attributes]) node.removeAttribute(attribute.name);
          if (href && /^https?:\/\/[^\s]+$/i.test(href.trim())) {
            node.setAttribute('href', href.trim());
            node.setAttribute('rel', 'noopener noreferrer');
          }
        }
      };
      sanitize(template.content);
      return template.innerHTML;
    }
    // Node fallback deliberately drops all attributes, including link destinations.
    const stripped = raw.replace(/<(script|style|iframe|object|svg|math|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
    return (stripped.match(/<!--[\s\S]*?-->|<\/?[a-z][^>]*>|[^<]+|</gi) || []).map(token => {
      if (token.startsWith('<!--')) return '';
      const tag = token.match(/^<(\/?)\s*([a-z][a-z0-9]*)\b[^>]*>$/i);
      if (tag) return allowed.has(tag[2].toLowerCase()) ? `<${tag[1]}${tag[2].toLowerCase()}>` : '';
      return escapeHtml(token);
    }).join('');
  }
  function createStore(options = {}) {
    let state = null;
    const crypto = options.crypto || root.crypto;
    const now = () => new Date().toISOString();
    const local = () => options.localStorage || root.localStorage;
    const sessions = () => options.sessionStorage || root.sessionStorage;
    function read(storage, key) {
      try { const value = storage().getItem(key); return value ? JSON.parse(value) : null; }
      catch (_) { fail('Browser storage is unavailable or contains invalid data. Enable site storage and reload.'); }
    }
    function write(storage, key, value) {
      try { if (value === null) storage().removeItem(key); else storage().setItem(key, JSON.stringify(value)); }
      catch (_) { fail('Your changes could not be saved to browser storage. Free some storage space and try again.'); }
    }
    const random = () => { if (!crypto || !crypto.subtle) fail('Secure browser crypto is unavailable. Open this prototype on localhost or HTTPS.'); return [...crypto.getRandomValues(new Uint8Array(16))].map(x => x.toString(16).padStart(2, '0')).join(''); };
    const id = prefix => `${prefix}-${random()}`;
    async function hashPassword(password, salt) {
      if (!crypto || !crypto.subtle) fail('Secure browser crypto is unavailable. Open this prototype on localhost or HTTPS.');
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: encoder.encode(salt), iterations: 120000, hash: 'SHA-256' }, key, 256);
      return [...new Uint8Array(bits)].map(x => x.toString(16).padStart(2, '0')).join('');
    }
    function text(value, label, min = 0, max = 200) {
      if (value === undefined || value === null) value = '';
      if (typeof value !== 'string') fail(`${label} must be text.`);
      const result = value.trim().replace(/\s+/g, ' ');
      if (result.length < min || result.length > max) fail(`${label} must contain ${min}–${max} characters.`);
      return result;
    }
    function boolean(value, fallback, label = 'Status') {
      if (value === undefined) return fallback;
      if (typeof value !== 'boolean') fail(`${label} must be true or false.`);
      return value;
    }
    function number(value, label, min, max, integer = false) {
      if (value === '' || value === null || value === undefined || typeof value === 'boolean') fail(`${label} is required.`);
      const result = Number(value);
      if (!Number.isFinite(result) || result < min || result > max || (integer && !Number.isInteger(result))) fail(`${label} must be ${integer ? 'a whole number' : 'a number'} between ${min} and ${max}.`);
      return result;
    }
    function passwordCheck(value) {
      if (typeof value !== 'string' || value.length < 10 || value.length > 128 || !/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/[0-9]/.test(value) || !/[^a-zA-Z0-9\s]/.test(value)) fail('Password must be 10–128 characters and include uppercase, lowercase, number and symbol.');
      return value;
    }
    function emailCheck(value, exceptId) {
      const email = text(value, 'Email', 5, 254).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Enter a valid email address.');
      if (state.users.some(user => user.id !== exceptId && user.email.toLowerCase() === email)) fail('A user with this email already exists.');
      return email;
    }
    function phoneCheck(value) {
      const phone = text(value, 'Phone', 0, 25);
      if (phone && (!/^\+?[0-9 ()-]+$/.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15)) fail('Phone must contain 7–15 digits, with an optional country code.');
      return phone;
    }
    function ready() { if (!state) fail('Administration data is not initialized. Reload the page.'); }
    function publicUser(user) {
      if (!user) return null;
      const { passwordHash, passwordSalt, authVersion, ...safe } = user;
      safe.managerName = state && state.users.find(item => item.id === user.managerId)?.name || '';
      return clone(safe);
    }
    function currentRaw() {
      ready();
      const session = read(sessions, SESSION_KEY);
      if (!session) return null;
      const latest = read(local, STORAGE_KEY);
      const user = latest && latest.users.find(item => item.id === session.userId);
      if (!user || !user.active || user.authVersion !== session.authVersion) { write(sessions, SESSION_KEY, null); return null; }
      return user;
    }
    function authenticated() { return currentRaw() || fail('Your session has expired. Sign in again.'); }
    function canFor(user, resource, action) {
      if (!user || !Object.hasOwn(permissionResources, resource) || !permissionResources[resource].actions.includes(action)) return false;
      if (user.role === 'superadmin') return true;
      if (resource === 'cms') return false;
      if (action !== 'view' && !canFor(user, resource, 'view')) return false;
      if (resource === 'users') {
        if (user.role !== 'subadmin' || !['view', 'create', 'edit', 'delete', 'status'].includes(action)) return false;
        return user.permissions?.[resource]?.[action] ?? true;
      }
      return user.permissions?.[resource]?.[action] ?? (action === 'view');
    }
    function can(resource, action) { return canFor(currentRaw(), resource, action); }
    function demand(resource, action) {
      const actor = authenticated();
      if (!canFor(actor, resource, action)) fail('You do not have permission to perform this action.');
      return actor;
    }
    function scopedUser(userId, action) {
      const actor = demand('users', action);
      const target = read(local, STORAGE_KEY).users.find(item => item.id === userId) || fail('User was not found.');
      if (actor.role === 'subadmin' && (target.role !== 'employee' || target.managerId !== actor.id)) fail('You can manage only Employees assigned directly to you.');
      return { actor, target };
    }
    const directReports = userId => state.users.filter(user => user.managerId === userId);
    function assertManager(user, actor) {
      if (!user.managerId) fail('Assign an active manager to this user.');
      if (user.managerId === user.id) fail('A user cannot be their own manager.');
      const manager = state.users.find(item => item.id === user.managerId);
      if (!manager || !manager.active || !['superadmin', 'subadmin'].includes(manager.role)) fail('Choose an active Super Admin or Sub Admin as manager.');
      if (user.role === 'subadmin' && manager.role !== 'superadmin') fail('A Sub Admin must report to a Super Admin.');
      if (actor.role === 'subadmin' && (user.role !== 'employee' || user.managerId !== actor.id)) fail('Sub Admins may create and manage only their own Employees.');
      const seen = new Set([user.id]);
      let next = manager;
      while (next) {
        if (seen.has(next.id)) fail('This manager assignment would create a circular hierarchy.');
        seen.add(next.id);
        next = state.users.find(item => item.id === next.managerId);
      }
    }
    function validateOverrides(overrides, role) {
      if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) fail('Permissions must be a resource/action map.');
      const normalized = {};
      for (const [resource, actions] of Object.entries(overrides)) {
        if (!Object.hasOwn(permissionResources, resource) || !actions || typeof actions !== 'object' || Array.isArray(actions)) fail('Unknown permission resource.');
        normalized[resource] = {};
        for (const [action, value] of Object.entries(actions)) {
          if (!permissionResources[resource].actions.includes(action) || typeof value !== 'boolean') fail('Unknown permission action or invalid permission value.');
          if (value && (resource === 'cms' || (resource === 'users' && (role !== 'subadmin' || ['assign', 'permissions'].includes(action))))) fail('These permissions cannot exceed the user’s role hierarchy.');
          normalized[resource][action] = value;
        }
      }
      return normalized;
    }
    function record(next, actor, action, target, summary) {
      next.audit.unshift({ id: id('audit'), timestamp: now(), actorId: actor.id, actorName: actor.name, action, target: String(target), summary });
      next.audit = next.audit.slice(0, 500);
    }
    function publishedProjection(next) {
      return Object.fromEntries(next.cms.filter(page => page.published).map(page => [page.slug, clone(page.published)]));
    }
    function persist(next, initial = false) {
      const existing = read(local, STORAGE_KEY);
      if ((!initial && (!existing || existing.revision !== next.revision)) || (initial && existing)) fail('Data changed in another tab. Reload before saving your changes.');
      const previousPublic = read(local, PUBLIC_CMS_KEY);
      next.revision += 1;
      try {
        write(local, STORAGE_KEY, next);
        write(local, PUBLIC_CMS_KEY, publishedProjection(next));
      } catch (error) {
        try { write(local, STORAGE_KEY, existing); write(local, PUBLIC_CMS_KEY, previousPublic); } catch (_) { /* Browser can also reject rollback; never report success. */ }
        throw error;
      }
      state = next;
    }
    function mutate(action, target, summary, callback, actor) {
      const next = clone(state);
      const result = callback(next);
      record(next, actor || authenticated(), action, target, summary);
      persist(next);
      return clone(result);
    }
    async function init() {
      const existing = read(local, STORAGE_KEY);
      if (existing) {
        if (existing.schemaVersion !== 1 || !Array.isArray(existing.users) || !Array.isArray(existing.plans) || !Array.isArray(existing.cms) || !existing.masters || !Number.isInteger(existing.revision)) fail('Stored Administration data uses an unsupported format. Please export or clear this prototype’s site data.');
        state = existing;
        return getState();
      }
      const createdAt = now();
      const users = await Promise.all(demoAccounts.map(async (account, index) => {
        const passwordSalt = random();
        return { id: `user-${index + 1}`, name: account.name, email: account.email, phone: '', role: account.role, managerId: index === 0 ? null : index === 2 ? 'user-2' : index === 4 ? 'user-4' : 'user-1', alsoEmployee: false, department: 'Administration', designation: roles[account.role], active: true, permissions: {}, passwordSalt, passwordHash: await hashPassword(account.password, passwordSalt), authVersion: random(), createdAt, updatedAt: createdAt };
      }));
      const masters = Object.fromEntries(Object.entries(masterSeeds).map(([kind, names]) => [kind, names.map((name, index) => ({ id: `${kind}-${index + 1}`, name, code: `${kind.toUpperCase()}-${String(index + 1).padStart(2, '0')}`, description: '', sortOrder: index + 1, requiresDetails: name.startsWith('Others'), symbol: '', active: true, createdAt, updatedAt: createdAt }))]));
      const plan1 = ['Legal reserch by NV', '2 online meeting before listing', 'Listing Only', '', 'Once when listing', 'No', '1 time', 'Once when listing', 'Only listing information', 'No', '', 'No', 'Before meeting with investor', ''];
      const plans = [1, 2].map((index) => ({ id: `plan-${index}`, name: `PLAN ${index}`, code: `PLAN-${index}`, description: '', durationMonths: 12, propertyLimit: index === 1 ? 1 : 5, price: null, currency: 'INR', active: false, features: Object.fromEntries(Object.keys(planFeatures).map((key, i) => [key, index === 1 ? plan1[i] : ''])), createdAt, updatedAt: createdAt }));
      const cms = [{ slug: 'terms', title: 'Terms & Conditions' }, { slug: 'privacy', title: 'Privacy Policy' }, { slug: 'payment', title: 'Payment Policy' }].map(page => ({ ...page, content: '<p>Policy content is awaiting review and approval. Replace this placeholder with the approved policy before publishing.</p>', status: 'draft', published: null, updatedAt: createdAt, updatedBy: 'Initial setup' }));
      persist({ schemaVersion: 1, revision: 0, users, masters, plans, cms, audit: [] }, true);
      return getState();
    }
    async function login(email, password) {
      ready();
      const latest = read(local, STORAGE_KEY);
      const user = latest?.users.find(item => item.email.toLowerCase() === String(email || '').trim().toLowerCase());
      if (!user || !user.active || typeof password !== 'string' || (await hashPassword(password, user.passwordSalt)) !== user.passwordHash) fail('Email or password is incorrect, or the account is inactive.');
      // Re-check after the asynchronous hash, in case another tab deactivated the account.
      const checked = read(local, STORAGE_KEY);
      const stillActive = checked?.users.find(item => item.id === user.id);
      if (!stillActive?.active || stillActive.authVersion !== user.authVersion) fail('This account changed while signing in. Please try again.');
      write(sessions, SESSION_KEY, { userId: user.id, authVersion: user.authVersion });
      state = checked;
      return publicUser(stillActive);
    }
    function logout() { write(sessions, SESSION_KEY, null); }
    function currentUser() { return publicUser(currentRaw()); }
    function listUsers() {
      const actor = demand('users', 'view');
      return read(local, STORAGE_KEY).users.filter(user => actor.role === 'superadmin' || (user.role === 'employee' && user.managerId === actor.id)).map(publicUser);
    }
    function getUser(userId) { const { target } = scopedUser(userId, 'view'); return publicUser(target); }
    function listManagers(role = 'employee', currentId = null) {
      const actor = authenticated();
      return read(local, STORAGE_KEY).users.filter(user => user.active && user.id !== currentId && (actor.role === 'superadmin' ? (role === 'subadmin' ? user.role === 'superadmin' : ['superadmin', 'subadmin'].includes(user.role)) : actor.role === 'subadmin' ? user.id === actor.id : user.id === actor.managerId)).map(user => ({ id: user.id, name: user.name, role: user.role, email: user.email }));
    }
    async function saveUser(data, userId = null) {
      if (!data || typeof data !== 'object') fail('User data is required.');
      const actor = demand('users', userId ? 'edit' : 'create');
      const existing = userId ? scopedUser(userId, 'edit').target : null;
      if (existing?.role === 'superadmin') fail('Super Admin accounts are managed through their own profile.');
      const role = data.role ?? existing?.role ?? 'employee';
      if (!['subadmin', 'employee'].includes(role)) fail('Choose Sub Admin or Employee.');
      if (actor.role === 'subadmin' && role !== 'employee') fail('Sub Admins may manage only Employees.');
      const changed = { ...(existing || {}), id: userId || id('user'), name: text(data.name ?? existing?.name, 'Name', 2, 100), email: emailCheck(data.email ?? existing?.email, userId), phone: phoneCheck(data.phone ?? existing?.phone), role, managerId: data.managerId ?? existing?.managerId ?? (actor.role === 'subadmin' ? actor.id : null), alsoEmployee: role === 'subadmin' ? boolean(data.alsoEmployee, existing?.alsoEmployee || false, 'Also Employee') : false, department: text(data.department ?? existing?.department, 'Department', 0, 100), designation: text(data.designation ?? existing?.designation, 'Designation', 0, 100), active: boolean(data.active, existing?.active ?? true), permissions: existing?.permissions || {}, createdAt: existing?.createdAt || now(), updatedAt: now() };
      assertManager(changed, actor);
      if (existing && changed.active !== existing.active) demand('users', 'status');
      if (existing && (changed.managerId !== existing.managerId || changed.role !== existing.role)) demand('users', 'assign');
      if (existing && directReports(userId).length && (!changed.active || changed.role !== existing.role)) fail('Reassign all direct reports before deactivating or changing this manager’s role.');
      if (data.permissions !== undefined) {
        demand('users', 'permissions');
        changed.permissions = validateOverrides(data.permissions, role);
      } else changed.permissions = validateOverrides(changed.permissions, role);
      const revision = state.revision;
      if (!existing || data.password) {
        const password = passwordCheck(data.password);
        changed.passwordSalt = random();
        changed.passwordHash = await hashPassword(password, changed.passwordSalt);
        changed.authVersion = random();
      }
      if (existing && changed.active !== existing.active) changed.authVersion = random();
      if (state.revision !== revision) fail('Data changed while saving. Reload before trying again.');
      const latestActor = demand('users', existing ? 'edit' : 'create');
      if (existing) scopedUser(userId, 'edit');
      mutate(existing ? 'user.updated' : 'user.created', changed.id, `${existing ? 'Updated' : 'Created'} ${changed.name}`, next => { const index = next.users.findIndex(user => user.id === changed.id); if (index < 0) next.users.push(changed); else next.users[index] = changed; return changed; }, latestActor);
      return publicUser(changed);
    }
    function setUserStatus(userId, active) {
      const { actor, target } = scopedUser(userId, 'status');
      if (typeof active !== 'boolean') fail('Status must be true or false.');
      if (target.role === 'superadmin') fail('Super Admin accounts cannot be deactivated here.');
      if (target.id === actor.id) fail('You cannot deactivate your own account.');
      if (!active && directReports(userId).length) fail('Reassign all direct reports before deactivating this manager.');
      const result = mutate('user.status', userId, `${active ? 'Activated' : 'Deactivated'} ${target.name}`, next => { const user = next.users.find(item => item.id === userId); user.active = active; user.authVersion = random(); user.updatedAt = now(); return user; }, actor);
      return publicUser(result);
    }
    function deleteUser(userId) {
      const { actor, target } = scopedUser(userId, 'delete');
      if (target.role === 'superadmin' || target.id === actor.id) fail('Super Admin accounts and your own account cannot be deleted.');
      if (directReports(userId).length) fail('Reassign all direct reports before deleting this manager.');
      mutate('user.deleted', userId, `Deleted ${target.name}`, next => { next.users = next.users.filter(user => user.id !== userId); return target; }, actor);
      return publicUser(target);
    }
    function updateProfile(data) {
      const actor = authenticated();
      const existing = state.users.find(user => user.id === actor.id) || fail('Your account was not found.');
      const fields = { name: text(data.name ?? existing.name, 'Name', 2, 100), email: emailCheck(data.email ?? existing.email, actor.id), phone: phoneCheck(data.phone ?? existing.phone), department: text(data.department ?? existing.department, 'Department', 0, 100), designation: text(data.designation ?? existing.designation, 'Designation', 0, 100) };
      const result = mutate('profile.updated', actor.id, 'Updated own profile', next => { const user = next.users.find(item => item.id === actor.id); Object.assign(user, fields, { updatedAt: now() }); return user; }, actor);
      return publicUser(result);
    }
    async function changePassword(currentPassword, newPassword, confirmPassword) {
      const actor = authenticated();
      if (newPassword !== confirmPassword) fail('New password and confirmation do not match.');
      passwordCheck(newPassword);
      if (newPassword === currentPassword) fail('Choose a different password from your current password.');
      const revision = state.revision;
      if (typeof currentPassword !== 'string' || await hashPassword(currentPassword, actor.passwordSalt) !== actor.passwordHash) fail('Current password is incorrect.');
      const passwordSalt = random();
      const passwordHash = await hashPassword(newPassword, passwordSalt);
      if (state.revision !== revision) fail('Data changed while saving. Reload before trying again.');
      authenticated();
      const result = mutate('password.changed', actor.id, 'Changed own password', next => { const user = next.users.find(item => item.id === actor.id); Object.assign(user, { passwordSalt, passwordHash, authVersion: random(), updatedAt: now() }); return user; }, actor);
      write(sessions, SESSION_KEY, { userId: result.id, authVersion: result.authVersion });
      return publicUser(result);
    }
    function savePermissions(userId, overrides) {
      const { actor, target } = scopedUser(userId, 'permissions');
      if (target.role === 'superadmin') fail('Super Admin permissions are always full access.');
      const permissions = validateOverrides(overrides, target.role);
      const result = mutate('user.permissions', userId, `Updated permissions for ${target.name}`, next => { const user = next.users.find(item => item.id === userId); user.permissions = permissions; user.updatedAt = now(); return user; }, actor);
      return publicUser(result);
    }
    function masterKind(kind) { if (!Object.hasOwn(masterTypes, kind)) fail('Unknown master data category.'); }
    function listMaster(kind) { masterKind(kind); demand(kind, 'view'); return clone(state.masters[kind]).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)); }
    function unique(items, entry, entryId, label) {
      if (items.some(item => item.id !== entryId && item.name.toLowerCase() === entry.name.toLowerCase())) fail(`${label} name already exists.`);
      if (items.some(item => item.id !== entryId && item.code.toLowerCase() === entry.code.toLowerCase())) fail(`${label} code already exists.`);
    }
    function saveMaster(kind, data, entryId = null) {
      masterKind(kind);
      const actor = demand(kind, entryId ? 'edit' : 'create');
      const existing = entryId ? state.masters[kind].find(item => item.id === entryId) || fail('Master entry was not found.') : null;
      const name = text(data.name ?? existing?.name, 'Name', 2, 100);
      const code = text(data.code ?? existing?.code ?? name.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30), 'Code', 1, 30).toUpperCase();
      if (!/^[A-Z0-9_-]+$/.test(code)) fail('Code may contain only letters, numbers, hyphens and underscores.');
      const entry = { id: entryId || id(kind), name, code, description: text(data.description ?? existing?.description, 'Description', 0, 1000), sortOrder: number(data.sortOrder ?? existing?.sortOrder ?? state.masters[kind].length + 1, 'Sort order', 0, 9999, true), requiresDetails: boolean(data.requiresDetails, existing?.requiresDetails || false, 'Requires details'), symbol: text(data.symbol ?? existing?.symbol, 'Symbol', 0, 12), active: boolean(data.active, existing?.active ?? true), createdAt: existing?.createdAt || now(), updatedAt: now() };
      if (existing && existing.active !== entry.active) demand(kind, 'status');
      unique(state.masters[kind], entry, entryId, masterTypes[kind].label);
      return mutate(`${kind}.${existing ? 'updated' : 'created'}`, entry.id, `${existing ? 'Updated' : 'Created'} ${entry.name}`, next => { const index = next.masters[kind].findIndex(item => item.id === entry.id); if (index < 0) next.masters[kind].push(entry); else next.masters[kind][index] = entry; return entry; }, actor);
    }
    function setMasterStatus(kind, entryId, active) {
      masterKind(kind); const actor = demand(kind, 'status'); if (typeof active !== 'boolean') fail('Status must be true or false.');
      return mutate(`${kind}.status`, entryId, `${active ? 'Activated' : 'Deactivated'} master entry`, next => { const entry = next.masters[kind].find(item => item.id === entryId) || fail('Master entry was not found.'); entry.active = active; entry.updatedAt = now(); return entry; }, actor);
    }
    function deleteMaster(kind, entryId) {
      masterKind(kind); const actor = demand(kind, 'delete');
      return mutate(`${kind}.deleted`, entryId, 'Deleted master entry', next => { const entry = next.masters[kind].find(item => item.id === entryId) || fail('Master entry was not found.'); next.masters[kind] = next.masters[kind].filter(item => item.id !== entryId); return entry; }, actor);
    }
    function listPlans() { demand('subscriptions', 'view'); return clone(state.plans); }
    function assertPlanActive(plan) {
      if (plan.active && (plan.price === null || plan.durationMonths <= 0 || plan.propertyLimit <= 0)) fail('Configure a price, duration and property limit before activating this plan.');
    }
    function savePlan(data, planId = null) {
      const actor = demand('subscriptions', planId ? 'edit' : 'create');
      const existing = planId ? state.plans.find(item => item.id === planId) || fail('Subscription plan was not found.') : null;
      const priceValue = data.price === undefined ? existing?.price ?? null : data.price;
      const price = priceValue === '' || priceValue === null ? null : number(priceValue, 'Price', 0, 99999999);
      if (price !== null && Math.abs(price * 100 - Math.round(price * 100)) > 0.00001) fail('Price can contain at most two decimal places.');
      const code = text(data.code ?? existing?.code, 'Code', 1, 30).toUpperCase();
      if (!/^[A-Z0-9_-]+$/.test(code)) fail('Code may contain only letters, numbers, hyphens and underscores.');
      if (data.currency !== undefined && data.currency !== 'INR') fail('Subscription currency must be INR.');
      const featuresInput = data.features ?? existing?.features ?? {};
      if (!featuresInput || typeof featuresInput !== 'object' || Array.isArray(featuresInput) || Object.keys(featuresInput).some(key => !Object.hasOwn(planFeatures, key))) fail('Unknown subscription feature.');
      const plan = { id: planId || id('plan'), name: text(data.name ?? existing?.name, 'Plan name', 2, 100), code, description: text(data.description ?? existing?.description, 'Description', 0, 1000), durationMonths: number(data.durationMonths ?? existing?.durationMonths, 'Duration in months', 1, 120, true), propertyLimit: number(data.propertyLimit ?? existing?.propertyLimit, 'Property limit', 1, 100000, true), price, currency: 'INR', active: boolean(data.active, existing?.active ?? false), features: Object.fromEntries(Object.keys(planFeatures).map(key => [key, text(featuresInput[key], planFeatures[key], 0, 500)])), createdAt: existing?.createdAt || now(), updatedAt: now() };
      if (existing && existing.active !== plan.active) demand('subscriptions', 'status');
      assertPlanActive(plan);
      unique(state.plans, plan, planId, 'Plan');
      return mutate(`plan.${existing ? 'updated' : 'created'}`, plan.id, `${existing ? 'Updated' : 'Created'} ${plan.name}`, next => { const index = next.plans.findIndex(item => item.id === plan.id); if (index < 0) next.plans.push(plan); else next.plans[index] = plan; return plan; }, actor);
    }
    function setPlanStatus(planId, active) {
      const actor = demand('subscriptions', 'status'); if (typeof active !== 'boolean') fail('Status must be true or false.');
      const plan = state.plans.find(item => item.id === planId) || fail('Subscription plan was not found.');
      assertPlanActive({ ...plan, active });
      return mutate('plan.status', planId, `${active ? 'Activated' : 'Deactivated'} ${plan.name}`, next => { const entry = next.plans.find(item => item.id === planId); entry.active = active; entry.updatedAt = now(); return entry; }, actor);
    }
    function deletePlan(planId) {
      const actor = demand('subscriptions', 'delete');
      return mutate('plan.deleted', planId, 'Deleted subscription plan', next => { const plan = next.plans.find(item => item.id === planId) || fail('Subscription plan was not found.'); next.plans = next.plans.filter(item => item.id !== planId); return plan; }, actor);
    }
    function listCms() { demand('cms', 'view'); return clone(state.cms); }
    function getCms(slug) { demand('cms', 'view'); return clone(state.cms.find(page => page.slug === slug) || fail('Policy page was not found.')); }
    function saveCms(slug, data) {
      const actor = demand('cms', 'edit');
      const existing = state.cms.find(page => page.slug === slug) || fail('Policy page was not found.');
      const title = text(data.title ?? existing.title, 'Page title', 3, 120);
      const status = data.status ?? existing.status;
      if (!['draft', 'published'].includes(status)) fail('Choose Draft or Published status.');
      if (typeof data.content !== 'string' || data.content.length > 100000) fail('Policy content is required and must be under 100,000 characters.');
      const content = sanitizeHtml(data.content);
      if (!content.replace(/<[^>]*>/g, '').trim()) fail('Add some policy text before saving.');
      return mutate('cms.updated', slug, `${status === 'published' ? 'Published' : 'Saved draft of'} ${title}`, next => { const page = next.cms.find(item => item.slug === slug); Object.assign(page, { title, content, status, updatedAt: now(), updatedBy: actor.name }); if (status === 'published') page.published = { title, content, updatedAt: page.updatedAt }; return page; }, actor);
    }
    function getState() {
      ready();
      const actor = currentRaw();
      return { schemaVersion: state.schemaVersion, revision: state.revision, users: canFor(actor, 'users', 'view') ? listUsers() : [], managerOptions: actor ? listManagers() : [], masters: Object.fromEntries(Object.keys(masterTypes).filter(kind => canFor(actor, kind, 'view')).map(kind => [kind, listMaster(kind)])), plans: canFor(actor, 'subscriptions', 'view') ? listPlans() : [], cms: canFor(actor, 'cms', 'view') ? listCms() : [], audit: actor ? clone(state.audit.filter(item => actor.role === 'superadmin' || item.actorId === actor.id)) : [] };
    }
    return { init, getState, currentUser, login, logout, can, listUsers, getUser, listManagers, saveUser, setUserStatus, deleteUser, updateProfile, changePassword, savePermissions, listMaster, saveMaster, setMasterStatus, deleteMaster, listPlans, savePlan, setPlanStatus, deletePlan, listCms, getCms, saveCms, sanitizeHtml, roles, masterTypes, permissionResources, planFeatures, demoAccounts, storageKey: STORAGE_KEY, sessionKey: SESSION_KEY, publicCmsKey: PUBLIC_CMS_KEY };
  }
  return Object.assign(createStore(), { createStore });
}));
