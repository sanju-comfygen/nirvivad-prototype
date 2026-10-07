# Nirvivad prototype summary

This record describes the current browser prototype as of 7 October 2026. It is also available in Administration → Prototype summary. Data is local to the browser and is for demonstration only.

## Account entry and roles

- Customer sign-in and signup use a mobile number and demo OTP. New users enter a name, optional email, and joining role; no role selection defaults to Buyer / Investor. Returning users resume their last role.
- One customer can add Buyer / Investor, Property Owner, Lawyer, Chartered Accountant, Broker, Arbitrator, and Builder / Developer roles; NV Channel Partner is assigned by Super Admin. The first role and later role history appear in the Administration customer directory.
- Administration uses separate email/password accounts for Super Admin, Sub Admin, and Employee. Team scope and permissions apply to their respective screens.

## KYC and professional profiles

- Aadhaar and PAN basic KYC is submitted once per customer and reused across roles. Identity attachments are optional and recorded as metadata; identifiers are masked in displays.
- Lawyer, CA, Broker, Arbitrator, and Builder / Developer profiles collect registration or membership details and proposed qualification document names. Super Admin reviews submitted profiles. Role workspaces require approval. Demo Broker, Arbitrator and Builder / Developer profiles are seeded for Administration review.

## Property journey

- The Owner enters basic property details through a four-stage stepper, may save a draft, and submits to the Administration queue. Drafts expire under the prototype timer.
- Employees review properties and select additional FRD fields and document categories. Already submitted or requested items are marked. Owners respond to selected requests.
- New sample images and PDFs up to 2 MB can be previewed from browser-local storage. Older filename-only records cannot be previewed.
- Employees assign an approved Lawyer, CA, Broker, NV Channel Partner, Arbitrator, or Builder / Developer with explicitly selected fields and documents. Multiple approved people can hold the same role on one property. Administration selects property fields, documents, individual sections of a submitted report, optional report attachments, and internal note text for each assignee. Other assignees’ identities and contacts are hidden from the recipient; report attachments appear only when explicitly selected. The assignee submits their own report. A customer cannot review a property they own under another role.
- A submitted professional report remains read-only. Reassigning the same person creates a numbered follow-up round with newly selected information; earlier assignments and reports stay visible in that person’s history.
- Owners see relevant status, actions, and visible updates. Administration sees full property details and the activity trail. Property detail uses Details, Actions & requests, Professionals, and Activity trail tabs.

## Buyer enquiry journey

- Buyers complete basic KYC before seeing approved limited listings. An enquiry enters the team queue against a property.
- Staff assign and process the enquiry, request information, add remarks and follow-ups, and send customer-visible updates. An Employee or Super Admin may assign an approved Broker or NV Partner a scoped market-support task. Buyers see their requests and visible timeline only.
- After a Broker or NV Partner submits an enquiry update, assigning that same account again creates a numbered follow-up round. Earlier updates remain read-only in the assignee’s history.
- Administration enquiry detail uses Enquiry details, Actions & requests, Market support, and Activity trail tabs. Multiple Brokers or NV Partners can receive independent scoped market-support assignments; Buyer and Owner contact details are not shared. The audit includes Buyer and staff actions. Older history is reconstructed and labelled where actor details were not recorded.

## Other Administration capabilities

Users and reporting hierarchy, customer role and review filters, six master-data categories, subscription plan settings, CMS policy pages, profile editing, password changes, and recent Administration activity are part of the prototype. Access varies by staff role.

## Boundaries for the next phase

The demo OTP, browser storage, sample attachment previews, and current audit trail are not production services. Production work needs server-side authentication and authorization, a database, document storage, durable audit logging, real verification and payment integration. The FRD's final mandatory property document matrix and role-specific report templates still need client confirmation.

## Website Contact Us inbox

Contact Us submissions require a mobile number; email is optional. They are saved in browser-local storage. Administration has a Contact enquiries queue and detail page with status changes. Customers who verify the submitted mobile can view their own messages and statuses from any console role. The data is visible only when the pages use the same browser and site origin; production delivery and shared storage are not connected.
