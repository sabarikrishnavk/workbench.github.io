#!/usr/bin/env python3
"""version_html.py — numbered versions of the top-level HTML pages (Claude skill: version-html).

  snapshot <page.html>… [--note TEXT] [--from-git REV]   archive the page as versions/<stem>.v<N>.html
  list [page.html…]                                       show current + archived versions
  install [page.html…]                                    add versions.js + the dropdown include
  restore <page.html> <N> [--note TEXT] [--with-assets]   roll the live page back to archived vN

Archived pages get <base href="../"> so relative links resolve from the site root, and their local
<script src> / stylesheet <link href> are frozen under versions/assets/<stem>.v<N>/. The manifest is
versions/manifest.js (window.HTML_VERSIONS = {...}) so it also loads from file://.
"""
import argparse, datetime, json, re, shutil, subprocess, sys
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
SHARED = {"versions.js"}                      # never frozen: every version uses the live picker
MANIFEST_HEAD = ("/* versions/manifest.js — written by .claude/skills/version-html/scripts/version_html.py.\n"
                 "   Archived versions of each top-level page; read by versions.js (the Version dropdown). Don't edit by hand. */\n")
INCLUDE = '<script src="versions.js" defer></script>'


def repo_root():
    try:
        out = subprocess.run(["git", "rev-parse", "--show-toplevel"], capture_output=True, text=True, check=True).stdout.strip()
        return Path(out)
    except Exception:
        return Path.cwd()

ROOT = repo_root()
VERSIONS = ROOT / "versions"
MANIFEST = VERSIONS / "manifest.js"
ASSETS = VERSIONS / "assets"


def git(*args):
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True)

def short_commit(rev="HEAD"):
    r = git("rev-parse", "--short", rev)
    return r.stdout.strip() if r.returncode == 0 else ""

def read_file(rel, rev=None, binary=False):
    """File content from disk, or from git at `rev`. None when it doesn't exist there."""
    if rev:
        r = subprocess.run(["git", "show", f"{rev}:{rel}"], cwd=ROOT, capture_output=True)
        if r.returncode != 0:
            return None
        return r.stdout if binary else r.stdout.decode("utf-8")
    p = ROOT / rel
    if not p.exists():
        return None
    return p.read_bytes() if binary else p.read_text(encoding="utf-8")


def load_manifest():
    if not MANIFEST.exists():
        return {}
    txt = MANIFEST.read_text(encoding="utf-8")
    m = re.search(r"window\.HTML_VERSIONS\s*=\s*(\{.*\})\s*;?\s*$", txt, re.S)
    return json.loads(m.group(1)) if m else {}

def save_manifest(data):
    VERSIONS.mkdir(exist_ok=True)
    MANIFEST.write_text(MANIFEST_HEAD + "window.HTML_VERSIONS = " + json.dumps(data, indent=2, sort_keys=True) + ";\n", encoding="utf-8")

def entry_for(data, page):
    e = data.setdefault(page, {"current": 1, "versions": []})
    e.setdefault("versions", []); e.setdefault("current", 1)
    return e


def norm_page(arg):
    p = Path(arg)
    rel = (p.resolve().relative_to(ROOT) if p.is_absolute() or (ROOT / p).exists() else p).as_posix()
    if "/" in rel or not rel.endswith(".html"):
        sys.exit(f"✗ {arg}: only top-level *.html pages are versioned")
    return rel

def is_local(url):
    return bool(url) and not re.match(r"^([a-z][a-z0-9+.-]*:|//|#)", url, re.I)

def ensure_include(path):
    """Add the versions.js include before </body> (once)."""
    txt = path.read_text(encoding="utf-8")
    if re.search(r'src=["\']versions\.js["\']', txt):
        return False
    new, n = re.subn(r"</body>", INCLUDE + "\n</body>", txt, count=1, flags=re.I)
    if not n:
        new = txt.rstrip() + "\n" + INCLUDE + "\n"
    path.write_text(new, encoding="utf-8")
    return True

def ensure_picker():
    src = SKILL_DIR / "assets" / "versions.js"
    dst = ROOT / "versions.js"
    if not dst.exists() or dst.read_bytes() != src.read_bytes():
        shutil.copyfile(src, dst)
        return True
    return False


# Local <script src> and stylesheet / script <link href> in a page.
ASSET_RE = re.compile(r'(<(?:script|link)\b[^>]*?\b(?:src|href)\s*=\s*)(["\'])([^"\']+)\2', re.I)

def freeze_assets(html, stem, n, rev):
    """Copy the page's local JS / CSS into versions/assets/<stem>.v<n>/ and point the archived page at them."""
    target = ASSETS / f"{stem}.v{n}"
    copied, missing = [], []

    def repl(m):
        tag_start, q, url = m.group(1), m.group(2), m.group(3)
        tag = m.group(0).lower()
        if not is_local(url) or url in SHARED:
            return m.group(0)
        if tag.startswith("<link") and not re.search(r"\.(css|js)(\?|$)", url, re.I):
            return m.group(0)                               # icons, preloads of other things: leave to <base>
        clean = url.split("?")[0].split("#")[0]
        data = read_file(clean, rev, binary=True)
        if data is None:
            missing.append(clean)
            return m.group(0)
        out = target / clean
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(data)
        copied.append(clean)
        return f'{tag_start}{q}versions/assets/{stem}.v{n}/{url}{q}'

    return ASSET_RE.sub(repl, html), copied, missing


def snapshot(pages, note, rev):
    data = load_manifest()
    ensure_picker()
    today = datetime.date.today().isoformat()
    commit = short_commit(rev or "HEAD")
    for arg in pages:
        page = norm_page(arg)
        html = read_file(page, rev)
        if html is None:
            sys.exit(f"✗ {page} not found{' at ' + rev if rev else ''}")
        e = entry_for(data, page)
        stem = page[:-5]
        n = max([e["current"]] + [v["v"] + 1 for v in e["versions"]])   # archive number: never reuse one
        dest = VERSIONS / f"{stem}.v{n}.html"
        if dest.exists():
            sys.exit(f"✗ {dest.relative_to(ROOT)} already exists — versions are never overwritten")
        html, copied, missing = freeze_assets(html, stem, n, rev)
        stamp = f"<!-- Archived v{n} of {page} · {today}{' · ' + commit if commit else ''}{' · from git ' + rev if rev else ''}. Frozen: don't edit. -->"
        html, k = re.subn(r"(<head\b[^>]*>)", r'\1\n' + stamp + '\n<base href="../">', html, count=1, flags=re.I)
        if not k:
            html = stamp + '\n<base href="../">\n' + html
        if not re.search(r'src=["\']versions\.js["\']', html):
            html = re.sub(r"</body>", INCLUDE + "\n</body>", html, count=1, flags=re.I)
        VERSIONS.mkdir(exist_ok=True)
        dest.write_text(html, encoding="utf-8")
        e["versions"].append({"v": n, "file": f"versions/{dest.name}", "date": today, "commit": commit,
                              "note": note or "", **({"fromGit": rev} if rev else {})})
        e["versions"].sort(key=lambda v: v["v"])
        e["current"] = n + 1
        added = ensure_include(ROOT / page)
        print(f"✓ {page}: archived v{n} → {dest.relative_to(ROOT)}  ·  live page is now v{n + 1}")
        print(f"  frozen assets: {', '.join(copied) if copied else 'none'}" + (f"  ·  not found (left live): {', '.join(missing)}" if missing else ""))
        if added:
            print(f"  added the Version dropdown include to {page}")
    save_manifest(data)


def list_versions(pages):
    data = load_manifest()
    keys = [norm_page(p) for p in pages] if pages else sorted(data)
    if not keys:
        print("No versions yet. Run: snapshot <page.html> --note '…'")
    for page in keys:
        e = data.get(page)
        if not e:
            print(f"{page}: not versioned yet (v1)"); continue
        print(f"{page}: current v{e['current']}")
        for v in sorted(e["versions"], key=lambda v: -v["v"]):
            print(f"  v{v['v']:<3} {v['date']}  {v.get('commit', ''):<8} {v['file']}  {v.get('note', '')}")


def install(pages):
    data = load_manifest()
    targets = [norm_page(p) for p in pages] if pages else sorted(p.name for p in ROOT.glob("*.html"))
    changed = ensure_picker()
    print(("✓ versions.js installed" if changed else "· versions.js up to date"))
    for page in targets:
        entry_for(data, page)
        print(f"{'✓ added include to' if ensure_include(ROOT / page) else '· already included in'} {page}  (v{data[page]['current']})")
    save_manifest(data)


def restore(page, n, note, with_assets):
    page = norm_page(page)
    data = load_manifest()
    e = data.get(page)
    ver = next((v for v in (e or {}).get("versions", []) if v["v"] == n), None)
    if not ver:
        sys.exit(f"✗ {page} has no archived v{n} (see: list {page})")
    snapshot([page], note or f"before restoring v{n}", None)          # keep the current live page
    stem = page[:-5]
    html = (ROOT / ver["file"]).read_text(encoding="utf-8")
    html = re.sub(r"\n?<!-- Archived v\d+ of [^>]*-->\n?", "\n", html, count=1)
    html = re.sub(r'\n?<base href="\.\./">', "", html, count=1)
    prefix = f"versions/assets/{stem}.v{n}/"
    if with_assets:
        src_dir = ASSETS / f"{stem}.v{n}"
        for f in src_dir.rglob("*"):
            if f.is_file():
                rel = f.relative_to(src_dir)
                (ROOT / rel).parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(f, ROOT / rel)
                print(f"  restored asset {rel.as_posix()} (shared with other pages)")
    html = html.replace(prefix, "")
    (ROOT / page).write_text(html, encoding="utf-8")
    data = load_manifest()
    print(f"✓ {page} restored from v{n}; it is now v{data[page]['current']}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("snapshot"); s.add_argument("pages", nargs="+"); s.add_argument("--note", default=""); s.add_argument("--from-git", dest="rev")
    l = sub.add_parser("list"); l.add_argument("pages", nargs="*")
    i = sub.add_parser("install"); i.add_argument("pages", nargs="*")
    r = sub.add_parser("restore"); r.add_argument("page"); r.add_argument("version", type=int); r.add_argument("--note", default=""); r.add_argument("--with-assets", action="store_true")
    a = ap.parse_args()
    if a.cmd == "snapshot": snapshot(a.pages, a.note, a.rev)
    elif a.cmd == "list": list_versions(a.pages)
    elif a.cmd == "install": install(a.pages)
    elif a.cmd == "restore": restore(a.page, a.version, a.note, a.with_assets)

if __name__ == "__main__":
    main()
