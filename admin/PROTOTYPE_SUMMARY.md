# Nirvivad prototype summary

This record describes the current browser prototype as of 6 October 2026. It is also available in Administration → Prototype summary. Data is local to the browser and is for demonstration only.

## Account entry and roles

- Customer sign-in and signup use a mobile number and demo OTP. New users enter a name, optional email, and joining role; no role selection defaults to Buyer / Investor. Returning users resume their last role.
- One customer can add Buyer / Investor, Property Owner, Lawyer, and Chartered Accountant roles. The first role and later role history appear in the Administration customer directory.
- Administration uses separate email/password accounts for Super Admin, Sub Admin, and Employee. Team scope and permissions apply to their respective screens.

## KYC and professional profiles

- Aadhaar and PAN basic KYC is submitted once per customer and reused across roles. Identity attachments are optional and recorded as metadata; identifiers are masked in displays.
- Lawyer and CA profiles collect registration or membership details and proposed qualification document names. Super Admin reviews submitted profiles. Professional dashboards require approval.

## Property journey

- The Owner enters basic property details through a four-stage stepper, may save a draft, and submits to the Administration queue. Drafts expire under the prototype timer.
- Employees review properties and select additional FRD fields and document categories. Already submitted or requested items are marked. Owners respond to selected requests.
- New sample images and PDFs up to 2 MB can be previewed from browser-local storage. Older filename-only records cannot be previewed.
- Employees assign an approved Lawyer or CA with explicitly selected fields and documents. The professional sees only assigned data and submits a report. A customer cannot review a property they own under another role.
- Owners see relevant status, actions, and visible updates. Administration sees full property details and the activity trail. Property detail uses Details, Actions & requests, Professionals, and Activity trail tabs.

## Buyer enquiry journey

- Buyers complete basic KYC before seeing approved limited listings. An enquiry enters the team queue against a property.
- Staff assign and process the enquiry, request information, add remarks and follow-ups, and send customer-visible updates. Buyers see their requests and visible timeline only.
- Administration enquiry detail uses Enquiry details, Actions & requests, and Activity trail tabs. The audit includes Buyer and staff actions. Older history is reconstructed and labelled where actor details were not recorded.

## Other Administration capabilities

Users and reporting hierarchy, customer role and review filters, six master-data categories, subscription plan settings, CMS policy pages, profile editing, password changes, and recent Administration activity are part of the prototype. Access varies by staff role.

## Boundaries for the next phase

The demo OTP, browser storage, sample attachment previews, and current audit trail are not production services. Production work needs server-side authentication and authorization, a database, document storage, durable audit logging, real verification and payment integration. The FRD's final mandatory property document matrix and Lawyer/CA report templates still need client confirmation.
