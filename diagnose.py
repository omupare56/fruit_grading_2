"""
Full diagnostic for fruit_classifier multi-prototype.
Tests A-H as requested.
"""
import os
import sys
import io

# Force UTF-8 output on Windows to allow unicode characters
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from PIL import Image
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from backend.services.fruit_classifier import (
    _ensure_proto_map, _extract_features, _feature_dist, classify_fruit, _LOW_CONF_MARGIN
)

DATASET = os.environ.get("FRUITNET_DATASET_PATH",
                          r"C:\FruitVision\dataset\FruitNetDataset")

def collect(label_dir_pairs, n=5):
    """Collect up to n images from each (label, dir_path) pair."""
    results = []
    for label, dpath in label_dir_pairs:
        if not os.path.isdir(dpath):
            print(f"  [SKIP] not found: {dpath}")
            continue
        files = sorted([f for f in os.listdir(dpath)
                        if f.lower().endswith((".jpg", ".jpeg", ".png"))])[:n]
        for f in files:
            results.append((os.path.join(dpath, f), label))
    return results

def run_tests(paths, tag):
    print(f"\n{'='*70}")
    print(f"  {tag}")
    print(f"{'='*70}")
    print(f"{'Image':<28} | {'Actual':<14} | {'Predicted':<22} | {'Conf':>6}")
    print("-" * 78)
    correct = 0
    total   = 0
    for path, actual in paths:
        if not os.path.exists(path):
            print(f"  [MISSING] {path}")
            continue
        try:
            pil = Image.open(path).convert("RGB")
            pred, conf = classify_fruit(pil)
            mark = "✓" if pred == actual else "✗"
            print(f"{os.path.basename(path):<28} | {actual:<14} | {pred:<22} | {conf:>5.3f}  {mark}")
            if pred == actual:
                correct += 1
            total += 1
        except Exception as e:
            print(f"  [ERROR] {path}: {e}")
    if total:
        print(f"\n  Accuracy: {correct}/{total} = {100*correct/total:.0f}%")
    return correct, total

def dump_distances(img_path, label):
    print(f"\n--- Detailed distance dump: {os.path.basename(img_path)} (actual={label}) ---")
    pm, err = _ensure_proto_map()
    if pm is None:
        print(f"  Proto map unavailable: {err}")
        return
    import cv2
    pil = Image.open(img_path).convert("RGB")
    img_rgb = np.array(pil)
    img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
    feat = _extract_features(img_bgr)
    if feat is None:
        print("  Feature extraction failed.")
        return
    scalars = feat[52:60]
    shape   = feat[60:]
    print(f"  Scalars [red_r oran_r yel_r grn_r v_mean s_mean tex_norm fg_r]:")
    print(f"    {scalars.round(4)}")
    print(f"  Shape   [aspect_ratio elongation compactness]:")
    print(f"    {shape.round(4)}")
    print(f"\n  Class distances (best proto per class):")
    class_dists = {}
    for lbl, protos in pm.items():
        dists_per_proto = [_feature_dist(feat, p) for p in protos]
        class_dists[lbl] = (min(dists_per_proto), dists_per_proto)
    for lbl, (best_d, all_d) in sorted(class_dists.items(), key=lambda x: x[1][0]):
        all_d_str = ", ".join(f"{d:.3f}" for d in all_d)
        print(f"    {lbl:<14}: best={best_d:.4f}  [per-proto: {all_d_str}]")

if __name__ == "__main__":
    # Build map first
    pm, err = _ensure_proto_map()
    if pm is None:
        print(f"[FATAL] Could not build proto map: {err}")
        sys.exit(1)
    print(f"\n[Proto map] Classes: {sorted(pm.keys())}")
    for lbl, protos in pm.items():
        print(f"  {lbl}: {len(protos)} prototypes")

    G  = os.path.join(DATASET, "Good Quality_Fruits")
    B  = os.path.join(DATASET, "Bad Quality_Fruits")
    MX = os.path.join(DATASET, "Mixed Qualit_Fruits")

    # -----------------------------------------------------------------------
    # A. Banana
    # -----------------------------------------------------------------------
    banana_paths = collect([
        ("Banana", os.path.join(G,  "Banana_Good")),
        ("Banana", os.path.join(B,  "Banana_Bad")),
        ("Banana", os.path.join(MX, "Banana")),
    ], n=5)
    ca, ta = run_tests(banana_paths, "A. FruitNet Banana (5+)")

    # -----------------------------------------------------------------------
    # B. Orange
    # -----------------------------------------------------------------------
    orange_paths = collect([
        ("Orange", os.path.join(G,  "Orange_Good")),
        ("Orange", os.path.join(B,  "Orange_Bad")),
        ("Orange", os.path.join(MX, "Orange")),
    ], n=5)
    cb, tb = run_tests(orange_paths, "B. FruitNet Orange (5+)")

    # -----------------------------------------------------------------------
    # C. Apple
    # -----------------------------------------------------------------------
    apple_paths = collect([
        ("Apple", os.path.join(G,  "Apple_Good")),
        ("Apple", os.path.join(B,  "Apple_Bad")),
        ("Apple", os.path.join(MX, "Apple")),
    ], n=5)
    cc, tc = run_tests(apple_paths, "C. FruitNet Apple (5+)")

    # -----------------------------------------------------------------------
    # D. Guava
    # -----------------------------------------------------------------------
    guava_paths = collect([
        ("Guava", os.path.join(G,  "Guava_Good")),
        ("Guava", os.path.join(B,  "Guava_Bad")),
        ("Guava", os.path.join(MX, "Guava")),
    ], n=5)
    cd, td = run_tests(guava_paths, "D. FruitNet Guava (5+)")

    # -----------------------------------------------------------------------
    # E. Lemon
    # -----------------------------------------------------------------------
    lemon_paths = collect([
        ("Lemon", os.path.join(G,  "Lime_Good")),
        ("Lemon", os.path.join(B,  "Lime_Bad")),
        ("Lemon", os.path.join(MX, "Lemon")),
    ], n=5)
    ce, te = run_tests(lemon_paths, "E. FruitNet Lemon (5+)")

    # -----------------------------------------------------------------------
    # F. Pomegranate
    # -----------------------------------------------------------------------
    pom_paths = collect([
        ("Pomegranate", os.path.join(G,  "Pomegranate_Good")),
        ("Pomegranate", os.path.join(B,  "Pomegranate_Bad")),
        ("Pomegranate", os.path.join(MX, "Pomegranate")),
    ], n=5)
    cf, tf = run_tests(pom_paths, "F. FruitNet Pomegranate (5+)")

    # -----------------------------------------------------------------------
    # G. External Banana (the one that previously failed)
    # -----------------------------------------------------------------------
    EXT_BANANA = None
    # Look for any real-world banana image uploaded by user
    for candidate in ["test_banana.jpg", "banana.jpg", "banana_test.jpg",
                       "banana.png", "test_banana.png"]:
        cpath = os.path.join(os.path.dirname(os.path.abspath(__file__)), candidate)
        if os.path.exists(cpath):
            EXT_BANANA = cpath
            break

    print(f"\n{'='*70}")
    print(f"  G. External Banana (real-world upload test)")
    print(f"{'='*70}")
    if EXT_BANANA:
        pil = Image.open(EXT_BANANA).convert("RGB")
        pred, conf = classify_fruit(pil)
        print(f"  File: {os.path.basename(EXT_BANANA)}")
        print(f"  Predicted: {pred}  Conf: {conf:.3f}")
        dump_distances(EXT_BANANA, "Banana")
    else:
        print("  [SKIP] No external banana image found in project root.")
        print("         Upload a banana image as 'test_banana.jpg' to test.")

    # -----------------------------------------------------------------------
    # H. test_apple.jpg
    # -----------------------------------------------------------------------
    print(f"\n{'='*70}")
    print(f"  H. test_apple.jpg")
    print(f"{'='*70}")
    APPLE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_apple.jpg")
    if os.path.exists(APPLE_PATH):
        pil = Image.open(APPLE_PATH).convert("RGB")
        pred, conf = classify_fruit(pil)
        mark = "✓" if pred == "Apple" else "✗"
        print(f"  test_apple.jpg -> {pred}  ({conf:.3f})  {mark}")
        dump_distances(APPLE_PATH, "Apple")
    else:
        print("  [SKIP] test_apple.jpg not found.")

    # -----------------------------------------------------------------------
    # Summary
    # -----------------------------------------------------------------------
    print(f"\n{'='*70}")
    print(f"  SUMMARY")
    print(f"{'='*70}")
    rows = [
        ("A. Banana",      ca, ta),
        ("B. Orange",      cb, tb),
        ("C. Apple",       cc, tc),
        ("D. Guava",       cd, td),
        ("E. Lemon",       ce, te),
        ("F. Pomegranate", cf, tf),
    ]
    total_c = total_t = 0
    for name, c, t in rows:
        acc = f"{100*c//t}%" if t else "N/A"
        print(f"  {name:<20}: {c}/{t}  ({acc})")
        total_c += c
        total_t += t
    overall = f"{100*total_c//total_t}%" if total_t else "N/A"
    print(f"\n  Overall: {total_c}/{total_t}  ({overall})")
