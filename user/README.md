# Property Owner and Buyer / Investor prototype

Run from `Prototype` with `python3 -m http.server 8000 --bind 127.0.0.1`, then open `/user/`. The public website's **Log in / Register** link reaches this console. Administration has **Property submissions** and **Buyer enquiries** queues. Serve the whole folder on one origin so all three screens use the same browser records.

## Review journey

1. On the public website, click **Log in / Register** to open the shared modal without leaving the page. Enter a mobile number in the single login/signup entry, then complete OTP in the same modal. New numbers continue to basic details and a role choice; returning numbers open their last active role. The console uses the same component. Demo OTP is `123456`; no SMS is sent. The system chooses login or signup after verification.
2. Signup asks for a name, optional email and optional starting role. An unselected role defaults to **Buyer / Investor**. Add Owner or Lawyer later from **Manage roles** and switch dashboards from the header.
3. Open **KYC centre** at any time. Submit Aadhaar and PAN details once for the account; card attachments are optional. Adding or switching to Owner, Buyer or Lawyer reuses this basic KYC and does not show another entry form. Degree, registration and other role-specific requirements are deferred until the client supplies them. Attachment selections store names, MIME type and size only, not file contents. No real verification occurs.
4. Basic KYC does not depend on creating a property, staff assignment or Employee eligibility. It is reused for the Owner's properties and permits Buyer browsing/enquiries when that role is held. Existing demo records with completed KYC under one role are recognized for the same account's other roles.
5. As Owner, create a property. **Save draft** accepts incomplete details; drafts expire after 10 minutes and stay outside staff queues. **Submit for review** requires basic property details.
6. In Administration, assign a Sub Admin and an Employee from that team. Staff can review, add internal notes, request information and send customer updates. The Employee marks the property **Eligible for deal**. Eligibility remains a property decision: eligibility plus completed basic KYC unlock plan selection regardless of which happened first. Plan choice then unlocks detailed property information. No payment is processed, and actual property documents are not uploaded.
7. Buyer dashboards and enquiry history can open before KYC. Browsing approved summaries or submitting new interest requires completed **basic KYC**. Enquiries do not reveal Owner contact or confidential property records.
8. Lawyer has a profile and independent KYC screen; professional allocation/reporting is outside this change. More role definitions can be added to `roleDefinitions` in `assets/journey-store.js` once their extra fields are specified.

Owner and Buyer dashboards retain role-scoped status, requested actions and customer updates. Internal notes and assignments stay in staff views. Login/OTP modal supports keyboard focus, Escape dismissal and focus restoration.

## Configuration and source decisions

`nirvivad-journey-config-v1` is an optional localStorage JSON object. Its `draftExpiryMs` default is `600000` (10 minutes). To simulate the intended later production duration, set `draftExpiryMonths` to `1` in the same object; this calculates one calendar month from draft creation. Expiry logic reads the setting and needs no change. OTP lifetime and max attempts are also configurable. Expired drafts remain as read-only **Draft expired** records for review; they do not enter staff queues.

Fields and terminology follow `Client-Side-Docs/Nirvivad work (1) (1).xlsx`, `Nirvivad_Detailed_Role_Journey_FRD.xlsx`, the proposal PDF and their reviews in `Reviewed/`. Land/building/ownership/dispute types and area units match the Administration masters' seeded labels. The detailed FRD flags many proposed fields as unconfirmed. The submission form therefore gathers basic information first; sensitive identifiers and document details are a later stage. Two sample approved listings are clearly illustrative, with no owner account attached.

## Prototype limits

This is browser-local review software. OTP is fixed and visible; optional KYC attachment selections record metadata only; storage and role checks in JavaScript cannot protect production data. No SMS, KYC provider, payment gateway, file storage, messaging service, server session, cross-device data sharing or real publication decision is connected. Use sample information only. Production needs server-side authentication and authorization before real personal or property data is collected. Subscription prices remain unset in Administration; plan selection cannot be called a purchase.

Data uses `nirvivad-journeys-v1` in localStorage and `nirvivad-customer-session-v1` in sessionStorage. Remove these keys to reset customer demo data. The Administration records use separate keys documented in `admin/README.md`.

## Checks

```sh
node --test user/tests/journey.test.cjs
node user/tests/browser.cjs
```

The service tests cover OTP, multi-role identity, draft expiry, assignments, owner/buyer data projections, enquiry, KYC and later details. The Chrome test walks through public gating, owner draft/submission, staff queue, buyer enquiry and desktop/mobile console routes using an isolated browser profile.

## Verification — 6 October 2026

Customer browser checks now cover global authentication, invalid OTP, default Buyer signup, shared basic KYC across Buyer, Owner, Lawyer and CA, Super Admin professional approval, alongside existing property and enquiry journeys. KYC service checks cover reuse across current and newly added roles, older prototype records, masked identifiers, attachment metadata validation and new and returning account checks. Sign out returns to the public site without opening the login modal.

## Lawyer and CA profile review — 6 October 2026

The **Lawyer** and **Chartered Accountant** roles reuse the account's basic Aadhaar/PAN KYC. Their professional dashboards are locked until a profile is submitted and approved in Administration. The profile asks for a registration/membership number, issuing authority, optional qualification/degree, and the names of two credential documents. The prototype stores document names only; it does not upload files or verify professional standing. A returned profile can be corrected and resubmitted. Approval is limited to Super Admin in this demo.

Suggested evidence for the client to confirm:

| Role | Primary professional details and documents |
| --- | --- |
| Lawyer | State Bar Council enrolment number and enrolment certificate; Bar Council Certificate of Practice. Law degree may be an optional supporting document. |
| Chartered Accountant | ICAI membership number and membership certificate; Certificate of Practice for a practising CA. Degree/pass certificate may be an optional supporting document. |

The [Bar Council of India AIBE guidance](https://www.barcouncilofindia.org/info/aibe-info) describes State Bar Council enrolment and the Certificate of Practice after AIBE. [ICAI member services](https://www.icai.org/post/17162) lists membership certificate verification and Membership/COP certificates. [ICAI's member FAQ](https://icai-call-sahayata.icai.org/assets/pdf/membership.pdf) states that COP does not have a separate number; use the ICAI membership number plus COP status/document. These are proposed intake fields, not a final document policy.

The Administration **Customer accounts** list is separate from internal staff users. It shows the role used at joining, later roles, shared basic KYC status and each professional review status. The customer detail page shows role history and supports approval or return for changes. Do not use real qualification files in the browser prototype.

### Sample Lawyer and CA accounts

Two clearly labelled demo accounts are seeded into browser-local customer storage, including for existing prototype data. They contain masked basic KYC and **sample document names only**. Both professional profiles begin as **Submitted**, so the Super Admin can review and approve them in **Administration → Customer accounts**.

| Profile | Mobile number | Example credential details |
| --- | --- | --- |
| Demo Lawyer | `9000000191` | `BAR-DEMO-2026-01`, sample enrolment and practice certificate names |
| Demo Chartered Accountant | `9000000192` | `ICAI-DEMO-2026-02`, sample membership and practice certificate names |

Enter either number in the customer login modal and use demo OTP `123456` to inspect its KYC and pending professional profile. These are fictional records; no real documents or identity numbers are stored.

### FRD property review workflow

The Property Owner basic submission uses four steps: property basics, location, ownership, and dispute/review. Submitted properties enter the Administration queue. An assigned Employee can request selected additional fields and document categories; the Owner sees and answers only those requests. Newly submitted sample images and PDFs (up to 2 MB each) are stored in browser-local storage for previews. Earlier metadata-only submissions cannot be previewed. No file is uploaded to a server.

Employees can assign approved Lawyer and CA accounts with an explicit list of shared fields and selected submitted document previews. Each professional sees only their own assigned cases and the selected data, then submits a role-specific report. Administration can inspect the complete case and activity trail. The Owner view shows milestones and requested actions rather than internal reports or remarks.

Field names follow `Client-Side-Docs/Nirvivad_Detailed_Role_Journey_FRD.xlsx`, especially sheet 12. The FRD leaves the mandatory document matrix and final Lawyer/CA report templates open, so the prototype uses selectable document categories and provisional report sections. This browser-only workflow is for review; production use needs server-side authorization, real document storage, and durable audit logging.

The Employee checklist marks already supplied or pending items and does not allow duplicate requests. The same account may hold Owner, Lawyer, and CA roles, but it cannot be assigned to review a property it owns. Property step completion is recorded in the case activity trail, which Administration sees as a timeline.

Administration property cases now use Details, Actions & requests, Professionals, and Activity trail tabs. Owner updates use a timeline. New sample image and PDF submissions have preview tiles that open in a new tab; previously saved metadata-only entries remain labelled as unavailable for preview.

Buyer property enquiries now have an Administration audit timeline for submission, assignment, status changes, staff remarks and follow-ups, information requests and Buyer responses. Earlier enquiries are reconstructed from saved history and clearly marked as earlier records where actor attribution was not stored. Buyers see only their own updates in a timeline.

The Administration enquiry detail page uses three responsive tabs: Enquiry details, Actions & requests, and Activity trail. Saving an enquiry action returns to its Actions tab.
