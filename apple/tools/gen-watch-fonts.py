#!/usr/bin/env python3
"""gen-watch-fonts.py — the repo's own web fonts, turned into something a Watch can render.

Run:  python3 apple/tools/gen-watch-fonts.py
Needs fontTools (with brotli, to read woff2):  pip3 install --user fonttools brotli
Writes: apple/TodaysFive/Fonts/*.ttf  and  test/fixtures/watch-fonts.json

THE ONE THING TO KNOW BEFORE READING ANY OF THIS
------------------------------------------------
**The font names in theme.js are a fiction that styles.css invents.** `PAIRS` names families like
"Outfit", "Manrope", "Nunito Sans", "Quicksand" — and those are the names of the `@font-face` rules
at the top of styles.css, not the names inside the binaries. The web never notices, because an
`@font-face` rule *renames* whatever file it points at. Apple platforms have no such thing: CoreText
asks the file what it is called, and the file says "Outfit Thin", "Manrope ExtraLight",
"DM Sans 9pt", "Nunito Sans 12pt ExtraLight 12pt".

Registering all 26 of the repo's faces and then asking `CTFontCreateWithName` for each of the 22
families `theme.js` names resolves **10 of 22 to Helvetica** — and a missing custom font on Apple
platforms renders the system face with no log and no error. That is why this script exists and why
it emits a map: the names go into `test/fixtures/watch-fonts.json` **read back out of the files it
just produced**, never guessed and never derived from theme.js.

WHAT IT PRODUCES, AND WHY THAT SET
----------------------------------
Static faces are converted 1:1 — `f.flavor = None; f.save(...)` is the whole of it; the glyphs are
the same latin subset the web serves.

Variable faces are **instanced to static weights**, because `Font.custom(...).weight(...)` is a
measured no-op on a variable file that carries no `fvar` named instances (Fraunces and Source Serif 4
both carry zero). Instancing removes the question entirely: one file, one weight, one PostScript
name, and nothing has to resolve at runtime.

The weights are the ones the app actually renders, which is narrower than the ones the web
*downloads*:

  * a **task** face is only ever drawn at `--task-w`, which is the pair's own `w` (styles.css uses
    `var(--task-w)` at every one of its seven `--font-task` call sites and nothing else), so a task
    face is instanced at exactly one weight;
  * a **ui** face is drawn at 400 and at 700, and the pair's axis string is what the web serves for
    both — `wght@400;600` means 700 renders as 600 — so a ui face gets the weights its axis string
    names.

That is 33 files. Lato 400 and 700 are deliberately **not** here: Lato is a task face in exactly one
pair and that pair draws it at 900, so the two lighter cuts would be bundle weight nothing renders.

`opsz`: Fraunces is the only file in the set that still carries an optical-size axis (Source Serif 4
and DM Sans and Nunito Sans had theirs baked in by Google's subsetter — which is where the "9pt" and
"12pt" in their family names come from). Its range is 9–144 and its **default is 9**, the cut the
family draws for small text. A watch is small text, so it is pinned at the default and the file's own
designer gets the last word rather than this script.

NAMING, AND THE LICENCE
-----------------------
Every face is OFL 1.1 (see apple/TodaysFive/Fonts/README.md, copied from fonts/README.md). **No family
is renamed to match the CSS name** — that would be inventing the same fiction one layer down, and the
whole point of the map is that the real names are surprising. Statics keep their names untouched.
An instance takes its source's name with the weight appended ("Outfit Thin" at 800 becomes family
"Outfit Thin 800", PostScript `Outfit-Thin-800`), because two instances of one variable file would
otherwise carry identical PostScript names and CoreText refuses a duplicate registration outright.
The weight suffix is the smallest change that makes them unique, and it keeps the surprise visible.

`updateFontNames=True` is NOT used: it raises `ValueError: Cannot find Axis Values` on a face whose
STAT table has no entry for the weight asked for (Fraunces at 500 is the one that bites), so the
naming is done here, by hand, for every face the same way.

**One licence question is left open on purpose, and recorded rather than decided.** OFL 1.1 calls a
format change a Modified Version, and §3 says a Modified Version may not carry the family's Reserved
Font Name. Five of the families here declare one — Josefin Sans, Lora, Playfair Display, Quicksand
and Source ('Source Serif 4') — plus Lato and 'Source' ('DM Serif Display') among the untouched
statics. The repo's web copies are in the same position and have been since v4, because Google's own
subsets are themselves modified versions distributed under those names. Every face records
`reservedFontName` in the fixture so the question is visible rather than folded away, and if the
answer ever comes back "no", the remedy is one line in `set_names` and a regenerated map — the map
is exactly what makes it one line.
"""

import json
import os
import re
import sys

try:
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont
except ImportError:                                              # pragma: no cover
    sys.exit("fontTools is missing: pip3 install --user fonttools brotli")

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(REPO, "fonts")
OUT = os.path.join(REPO, "apple", "TodaysFive", "Fonts")
FIXTURE = os.path.join(REPO, "test", "fixtures", "watch-fonts.json")

# ---------------------------------------------------------------- theme.js's PAIRS, read not copied

PAIR_RE = re.compile(
    r"(\w+):\s*\{\s*name:\s*\"([^\"]*)\",\s*"
    r"task:\s*\[\"([^\"]*)\",\s*\"([^\"]*)\",\s*`([^`]*)`\],\s*"
    r"ui:\s*\[\"([^\"]*)\",\s*\"([^\"]*)\",\s*`([^`]*)`\],\s*"
    r"w:\s*(\d+),\s*ls:\s*\"([^\"]*)\",\s*lh:\s*([\d.]+)\s*\}")


def read_pairs():
    """theme.js's PAIRS, as a list of dicts. A regex over the source rather than a copy of the
    table: this script must not be a second place where the pairs are written down."""
    source = open(os.path.join(REPO, "theme.js"), encoding="utf-8").read()
    block = source[source.index("export const PAIRS"):source.index("export const CUSTOM_PAIRS")]
    pairs = []
    for m in PAIR_RE.finditer(block):
        pairs.append({
            "id": m.group(1), "name": m.group(2),
            "task": {"css": m.group(3), "axes": m.group(4), "stack": m.group(5)},
            "ui": {"css": m.group(6), "axes": m.group(7), "stack": m.group(8)},
            "w": int(m.group(9)), "ls": m.group(10), "lh": float(m.group(11))
        })
    if len(pairs) != 13:
        sys.exit("expected 13 pairs in theme.js, parsed %d — the regex and the source have parted company" % len(pairs))
    return pairs


def axis_weights(axes):
    """The weights a Google Fonts axis string names. "wght@500;800" -> [500, 800];
    "wght@500..700" -> [500, 700]; "opsz,wght@9..144,500..700" -> [500, 700]; "" -> [400]."""
    if not axes:
        return [400]
    tags, _, values = axes.partition("@")
    tag_list = tags.split(",")
    value_list = values.split(",")
    if "wght" not in tag_list:
        return [400]
    spec = value_list[tag_list.index("wght")]
    return sorted({int(float(v)) for v in spec.replace("..", ";").split(";")})


# ---------------------------------------------------------------- which file carries which family

def index_sources():
    """Every woff2 in fonts/, keyed by the family name **inside the file**, plus the CSS name that
    styles.css renames it to. The CSS name is what maps a pair to a file; the inner name is what
    CoreText will answer with."""
    css = open(os.path.join(REPO, "styles.css"), encoding="utf-8").read()
    rules = re.findall(r'@font-face\{font-family:"([^"]+)";[^}]*?src:url\(fonts/([^)]+)\)', css)
    by_css = {}
    for css_name, filename in rules:
        by_css.setdefault(css_name, []).append(filename)
    if len(rules) != 26:
        sys.exit("expected 26 @font-face rules in styles.css, found %d" % len(rules))
    return by_css


def pick_source(files, weight):
    """Which of a CSS family's files serves this weight. A family with one file is that file
    (variable, or the only static there is); a family with several statics is the one whose name
    carries the weight, which is how styles.css splits Lato, PT Sans and IBM Plex Mono."""
    if len(files) == 1:
        return files[0]
    exact = [f for f in files if re.search(r"-%d\.woff2$" % weight, f)]
    if len(exact) == 1:
        return exact[0]
    sys.exit("cannot tell which of %s carries weight %d" % (files, weight))


# ---------------------------------------------------------------- the conversion

def slug(filename):
    return re.sub(r"-\d+(-\d+)?\.woff2$", "", filename)


def set_names(font, family, sub, full, ps):
    """Write the four names CoreText reads, on every platform record the file already has, and drop
    the typographic pair (16/17) — a face with one weight has no typographic family to belong to,
    and leaving a stale 16 behind is how "Nunito Sans 12pt ExtraLight 12pt" ends up as two different
    answers to the same question."""
    name = font["name"]
    for nid, value in ((1, family), (2, sub), (4, full), (6, ps)):
        name.setName(value, nid, 3, 1, 0x409)                    # Windows / Unicode BMP / en-US
        name.setName(value, nid, 1, 0, 0)                        # Macintosh / Roman / English
    for nid in (16, 17):
        name.removeNames(nid)


def convert(filename, weight, is_variable):
    """One source file at one weight, written into apple/TodaysFive/Fonts/. Returns what the
    produced file says about itself, read back out of the produced file."""
    src = os.path.join(SRC, filename)
    font = TTFont(src)
    axes = {a.axisTag: a for a in font["fvar"].axes} if "fvar" in font else {}

    if is_variable:
        pins = {}
        for tag, axis in axes.items():
            if tag == "wght":
                pins[tag] = float(min(max(weight, axis.minValue), axis.maxValue))
            else:
                # opsz and anything else: the file's own default. Fraunces defaults to 9, the cut it
                # draws for small text, and a watch is small text.
                pins[tag] = float(axis.defaultValue)
        # updateFontNames=False: with it True this raises "Cannot find Axis Values" on any face whose
        # STAT table has no entry for the weight (Fraunces at 500). The naming is done below instead.
        font = instantiateVariableFont(font, pins, updateFontNames=False, inplace=True)
        old_family = font["name"].getDebugName(1)
        old_ps = font["name"].getDebugName(6)
        family = "%s %d" % (old_family, weight)
        ps = re.sub(r"[^A-Za-z0-9-]", "", "%s-%d" % (old_ps, weight))
        set_names(font, family, "Regular", family, ps)
        font["OS/2"].usWeightClass = weight

    font.flavor = None                                           # woff2 in, plain TTF out
    out_name = "%s-%d.ttf" % (slug(filename), weight)
    out_path = os.path.join(OUT, out_name)
    font.save(out_path)
    font.close()

    # Read the answers back out of the file that was written, which is the whole discipline here.
    produced = TTFont(out_path)
    notice = produced["name"].getDebugName(0) or ""
    record = {
        "file": out_name,
        "source": "fonts/" + filename,
        "family": produced["name"].getDebugName(1),
        "postScriptName": produced["name"].getDebugName(6),
        "weight": weight,
        "variable": is_variable,
        # OFL 1.1 §3: a Modified Version may not carry the family's Reserved Font Name. Recorded per
        # face rather than argued about here — see the licence note in the header and in the README.
        "reservedFontName": "Reserved Font Name" in notice,
        "bytes": os.path.getsize(out_path)
    }
    produced.close()
    return record


# ---------------------------------------------------------------- go

def main():
    pairs = read_pairs()
    by_css = index_sources()
    os.makedirs(OUT, exist_ok=True)

    faces = {}                                                   # (filename, weight) -> record
    wanted = {}                                                  # css family -> set of weights

    for p in pairs:
        # A task face is drawn at the pair's own `w` and nowhere else; a ui face at the weights its
        # axis string names. See the header for where that comes from.
        wanted.setdefault(p["task"]["css"], set()).add(p["w"])
        wanted.setdefault(p["ui"]["css"], set()).update(axis_weights(p["ui"]["axes"]))

    for css_name in sorted(wanted):
        files = by_css[css_name]
        for weight in sorted(wanted[css_name]):
            filename = pick_source(files, weight)
            key = (filename, weight)
            if key in faces:
                continue
            variable = "fvar" in TTFont(os.path.join(SRC, filename))
            faces[key] = convert(filename, weight, variable)

    def face_for(css_name, weight):
        filename = pick_source(by_css[css_name], weight)
        return faces[(filename, weight)]

    out_pairs = {}
    for p in pairs:
        task_weights = [p["w"]]
        ui_weights = axis_weights(p["ui"]["axes"])
        out_pairs[p["id"]] = {
            "name": p["name"],
            # `w` is the weight the task line is drawn at, `ls` its tracking in em and `lh` its line
            # height — the three numbers a renderer needs that are not in any font file.
            "w": p["w"], "ls": p["ls"], "lh": p["lh"],
            "task": role_block(p["task"]["css"], task_weights, face_for),
            "ui": role_block(p["ui"]["css"], ui_weights, face_for)
        }

    total = sum(f["bytes"] for f in faces.values())
    source_total = sum(os.path.getsize(os.path.join(SRC, f)) for f in sorted({k[0] for k in faces}))

    out = {
        "note": "Generated by apple/tools/gen-watch-fonts.py from the repo's own fonts/*.woff2. "
                "Every family and PostScript name here was read back out of the .ttf the script "
                "produced — never from theme.js, whose family names are the fiction styles.css's "
                "@font-face rules invent and resolve to Helvetica on Apple platforms. Read by "
                "apple/TodaysFiveCore's KitsGen plugin and its tests. The files live in "
                "apple/TodaysFive/Fonts/ and are listed in the Watch app's UIAppFonts.",
        "faces": [faces[k] for k in sorted(faces)],
        "pairs": out_pairs,
        "totals": {
            "faces": len(faces),
            "bytes": total,
            "sourceFiles": len({k[0] for k in faces}),
            "sourceBytes": source_total
        }
    }
    with open(FIXTURE, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2, ensure_ascii=False)
        fh.write("\n")

    print("wrote %d .ttf into apple/TodaysFive/Fonts/ (%.2f MB from %.0f KB of woff2)"
          % (len(faces), total / 1048576.0, source_total / 1024.0))
    print("wrote test/fixtures/watch-fonts.json — %d pairs, %d faces" % (len(out_pairs), len(faces)))
    renamed = [f for f in faces.values() if f["variable"]]
    print("  %d instanced from variable files (renamed with their weight, or their PostScript names collide)"
          % len(renamed))
    print("  %d statics copied with their names untouched" % (len(faces) - len(renamed)))
    # The point of the map, printed: every family whose real name is not the one theme.js uses. An
    # instance carries its weight as a suffix, so that much is expected and is stripped before the
    # comparison; anything left over is the fiction styles.css was hiding.
    surprises = set()
    for p in out_pairs.values():
        for role in ("task", "ui"):
            for f in p[role]["faces"]:
                bare = re.sub(r" %d$" % f["weight"], "", f["family"])
                if bare != p[role]["cssFamily"]:
                    surprises.add((p[role]["cssFamily"], bare))
    print("  %d of the %d families are not called what theme.js calls them:"
          % (len(surprises), len({p[r]["cssFamily"] for p in out_pairs.values() for r in ("task", "ui")})))
    for css_name, real in sorted(surprises):
        print("    styles.css says %-22s the file says %s" % ('"%s"' % css_name, real))

    rfn = sorted({f["family"] for f in faces.values() if f["reservedFontName"]})
    print("  %d of %d faces carry a Reserved Font Name (OFL 1.1 §3, see the header): %s"
          % (sum(1 for f in faces.values() if f["reservedFontName"]), len(faces), ", ".join(rfn)))


def role_block(css_name, weights, face_for):
    """One side of a pair: the CSS name theme.js uses, the real names of the primary face, and every
    face this role can draw with. The primary is the lightest weight, which is the one a ui face
    renders body text at and the only one a task face has."""
    picked = [face_for(css_name, w) for w in weights]
    return {
        "cssFamily": css_name,
        "family": picked[0]["family"],
        "postScriptName": picked[0]["postScriptName"],
        "weights": weights,
        "faces": [{"weight": f["weight"], "family": f["family"],
                   "postScriptName": f["postScriptName"], "file": f["file"]} for f in picked]
    }


if __name__ == "__main__":
    main()
