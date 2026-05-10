#!/bin/bash
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: bash rollback.sh v<number>"
  exit 1
fi

VERSION="$1"
VERSION_DIR="versions/$VERSION"

if [ ! -d "$VERSION_DIR" ]; then
  echo "Version snapshot not found: $VERSION_DIR"
  exit 1
fi

echo "Restoring files from $VERSION_DIR ..."
while IFS= read -r -d '' file; do
  rel="${file#${VERSION_DIR}/}"
  mkdir -p "$(dirname "$rel")"
  cp -f "$file" "$rel"
  echo "Restored: $rel"
done < <(find "$VERSION_DIR" -type f -print0)

echo "Rollback to $VERSION completed."
