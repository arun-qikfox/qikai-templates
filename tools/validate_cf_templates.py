#!/usr/bin/env python3
"""Validate Cloudflare template runtime files do not drift into GCP/Firestore ecosystem."""
from __future__ import annotations

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
DEFINITIONS = ROOT / "definitions"
CF_TEMPLATES = [
    "vite-cf-DO-runner",
    "vite-cf-DO-KV-runner",
    "vite-cf-DO-v2-runner",
    "vite-cfagents-runner",
]

# Runtime-focused checks only (not prompts/docs) to avoid blocking prompt wording iteration.
RUNTIME_GLOBS = [
    "worker/**/*.ts",
    "worker/**/*.js",
    "wrangler.jsonc",
]

FORBIDDEN_PATTERNS = [
    re.compile(r"\\bFIRESTORE_", re.IGNORECASE),
    re.compile(r"\\bDATA_PROVIDER\\s*[:=]\\s*['\"]?firestore", re.IGNORECASE),
    re.compile(r"google\\s+cloud", re.IGNORECASE),
    re.compile(r"app\\s+engine", re.IGNORECASE),
    re.compile(r"@google-cloud", re.IGNORECASE),
]


def iter_runtime_files(template_dir: Path):
    for pattern in RUNTIME_GLOBS:
        for path in template_dir.glob(pattern):
            if path.is_file():
                yield path


def main() -> int:
    violations: list[str] = []

    for template in CF_TEMPLATES:
        tdir = DEFINITIONS / template
        if not tdir.exists():
            violations.append(f"missing template directory: {tdir}")
            continue

        for file in iter_runtime_files(tdir):
            text = file.read_text(encoding="utf-8", errors="ignore")
            for pattern in FORBIDDEN_PATTERNS:
                if pattern.search(text):
                    rel = file.relative_to(ROOT)
                    violations.append(f"{rel}: matches forbidden pattern `{pattern.pattern}`")

    if violations:
        print("Cloudflare template runtime validation failed:")
        for item in violations:
            print(f"- {item}")
        return 1

    print("Cloudflare template runtime validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
