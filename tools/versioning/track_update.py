#!/usr/bin/env python3
"""
Post-base update tracker.

Usage:
  python tools/versioning/track_update.py \
    --prompt "..." \
    --affected path/to/file1 --affected path/to/file2 \
    --summary "what changed" --summary "why"
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
import shutil
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
VERSIONS_DIR = ROOT / "versions"
CURRENT_VERSION_FILE = ROOT / "current_version.txt"
UPDATES_LOG_FILE = ROOT / "updates.log"
CHANGELOG_FILE = ROOT / "changelog.md"
BACKUPS_DIR = VERSIONS_DIR / "backups"


def _read_current_version() -> str:
    if not CURRENT_VERSION_FILE.exists():
        return "BASE"
    value = CURRENT_VERSION_FILE.read_text(encoding="utf-8").strip()
    return value or "BASE"


def _next_version_number(current: str) -> int:
    if current.upper() == "BASE":
        return 1
    if current.startswith("v") and current[1:].isdigit():
        return int(current[1:]) + 1
    raise ValueError(f"Invalid current version value: {current}")


def _relative(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def _safe_resolve(rel_path: str) -> Path:
    candidate = (ROOT / rel_path).resolve()
    root_resolved = ROOT.resolve()
    if not str(candidate).startswith(str(root_resolved)):
        raise ValueError(f"Path escapes project root: {rel_path}")
    return candidate


def _append_update_log(
    update_number: int, prompt: str, affected: list[str], summaries: list[str], timestamp: dt.datetime
) -> None:
    lines: list[str] = []
    lines.append("==================================================")
    lines.append(f"Update #{update_number}")
    lines.append(f"Version: v{update_number}")
    lines.append("")
    lines.append(f"Date: {timestamp.strftime('%Y-%m-%d')}")
    lines.append(f"Time: {timestamp.strftime('%H:%M:%S')}")
    lines.append("")
    lines.append("Prompt:")
    lines.append(f"\"{prompt}\"")
    lines.append("")
    lines.append("Affected Files:")
    lines.append("")
    if affected:
        for file_path in affected:
            lines.append(f"* {file_path}")
    else:
        lines.append("* (none specified)")
    lines.append("")
    lines.append("Changes Made:")
    lines.append("")
    if summaries:
        for summary in summaries:
            lines.append(f"* {summary}")
    else:
        lines.append("* change summary not provided")
    lines.append("")
    lines.append("Status:")
    lines.append("Logged Before Implementation")
    lines.append("============================")
    lines.append("")

    with UPDATES_LOG_FILE.open("a", encoding="utf-8", newline="\n") as handle:
        handle.write("\n".join(lines))


def _snapshot_files(version_number: int, affected: list[str]) -> Path:
    version_dir = VERSIONS_DIR / f"v{version_number}"
    version_dir.mkdir(parents=True, exist_ok=False)
    for rel_file in affected:
        source = _safe_resolve(rel_file)
        if not source.exists() or source.is_dir():
            continue
        destination = version_dir / rel_file
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
    return version_dir


def _write_current_version(version_number: int) -> None:
    CURRENT_VERSION_FILE.write_text(f"v{version_number}\n", encoding="utf-8")


def _append_changelog(version_number: int, prompt: str, summaries: list[str], timestamp: dt.datetime) -> None:
    if not CHANGELOG_FILE.exists():
        CHANGELOG_FILE.write_text("# Changelog\n\n", encoding="utf-8")
    with CHANGELOG_FILE.open("a", encoding="utf-8", newline="\n") as handle:
        handle.write(f"## v{version_number} - {timestamp.strftime('%Y-%m-%d %H:%M:%S')}\n")
        handle.write(f"- Prompt: {prompt}\n")
        if summaries:
            for summary in summaries:
                handle.write(f"- {summary}\n")
        handle.write("\n")


def _zip_snapshot(version_number: int, version_dir: Path) -> Path:
    BACKUPS_DIR.mkdir(parents=True, exist_ok=True)
    zip_path = BACKUPS_DIR / f"v{version_number}.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as archive:
        for file_path in version_dir.rglob("*"):
            if file_path.is_file():
                archive.write(file_path, arcname=str(file_path.relative_to(version_dir)))
    return zip_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Track a post-base update with immutable log + snapshot.")
    parser.add_argument("--prompt", required=True, help="Exact user modification request.")
    parser.add_argument("--affected", action="append", default=[], help="Affected file path relative to repo root.")
    parser.add_argument("--summary", action="append", default=[], help="Short change summary bullet.")
    args = parser.parse_args()

    now = dt.datetime.now()
    current = _read_current_version()
    next_number = _next_version_number(current)

    VERSIONS_DIR.mkdir(parents=True, exist_ok=True)
    _append_update_log(next_number, args.prompt, args.affected, args.summary, now)
    snapshot_dir = _snapshot_files(next_number, args.affected)
    _write_current_version(next_number)
    _append_changelog(next_number, args.prompt, args.summary, now)
    backup_file = _zip_snapshot(next_number, snapshot_dir)

    print(f"Tracked update v{next_number}")
    print(f"Snapshot: {_relative(snapshot_dir)}")
    print(f"Backup: {_relative(backup_file)}")


if __name__ == "__main__":
    main()
