#!/bin/bash
# ═══════════════════════════════════════════════════════════
# check-polish.sh — verify no \uXXXX escapes in UI files
# Run after every file creation before packaging
# Exit code 0 = clean, 1 = found issues
# ═══════════════════════════════════════════════════════════

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

FOUND=0

# Check all TSX and TS files (excluding node_modules, .next)
while IFS= read -r file; do
  # Look for \u0 sequences that are Polish chars
  if grep -qP '\\\\u0[01][0-9a-f]{2}' "$file" 2>/dev/null; then
    echo -e "${RED}FAIL${NC} $file"
    grep -nP '\\\\u0[01][0-9a-f]{2}' "$file" | head -5
    FOUND=1
  fi
done < <(find src/ -name '*.tsx' -o -name '*.ts' | grep -v node_modules | grep -v .next)

if [ $FOUND -eq 0 ]; then
  echo -e "${GREEN}OK${NC} — no unicode escapes found in source files"
  exit 0
else
  echo ""
  echo -e "${RED}Found unicode escapes that should be normal Polish characters.${NC}"
  echo "Fix: rewrite file with normal ł, ą, ę, ś, ć, ź, ż, ó, ń characters."
  exit 1
fi
