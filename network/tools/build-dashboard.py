#!/usr/bin/env python3
"""
SUES Design Network dashboard builder.

Reads the data files and writes data/dashboard-data.json. The dashboard page
draws every chart from that file, so it holds no figures typed by hand.

Usage:
    python3 tools/build-dashboard.py
    python3 tools/build-dashboard.py --as-of 2026-10-04
"""

import datetime
import io
import json
import os
import sys
from collections import Counter, OrderedDict

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(os.path.dirname(HERE), "data")

SECTORS = ["Renewable energy", "Conscious consumption", "Circular manufacturing", "Community choices"]
SOLUTIONS = ["Materials", "Production", "Agriculture", "Construction"]
ZONES = ["local-collective", "global-collective", "local-individual", "global-individual"]
STORY_STATUSES = ["Idea", "Pilot", "Operating", "Scaling", "Paused", "Closed"]
OPP_STATUSES = ["Open", "Matched", "In conversation", "Piloting", "Closed"]
STRENGTH_RANK = {"weak": 1, "emerging": 2, "strong": 3}
TARGETS = {"signals": 500, "stories": 40, "experts": 60, "matched": 15, "subscribers": 1000}


def load(name):
    path = os.path.join(DATA, name)
    if not os.path.exists(path):
        return []
    with io.open(path, encoding="utf-8") as f:
        return json.load(f)


def parse(d):
    return datetime.date.fromisoformat(d)


def zone(r):
    if r.get("dsf_production") and r.get("dsf_consumption"):
        return "%s-%s" % (r["dsf_production"], r["dsf_consumption"])
    return ""


def chains(signals):
    ids = {s["id"]: s for s in signals}
    adj = {}
    for s in signals:
        for r in s.get("related_signals", []):
            if r in ids:
                adj.setdefault(s["id"], set()).add(r)
                adj.setdefault(r, set()).add(s["id"])
    seen, out = set(), []
    for start in adj:
        if start in seen:
            continue
        stack, comp = [start], []
        while stack:
            x = stack.pop()
            if x in seen:
                continue
            seen.add(x)
            comp.append(ids[x])
            stack.extend(adj.get(x, ()))
        comp.sort(key=lambda s: s["date"])
        out.append(comp)
    return out


def build(as_of):
    signals = [s for s in load("signals-data.json") if s.get("content_type", "daily") == "daily" and not s.get("retracted")]
    stories = [s for s in load("stories-data.json") if not s.get("retracted")]
    opps = load("opportunities-data.json")
    events = load("events-data.json")
    experts = load("experts-data.json")

    heat = OrderedDict()
    for sol in SOLUTIONS:
        for sec in SECTORS:
            cell = [s for s in signals if s.get("sector") == sec and s.get("solution") == sol]
            heat[sec + "|" + sol] = {
                "n": len(cell),
                "mean_impact": round(sum(s.get("impact_score", 0) for s in cell) / len(cell), 2) if cell else 0,
            }

    def zone_counts(days=None):
        c = OrderedDict((z, 0) for z in ZONES)
        for s in signals:
            if days is not None and (as_of - parse(s["date"])).days > days:
                continue
            z = zone(s)
            if z in c:
                c[z] += 1
        return c

    movement = {"up": 0, "down": 0, "unchanged": 0, "chains": []}
    for comp in chains(signals):
        a = STRENGTH_RANK.get(comp[0].get("signal_strength"), 0)
        b = STRENGTH_RANK.get(comp[-1].get("signal_strength"), 0)
        key = "up" if b > a else "down" if b < a else "unchanged"
        movement[key] += 1
        movement["chains"].append({
            "ids": [s["id"] for s in comp],
            "title_en": comp[-1].get("title_en", ""),
            "title_zh": comp[-1].get("title_zh", ""),
            "from": comp[0].get("signal_strength"),
            "to": comp[-1].get("signal_strength"),
            "direction": key,
        })

    status = OrderedDict((k, 0) for k in STORY_STATUSES)
    for s in stories:
        if s.get("status") in status:
            status[s["status"]] += 1

    by_unit = OrderedDict()
    for s in stories:
        for r in s.get("results", []):
            unit = (r.get("unit") or "").strip()
            if not unit:
                continue
            u = by_unit.setdefault(unit, {"unit": unit, "total": 0, "reported": 0, "third_party": 0, "items": []})
            v = float(r.get("value") or 0)
            u["total"] += v
            u["third_party" if r.get("verification") == "third-party" else "reported"] += v
            u["items"].append({
                "story_id": s["id"], "title_en": s.get("title_en", ""), "title_zh": s.get("title_zh", ""),
                "label": r.get("label", ""), "value": v, "period": r.get("period", ""),
                "verification": r.get("verification", "reported"),
            })
    results = sorted(by_unit.values(), key=lambda u: -len(u["items"]))

    funnel = OrderedDict([
        ("Needs received", len(opps)),
        ("Matched", sum(1 for o in opps if o.get("status") in OPP_STATUSES[1:] or o.get("matches"))),
        ("In conversation", sum(1 for o in opps if o.get("status") in ("In conversation", "Piloting") or (o.get("status") == "Closed" and o.get("outcome")))),
        ("Piloting", sum(1 for o in opps if o.get("status") == "Piloting")),
        ("Closed", sum(1 for o in opps if o.get("status") == "Closed")),
    ])

    country = Counter(e.get("country", "Unknown") for e in experts)
    discipline = Counter(d for e in experts for d in e.get("disciplines", []))

    ev_type = Counter(e.get("type", "") for e in events if e.get("status") != "cancelled")
    ev_region = Counter((e.get("place") or {}).get("country") or "Online" for e in events if e.get("status") != "cancelled")
    ev_month = Counter(e.get("start_date", "")[:7] for e in events if e.get("status") != "cancelled")
    produced = sum(1 for e in events if e.get("related_stories"))

    example = sum(1 for r in signals + stories + opps + events + experts if r.get("example"))
    draft = sum(1 for r in signals + stories + opps + events + experts if r.get("draft") or r.get("consent") == "pending")

    return OrderedDict([
        ("generated_at", datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat()),
        ("as_of", as_of.isoformat()),
        ("example_records", example),
        ("draft_records", draft),
        ("totals", OrderedDict([
            ("signals", len(signals)),
            ("verified_signals", sum(1 for s in signals if not s.get("draft") and s.get("verification", "verified") != "pending" and not s.get("example"))),
            ("stories", len(stories)), ("experts", len(experts)),
            ("opportunities", len(opps)), ("matched", sum(1 for o in opps if o.get("matches"))),
            ("events", len(events)), ("subscribers", None),
        ])),
        ("targets", TARGETS),
        ("heat", heat),
        ("dsf", {"last_90": zone_counts(90), "all_time": zone_counts()}),
        ("strength_movement", movement),
        ("story_status", status),
        ("results", results),
        ("story_points", [{
            "id": s["id"], "title_en": s.get("title_en", ""), "title_zh": s.get("title_zh", ""),
            "lat": (s.get("place") or {}).get("lat"), "lng": (s.get("place") or {}).get("lng"),
            "place": ", ".join(x for x in [(s.get("place") or {}).get("city"), (s.get("place") or {}).get("country")] if x),
            "zone": zone(s),
        } for s in stories]),
        ("funnel", funnel),
        ("experts_by_country", OrderedDict(country.most_common())),
        ("experts_by_discipline", OrderedDict(discipline.most_common())),
        ("events", OrderedDict([
            ("by_type", OrderedDict(ev_type.most_common())),
            ("by_region", OrderedDict(ev_region.most_common())),
            ("by_month", OrderedDict(sorted(ev_month.items()))),
            ("produced_story", produced),
        ])),
    ])


def main(argv):
    as_of = datetime.date.today()
    if "--as-of" in argv:
        as_of = parse(argv[argv.index("--as-of") + 1])
    out = build(as_of)
    path = os.path.join(DATA, "dashboard-data.json")
    with io.open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write("\n")
    t = out["totals"]
    print("Wrote %s: %d signals, %d stories, %d opportunities, %d events, %d experts" % (
        os.path.relpath(path), t["signals"], t["stories"], t["opportunities"], t["events"], t["experts"]))


if __name__ == "__main__":
    main(sys.argv[1:])
