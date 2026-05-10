#!/usr/bin/env python3
from __future__ import annotations

import datetime as dt
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CURRENT_VERSION_FILE = ROOT / "current_version.txt"


def _read_version() -> str:
    if not CURRENT_VERSION_FILE.exists():
        return "v0"
    value = CURRENT_VERSION_FILE.read_text(encoding="utf-8").strip()
    if not value:
        return "v0"
    if value.upper() == "BASE":
        return "v0"
    return value


def main() -> int:
    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    version = _read_version()
    print(f"[{now}] Update {version}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
