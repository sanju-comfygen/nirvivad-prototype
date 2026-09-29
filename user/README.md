# Property Owner and Buyer / Investor prototype

Run from `Prototype` with `python3 -m http.server 8000 --bind 127.0.0.1`, then open `/user/`. The public website's **Log in / Register** link reaches this console. Administration has **Property submissions** and **Buyer enquiries** queues. Serve the whole folder on one origin so all three screens use the same browser records.

## Review journey

1. Enter a 10–15 digit mobile number. For this local prototype the displayed OTP is `123456`; no SMS is sent. It expires after five minutes and permits five attempts.
2. Set up a name and optional email. Choose Property Owner or Buyer / Investor. Add the second role later from **Add role**, and switch dashboards from the header.
3. As Owner, create a property. **Save draft** accepts incomplete details. A draft stays in the owner's account, expires after 10 minutes, and never appears in staff queues. **Submit for review** requires title, category, state, city, area, unit and ownership type.
4. Sign in to Administration (`sa@nirvivad.example` / `Nirvivad@123`). Open the property queue, assign a Sub Admin, then an Employee from that Sub Admin's team. Review status, add internal remarks, log follow-ups, request information, and send a customer-visible update. An Employee can handle only assigned requests and cannot publish or confirm KYC/subscription. Super Admin owns final publication or rejection in this prototype.
5. When status reaches **KYC needed**, the Owner can enter Aadhaar and PAN. The browser record keeps only Aadhaar's last four digits and a masked PAN. A staff member marks each reviewed; no external verification occurs. The Owner can select one of the 1 or 5 post annual plans. This records a request, not a payment. Staff can mark the subscription active for the workflow demonstration. At **Detailed information**, the Owner can provide address, survey identifier, case details and document names. Actual files are not uploaded.
6. As Buyer / Investor, browse the two illustrative approved summaries, submit interest, and track its status. Administration assigns a Sub Admin and Employee; the Employee records follow-up and customer-visible updates. Interest does not unlock owner contact or confidential property details.

Owner and buyer dashboards show references, simplified status/progress, required actions and customer-visible updates. Internal assignment, notes, contact details and review fields stay in staff views. The public site does not render property listings before login; browsing occurs inside the verified console.

## Configuration and source decisions

`nirvivad-journey-config-v1` is an optional localStorage JSON object. Its `draftExpiryMs` default is `600000` (10 minutes). To simulate the intended later production duration, set `draftExpiryMonths` to `1` in the same object; this calculates one calendar month from draft creation. Expiry logic reads the setting and needs no change. OTP lifetime and max attempts are also configurable. Expired drafts remain as read-only **Draft expired** records for review; they do not enter staff queues.

Fields and terminology follow `Client-Side-Docs/Nirvivad work (1) (1).xlsx`, `Nirvivad_Detailed_Role_Journey_FRD.xlsx`, the proposal PDF and their reviews in `Reviewed/`. Land/building/ownership/dispute types and area units match the Administration masters' seeded labels. The detailed FRD flags many proposed fields as unconfirmed. The submission form therefore gathers basic information first; sensitive identifiers and document details are a later stage. Two sample approved listings are clearly illustrative, with no owner account attached.

## Prototype limits

This is browser-local review software. OTP is fixed and visible; storage and role checks in JavaScript cannot protect production data. No SMS, KYC provider, payment gateway, file storage, messaging service, server session, cross-device data sharing or real publication decision is connected. Use sample information only. Production needs server-side authentication and authorization before real personal or property data is collected. Subscription prices remain unset in Administration; plan selection cannot be called a purchase.

Data uses `nirvivad-journeys-v1` in localStorage and `nirvivad-customer-session-v1` in sessionStorage. Remove these keys to reset customer demo data. The Administration records use separate keys documented in `admin/README.md`.

## Checks

```sh
node --test user/tests/journey.test.cjs
node user/tests/browser.cjs
```

The service tests cover OTP, multi-role identity, draft expiry, assignments, owner/buyer data projections, enquiry, KYC and later details. The Chrome test walks through public gating, owner draft/submission, staff queue, buyer enquiry and desktop/mobile console routes using an isolated browser profile.
