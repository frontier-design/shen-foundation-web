import { useEffect, useState } from "react";
import { imageUrl, IMAGE_WIDTHS } from "../images.js";
import { blobVideo } from "../videos.js";

const CONTRAST_TARGET = 2.6;
const SAMPLE = 64;
const MIN_SATURATION = 0.35;
const MIN_VIBRANT_FRACTION = 0.12;
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

  let opaque = 0;
  let vibrant = 0;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 125) continue;
    opaque += 1;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const [h, s, l] = rgbToHsl(r, g, b);
    if (s < MIN_SATURATION || l < MIN_LIGHTNESS || l > MAX_LIGHTNESS) continue;
    vibrant += 1;
    const weight = s * s;
    const bucket =
      buckets[Math.min(HUE_BUCKETS - 1, Math.floor((h / 360) * HUE_BUCKETS))];
    bucket.r += r * weight;
    bucket.g += g * weight;
    bucket.b += b * weight;
    bucket.weight += weight;
  }

  if (!opaque || vibrant / opaque < MIN_VIBRANT_FRACTION) return null;

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

const VIDEO_FRAME_TIME = 1;
const VIDEO_TIMEOUT = 15000;

function accentFromSource(source, width, height) {
  const scale = Math.min(1, SAMPLE / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, w, h);

  let data;
  try {
    data = ctx.getImageData(0, 0, w, h).data;
  } catch {
    return null;
  }

  const vibrant = extractVibrant(data);
  return vibrant ? ensureContrast(vibrant) : null;
}

// A frame about a second in (videos often open on black), read from an
// off-screen muted video; Blob videos allow cross-origin reads.
function loadVideoAccent(src) {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      video.pause();
      video.removeAttribute("src");
      video.load();
      resolve(value);
    };
    const draw = () => {
      if (!video.videoWidth || video.readyState < 2) return;
      finish(accentFromSource(video, video.videoWidth, video.videoHeight));
    };
    const timer = setTimeout(() => finish(null), VIDEO_TIMEOUT);

    Object.assign(video, { crossOrigin: "anonymous", muted: true, playsInline: true, preload: "auto" });
    video.addEventListener("error", () => finish(null));
    video.addEventListener("loadedmetadata", () => {
      const time = Math.min(VIDEO_FRAME_TIME, (video.duration || 0) / 2);
      if (time > 0) video.currentTime = time;
      else video.addEventListener("loadeddata", draw, { once: true });
    });
    video.addEventListener("seeked", draw);
    video.src = src;
    // Browsers that don't preload (iOS Safari) start loading on play().
    setTimeout(() => {
      if (!settled && video.readyState < 1) video.play().then(() => video.pause()).catch(() => {});
    }, 3000);
  });
}

function loadAccent(src) {
  if (accentCache.has(src)) return accentCache.get(src);

  if (blobVideo(src)) {
    const promise = loadVideoAccent(src);
    accentCache.set(src, promise);
    return promise;
  }

  const promise = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";

    img.onerror = () => resolve(null);
    img.onload = () => resolve(accentFromSource(img, img.naturalWidth, img.naturalHeight));

    img.src = imageUrl(src, IMAGE_WIDTHS[0]);
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
