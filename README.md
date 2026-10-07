# Nirvivad website and Administration prototype

Open `index.html` directly, or serve this folder locally:

```sh
cd Prototype
python3 -m http.server 8000 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:8000`. There are no build dependencies or external font/image requests.

## Public website

- Home: original property imagery, branded hero, private-discovery invitation, process, audiences, About, plans and FAQs.
- Explore properties: anonymous visitors see the login gate; verified customers browse limited, approved summaries in the customer console.
- How it works: six steps and privacy boundaries.
- Plans: proposed one-property and five-property annual plans with a comparison table.
- About: platform story, principles and the new logo concept.
- Contact: mobile number is required and email is optional. Submitted website enquiries appear in the browser-local Administration inbox and in the verified mobile account’s console, with a reference shown after submission.
- Privacy, terms and payment information: preview content until a policy is published through Administration.
- [Prototype recordings](recordings.html): dated walkthrough folders with videos, PDF guides, slide gallery, notes and shareable packs.

Navigation uses URL hashes and supports direct links and browser history. The [Customer Console](user/index.html) provides one shared login/signup/OTP flow, default Buyer registration, independent role KYC, Owner drafts/submissions and Buyer enquiries. See [its review guide](user/README.md). The [Administration Panel](admin/index.html) provides user, master data, subscription and policy management. See [Administration setup and workflows](admin/README.md). The earlier `user/index.html` demo has been replaced by the connected customer prototype. `nirvivad-clickable-prototype/index.html` remains a separate legacy demo.

## Editing

| File | Purpose |
|---|---|
| `index.html` | Shared document, navigation and footer |
| `assets/website-content.js` | Example properties, plan data, FAQs, process and About copy |
| `assets/website.js` | Public page templates, navigation and interactions |
| `assets/contact-store.js` | Browser-local Contact Us submissions shared with Administration and matched to customer accounts by verified mobile number |
| `assets/website.css` | Responsive design and design tokens |
| `recordings.html` and `assets/recordings.css` | Date-wise walkthrough library and responsive layout |
| `assets/nirvivad-mark.svg` | Standalone scalable N/roof mark and favicon |
| `assets/nirvivad-logo.svg` | Standalone logo with wordmark and tagline |
| `assets/IMAGE_PROMPTS.md` | Original image prompts, generation method and asset provenance |

This is a static browser prototype. Administration includes a local CMS editor: published policies appear on the public Terms, Privacy and Payment pages in the same browser and origin. Drafts preserve the last published version. `assets/cms-content.js` reads only the published projection and sanitises its HTML. There is no production backend or shared database.

## Content boundaries

Customer console listings are illustrative examples, not live inventory. All images are generated representative scenes, not photographs of real listed properties or actual staff. There are no invented customer testimonials, live transaction metrics or membership prices.

Plan counts and duration come from `Client-Side-Docs/Nirvivad work (1) (1).xlsx`. Plan 1 benefits are labelled proposed. Plan 2's unspecified benefits remain unconfirmed. The site does not resolve the outstanding payment-timing differences between the existing proposal and detailed workflow prototype.

Contact Us submissions appear under **Contact enquiries** in Administration and under **Contact enquiries** in the customer console after login with the submitted mobile number. A signed-in customer’s verified mobile is prefilled on the form. These records are stored in local browser storage only, so all views need the same browser and origin; there is no server delivery, cross-device sharing, email or notification integration. Owner and Buyer records in the second module also use browser storage; see the customer review guide for its limits.

## Design

Primary blue `#1e4f91`, deep blue `#163d72`, accent blue `#3b82c4`, muted slate `#566b85` and a cool background `#f5f8fc`. The vector logo combines an open roof and N; original neighbourhood, bungalow, agricultural and collaboration imagery provides the public website's visual identity. System serif and sans-serif fonts keep the preview self-contained.

## Verification — 28 September 2026

- JavaScript syntax checked for both public-site scripts.
- Headless Chrome: all nine public routes render one primary heading, without horizontal overflow at desktop and 390px mobile widths.
- Homepage also checked at 320px, 768px and 1024px.
- The former public catalogue checks applied before the second module changed property access. Current customer and Admin browser checks are listed in their module guides.
- All homepage assets loaded; no failing asset requests or application runtime exceptions in the completed browser run.
- Desktop and mobile screenshots inspected. Contact page inspected separately.

These are prototype checks, not a production accessibility, security or performance certification.


## Administration verification — 29 September 2026

The Administration checks cover 23 routes at desktop and mobile widths, user hierarchy and permission boundaries, CRUD operations, profile/password workflows, and CMS publication to the public site. Run the repeatable checks using the commands in [admin/README.md](admin/README.md).


## Property Owner and Buyer / Investor phase — 29 September 2026

The customer console and Administration request queues now share a browser-local workflow. Anonymous public routes contain no listing cards or search results. The [second-module resource review](../Reviewed/Second_Module_Resource_Analysis.md) records source decisions and unresolved production integrations. See [customer setup and checks](user/README.md).
