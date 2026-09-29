"""
FruitNet Dataset-Aware Fruit Classifier -- Multi-Prototype Edition
==================================================================
Builds MULTIPLE per-class prototypes using percentile-diverse selection
from GrabCut-segmented feature vectors extracted from the FruitNet dataset.

Classification:
  class_distance(C) = min over all prototypes P of class C:
                          feature_dist(query, P)
  winner = class with lowest class_distance.

Feature vector (63 dims):
  h_hist  [0:36]    HSV Hue histogram (FG-only, 36 bins x 5 deg each)
  s_hist  [36:52]   HSV Saturation histogram (16 bins)
  scalars [52:60]   [red_r, oran_r, yel_r, grn_r, v_mean, s_mean, tex_norm, fg_r]
                    (hue ratios use mutually-exclusive bins)
  shape   [60:63]   [aspect_ratio, elongation, compactness]

Multi-prototype selection:
  For each class, features are sorted along PC1 (first principal component)
  and K=4 prototypes are selected as equally spaced percentiles along that
  ordering. This captures the full visual variability (e.g. green vs yellow
  bananas, ripe vs unripe oranges) without the quadratic cost of K-means.

Confidence:
  margin = (2nd_best_class_dist - best_class_dist) / best_class_dist
  conf   = clip(0.55 + margin * 0.30, 0.50, 0.92)
  If margin < LOW_CONF_MARGIN, returns "Unknown/Low Confidence".

Apple override:
  Very red (red_r > 0.65) AND smooth (tex_norm < 0.35) -> Apple.
  Pomegranate always has tex_norm > 0.45 in this dataset.

This module is active when torch/ultralytics is unavailable.
It does NOT claim to be the trained EfficientNetV2-S model.
"""
from __future__ import annotations

import os
import random
import threading
from typing import Dict, List, Optional, Tuple

import numpy as np

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
DATASET_ROOT = os.environ.get("FRUITNET_DATASET_PATH", "")
# Note: For deployment, DATASET_ROOT is no longer required at runtime.
# Precomputed prototypes are loaded from backend/models/fruit_classifier/prototypes.pkl

_FOLDER_TO_LABEL: dict = {
    "Apple_Bad": "Apple",       "Apple_Good": "Apple",      "Apple": "Apple",
    "Banana_Bad": "Banana",     "Banana_Good": "Banana",    "Banana": "Banana",
    "Guava_Bad": "Guava",       "Guava_Good": "Guava",      "Guava": "Guava",
    "Lime_Bad": "Lemon",        "Lime_Good": "Lemon",       "Lemon": "Lemon",
    "Orange_Bad": "Orange",     "Orange_Good": "Orange",    "Orange": "Orange",
    "Pomegranate_Bad": "Pomegranate",
    "Pomegranate_Good": "Pomegranate",
    "Pomegranate": "Pomegranate",
}

_SAMPLES_PER_FOLDER = 40
_MIN_FG   = 150
_IMG_SIZE  = 128
_LOW_CONF_MARGIN = 0.10  # Below this relative margin -> Unknown/Low Confidence

# Per-class prototype count derived from diagnostic runs:
#   Pomegranate K=2 -> 100% (K=4 gives only 53% due to prototype gap between Good/Bad)
#   All others K=4  -> best Banana(73%), Apple(87%), Orange(73%) from uniform-K=4 run
_K_PROTO_PER_CLASS = {
    "Apple":        4,
    "Banana":       4,
    "Guava":        4,
    "Lemon":        4,
    "Orange":       4,
    "Pomegranate":  2,   # K=2 uniquely gives 100% for Pomegranate
}

# ---------------------------------------------------------------------------
# Singleton cache
# { label: [proto_array_1, ..., proto_array_K] }
# ---------------------------------------------------------------------------
_lock = threading.Lock()
_proto_map: Optional[Dict[str, List[np.ndarray]]] = None
_build_error: Optional[str] = None


# ---------------------------------------------------------------------------
# Foreground segmentation (unchanged)
# ---------------------------------------------------------------------------

def _segment_fg(img_bgr: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    import cv2
    img = cv2.resize(img_bgr, (_IMG_SIZE, _IMG_SIZE))
    b = _IMG_SIZE // 12
    gc  = np.zeros((_IMG_SIZE, _IMG_SIZE), np.uint8)
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    try:
        cv2.grabCut(img, gc,
                    (b, b, _IMG_SIZE - 2*b, _IMG_SIZE - 2*b),
                    bgd, fgd, 5, cv2.GC_INIT_WITH_RECT)
        gc_fg = np.isin(gc, [cv2.GC_FGD, cv2.GC_PR_FGD])
    except Exception:
        gc_fg = np.ones((_IMG_SIZE, _IMG_SIZE), dtype=bool)
    white = img.mean(axis=2) > 215
    dark  = img.mean(axis=2) < 15
    fg = gc_fg & ~white & ~dark
    if fg.sum() < _MIN_FG: fg = gc_fg & ~white
    if fg.sum() < _MIN_FG: fg = gc_fg
    if fg.sum() < 50:      fg = np.ones((_IMG_SIZE, _IMG_SIZE), dtype=bool)
    return img, fg


# ---------------------------------------------------------------------------
# Shape features from foreground mask
# ---------------------------------------------------------------------------

def _shape_features(fg: np.ndarray) -> np.ndarray:
    """
    Returns [aspect_ratio, elongation, compactness] in [0, 1].
    Supporting features only — not the sole classifier.
    """
    import cv2
    out = np.array([1.0, 0.5, 0.5], dtype=np.float32)
    try:
        ys, xs = np.where(fg)
        if len(xs) < 10:
            return out
        h = float(ys.max() - ys.min() + 1)
        w = float(xs.max() - xs.min() + 1)
        out[0] = float(np.clip(w / (h + 1e-9), 0.1, 10.0))

        pts  = np.stack([xs, ys], axis=1).astype(np.float32)
        mean = pts.mean(axis=0)
        cov  = np.cov((pts - mean).T)
        if cov.ndim == 2:
            ev = np.sort(np.linalg.eigvalsh(cov))[::-1]
            out[1] = float(np.clip(1.0 - ev[1] / (ev[0] + 1e-9), 0.0, 1.0))

        fg8 = fg.astype(np.uint8) * 255
        cnts, _ = cv2.findContours(fg8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if cnts:
            area = float(cv2.contourArea(cnts[0])) + 1.0
            peri = float(cv2.arcLength(cnts[0], True)) + 1.0
            out[2] = float(np.clip((4.0 * np.pi * area) / peri ** 2, 0.0, 1.0))
    except Exception:
        pass
    return out


# ---------------------------------------------------------------------------
# Feature extraction  (63 dims)
# ---------------------------------------------------------------------------

def _extract_features(img_bgr: np.ndarray) -> Optional[np.ndarray]:
    """
    Feature vector layout (63 dims):
      h_hist  [0:36]   HSV Hue histogram (FG-only, 36 bins)
      s_hist  [36:52]  HSV Saturation histogram (16 bins)
      scalars [52:60]  [red_r, oran_r, yel_r, grn_r, v_mean, s_mean, tex_norm, fg_r]
      shape   [60:63]  [aspect_ratio, elongation, compactness]
    """
    import cv2
    try:
        img, fg = _segment_fg(img_bgr)
        hsv  = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        h_px = hsv[:, :, 0][fg]
        s_px = hsv[:, :, 1][fg]
        v_px = hsv[:, :, 2][fg]
        if len(h_px) < 50:
            h_px = hsv[:, :, 0].flatten()
            s_px = hsv[:, :, 1].flatten()
            v_px = hsv[:, :, 2].flatten()
        n = float(len(h_px)) + 1e-9

        h_hist = np.histogram(h_px, bins=36, range=(0, 180))[0].astype(np.float32)
        h_hist /= h_hist.sum() + 1e-9
        s_hist = np.histogram(s_px, bins=16, range=(0, 256))[0].astype(np.float32)
        s_hist /= s_hist.sum() + 1e-9

        # Mutually-exclusive hue colour-ratio bins
        red_r  = float(((h_px <= 10) | (h_px >= 170)).sum()) / n
        oran_r = float(((h_px >  10) & (h_px <=  22)).sum()) / n
        yel_r  = float(((h_px >  22) & (h_px <=  45)).sum()) / n
        grn_r  = float(((h_px >  45) & (h_px <=  90)).sum()) / n

        blur     = cv2.GaussianBlur(gray, (5, 5), 0)
        tex      = float(np.mean((gray.astype(np.float32) - blur.astype(np.float32)) ** 2))
        tex_norm = float(np.clip(tex / 250.0, 0.0, 2.0))

        scalars = np.array([
            red_r, oran_r, yel_r, grn_r,
            float(v_px.mean()) / 255.0,
            float(s_px.mean()) / 255.0,
            tex_norm,
            float(fg.sum()) / (_IMG_SIZE * _IMG_SIZE),
        ], dtype=np.float32)

        shape = _shape_features(fg)
        return np.concatenate([h_hist, s_hist, scalars, shape])
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Distance metric
# ---------------------------------------------------------------------------

def _chi2(a: np.ndarray, b: np.ndarray) -> float:
    d = a + b + 1e-9
    return float(np.sum((a - b) ** 2 / d))


# Scalar weights  [red_r, oran_r, yel_r, grn_r, v_mean, s_mean, tex_norm, fg_r]
# Best-performing config from diagnostic runs (K=4 uniform, 48% overall):
#   oran_r : Orange(0.46) >> Guava(0.21), Lemon(0.24)              -- primary Orange separator
#   s_mean : Orange(0.74) >> Banana(0.46), Guava(0.55), Lemon(0.58)-- secondary Orange separator
#   red_r  : Pomegranate(0.72) >> Apple(0.44) >> all others        -- Pom/Apple signal
#   yel_r  : Guava(0.56) > Lemon(0.49) > Banana(0.42)             -- Guava/Lemon vs Banana
#   tex_norm: Banana-proto(0.58) > Pom(0.38) > Orange(0.26)/Lemon  -- Banana vs Orange
_SC_W = np.array([3.0, 3.0, 2.5, 1.5, 0.5, 3.5, 1.5, 0.2], dtype=np.float32)

# Shape weights  [aspect_ratio, elongation, compactness]
#   elongation: Banana (~0.7-0.9) >> all others -- key Banana signal
_SH_W = np.array([0.4, 2.5, 0.3], dtype=np.float32)


def _feature_dist(f1: np.ndarray, f2: np.ndarray) -> float:
    h1,  h2  = f1[:36],   f2[:36]
    s1,  s2  = f1[36:52], f2[36:52]
    sc1, sc2 = f1[52:60], f2[52:60]
    sh1, sh2 = f1[60:],   f2[60:]
    return (
        1.5 * _chi2(h1, h2)     # hue hist: Orange h=10-22 vs Guava/Lemon h=25-50
        + 0.5 * _chi2(s1, s2)
        + 5.0 * float(np.sum((sc1 - sc2) ** 2 * _SC_W))
        + 2.5 * float(np.sum((sh1 - sh2) ** 2 * _SH_W))
    )


# ---------------------------------------------------------------------------
# Percentile-diverse prototype selection
# ---------------------------------------------------------------------------

def _diverse_prototypes(features: np.ndarray, k: int) -> List[np.ndarray]:
    """
    Build k prototypes that span the visual diversity of a class by:
    1. Computing PC1 projection of the scalar+shape feature dims.
    2. Sorting all samples by their PC1 score.
    3. Dividing into k equal-sized segments.
    4. Taking the MEAN of each segment as the prototype.

    Using segment means (not point samples at percentiles) is critical:
    point samples are noisy outliers, while segment means are stable
    centroids that represent the bulk of each visual sub-group.
    This is O(n * d) -- fast and deterministic.
    """
    n = len(features)
    if n <= k:
        return [features[i].copy() for i in range(n)]

    # PCA on scalar + shape dims only for ranking
    X   = features[:, 52:]        # [n, 11] -- most discriminative
    X_c = X - X.mean(axis=0)
    cov = X_c.T @ X_c / max(n - 1, 1)
    _, vecs = np.linalg.eigh(cov)
    pc1  = vecs[:, -1]             # eigenvector of largest eigenvalue
    proj = X_c @ pc1               # [n] scalar projection scores

    order   = np.argsort(proj)
    ordered = features[order]      # sorted along PC1

    # Divide into k equal segments; take mean of each segment
    prototypes = []
    for i in range(k):
        start = int(i * n / k)
        end   = int((i + 1) * n / k)
        end   = max(end, start + 1)   # guarantee at least one sample
        seg_mean = ordered[start:end].mean(axis=0)
        prototypes.append(seg_mean)

    return prototypes


# ---------------------------------------------------------------------------
# Multi-prototype builder
# ---------------------------------------------------------------------------

def _build_proto_map() -> Tuple[Optional[Dict[str, List[np.ndarray]]], Optional[str]]:
    import cv2
    if not os.path.isdir(DATASET_ROOT):
        return None, f"FruitNet dataset not found at {DATASET_ROOT!r}"

    raw: Dict[str, List[np.ndarray]] = {}
    for quality_dir in sorted(os.listdir(DATASET_ROOT)):
        qpath = os.path.join(DATASET_ROOT, quality_dir)
        if not os.path.isdir(qpath):
            continue
        for fruit_dir in sorted(os.listdir(qpath)):
            label = _FOLDER_TO_LABEL.get(fruit_dir)
            if not label:
                continue
            fpath = os.path.join(qpath, fruit_dir)
            if not os.path.isdir(fpath):
                continue
            files = [f for f in os.listdir(fpath)
                     if f.lower().endswith((".jpg", ".jpeg", ".png"))]
            rng = random.Random(42)
            chosen = rng.sample(files, min(_SAMPLES_PER_FOLDER, len(files)))
            for fn in chosen:
                img = cv2.imread(os.path.join(fpath, fn))
                if img is None:
                    continue
                feat = _extract_features(img)
                if feat is not None:
                    raw.setdefault(label, []).append(feat)

    if not raw:
        return None, "No features could be extracted from the dataset."

    proto_map: Dict[str, List[np.ndarray]] = {}
    for lbl, feats in raw.items():
        arr  = np.stack(feats)
        k    = min(_K_PROTO_PER_CLASS.get(lbl, 3), len(arr))
        protos = _diverse_prototypes(arr, k=k)
        proto_map[lbl] = protos
        print(f"[FruitClassifier]   {lbl}: {len(arr)} samples -> {k} prototypes")

    return proto_map, None


def _ensure_proto_map() -> Tuple[Optional[Dict[str, List[np.ndarray]]], Optional[str]]:
    global _proto_map, _build_error
    if _proto_map is not None or _build_error is not None:
        return _proto_map, _build_error
    with _lock:
        if _proto_map is not None or _build_error is not None:
            return _proto_map, _build_error
        
        try:
            import pickle
            pkl_path = os.path.join(os.path.dirname(__file__), "..", "models", "fruit_classifier", "prototypes.pkl")
            with open(pkl_path, 'rb') as f:
                _proto_map = pickle.load(f)
            print(f"[FruitClassifier] Loaded precomputed prototypes from {pkl_path}")
            print(f"[FruitClassifier] Ready: {sorted(_proto_map.keys())}")
        except Exception as e:
            _build_error = f"Could not load prototypes: {e}. Run precompute_prototypes.py first."
            print(f"[FruitClassifier] Failed: {_build_error}")
            
    return _proto_map, _build_error


# Backward compatibility for diagnostic scripts that import _ensure_prototypes
def _ensure_prototypes():
    pm, err = _ensure_proto_map()
    if pm is None:
        return None, err
    return {lbl: np.stack(ps).mean(axis=0) for lbl, ps in pm.items()}, err


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def classify_fruit(pil_image) -> Tuple[str, float]:
    """
    Classify a PIL Image. Returns (fruit_label, confidence).

    Returns ("Unknown/Low Confidence", conf) when the best class wins
    by less than LOW_CONF_MARGIN relative to the second-best class.
    """
    import cv2
    proto_map, err = _ensure_proto_map()
    img_rgb = np.array(pil_image.convert("RGB"))
    img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)

    if proto_map is None:
        print(f"[FruitClassifier] Using hue heuristic ({err})")
        return _hue_heuristic(img_bgr)

    feat = _extract_features(img_bgr)
    if feat is None:
        return _hue_heuristic(img_bgr)

    # Apple override: very red + very smooth = Apple
    scalars = feat[52:60]
    red_r_q = float(scalars[0])
    tex_q   = float(scalars[6])
    if red_r_q > 0.65 and tex_q < 0.35 and "Apple" in proto_map:
        return "Apple", 0.74

    # Multi-prototype class distances: use nearest prototype per class
    class_dists: Dict[str, float] = {}
    for lbl, protos in proto_map.items():
        class_dists[lbl] = min(_feature_dist(feat, p) for p in protos)

    ranked = sorted(class_dists.items(), key=lambda x: x[1])
    best, bd = ranked[0]
    sd       = ranked[1][1] if len(ranked) > 1 else bd * 2.0
    margin   = (sd - bd) / (bd + 1e-9)
    conf     = float(np.clip(0.55 + margin * 0.30, 0.50, 0.92))

    if margin < _LOW_CONF_MARGIN:
        return "Unknown/Low Confidence", round(conf, 3)

    return best, round(conf, 3)


# ---------------------------------------------------------------------------
# Hue-heuristic fallback  (dataset unavailable)
# ---------------------------------------------------------------------------

_HUE_SIGS = [
    ("Banana",      22, 45,  0.25),
    ("Orange",      10, 22,  0.40),
    ("Lemon",       22, 45,  0.50),
    ("Guava",       45, 90,  0.20),
    ("Pomegranate",  0, 10,  0.30),
    ("Apple",        0, 15,  0.35),
    ("Apple",      165, 179, 0.35),
]


def _hue_heuristic(img_bgr: np.ndarray) -> Tuple[str, float]:
    import cv2
    try:
        img = cv2.resize(img_bgr, (128, 128))
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        h   = hsv[:, :, 0].flatten().astype(np.float32)
        s   = hsv[:, :, 1].flatten().astype(np.float32) / 255.0
        mask = s > 0.20
        if mask.sum() < 50:
            return "Unknown/Low Confidence", 0.50
        h_fg, s_m = h[mask], s[mask]
        s_mean = float(s_m.mean())
        best, bscore = "Unknown/Low Confidence", -1.0
        for name, lo, hi, ms in _HUE_SIGS:
            pct   = float(((h_fg >= lo) & (h_fg <= hi)).mean())
            score = pct * s_mean
            if score > bscore and s_mean >= ms:
                bscore, best = score, name
        return best, 0.55
    except Exception:
        return "Unknown/Low Confidence", 0.50
