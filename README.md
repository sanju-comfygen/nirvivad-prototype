# Nirvivad public website prototype

Open `index.html` directly, or serve this folder locally:

```sh
cd Prototype
python3 -m http.server 8000 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:8000`. There are no build dependencies or external font/image requests.

## Public website

- Home: original property imagery, branded hero, search, featured opportunities, process, audiences, About, plans and FAQs.
- Explore properties: city/type/opportunity/text filters, area sorting, saved properties, empty states and accessible detail dialogs.
- How it works: six steps and privacy boundaries.
- Plans: proposed one-property and five-property annual plans with a comparison table.
- About: platform story, principles and the new logo concept.
- Contact: validated enquiry preparation and local text-file download. **No enquiry is sent.**
- Privacy, terms and payment information: clearly labelled preview content.

Navigation uses URL hashes and supports direct links and browser history. Existing `user/index.html`, `admin/index.html` and `nirvivad-clickable-prototype/index.html` remain separate and unchanged.

## Editing

| File | Purpose |
|---|---|
| `index.html` | Shared document, navigation and footer |
| `assets/website-content.js` | Example properties, plan data, FAQs, process and About copy |
| `assets/website.js` | Public page templates, navigation and interactions |
| `assets/website.css` | Responsive design and design tokens |
| `assets/nirvivad-mark.svg` | Standalone scalable N/roof mark and favicon |
| `assets/nirvivad-logo.svg` | Standalone logo with wordmark and tagline |
| `assets/IMAGE_PROMPTS.md` | Original image prompts, generation method and asset provenance |

This is an editable static public site, **not a connected CMS**. A CMS editor and administration workflows are later work. The About title is trusted local HTML; other content records are escaped when rendered. Do not connect untrusted CMS HTML without sanitisation.

## Content boundaries

Properties and review labels are examples, not live inventory. All images are generated representative scenes, not photographs of real listed properties or actual staff. There are no invented customer testimonials, live transaction metrics or membership prices.

Plan counts and duration come from `Client-Side-Docs/Nirvivad work (1) (1).xlsx`. Plan 1 benefits are labelled proposed. Plan 2's unspecified benefits remain unconfirmed. The site does not resolve the outstanding payment-timing differences between the existing proposal and detailed workflow prototype.

The contact form keeps its prepared text in memory only and never transmits it. Editing the form invalidates a previously prepared download. Saved example property IDs use browser local storage; saving still works for the current visit if storage is unavailable.

## Design

Primary blue `#1e4f91`, deep blue `#163d72`, accent blue `#3b82c4`, muted slate `#566b85` and a cool background `#f5f8fc`. The vector logo combines an open roof and N; original neighbourhood, bungalow, agricultural and collaboration imagery provides the public website's visual identity. System serif and sans-serif fonts keep the preview self-contained.

## Verification — 28 September 2026

- JavaScript syntax checked for both public-site scripts.
- Headless Chrome: all nine public routes render one primary heading, without horizontal overflow at desktop and 390px mobile widths.
- Homepage also checked at 320px, 768px and 1024px.
- Search transfers selected category to the catalogue; reset, saved filter, property dialog, empty state, plan-prefilled enquiries, form validation and mobile navigation checked.
- All homepage assets loaded; no failing asset requests or application runtime exceptions in the completed browser run.
- Desktop and mobile screenshots inspected. Contact page inspected separately.

These are prototype checks, not a production accessibility, security or performance certification.
