#!/usr/bin/env python3
"""
Auto-track pending git changes before commit.

Designed for use from a git pre-commit hook.
"""

from __future__ import annotations

import argparse
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
TRACK_SCRIPT = ROOT / "tools" / "versioning" / "track_update.py"

EXCLUDE_FILES = {
    "updates.log",
    "current_version.txt",
    "changelog.md",
}


def _run_git(args: list[str]) -> str:
    out = subprocess.check_output(["git", *args], cwd=ROOT, text=True)
    return out.strip()


def _changed_files() -> list[str]:
    status = _run_git(["status", "--porcelain"])
    files: list[str] = []
    if not status:
        return files
    for line in status.splitlines():
        if len(line) < 4:
            continue
        raw = line[3:].strip()
        path = raw.split(" -> ")[-1]
        norm = path.replace("\\", "/")
        if norm in EXCLUDE_FILES:
            continue
        if norm.startswith("versions/"):
            continue
        files.append(norm)
    # stable unique order
    return sorted(set(files))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--prompt", default="Automatic pre-commit tracked update")
    args = parser.parse_args()

    changed = _changed_files()
    if not changed:
        print("No non-versioning changes detected; skipping auto-track.")
        return 0

    cmd = [
        "python",
        str(TRACK_SCRIPT),
        "--prompt",
        args.prompt,
        "--summary",
        "Automatic pre-commit tracking of changed files",
    ]
    for path in changed:
        cmd.extend(["--affected", path])

    subprocess.check_call(cmd, cwd=ROOT)
    print(f"Auto-tracked {len(changed)} file(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
