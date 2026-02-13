import { mathjax } from "mathjax-full/js/mathjax";
import { TeX } from "mathjax-full/js/input/tex";
import { SVG } from "mathjax-full/js/output/svg";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html";

const HTML_TAG_REGEX = /<[^>]*>/g;
const LATEX_INLINE_REGEX = /\\\(|\\\)|\\\[|\\\]/g;

export type LatexSegment =
  | { type: "text"; value: string }
  | { type: "latex"; value: string };

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

const tex = new TeX({
  packages: ["base", "ams"],
});

const svg = new SVG({
  fontCache: "none",
});

const html = mathjax.document("", {
  InputJax: tex,
  OutputJax: svg,
});

const latexCache = new Map<
  string,
  { dataUrl: string; width: number; height: number }
>();
const latexMarkupCache = new Map<string, string>();

const decodeHtmlEntities = (value: string) => {
  if (typeof document === "undefined") {
    return value
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
};

const normalizeLatexInput = (value: string) => {
  const withoutTags = value.replace(HTML_TAG_REGEX, " ");
  const decoded = decodeHtmlEntities(withoutTags);
  return decoded.replace(/\s+/g, " ").trim();
};

const stripLatexDelimiters = (value: string) => {
  return value
    .replace(LATEX_INLINE_REGEX, "")
    .replace(/^\s*\$+/, "")
    .replace(/\$+\s*$/, "")
    .trim();
};

export const splitLatexSegments = (value: string): LatexSegment[] => {
  const normalized = normalizeLatexInput(value);
  if (!normalized) {
    return [];
  }

  const segments: LatexSegment[] = [];
  const regex =
    /(\\\((?:[\s\S]*?)\\\))|(\\\[(?:[\s\S]*?)\\\])|(\$\$(?:[\s\S]*?)\$\$)|(\$(?:[^$]*?)\$)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(normalized)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      const textPart = normalized.slice(lastIndex, matchIndex).trim();
      if (textPart) {
        segments.push({ type: "text", value: textPart });
      }
    }

    const latexPart = match[0]?.trim();
    if (latexPart) {
      segments.push({ type: "latex", value: latexPart });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < normalized.length) {
    const textPart = normalized.slice(lastIndex).trim();
    if (textPart) {
      segments.push({ type: "text", value: textPart });
    }
  }

  return segments;
};

export const containsLatex = (value: string) => {
  const normalized = normalizeLatexInput(value);
  return /\\\(|\\\[|\\begin\{|\$[^$]+\$|\\frac|\\sqrt|\\sum|\\int/.test(
    normalized,
  );
};

const parseSvgDimension = (rawValue: string | null) => {
  if (!rawValue) {
    return null;
  }

  const match = rawValue.match(/([0-9.]+)\s*(px|ex|em)?/);
  if (!match) {
    return null;
  }

  const value = Number(match[1]);
  const unit = match[2];

  if (!Number.isFinite(value)) {
    return null;
  }

  if (!unit || unit === "px") {
    return value;
  }

  if (unit === "ex") {
    return value * 8;
  }

  if (unit === "em") {
    return value * 16;
  }

  return value;
};

const getSvgDimensions = async (svgMarkup: string, dataUrl: string) => {
  const widthMatch = svgMarkup.match(/width="([^"]+)"/);
  const heightMatch = svgMarkup.match(/height="([^"]+)"/);
  const parsedWidth = parseSvgDimension(widthMatch?.[1] ?? null);
  const parsedHeight = parseSvgDimension(heightMatch?.[1] ?? null);

  if (parsedWidth && parsedHeight) {
    return { width: parsedWidth, height: parsedHeight };
  }

  const viewBoxMatch = svgMarkup.match(/viewBox="([^"]+)"/);
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].split(/\s+/).map(Number);
    if (parts.length === 4 && parts.every(Number.isFinite)) {
      const width = parts[2];
      const height = parts[3];
      if (width > 0 && height > 0) {
        return { width, height };
      }
    }
  }

  if (typeof Image !== "undefined") {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load SVG"));
      img.src = dataUrl;
    });

    if (image.naturalWidth && image.naturalHeight) {
      return { width: image.naturalWidth, height: image.naturalHeight };
    }
  }

  return { width: 120, height: 40 };
};

const ensureSvgNamespaces = (markup: string) => {
  let svgMarkup = markup;
  if (!svgMarkup.includes("xmlns=")) {
    svgMarkup = svgMarkup.replace(
      "<svg ",
      '<svg xmlns="http://www.w3.org/2000/svg" ',
    );
  }
  if (!svgMarkup.includes("xmlns:xlink=")) {
    svgMarkup = svgMarkup.replace(
      "<svg ",
      '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ',
    );
  }
  return svgMarkup;
};

const toBase64DataUrl = (svgMarkup: string) => {
  if (typeof window === "undefined" || typeof window.btoa !== "function") {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
  }

  const encoded = window.btoa(
    new TextDecoder().decode(new TextEncoder().encode(svgMarkup))
  );
  return `data:image/svg+xml;base64,${encoded}`;
};

export const renderLatexToSvgDataUrl = async (value: string) => {
  const normalized = normalizeLatexInput(value);
  if (!normalized) {
    return null;
  }

  const stripped = stripLatexDelimiters(normalized);
  if (!stripped) {
    return null;
  }

  if (latexCache.has(stripped)) {
    return latexCache.get(stripped)!;
  }

  const node = html.convert(stripped, { display: false });
  const svgMarkup = adaptor.outerHTML(node);
  const svgWithNamespaces = ensureSvgNamespaces(svgMarkup);
  const dataUrl = toBase64DataUrl(svgWithNamespaces);

  const { width, height } = await getSvgDimensions(svgWithNamespaces, dataUrl);
  const result = { dataUrl, width, height };
  latexCache.set(stripped, result);

  return result;
};

export const renderLatexToSvgMarkup = (value: string) => {
  const normalized = normalizeLatexInput(value);
  if (!normalized) {
    return null;
  }

  const stripped = stripLatexDelimiters(normalized);
  if (!stripped) {
    return null;
  }

  if (latexMarkupCache.has(stripped)) {
    return latexMarkupCache.get(stripped)!;
  }

  const node = html.convert(stripped, { display: false });
  const svgMarkup = adaptor.outerHTML(node);
  const svgWithNamespaces = ensureSvgNamespaces(svgMarkup);

  latexMarkupCache.set(stripped, svgWithNamespaces);

  return svgWithNamespaces;
};
