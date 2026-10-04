#!/usr/bin/env python3
"""
SUES Design Network weekly digest generator.

Selects up to seven signals from one Monday-to-Sunday week, promotes the
highest-impact one to editorial pick, and writes drafts/digest-YYYY-MM-DD.md
for the editor to paste into the email platform. Refuses to write if an
em-dash appears.

Usage:
    python3 tools/weekly-digest.py                     # week ending the most recent Sunday
    python3 tools/weekly-digest.py 2026-10-11          # week ending a given Sunday
    python3 tools/weekly-digest.py 2026-10-11 --pick <signal-id>
"""

import datetime
import io
import json
import os
import re
import sys

CAP = 7
RANK = {"strong": 3, "emerging": 2, "weak": 1}
LABEL = {"strong": "Accelerating", "emerging": "Emerging", "weak": "Early"}
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data", "signals-data.json")
BASE = "https://www.sues.design/network/signals/#"


def recent_sunday(today=None):
    today = today or datetime.date.today()
    return today - datetime.timedelta(days=(today.weekday() + 1) % 7)


def rank(s):
    return (s.get("impact_score", 0), RANK.get(s.get("signal_strength"), 0), s.get("date", ""))


def build(week_end, pick_id=None):
    start = week_end - datetime.timedelta(days=6)
    with io.open(DATA, encoding="utf-8") as f:
        data = json.load(f)
    week = [s for s in data if s.get("content_type", "daily") == "daily" and not s.get("retracted")
            and start <= datetime.date.fromisoformat(s["date"]) <= week_end]
    if not week:
        raise SystemExit("No signals found for the week ending %s" % week_end)
    week.sort(key=rank, reverse=True)
    pick = next((s for s in week if s["id"] == pick_id), None) if pick_id else week[0]
    if pick_id and not pick:
        raise SystemExit("Pick %s is not in this week" % pick_id)
    rest = [s for s in week if s is not pick][:CAP]
    held = [s for s in week if s is not pick][CAP:]

    out = ["# SUES Design Network weekly digest", "",
           "%s to %s" % (start.strftime("%d %B"), week_end.strftime("%d %B %Y")), "",
           "## Editorial pick", "", entry(pick, True), "", "## This week's signals", ""]
    out += [entry(s, False) + "\n" for s in rest]
    out += ["---", "", "An AI agent drafts entries from verified sources. A human editor approves every entry before publication."]
    text = "\n".join(out)
    if re.search("[\u2014\u2015]", text):
        raise SystemExit("Em-dash found. Fix the data and run again.")
    path = os.path.join(ROOT, "drafts", "digest-%s.md" % week_end.isoformat())
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(text + "\n")
    print("Wrote %s" % os.path.relpath(path, ROOT))
    print("Pick: %s (impact %s)" % (pick["title_en"], pick.get("impact_score")))
    for s in held:
        print("Held back: %s" % s["title_en"])
    if any(s.get("draft") for s in [pick] + rest):
        print("Warning: the digest includes draft records that are not yet verified.")


def entry(s, full):
    b = s.get("body", {})
    lines = ["### %s" % s["title_en"],
             "%s | %s | %s | Impact %s/5" % (s["sector"], s["solution"], LABEL.get(s["signal_strength"], ""), s.get("impact_score")), "",
             b.get("signal", "")]
    if full:
        lines += ["", "**Why it works.** " + b.get("why_it_works", ""), "", "**Transferability.** " + b.get("transferability", ""),
                  "", "**This week.** " + b.get("next_step", "")]
    lines += ["", "[Read on the site](%s%s) | [Source](%s)" % (BASE, s["id"], s.get("source_url", ""))]
    return "\n".join(lines)


if __name__ == "__main__":
    args = sys.argv[1:]
    pick = None
    if "--pick" in args:
        i = args.index("--pick")
        pick = args[i + 1]
        del args[i:i + 2]
    end = datetime.date.fromisoformat(args[0]) if args else recent_sunday()
    build(end, pick)
