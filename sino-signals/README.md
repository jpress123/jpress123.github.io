# Sino-Signals

Daily AI signals from China with strategic forecasts for the West.

## File Structure

```
sino-signals/
  index.html          Main microsite (HTML + inline CSS + JS)
  signals-data.json   Signal entries (loaded by index.html on page load)
  README.md           This file
```

## Adding a New Signal

Add a new object to `signals-data.json`. Each entry follows this schema:

```json
{
  "id": "2026-04-08-short-slug",
  "date": "2026-04-08",
  "day_number": 8,
  "category": "Consumer & Society",
  "category_emoji": "\ud83c\udfe0",
  "signal_strength": "emerging",
  "strength_emoji": "\ud83d\udfe0",
  "title_en": "English title",
  "title_cn": "Chinese title",
  "source_url": "https://...",
  "source_name": "Source Name",
  "tags": ["tag1", "tag2"],
  "related_signals": ["2026-04-03-earlier-signal-id"],
  "industry_lens": "sector",
  "content_type": "daily",
  "body": {
    "signal": "What is the signal?",
    "china_scale": "Why can it scale in China?",
    "global_impact": "How might it impact the world?",
    "monday_morning": "So what would you do Monday morning?",
    "related_notes": ""
  }
}
```

**Content types:** `daily`, `monthly_synthesis`, `quarterly_report`

**Signal strengths:** `weak`, `emerging`, `strong`

**Categories (7-day rotation):**
- Monday: Policy & Governance
- Tuesday: Technology & Research
- Wednesday: Industry & Enterprise
- Thursday: Investment & Capital
- Friday: Talent & Education
- Saturday: Consumer & Society
- Sunday: Infrastructure & Compute

The site automatically sorts by date (newest first) and displays the most recent signal as the hero card.

## Deployment

Upload all files in `sino-signals/` to the repo root. GitHub Pages serves the site at `www.josephpress.com/sino-signals/` automatically. No build step required.

## Dependencies

None. Vanilla HTML, CSS, and JavaScript. Google Fonts (Inter, Playfair Display) loaded via CDN.
