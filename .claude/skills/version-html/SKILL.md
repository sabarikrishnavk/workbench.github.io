---
name: version-html
description: Version the top-level HTML pages of this workbench. Always ask the user before creating a new version. When they agree, before the page is changed, snapshot the current page into versions/<page>.v<N>.html (N increments), freeze its local JS/CSS, record it in versions/manifest.js, and keep the in-page "Version" dropdown working so any version can be opened. Use when the user asks to create a new version of an HTML page, to version / snapshot / archive / back up a page before editing it, to list the versions of a page, to roll back or restore an earlier version, or to add the version dropdown to a page.
---

# Version the HTML pages

Every top-level page (`workbench.html`, `gql-migration.html`, `subgraph-codemigration.html`, `data-mapping.html`, `index.html`, `help.html`, `demo.html`) can keep numbered archived versions:

```
workbench.html                       ← the current version (vN, what users open)
versions/
  manifest.js                        ← window.HTML_VERSIONS = { "workbench.html": { current, versions[] } }
  workbench.v1.html                  ← archived v1 (frozen: never edit)
  workbench.v2.html
  assets/workbench.v1/…              ← v1's own copies of its local JS / CSS (common.js, styles.css, …)
versions.js                          ← the "Version" dropdown, included by every page
```

An archived page gets `<base href="../">`, so its links, `fetch()` calls and samples still resolve from the site root. Its `<script src>` and stylesheet links point at its frozen copies in `versions/assets/<page>.v<N>/`. Later edits to shared files (`common.js`, `onboarding.js`, …) therefore never break an old version. `versions.js` and `versions/manifest.js` stay shared, so every version's dropdown lists every other version.

The script lives at `.claude/skills/version-html/scripts/version_html.py`. Run it from the repo root with `python3`. It needs only the standard library.

## Creating a new version of a page (the main workflow)

0. **Ask before creating a new version.** Never snapshot on your own initiative. Before editing a page, ask the user (with AskUserQuestion when it is available) whether this change should become a new version, naming the page(s), the version the live page becomes (`v<N+1>`) and a proposed note, e.g. *"Create a new version of gql-migration.html? v2 is archived and the live page becomes v3 (note: before: NFR comparison)."* Offer **Create new version** / **Edit the current version in place**.
   - Run `list <page>` first so the numbers you quote are right.
   - Only snapshot after a yes. On a no, edit the live page without snapshotting and keep its version number.
   - One answer covers one change request. Ask again for the next request, unless the user said to version every change (or never to) in this conversation.
   - If the user's own request already says to create a new version (e.g. "make a v3 of workbench.html"), that is the yes: don't ask again.
1. **Snapshot first, before any edit:**
   ```bash
   python3 .claude/skills/version-html/scripts/version_html.py snapshot workbench.html --note "before: onboarding layout"
   ```
   This copies the page as it is now to `versions/workbench.v<N>.html`, where `N` is the page's current version. It freezes the page's local assets and adds the entry to `versions/manifest.js`. The live page becomes v`N+1`. The note should say what the archived version was, or what the new version changes.
   - Already edited the page without a snapshot? Archive the last committed version instead: add `--from-git HEAD` (or any commit / tag). The page and its assets are then read from git, not from disk.
   - Snapshot several pages in one go when a change spans them: `snapshot gql-migration.html subgraph-codemigration.html --note "…"`.
2. **Make the requested changes to the live page** (`workbench.html`), never to anything under `versions/`.
3. **Verify:**
   - The live page still loads.
   - The archived page opens (`versions/workbench.v<N>.html`).
   - The **Version** dropdown on both lists the new entry.

   Pages that `fetch()` samples need http, e.g. `python3 -m http.server`. Check the console for errors.
4. **Report** the version numbers ("workbench.html is now v3; v2 is archived at versions/workbench.v2.html"). Commit only if the user asks.

## Other commands

| Command | What it does |
|---|---|
| `list [page…]` | Each page's current version and its archived versions (date, commit, note). |
| `install [page…]` | Copies `versions.js` into the repo root, creates `versions/manifest.js`, and adds `<script src="versions.js" defer></script>` to the pages (default: every top-level `*.html`). It's safe to re-run and never changes version numbers. |
| `restore <page> <N> --note "…"` | Rolls the live page back to archived vN. It first snapshots the current live page, so nothing is lost. Then it copies vN's HTML back, removing `<base>` and pointing asset links at the live files again. The live page becomes a new version number. Add `--with-assets` to also copy vN's frozen JS / CSS over the live files, but only after confirming with the user, because those files are shared with the other pages. |

## Rules

- Version numbers only go up. Never renumber, overwrite or delete an archived version, and never edit files in `versions/` by hand. To change an old version, restore it, which creates a new version.
- Ask before every new version (step 0); a snapshot is never automatic.
- One snapshot per new version, taken before the edit. Don't snapshot again for follow-up tweaks within the same version unless the user asks for a new version.
- The dropdown sits next to the page's **▾ Toolbar** button when there is one (so it stays visible when the toolbar is collapsed), else at the end of the `<header>`. Otherwise it floats bottom-left. A page can choose the spot with an element marked `data-version-slot`.
- Archived versions share `localStorage` with the live page (same origin). If a new version changes the shape of what a page stores, mention that opening an old version may see newer data.
- External CDN scripts (SheetJS, Mermaid, js-yaml) aren't copied; archived versions load them from the CDN like the live page.
