#!/usr/bin/env python3
"""
Sino-Signals weekly digest generator.

Reads signals-data.json, selects the strongest seven signals from one
Monday-to-Sunday week, promotes the highest-impact one to editorial pick,
and writes a Substack-ready markdown file.

Usage:
    python3 weekly-digest.py                    # week ending the most recent Sunday
    python3 weekly-digest.py 2026-09-13         # week ending a specific Sunday
    python3 weekly-digest.py 2026-09-13 --pick 2026-09-11-alibaba-...   # override the pick

Output: digest-YYYY-MM-DD.md (dated by the Sunday that ends the week)
"""

import json
import sys
import io
import os
import datetime

SIGNAL_CAP = 7  # the promise on the site: "7 signals + the editorial pick of the week"
STRENGTH_RANK = {"strong": 3, "emerging": 2, "weak": 1}
STRENGTH_LABEL = {"strong": "Accelerating", "emerging": "Emerging", "weak": "Early"}
LENS_LABEL = {
    "automotive": "Mobility",
    "consumer": "Consumer Products",
    "pharma": "Health & Pharma",
    "education": "Education",
    "financial services": "Financial Services",
    "entertainment": "Entertainment",
}

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "signals-data.json")


def most_recent_sunday(today=None):
    today = today or datetime.date.today()
    return today - datetime.timedelta(days=(today.weekday() + 1) % 7)


def load_week(week_end):
    """week_end is the Sunday. Window is the Monday six days before, inclusive."""
    week_start = week_end - datetime.timedelta(days=6)
    with io.open(DATA, encoding="utf-8") as f:
        data = json.load(f)
    out = []
    for s in data:
        try:
            d = datetime.date.fromisoformat(s["date"])
        except (KeyError, ValueError):
            continue
        if week_start <= d <= week_end:
            out.append(s)
    return out, week_start


def rank(s):
    """Higher is stronger. Impact dominates, then market maturity, then recency."""
    return (
        s.get("impact_score", 0),
        STRENGTH_RANK.get(s.get("signal_strength"), 0),
        s.get("date", ""),
    )


def fmt_range(start, end):
    if start.month == end.month:
        return "%s %d to %d, %d" % (start.strftime("%B"), start.day, end.day, end.year)
    return "%s %d to %s %d, %d" % (
        start.strftime("%B"), start.day, end.strftime("%B"), end.day, end.year
    )


def build(week_end, pick_id=None):
    week, week_start = load_week(week_end)
    if not week:
        raise SystemExit("No signals found for week ending %s" % week_end)

    ordered = sorted(week, key=rank, reverse=True)
    selected = ordered[:SIGNAL_CAP]
    dropped = ordered[SIGNAL_CAP:]

    if pick_id:
        match = [s for s in selected if s["id"] == pick_id]
        if not match:
            match = [s for s in week if s["id"] == pick_id]
            if not match:
                raise SystemExit("Pick id not found in this week: %s" % pick_id)
            selected = [match[0]] + selected[: SIGNAL_CAP - 1]
        pick = match[0]
    else:
        pick = selected[0]

    rest = [s for s in selected if s["id"] != pick["id"]]
    rest.sort(key=lambda s: s["date"])

    site = "https://www.josephpress.com/sino-signals/"
    L = []
    A = L.append

    A("# Sino-Signals Weekly | Week ending %s" % week_end.strftime("%A, %B %-d, %Y"))
    A("")
    A("*%s. Seven signals from China, and the one that should change a decision.*"
      % fmt_range(week_start, week_end))
    A("")
    A("## The pick of the week")
    A("")
    A("### %s" % pick["title_en"])
    A("")
    A("**%s %s | %s | Impact %d of 5**" % (
        pick.get("category_emoji", ""), pick["category"],
        STRENGTH_LABEL.get(pick.get("signal_strength"), ""), pick.get("impact_score", 0)))
    A("")
    b = pick["body"]
    A(b["signal"])
    A("")
    A("**Why it scales in China.** " + b["china_scale"])
    A("")
    A("**What it means outside China.** " + b["global_impact"])
    A("")
    A("**Monday morning.** " + b["monday_morning"])
    A("")
    A("Source: [%s](%s)" % (pick["source_name"], pick["source_url"]))
    A("")
    A("## The rest of the week")
    A("")
    for s in rest:
        d = datetime.date.fromisoformat(s["date"])
        A("**%s. %s**  " % (d.strftime("%a %-d %b"), s["title_en"]))
        A("%s %s | %s | Impact %d of 5 | %s  " % (
            s.get("category_emoji", ""), s["category"],
            STRENGTH_LABEL.get(s.get("signal_strength"), ""),
            s.get("impact_score", 0),
            LENS_LABEL.get(s.get("industry_lens"), s.get("industry_lens", ""))))
        A(s["body"]["signal"].split(". ")[0].rstrip(".") + ".")
        A("")
        A("Monday morning: " + s["body"]["monday_morning"].split(". ")[0].rstrip(".") + ".")
        A("")
        A("[Read the full signal](%s#%s) | [Source: %s](%s)" % (
            site, s["id"], s["source_name"], s["source_url"]))
        A("")

    A("---")
    A("")
    A("Every signal is verified against a primary source before it goes up. "
      "The full archive, searchable by category, industry, and impact, is at "
      "[josephpress.com/sino-signals](%s)." % site)

    text = "\n".join(L) + "\n"
    if "—" in text:
        raise SystemExit("Em-dash found in output. House style bans it. Fix the source signal.")
    return text, pick, selected, dropped


def main():
    args = [a for a in sys.argv[1:]]
    pick_id = None
    if "--pick" in args:
        i = args.index("--pick")
        pick_id = args[i + 1]
        del args[i:i + 2]
    week_end = datetime.date.fromisoformat(args[0]) if args else most_recent_sunday()
    if week_end.weekday() != 6:
        print("Note: %s is a %s, not a Sunday. Using it as the window end anyway."
              % (week_end, week_end.strftime("%A")))

    text, pick, selected, dropped = build(week_end, pick_id)
    out = os.path.join(HERE, "digest-%s.md" % week_end)
    with io.open(out, "w", encoding="utf-8") as f:
        f.write(text)

    print("Wrote %s" % os.path.basename(out))
    print("  words: %d" % len(text.split()))
    print("  pick:  %s (impact %d)" % (pick["title_en"], pick.get("impact_score", 0)))
    print("  included: %d signals" % len(selected))
    if dropped:
        print("  held back (%d, below the cap of %d):" % (len(dropped), SIGNAL_CAP))
        for s in dropped:
            print("    impact %d  %s" % (s.get("impact_score", 0), s["title_en"]))


if __name__ == "__main__":
    main()
