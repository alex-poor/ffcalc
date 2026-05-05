#!/usr/bin/env bash
# build.sh — bundle ui/ into a fully self-contained offline ui/FFCalc.html
# Pre-compiles JSX with esbuild, inlines React UMD from node_modules.
# Result: single file, no network fetches at runtime, works via file:// AND Tauri.

set -euo pipefail
cd "$(dirname "$0")"

OUT=FFCalc.html
ESBUILD=../node_modules/.bin/esbuild
REACT_UMD=../node_modules/react/umd/react.production.min.js
REACT_DOM_UMD=../node_modules/react-dom/umd/react-dom.production.min.js
JSX_ORDER=(icons.jsx state.jsx shared.jsx register.jsx editor.jsx workbench.jsx compare.jsx network.jsx rates.jsx data.jsx app.jsx)

[[ -x "$ESBUILD" ]] || { echo "error: esbuild not found (run: npm install)"; exit 1; }
[[ -f "$REACT_UMD" ]] || { echo "error: React UMD not found (run: npm install)"; exit 1; }

COMPILED=$(mktemp --suffix=.js)
UPDATER=$(mktemp --suffix=.js)
PDF=$(mktemp --suffix=.js)
HELP=$(mktemp --suffix=.js)
trap 'rm -f "$COMPILED" "$UPDATER" "$PDF" "$HELP"' EXIT

for f in "${JSX_ORDER[@]}"; do
  # Each JSX file compiles to its own IIFE so top-level consts don't collide.
  echo "// --- $f ---"
  "$ESBUILD" "$f" --format=iife --jsx=transform --minify
  echo
done > "$COMPILED"

# Bundle the Tauri updater entry (pulls in plugin JS from node_modules).
"$ESBUILD" updater-entry.js --bundle --format=iife --minify --platform=browser > "$UPDATER"

# Bundle jsPDF + autotable, exposed as window.ffPDF.
"$ESBUILD" pdf-entry.js --bundle --format=iife --minify --platform=browser > "$PDF"

# Embed help markdown files as window.HELP = { route: "..." } using Node for safe JSON encoding.
node -e '
  const fs = require("fs"), path = require("path");
  const dir = "help";
  const out = {};
  for (const f of fs.readdirSync(dir).sort()) {
    if (!f.endsWith(".md")) continue;
    out[f.replace(/\.md$/, "")] = fs.readFileSync(path.join(dir, f), "utf8");
  }
  process.stdout.write("window.HELP = " + JSON.stringify(out) + ";");
' > "$HELP"

{
cat <<'HTML_HEAD'
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>FFCalc · thePHO Bulk Funding Calculator</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&display=swap"/>
  <style>
HTML_HEAD

cat styles.css

cat <<'HTML_MID'
  </style>
</head>
<body>
  <div id="root"></div>

  <script>
/* React UMD (production) */
HTML_MID

cat "$REACT_UMD"
echo
echo '/* ReactDOM UMD (production) */'
cat "$REACT_DOM_UMD"
echo
echo '/* FFCalc engine (ports /src/engine) */'
cat engine.js
echo
echo '/* thePHO logo assets */'
cat logo.js
echo
echo '/* Tauri updater glue (no-ops in a browser) */'
cat "$UPDATER"
echo
echo '/* PDF export (jsPDF + autotable, exposed as window.ffPDF) */'
cat "$PDF"
echo
echo '/* Help content (markdown per route, exposed as window.HELP) */'
cat "$HELP"
echo
echo '/* FFCalc UI — JSX pre-compiled with esbuild */'
cat "$COMPILED"

cat <<'HTML_FOOT'
  </script>
</body>
</html>
HTML_FOOT
} > "$OUT"

echo "Built $OUT ($(wc -c < "$OUT") bytes)"
