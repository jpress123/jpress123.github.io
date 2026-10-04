#!/usr/bin/env python3
"""
SUES Design Network data validator.

Checks every data file before a commit: required fields, known values for
sector, solution, DSF coordinates, strength and status, impact score 1 to 5,
unique record IDs across files, duplicate source URLs, and any em-dash.

Usage:
    python3 tools/validate-data.py            # errors fail, warnings print
    python3 tools/validate-data.py --strict   # warnings also fail

Exit code 0 when the data passes, 1 when it does not.
"""

import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(os.path.dirname(HERE), "data")

SECTORS = {"Renewable energy", "Conscious consumption", "Circular manufacturing", "Community choices"}
SOLUTIONS = {"Materials", "Production", "Agriculture", "Construction"}
PRODUCTION = {"local", "global"}
CONSUMPTION = {"individual", "collective"}
ZONES = {p + "-" + c for p in PRODUCTION for c in CONSUMPTION}
STRENGTHS = {"weak", "emerging", "strong"}
CONTENT_TYPES = {"daily", "monthly_synthesis", "quarterly_report"}
STORY_STATUSES = {"Idea", "Pilot", "Operating", "Scaling", "Paused", "Closed"}
OPP_STATUSES = {"Open", "Matched", "In conversation", "Piloting", "Closed"}
EVENT_TYPES = {"conference", "workshop", "webinar", "field visit", "exhibition", "call", "deadline", "competition", "network event"}
EVENT_MODES = {"in person", "online", "hybrid"}
EVENT_STATUSES = {"upcoming", "live", "past", "cancelled"}
EMDASH = re.compile("[\u2014\u2015]")
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

errors, warnings = [], []


def err(f, rid, msg):
    errors.append("%s [%s] %s" % (f, rid, msg))


def warn(f, rid, msg):
    warnings.append("%s [%s] %s" % (f, rid, msg))


def load(name):
    path = os.path.join(DATA, name)
    if not os.path.exists(path):
        err(name, "-", "file missing")
        return []
    with io.open(path, encoding="utf-8") as f:
        raw = f.read()
    if EMDASH.search(raw):
        for i, line in enumerate(raw.splitlines(), 1):
            if EMDASH.search(line):
                err(name, "line %d" % i, "contains an em-dash")
    try:
        data = json.loads(raw)
    except ValueError as e:
        err(name, "-", "invalid JSON: %s" % e)
        return []
    if not isinstance(data, list):
        err(name, "-", "top level must be one array")
        return []
    return data


def need(f, r, fields):
    for k in fields:
        v = r.get(k)
        if v is None or v == "" or v == []:
            err(f, r.get("id", "?"), "missing required field '%s'" % k)


def check_dsf(f, r, required=True):
    rid = r.get("id", "?")
    p, c = r.get("dsf_production"), r.get("dsf_consumption")
    if required or p or c:
        if p not in PRODUCTION:
            err(f, rid, "unknown dsf_production '%s'" % p)
        if c not in CONSUMPTION:
            err(f, rid, "unknown dsf_consumption '%s'" % c)
    sz = r.get("dsf_secondary_zone")
    if sz and sz not in ZONES:
        err(f, rid, "unknown dsf_secondary_zone '%s'" % sz)


def check_date(f, r, k):
    v = r.get(k)
    if v and not DATE.match(v):
        err(f, r.get("id", "?"), "%s must be YYYY-MM-DD" % k)


def title_words(f, r):
    t = r.get("title_en", "")
    if t and len(t.split()) > 12:
        warn(f, r.get("id", "?"), "title_en has %d words (rule: 12 or fewer)" % len(t.split()))
    if ":" in t:
        warn(f, r.get("id", "?"), "title_en contains a colon")


def is_sorted_newest_first(f, data, key):
    dates = [r.get(key, "") for r in data]
    if dates != sorted(dates, reverse=True):
        warn(f, "-", "records are not newest first by '%s'" % key)


def main(argv):
    strict = "--strict" in argv
    files = {
        "signals-data.json": load("signals-data.json"),
        "stories-data.json": load("stories-data.json"),
        "opportunities-data.json": load("opportunities-data.json"),
        "events-data.json": load("events-data.json"),
        "experts-data.json": load("experts-data.json"),
        "submissions-queue.json": load("submissions-queue.json"),
    }

    ids = {}
    for f, data in files.items():
        if f == "submissions-queue.json":
            continue
        for r in data:
            rid = r.get("id")
            if not rid:
                err(f, "?", "record without id")
                continue
            if rid in ids:
                err(f, rid, "duplicate id (also in %s)" % ids[rid])
            ids[rid] = f
            if r.get("example"):
                warn(f, rid, "example record, replace before launch")
            if r.get("draft") or r.get("verification") == "pending":
                warn(f, rid, "draft, sources not yet verified by the editor")

    f = "signals-data.json"
    urls = {}
    for r in files[f]:
        rid = r.get("id", "?")
        need(f, r, ["id", "date", "sector", "solution", "signal_strength", "impact_score", "title_en", "source_url", "body"])
        check_date(f, r, "date")
        if r.get("id") and r.get("date") and not r["id"].startswith(r["date"]):
            warn(f, rid, "id should start with the date")
        if r.get("sector") not in SECTORS:
            err(f, rid, "unknown sector '%s'" % r.get("sector"))
        if r.get("solution") not in SOLUTIONS:
            err(f, rid, "unknown solution '%s'" % r.get("solution"))
        check_dsf(f, r)
        if r.get("signal_strength") not in STRENGTHS:
            err(f, rid, "unknown signal_strength '%s'" % r.get("signal_strength"))
        s = r.get("impact_score")
        if not isinstance(s, int) or not 1 <= s <= 5:
            err(f, rid, "impact_score must be an integer 1 to 5")
        if r.get("content_type", "daily") not in CONTENT_TYPES:
            err(f, rid, "unknown content_type '%s'" % r.get("content_type"))
        body = r.get("body") or {}
        if r.get("content_type", "daily") == "daily":
            for k in ("signal", "why_it_works", "transferability", "next_step"):
                if not body.get(k):
                    err(f, rid, "body.%s is empty" % k)
            if not (r.get("place") or {}).get("country"):
                warn(f, rid, "place.country is empty")
        if not r.get("title_zh"):
            warn(f, rid, "title_zh is empty")
        title_words(f, r)
        u = (r.get("source_url") or "").strip().rstrip("/").lower()
        if u:
            if u in urls:
                err(f, rid, "duplicate source_url (also %s)" % urls[u])
            urls[u] = rid
        for k in ("related_signals", "related_stories", "related_opportunities"):
            for x in r.get(k, []):
                if x not in ids:
                    warn(f, rid, "%s points to unknown id '%s'" % (k, x))
    is_sorted_newest_first(f, files[f], "date")
    nums = [r.get("day_number") for r in files[f] if isinstance(r.get("day_number"), int)]
    if len(nums) != len(set(nums)):
        err(f, "-", "day_number values repeat")

    f = "stories-data.json"
    for r in files[f]:
        rid = r.get("id", "?")
        need(f, r, ["id", "title_en", "place", "practitioners", "challenge", "solution", "status", "lessons"])
        title_words(f, r)
        check_dsf(f, r)
        if r.get("status") not in STORY_STATUSES:
            err(f, rid, "unknown status '%s'" % r.get("status"))
        sol = r.get("solution") or {}
        if sol.get("sector") not in SECTORS:
            err(f, rid, "solution.sector unknown '%s'" % sol.get("sector"))
        if sol.get("solution_type") not in SOLUTIONS:
            err(f, rid, "solution.solution_type unknown '%s'" % sol.get("solution_type"))
        for p in r.get("practitioners", []):
            if p.get("consent") == "pending":
                warn(f, rid, "practitioner '%s' consent pending" % p.get("name"))
            elif p.get("consent") is not True:
                err(f, rid, "practitioner '%s' has no recorded consent" % p.get("name"))
        for res in r.get("results", []):
            for k in ("value", "unit", "period", "source"):
                if res.get(k) in (None, ""):
                    err(f, rid, "result '%s' missing %s" % (res.get("label"), k))
            if res.get("verification") not in ("reported", "third-party"):
                err(f, rid, "result '%s' verification must be 'reported' or 'third-party'" % res.get("label"))
        img = r.get("image") or {}
        if img.get("url") and not img.get("licence"):
            err(f, rid, "image has no licence note")
        pl = r.get("place") or {}
        if pl.get("lat") is None or pl.get("lng") is None:
            warn(f, rid, "place has no coordinates (needed for the story map)")

    f = "opportunities-data.json"
    for r in files[f]:
        rid = r.get("id", "?")
        need(f, r, ["id", "date", "title_en", "description", "place", "sector", "solution_type", "status"])
        check_date(f, r, "date")
        check_dsf(f, r, required=False)
        if r.get("sector") not in SECTORS:
            err(f, rid, "unknown sector '%s'" % r.get("sector"))
        if r.get("solution_type") not in SOLUTIONS:
            err(f, rid, "unknown solution_type '%s'" % r.get("solution_type"))
        if r.get("status") not in OPP_STATUSES:
            err(f, rid, "unknown status '%s'" % r.get("status"))
        for m in r.get("matches", []):
            if not m.get("rationale"):
                err(f, rid, "match '%s' has no rationale" % m.get("practice"))
        if "@" in json.dumps(r):
            err(f, rid, "contains an email address; personal contact details stay off the public page")

    f = "events-data.json"
    for r in files[f]:
        rid = r.get("id", "?")
        need(f, r, ["id", "title_en", "type", "start_date", "mode", "organiser", "status"])
        if not r.get("source_url"):
            if r.get("type") == "network event":
                warn(f, rid, "network event without a source page")
            else:
                err(f, rid, "missing required field 'source_url'")
        if r.get("date_confirmed") is False:
            warn(f, rid, "date to be confirmed")
        check_date(f, r, "start_date")
        check_date(f, r, "end_date")
        if r.get("type") not in EVENT_TYPES:
            err(f, rid, "unknown type '%s'" % r.get("type"))
        if r.get("mode") not in EVENT_MODES:
            err(f, rid, "unknown mode '%s'" % r.get("mode"))
        if r.get("status") not in EVENT_STATUSES:
            err(f, rid, "unknown status '%s'" % r.get("status"))
        if r.get("end_date") and r.get("start_date") and r["end_date"] < r["start_date"]:
            err(f, rid, "end_date is before start_date")
        for s in r.get("sectors", []):
            if s not in SECTORS:
                err(f, rid, "unknown sector '%s'" % s)
        for s in r.get("solutions", []):
            if s not in SOLUTIONS:
                err(f, rid, "unknown solution '%s'" % s)
        check_dsf(f, r, required=False)

    f = "experts-data.json"
    for r in files[f]:
        need(f, r, ["id", "name", "organisation", "country", "disciplines"])
        if r.get("consent") == "pending":
            warn(f, r.get("id", "?"), "expert consent pending, confirm before launch")
        elif r.get("consent") is not True:
            err(f, r.get("id", "?"), "expert listed without consent")

    for w in warnings:
        print("WARN  " + w)
    for e in errors:
        print("ERROR " + e)
    total = sum(len(v) for v in files.values())
    print("\n%d records checked: %d errors, %d warnings" % (total, len(errors), len(warnings)))
    if errors or (strict and warnings):
        print("Do not commit. Fix the data and run the validator again.")
        return 1
    print("Data passes.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
