import { useEffect, useState } from "react";

const CONTRAST_TARGET = 2.6;
const SAMPLE = 64;
const MIN_SATURATION = 0.35;
const MIN_LIGHTNESS = 0.12;
const MAX_LIGHTNESS = 0.92;
const MIN_OUTPUT_SATURATION = 0.85;
const LIGHTNESS_FLOOR = 0.48;
const HUE_BUCKETS = 12;

const toLinear = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const luminance = (r, g, b) =>
  0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

const contrastWithWhite = (r, g, b) => 1.05 / (luminance(r, g, b) + 0.05);

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  if (d === 0) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

function hslToRgb(h, s, l) {
  h /= 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q1 = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const q0 = 2 * l - q1;
  const hue = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return q0 + (q1 - q0) * 6 * t;
    if (t < 1 / 2) return q1;
    if (t < 2 / 3) return q0 + (q1 - q0) * (2 / 3 - t) * 6;
    return q0;
  };
  return [
    Math.round(hue(h + 1 / 3) * 255),
    Math.round(hue(h) * 255),
    Math.round(hue(h - 1 / 3) * 255),
  ];
}

function extractVibrant(data) {
  const buckets = Array.from({ length: HUE_BUCKETS }, () => ({
    r: 0,
    g: 0,
    b: 0,
    weight: 0,
  }));

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 125) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const [h, s, l] = rgbToHsl(r, g, b);
    if (s < MIN_SATURATION || l < MIN_LIGHTNESS || l > MAX_LIGHTNESS) continue;
    const weight = s * s;
    const bucket =
      buckets[Math.min(HUE_BUCKETS - 1, Math.floor((h / 360) * HUE_BUCKETS))];
    bucket.r += r * weight;
    bucket.g += g * weight;
    bucket.b += b * weight;
    bucket.weight += weight;
  }

  let best = null;
  for (const bucket of buckets) {
    if (bucket.weight > 0 && (!best || bucket.weight > best.weight))
      best = bucket;
  }
  if (!best) return null;

  return [
    Math.round(best.r / best.weight),
    Math.round(best.g / best.weight),
    Math.round(best.b / best.weight),
  ];
}

function ensureContrast([r, g, b]) {
  let [h, s, l] = rgbToHsl(r, g, b);
  s = Math.max(s, MIN_OUTPUT_SATURATION);
  let rgb = hslToRgb(h, s, l);
  while (contrastWithWhite(...rgb) < CONTRAST_TARGET && l > LIGHTNESS_FLOOR) {
    l = Math.max(LIGHTNESS_FLOOR, l - 0.02);
    rgb = hslToRgb(h, s, l);
  }
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

const accentCache = new Map();

function loadAccent(src) {
  if (accentCache.has(src)) return accentCache.get(src);

  const promise = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";

    img.onerror = () => resolve(null);
    img.onload = () => {
      const scale = Math.min(
        1,
        SAMPLE / Math.max(img.naturalWidth, img.naturalHeight),
      );
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0, w, h);

      let data;
      try {
        data = ctx.getImageData(0, 0, w, h).data;
      } catch {
        return resolve(null);
      }

      const vibrant = extractVibrant(data);
      resolve(vibrant ? ensureContrast(vibrant) : null);
    };

    img.src = src;
  });

  accentCache.set(src, promise);
  return promise;
}

export function useImageAccent(src, fallback = null) {
  const [accent, setAccent] = useState(null);

  useEffect(() => {
    if (!src) return undefined;

    let cancelled = false;
    loadAccent(src).then((value) => {
      if (!cancelled) setAccent(value ?? fallback);
    });

    return () => {
      cancelled = true;
    };
  }, [src, fallback]);

  return accent;
}

export default useImageAccent;
