#!/usr/bin/env python3
"""
FruitVision DL — Model Weight Download Script
==============================================
Downloads trained model weights from a hosted URL.

Usage:
    python scripts/download_models.py

Environment variables (set in .env or shell):
    YOLO_MODEL_DOWNLOAD_URL        – Direct URL to your best.pt file
    EFFICIENTNET_MODEL_DOWNLOAD_URL – Direct URL to your efficientnet_v2.pth file

Supported URL formats:
    • Direct download URL (Google Drive export, Dropbox, S3, Cloudflare R2, etc.)
    • HuggingFace Hub URL:  hf://username/repo/model.pt
    • Local path (copy):    /absolute/path/to/model.pt

The script skips download if the target file already exists and is non-empty.

Hosting recommendations (for your trained weights):
    • HuggingFace Hub (free, git-lfs, versioned) — recommended
    • Cloudflare R2 (free egress)
    • AWS S3 / Google Cloud Storage
    • Direct GitHub Release asset (≤2GB per file)
"""

import os
import sys
import urllib.request
import shutil
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent.resolve()

TARGETS = {
    "yolo": {
        "dest": PROJECT_ROOT / "models" / "yolo" / "best.pt",
        "env_key": "YOLO_MODEL_DOWNLOAD_URL",
        "description": "YOLOv8 fruit detection weights",
    },
    "efficientnet": {
        "dest": PROJECT_ROOT / "models" / "efficientnet" / "efficientnet_v2.pth",
        "env_key": "EFFICIENTNET_MODEL_DOWNLOAD_URL",
        "description": "EfficientNetV2-S quality classification weights",
    },
}


def _progress_hook(block_num, block_size, total_size):
    if total_size > 0:
        pct = min(block_num * block_size / total_size * 100, 100)
        mb_done = block_num * block_size / (1024 * 1024)
        mb_total = total_size / (1024 * 1024)
        print(f"\r  {pct:5.1f}%  {mb_done:.1f} / {mb_total:.1f} MB", end="", flush=True)
    else:
        mb_done = block_num * block_size / (1024 * 1024)
        print(f"\r  {mb_done:.1f} MB downloaded...", end="", flush=True)


def download_from_url(url: str, dest: Path, description: str):
    print(f"\n[Download] {description}")
    print(f"  Source : {url}")
    print(f"  Target : {dest}")

    if dest.exists() and dest.stat().st_size > 0:
        print(f"  ✓ Already exists ({dest.stat().st_size / 1e6:.1f} MB) — skipping.")
        return True

    dest.parent.mkdir(parents=True, exist_ok=True)

    # HuggingFace Hub shorthand  hf://owner/repo/path
    if url.startswith("hf://"):
        return _download_from_hf(url, dest, description)

    # Local file copy
    if url.startswith("/") or url.startswith("C:\\") or url.startswith("file://"):
        src = Path(url.replace("file://", ""))
        if src.exists():
            shutil.copy2(src, dest)
            print(f"\n  ✓ Copied from {src}")
            return True
        else:
            print(f"\n  ✗ Local source not found: {src}")
            return False

    # Direct HTTP/HTTPS download
    try:
        urllib.request.urlretrieve(url, dest, reporthook=_progress_hook)
        print(f"\n  ✓ Downloaded ({dest.stat().st_size / 1e6:.1f} MB)")
        return True
    except Exception as e:
        print(f"\n  ✗ Download failed: {e}")
        if dest.exists():
            dest.unlink()
        return False


def _download_from_hf(hf_url: str, dest: Path, description: str):
    """Downloads a file from HuggingFace Hub using the huggingface_hub library."""
    # Parse  hf://owner/repo/path/to/file.pt
    parts = hf_url[5:].split("/", 2)
    if len(parts) < 3:
        print("  ✗ Invalid HuggingFace URL format. Use: hf://owner/repo/path/to/file.pt")
        return False

    repo_id = f"{parts[0]}/{parts[1]}"
    filename = parts[2]

    try:
        from huggingface_hub import hf_hub_download
    except ImportError:
        print("  Installing huggingface_hub...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "huggingface_hub", "-q"])
        from huggingface_hub import hf_hub_download

    try:
        cached = hf_hub_download(repo_id=repo_id, filename=filename)
        shutil.copy2(cached, dest)
        print(f"  ✓ Downloaded from HuggingFace Hub: {repo_id}/{filename}")
        return True
    except Exception as e:
        print(f"  ✗ HuggingFace download error: {e}")
        return False


def main():
    # Load .env if present
    env_path = PROJECT_ROOT / ".env"
    if env_path.exists():
        from pathlib import Path as _P
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip())

    print("=" * 60)
    print("FruitVision DL — Model Weight Downloader")
    print("=" * 60)

    any_downloaded = False
    any_failed = False

    for name, target in TARGETS.items():
        url = os.environ.get(target["env_key"], "").strip()
        if not url:
            if target["dest"].exists() and target["dest"].stat().st_size > 0:
                print(f"\n[{name}] ✓ Already present at {target['dest']}")
            else:
                print(f"\n[{name}] SKIPPED — {target['env_key']} not set.")
                print(f"  Set this env var to a download URL and re-run this script.")
            continue

        success = download_from_url(url, target["dest"], target["description"])
        if success:
            any_downloaded = True
        else:
            any_failed = True

    print("\n" + "=" * 60)
    if any_failed:
        print("Some downloads FAILED. Check URLs and try again.")
        sys.exit(1)
    elif any_downloaded:
        print("All downloads completed successfully.")
    else:
        print("Nothing to download. Set env vars to download model weights.")
        print("\nExample .env entries:")
        for name, t in TARGETS.items():
            print(f"  {t['env_key']}=https://your-host/path/to/model.pt")
    print("=" * 60)


if __name__ == "__main__":
    main()
