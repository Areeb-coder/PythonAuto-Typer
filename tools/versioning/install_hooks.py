#!/usr/bin/env python3
from __future__ import annotations

import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def main() -> int:
    hook_path = ROOT / ".githooks"
    subprocess.check_call(["git", "config", "core.hooksPath", str(hook_path)], cwd=ROOT)
    print(f"Configured git hooksPath: {hook_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
