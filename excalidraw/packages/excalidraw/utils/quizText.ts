const HTML_TAG_REGEX = /<[^>]*>/g;
const LATEX_INLINE_WRAPPER_REGEX = /\\\(|\\\)|\\\[|\\\]/g;

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

const sanitizeLatexToText = (value: string) => {
  let text = value;

  text = text.replace(LATEX_INLINE_WRAPPER_REGEX, "");
  text = text.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "$1/$2");
  text = text.replace(/\\times/g, "×");
  text = text.replace(/\\cdot/g, "·");
  text = text.replace(/\\leq/g, "≤");
  text = text.replace(/\\geq/g, "≥");
  text = text.replace(/\\neq/g, "≠");
  text = text.replace(/\\pm/g, "±");
  text = text.replace(/\\mathrm\{([^}]*)\}/g, "$1");
  text = text.replace(/\\text\{([^}]*)\}/g, "$1");
  text = text.replace(/\\mathbf\{([^}]*)\}/g, "$1");
  text = text.replace(/\\mathit\{([^}]*)\}/g, "$1");
  text = text.replace(/\\mathsf\{([^}]*)\}/g, "$1");
  text = text.replace(/\{([^}]*)\}/g, "$1");
  text = text.replace(/\\/g, "");

  return text;
};

export const sanitizeQuizText = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  const withoutTags = value.replace(HTML_TAG_REGEX, " ");
  const decoded = decodeHtmlEntities(withoutTags);
  const latexSanitized = sanitizeLatexToText(decoded);

  return latexSanitized.replace(/\s+/g, " ").trim();
};
