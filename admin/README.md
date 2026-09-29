# Nirvivad Administration

Administration follows the public website’s blue palette, typography and logo. This module includes email/password login, users and hierarchy, six master categories, subscriptions, CMS policies, profile editing and password changes. The second phase adds submitted-property and buyer-enquiry queues in the same panel; see the [customer workflow guide](../user/README.md).

## Run

Serve the Prototype folder so Administration and the public pages share an origin:

```sh
cd Prototype
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000/admin/. Use localhost or HTTPS for Web Crypto support.

| Role | Demo email | Password |
|---|---|---|
| Super Admin | sa@nirvivad.example | Nirvivad@123 |
| Sub Admin | subadmin@nirvivad.example | Nirvivad@123 |
| Employee | employee@nirvivad.example | Nirvivad@123 |

The seeded team also includes a second Sub Admin and their Employee to demonstrate team boundaries. Demo selectors fill credentials; they do not bypass password checking.

## Scope and storage

This is a functioning **local browser prototype**, not production authentication. Data persists in localStorage; the current session uses sessionStorage. Passwords use salted PBKDF2 hashes, but browser-owned storage and JavaScript cannot enforce production security. A backend, server-side authorization, database, password recovery and deployment remain separate implementation work. Do not use real credentials or confidential records.

Storage keys are `nirvivad-administration-v1`, `nirvivad-admin-session-v1` and `nirvivad-public-cms-v1`. To reset the demo, remove those keys using browser developer tools, then reload. This deletes local Administration records and published policies. Other browsers/devices do not share changes. Conflicting tab writes are rejected instead of silently overwriting newer data.

## Access and hierarchy

| Capability | Super Admin | Sub Admin | Employee |
|---|---|---|---|
| Users | Manage Sub Admins and Employees | Manage directly assigned Employees | No user management |
| Manager/role/permission assignment | Yes | No | No |
| Six master categories | Full CRUD and status | View by default | View by default |
| Subscriptions | Full CRUD and status | View by default | View by default |
| CMS policies | View, edit, draft, publish | No | No |
| Submitted property and buyer queues | All submitted requests and assignment | Incoming/unassigned or assigned team requests; assign direct-report Employees | Assigned requests, follow-up, remarks and information requests |
| Own profile/password | Yes | Yes | Yes |

Super Admin can allow or deny individual resource actions. Mutation permissions also require View. Overrides cannot bypass team boundaries, grant Employees user management, or grant other roles CMS access. Super Admin access remains full.

Sub Admins report to Super Admin. Employees report to an active Super Admin or Sub Admin. A Sub Admin can also have Employee capability without losing their primary role. Self-management, cycles and invalid managers are rejected. Reassign all reports before deleting, deactivating or changing a manager’s role. The Super Admin account is protected; its owner can edit their profile.

## Screens and fields

- **Overview:** scoped counts, quick actions, access summary and recent activity.
- **Request workflows:** submitted properties and Buyer enquiries, team assignment, processing status, follow-ups, internal remarks, information requests and customer-visible updates. Owner drafts do not appear in these queues.
- **Users:** searchable/filterable directory, pagination, reporting hierarchy, details, add/edit, status and deletion confirmation. Fields: name, email, phone, department, designation, role, manager, Employee capability, active status and initial password. Permissions have Role default / Allow / Deny controls.
- **Master data:** Land Type, Building Type, City Type, Ownership Type, Dispute Type and Unit of Measure. Each supports list/search, details, create/edit, status and deletion. Fields: name, unique code, description, sort order, additional-details flag and unit symbol where applicable.
- **Subscriptions:** list/search, details, create/edit, status and deletion. Fields include name, code, description, duration in months, property posting limit, INR price and all 14 workbook benefit fields.
- **CMS:** Terms & Conditions, Privacy Policy and Payment Policy. Rich-text editor supports headings, paragraphs, emphasis, lists and links, with preview, draft and publication actions. Unsafe markup is removed. Publishing updates the corresponding public policy page in the same browser/origin; later drafts keep the previous publication visible.
- **My account:** profile details, edit name/email/contact/department/designation, role/access summary, and current/new/confirmed password. A successful password change signs out the UI and invalidates other sessions.

Required fields, email format, case-insensitive duplicate emails/codes/names, contact format, numeric limits and permission boundaries are checked. Passwords require 10–128 characters with uppercase, lowercase, number and symbol. Plans require a configured nonnegative price before activation; zero is a valid free price.

## Source decisions

Requirements were reviewed against `Client-Side-Docs/Nirvivad work (1) (1).xlsx`, the other supplied workbook, proposal PDF and existing project reviews. See `Reviewed/Administration_Resource_Analysis.md` at the project root for traceability.

The workbook seeds 58 master entries: 9 land, 13 building, 7 city, 10 ownership, 10 dispute and 9 units. Two annual plans allow 1 and 5 property posts. Missing prices remain unset and both plans start inactive. Plan 1 benefit text follows the source; Plan 2’s unspecified benefits remain blank rather than being invented. A plan’s confidentiality text does not alter platform privacy behavior.

Subscription changes remain within Administration; the public marketing plan comparison remains its existing proposed content. No property, investor, payment-processing or unrelated administration modules were added.

## Verification

From the Prototype directory:

```sh
node --test admin/tests/store.test.cjs
node admin/tests/browser.cjs
```

The service suite checks authentication, hierarchy, role boundaries, validation, permissions, plans, CMS sanitisation, session invalidation, storage failures and tab conflicts. The browser suite requires Node 22+ and Google Chrome (`CHROME_BIN` can override the executable). It starts an isolated local server and temporary Chrome profile, exercises 23 routes at 1440px and 390px, checks CRUD and role-specific flows, and writes screenshots/results to a temporary directory printed on completion. It does not change your normal browser’s demo data.

Implementation: `admin-store.js` contains data operations and validation; `admin-ui.js` contains screens and navigation; `admin.css` provides responsive styling. Public CMS rendering lives in `../assets/cms-content.js`.
