# SUES Design Network

Static site for www.sues.design/network/. It publishes verified signals of sustainable practice, Stories of Impact, Innovation Opportunities, Ecosystem Events and an Impact Dashboard, all placed on the Designing Sustainable Futures (DSF) matrix. No framework, no database: HTML, CSS and JavaScript pages read JSON files in `data/`.

All links are relative, so the folder runs unchanged at any path, for example `www.sues.design/network/` or `www.josephpress.com/network/`.

## Structure

```
network/
  index.html                 home: signal of the day, DSF map, stories, opportunities, next 30 days
  about/                     mission, DSF approach, Design Harvests 3.0, editorial standards, expert directory
  stories/                   map, filters, list and detail
  signals/                   feed, heat map, DSF cloud, trajectory, sortable table
  opportunities/             needs and matched solutions
  events/                    list, month calendar, map, iCal export
  dashboard/                 charts drawn from data/dashboard-data.json
  members/                   submission forms with automatic checks, My submissions
  assets/config.js           backends, sectors, solutions, DSF zone labels, targets
  assets/site.css, site.js   shared styles and runtime (header, footer, search, language toggle)
  assets/js/*.js             one script per page, plus cards.js for shared renderers
  data/                      one JSON array per file, newest first
  drafts/                    LinkedIn, working and digest drafts
  tools/validate-data.py     schema, duplicate URL, consent and em-dash checks
  tools/build-dashboard.py   writes data/dashboard-data.json
  tools/weekly-digest.py     writes drafts/digest-YYYY-MM-DD.md
```

## Publishing routine

1. Edit or add records in `data/*.json` (new records at the top).
2. `python3 tools/validate-data.py` must pass with 0 errors.
3. `python3 tools/build-dashboard.py`
4. Commit and push.

Deep links open one record: `/network/signals/#<record-id>`, and the same for stories, opportunities, events and experts (`/network/about/#<expert-id>`).

## Record states

- `"draft": true` shows a "Draft, pending verification" badge. Remove it after the editor opens the source and checks the entry.
- `"consent": "pending"` on experts and story practitioners shows a "Consent pending" badge. Set it to `true` after written consent.
- `"provenance"` records where the editor found the item. It is never rendered on the site.
- `"retracted": true` keeps a record in the archive with a retracted flag. `"correction"` shows a dated correction note.

## Configuration still to connect

Set these in `assets/config.js`:

- `subscribeEndpoint`: email platform form action for the weekly digest.
- `formEndpoint`: member portal backend that accepts JSON posts. Until it is set, forms run their checks and save on the visitor's device, with a download button.
- `dsfZones`: the four zone labels are placeholders until the Designing Sustainable Futures labels are confirmed.
- `dataLicence`: the data licence statement.

## Hosting at www.sues.design/network/

This folder lives in the josephpress.com repository. To serve it at www.sues.design/network/, either create a repository whose GitHub Pages custom domain is www.sues.design and copy this folder into it as `network/`, or create a repository named `network` under a GitHub account or organisation whose Pages domain is www.sues.design.
