import {
  CaptureUpdateAction,
  newElementWith,
  newImageElement,
  getCommonBounds,
  newIframeElement,
} from "@excalidraw/element";
import {
  FONT_FAMILY,
  getFontString,
  randomId,
  IMAGE_MIME_TYPES,
} from "@excalidraw/common";
import { newElement, newTextElement, wrapText } from "@excalidraw/element";

import type {
  FileId,
  NonDeletedExcalidrawElement,
} from "@excalidraw/element/types";

import { ArrowIcon, LibraryIcon } from "../components/icons";
import { sanitizeQuizText } from "../utils/quizText";
import {
  containsLatex,
  renderLatexToSvgDataUrl,
  splitLatexSegments,
} from "../utils/latexUtils";

import { register } from "./register";

import {
  QUIZ_TEMPLATES,
  getCurrentQuizTemplate,
  setCurrentQuizTemplate,
  applyQuizTemplate,
  type QuizTemplate,
} from "./quizTemplates";

import type { AppState, BinaryFiles, DataURL } from "../types";

const QUESTION_FONT_SIZE = 21;
const OPTION_FONT_SIZE = 18;
const QUESTION_MAX_WIDTH = 800;
const OPTION_MAX_WIDTH = 550;
const OPTION_PADDING = 12;
const OPTION_GAP = 16;
const QUESTION_GAP = 24;
const QUESTION_BLOCK_GAP = 48;
const SLIDE_GAP = 2000;
const SLIDE_PADDING = 60;
const INLINE_SEGMENT_GAP = 8;
const INLINE_LINE_GAP = 6;
const EXPLANATION_MIN_HEIGHT = 480;
const EXPLANATION_MAX_HEIGHT = 840;

const estimateExplanationHeight = (html: string) => {
  const plainText = html.replace(/<[^>]+>/g, "").trim();
  const approxLines = Math.max(3, Math.ceil(plainText.length / 80));
  const height = EXPLANATION_MIN_HEIGHT + approxLines * 22;
  return Math.min(EXPLANATION_MAX_HEIGHT, height);
};
const createExplanationHtml = (rawHtml: string, elementId: string) => {
  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Explanation Card</title>

  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" crossorigin="anonymous">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" crossorigin="anonymous"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js" crossorigin="anonymous"></script>

  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600&display=swap" rel="stylesheet">

  <style>
    :root {
      --primary: #6d28d9;
      --primary-hover: #5b21b6;
      --text: #1f2937;
    }
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body {
      font-family: "Noto Sans Bengali", "Noto Sans", system-ui, sans-serif;
      background: transparent;
      width: fit-content;
      min-width: 240px;
      height: auto;
      display: flex;
      justify-content: flex-start;
      align-items: flex-start;
      color: var(--text);
    }
    .container {
      width: auto;
      max-width: 980px;
      min-width: 240px;
      text-align: center;
      transition: all 0.35s ease;
      background: transparent;
    }
    .toggle-btn {
      margin-left: -70px;
      font-size: 1.28rem;
      font-weight: 600;
      margin-top: 40px;
      padding: 12px 34px;
      background: var(--primary);
      color: #fff;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.25s ease;
      box-shadow: 0 3px 10px rgba(109, 40, 217, 0.25);
      display: inline-flex;
      align-items: center;
      gap: 8px;
      position: relative;
      overflow: hidden;
    }
    .toggle-btn:hover:not(:disabled) {
      background: var(--primary-hover);
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(109, 40, 217, 0.35);
    }
    .toggle-btn:disabled { opacity: 0.65; cursor: not-allowed; }
    .spinner {
      width: 18px;
      height: 18px;
      border: 3px solid rgba(255,255,255,0.35);
      border-top: 3px solid #fff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .content-card {
      margin-top: 16px;
      padding: 0;
      background: transparent;
      border: none;
      box-shadow: none;
      line-height: 1.82;
      font-size: 1.34rem;
      text-align: left;
      opacity: 0;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.7s ease, opacity 0.5s ease, padding 0.5s ease;
    }
    .content-card.visible {
      opacity: 1;
      max-height: 3200px;
      padding: 20px 28px;
      margin-top: 20px;
    }
    .math-box {
      padding: 10px 0;
    }
    .math-box img { max-width: 100%; height: auto; }
    ul, ol {
      list-style-type: disc;
      margin: 0.6em 0 0.6em 2em;
      padding-left: 1em;
    }
    li { margin-bottom: 0.5em; }
    p { margin-bottom: 0.9em; }
    strong { font-weight: 700; }
    @media (max-width: 640px) {
      .toggle-btn { font-size: 1.18rem; padding: 10px 26px; }
      .content-card { font-size: 1.20rem; }
      .content-card.visible { padding: 14px 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <button class="toggle-btn" id="toggleBtn">ব্যাখ্যা</button>
    <div class="content-card" id="contentCard">
      <div class="math-box" id="previewBox"></div>
    </div>
  </div>

  <script>
    const fullHTML = ${JSON.stringify(rawHtml ?? "")};
    const toggleBtn = document.getElementById("toggleBtn");
    const contentCard = document.getElementById("contentCard");
    const previewBox = document.getElementById("previewBox");
    const container = document.querySelector(".container");
    const elementId = ${JSON.stringify(elementId)};

    let state = {
      visible: false,
      typing: false,
      index: 0,
    };

    const notifySize = (() => {
      let raf = 0;
      return () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const rect = container?.getBoundingClientRect() || document.body.getBoundingClientRect();
          const width = Math.ceil(rect.width || 0);
          const height = Math.ceil(rect.height || 0);
          if (width > 0 && height > 0 && window.parent) {
            window.parent.postMessage(
              { type: "excalidraw:resize", width, height, id: elementId },
              "*"
            );
          }
        });
      };
    })();

    const renderMath = () => {
      if (typeof renderMathInElement === "function") {
        renderMathInElement(previewBox, {
          delimiters: [
            {left: "\\\\(", right: "\\\\)", display: false},
            {left: "\\\\[", right: "\\\\]", display: true},
            {left: "$", right: "$", display: false},
            {left: "$$", right: "$$", display: true}
          ],
          throwOnError: false,
          strict: "ignore"
        });
      }
    };

    const startTyping = () => {
      if (state.typing) return;
      state.typing = true;
      state.index = 0;
      previewBox.innerHTML = "";
      toggleBtn.disabled = true;
      toggleBtn.innerHTML = "লোড হচ্ছে <span class=\\"spinner\\"></span>";

      const typeNext = () => {
        if (state.index < fullHTML.length) {
          // Extremely fast chunk size (almost instant feel)
          const chunk = 60;  // 10× faster than before (was ~12)
          const nextIndex = Math.min(state.index + chunk, fullHTML.length);
          previewBox.innerHTML = fullHTML.substring(0, nextIndex);
          state.index = nextIndex;
          renderMath();
          notifySize();
          setTimeout(typeNext, 50);  // 1ms delay → super fast
        } else {
          // Final correct render — fixes all formatting issues (lists, strong, etc.)
          previewBox.innerHTML = fullHTML;
          renderMath();
          state.typing = false;
          toggleBtn.disabled = false;
          toggleBtn.textContent = "ব্যাখ্যা";
          notifySize();
        }
      };

      setTimeout(typeNext, 150); // very short initial delay
    };

    toggleBtn.addEventListener("click", () => {
      if (state.typing) return;

      state.visible = !state.visible;

      if (state.visible) {
        contentCard.classList.add("visible");
        toggleBtn.textContent = "ব্যাখ্যা";
        startTyping();
      } else {
        contentCard.classList.remove("visible");
        toggleBtn.textContent = "ব্যাখ্যা";
      }

      setTimeout(notifySize, 220);
    });

    window.addEventListener("load", () => {
      if (typeof katex === "undefined") {
        previewBox.innerHTML = "<p style=\\"color:#dc2626;\\">KaTeX লোড হয়নি। ইন্টারনেট চেক করুন।</p>";
      }
      notifySize();
    });

    const checkAutoRender = setInterval(() => {
      if (typeof renderMathInElement === "function") {
        clearInterval(checkAutoRender);
        renderMath();
      }
    }, 150);

    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(notifySize).observe(document.body);
    }

    if (typeof MutationObserver !== "undefined") {
      new MutationObserver(notifySize).observe(previewBox, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  </script>
</body>
</html>`;
};

type SlideAnchor = {
  centerX: number;
  centerY: number;
};

let quizSlideAnchors: SlideAnchor[] = [];

type ExamQuestion = {
  ID?: number | string;
  question?: string;
  options?: string[];
  subject?: string;
  answer?: string;
  explanation?: string;
  explanation_text?: string;
  solution?: string;
  correctIndex?: number;
  correct_index?: number;
  correctOption?: number | string;
  correct_option?: number | string;
  correctAnswer?: string;
};

type ExamApiResponse = {
  count?: number;
  data?: ExamQuestion[];
};

const resolveCorrectIndex = (item: ExamQuestion, options: string[]) => {
  const rawValue =
    item.correctIndex ??
    item.correct_index ??
    item.correctOption ??
    item.correct_option ??
    item.correctAnswer ??
    item.answer;

  if (typeof rawValue === "number") {
    if (rawValue >= 0 && rawValue < options.length) {
      return rawValue;
    }
    if (rawValue >= 1 && rawValue <= options.length) {
      return rawValue - 1;
    }
  }

  if (typeof rawValue === "string") {
    const normalized = sanitizeQuizText(rawValue).toLowerCase();
    const optionMatch = normalized.match(/^option\s*([a-z])$/i);
    if (optionMatch) {
      const index = optionMatch[1].toLowerCase().charCodeAt(0) - 97;
      if (index >= 0 && index < options.length) {
        return index;
      }
    }
    if (["a", "b", "c", "d"].includes(normalized)) {
      return ["a", "b", "c", "d"].indexOf(normalized);
    }

    if (/^\d+$/.test(normalized)) {
      const parsed = Number(normalized);
      if (parsed >= 0 && parsed < options.length) {
        return parsed;
      }
      if (parsed >= 1 && parsed <= options.length) {
        return parsed - 1;
      }
    }

    const optionIndex = options.findIndex(
      (option) => sanitizeQuizText(option).toLowerCase() === normalized,
    );
    if (optionIndex >= 0) {
      return optionIndex;
    }
  }

  return null;
};

const resolveExplanationText = (item: ExamQuestion) => {
  return item.explanation ?? item.explanation_text ?? item.solution ?? "";
};

const wrapWithFont = (text: string, fontSize: number, maxWidth: number) => {
  return wrapText(
    text,
    getFontString({ fontFamily: FONT_FAMILY.Virgil, fontSize }),
    maxWidth,
  );
};

const getScrollToCenter = (
  centerX: number,
  centerY: number,
  appState: AppState,
) => {
  const zoom = appState.zoom.value;
  return {
    scrollX: appState.width / 2 - centerX * zoom,
    scrollY: appState.height / 2 - centerY * zoom,
  };
};

const createQuizContentElement = async ({
  rawText,
  x,
  y,
  maxWidth,
  fontSize,
  groupId,
  customData,
  opacity,
  files,
}: {
  rawText: string;
  x: number;
  y: number;
  maxWidth: number;
  fontSize: number;
  groupId: string;
  customData?: Record<string, any>;
  opacity?: number;
  files: BinaryFiles;
}) => {
  const segments = splitLatexSegments(rawText);
  if (segments.length > 1) {
    const elements: NonDeletedExcalidrawElement[] = [];
    let cursorX = x;
    let cursorY = y;
    let lineHeight = 0;

    for (const segment of segments) {
      if (segment.type === "text") {
        const sanitizedText = sanitizeQuizText(segment.value);
        if (!sanitizedText) {
          continue;
        }

        const textElement = newTextElement({
          x: cursorX,
          y: cursorY,
          text: sanitizedText,
          fontFamily: FONT_FAMILY.Virgil,
          fontSize,
          textAlign: "left",
          verticalAlign: "top",
          groupIds: [groupId],
          customData,
          opacity,
        });

        if (cursorX > x && cursorX + textElement.width > x + maxWidth) {
          cursorX = x;
          cursorY += lineHeight + INLINE_LINE_GAP;
          lineHeight = 0;

          const wrappedText = wrapWithFont(sanitizedText, fontSize, maxWidth);
          const wrappedElement = newTextElement({
            x: cursorX,
            y: cursorY,
            text: wrappedText,
            fontFamily: FONT_FAMILY.Virgil,
            fontSize,
            textAlign: "left",
            verticalAlign: "top",
            groupIds: [groupId],
            customData,
            opacity,
          });
          elements.push(wrappedElement);
          cursorX = x + wrappedElement.width + INLINE_SEGMENT_GAP;
          lineHeight = Math.max(lineHeight, wrappedElement.height);
          continue;
        }

        elements.push(textElement);
        cursorX += textElement.width + INLINE_SEGMENT_GAP;
        lineHeight = Math.max(lineHeight, textElement.height);
        continue;
      }

      const rendered = await renderLatexToSvgDataUrl(segment.value);
      if (!rendered) {
        continue;
      }

      const fileId = randomId() as FileId;
      files[fileId] = {
        id: fileId,
        dataURL: rendered.dataUrl as DataURL,
        mimeType: IMAGE_MIME_TYPES.svg,
        created: Date.now(),
      };

      const scale = rendered.width > maxWidth ? maxWidth / rendered.width : 1;
      const width = Math.max(1, rendered.width * scale);
      const height = Math.max(1, rendered.height * scale);

      if (cursorX > x && cursorX + width > x + maxWidth) {
        cursorX = x;
        cursorY += lineHeight + INLINE_LINE_GAP;
        lineHeight = 0;
      }

      const imageElement = newImageElement({
        type: "image",
        x: cursorX,
        y: cursorY,
        width,
        height,
        fileId,
        status: "saved",
        groupIds: [groupId],
        customData,
        opacity,
      });

      elements.push(imageElement);
      cursorX += width + INLINE_SEGMENT_GAP;
      lineHeight = Math.max(lineHeight, height);
    }

    const height = Math.max(lineHeight, fontSize);
    const totalHeight = cursorY + height - y;
    return { elements, height: totalHeight || height };
  }

  if (containsLatex(rawText)) {
    const rendered = await renderLatexToSvgDataUrl(rawText);
    if (rendered) {
      const fileId = randomId() as FileId;
      files[fileId] = {
        id: fileId,
        dataURL: rendered.dataUrl as DataURL,
        mimeType: IMAGE_MIME_TYPES.svg,
        created: Date.now(),
      };

      const scale = rendered.width > maxWidth ? maxWidth / rendered.width : 1;
      const width = Math.max(1, rendered.width * scale);
      const height = Math.max(1, rendered.height * scale);

      const imageElement = newImageElement({
        type: "image",
        x,
        y,
        width,
        height,
        fileId,
        status: "saved",
        groupIds: [groupId],
        customData,
        opacity,
      });

      return { elements: [imageElement], height };
    }
  }

  const sanitizedText = sanitizeQuizText(rawText);
  const wrappedText = wrapWithFont(sanitizedText, fontSize, maxWidth);
  const textElement = newTextElement({
    x,
    y,
    text: wrappedText,
    fontFamily: FONT_FAMILY.Virgil,
    fontSize,
    textAlign: "left",
    verticalAlign: "top",
    groupIds: [groupId],
    customData,
    opacity,
  });

  return { elements: [textElement], height: textElement.height };
};

export const actionImportExamQuestions = register<{ examId: string }>({
  name: "importExamQuestions",
  label: "Import Exam Questions",
  icon: LibraryIcon,
  trackEvent: { category: "menu", action: "importExamQuestions" },
  viewMode: false,
  perform: async (elements, appState, value, app) => {
    const examId = value?.examId?.trim();
    if (!examId) {
      return false;
    }

    try {
      const response = await fetch(
        `https://bdpreparationhub.pythonanywhere.com/exam_view_questions_api?exam_id=${encodeURIComponent(
          examId.trim(),
        )}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch exam questions.");
      }

      const payload = (await response.json()) as ExamApiResponse;
      const questions = payload.data ?? [];

      if (questions.length === 0) {
        return {
          appState: {
            ...appState,
            errorMessage: "No questions found for the provided Exam ID.",
          },
          captureUpdate: CaptureUpdateAction.EVENTUALLY,
        };
      }

      const baseX = 0;
      const baseY = 0;

      const createdElements: NonDeletedExcalidrawElement[] = [];
      const newFiles: BinaryFiles = { ...app.files };
      const template = QUIZ_TEMPLATES[getCurrentQuizTemplate()];
      quizSlideAnchors = [];

      for (const [questionIndex, item] of questions.entries()) {
        const questionElements: NonDeletedExcalidrawElement[] = [];
        const groupId = randomId();
        const slideStartIndex = createdElements.length;
        const slideX = baseX + questionIndex * SLIDE_GAP + SLIDE_PADDING;
        let currentY = baseY + SLIDE_PADDING;

        const questionContent = await createQuizContentElement({
          rawText: item.question ?? "",
          x: slideX,
          y: currentY,
          maxWidth: QUESTION_MAX_WIDTH,
          fontSize: QUESTION_FONT_SIZE,
          groupId,
          files: newFiles,
        });

        questionElements.push(...questionContent.elements);
        createdElements.push(...questionContent.elements);
        currentY += questionContent.height + QUESTION_GAP;

        const options = item.options ?? [];
        const correctIndex = resolveCorrectIndex(item, options);
        const explanationText = resolveExplanationText(item);

        for (const [optionIndex, optionTextRaw] of options.entries()) {
          const optionRect = newElement({
            type: "rectangle",
            x: slideX,
            y: currentY,
            width: OPTION_MAX_WIDTH,
            height: 0,
            fillStyle: "solid",
            backgroundColor: template.optionBg,
            strokeColor: template.optionStroke,
            strokeWidth: template.optionStrokeWidth,
            roughness: template.optionRoughness,
            roundness: template.optionRoundness,
            groupIds: [groupId],
          });

          const optionLabel =
            template.labelFormat === "numeric"
              ? `${optionIndex + 1}`
              : String.fromCharCode(65 + optionIndex);
          const optionLabelElement = newTextElement({
            x: slideX + OPTION_PADDING,
            y: currentY + OPTION_PADDING,
            text: `${optionLabel}.`,
            fontFamily: FONT_FAMILY.Virgil,
            fontSize: OPTION_FONT_SIZE,
            textAlign: "left",
            verticalAlign: "top",
            strokeColor: template.labelColor,
            groupIds: [groupId],
          });

          const optionMeta = {
            quizOption: {
              optionIndex,
              optionElementId: optionRect.id,
              isCorrect: optionIndex === correctIndex,
              questionId: item.ID,
            },
          };

          const optionContent = await createQuizContentElement({
            rawText: optionTextRaw,
            x: slideX + OPTION_PADDING + optionLabelElement.width + 6,
            y: currentY + OPTION_PADDING,
            maxWidth: OPTION_MAX_WIDTH - OPTION_PADDING * 2,
            fontSize: OPTION_FONT_SIZE,
            groupId,
            files: newFiles,
            customData: optionMeta,
          });

          const optionHeight = optionContent.height + OPTION_PADDING * 2;
          const optionRectWithData = newElementWith(optionRect, {
            height: optionHeight,
            customData: optionMeta,
          });

          const optionLabelWithData = newElementWith(optionLabelElement, {
            customData: {
              ...optionMeta,
              quizOption: {
                ...optionMeta.quizOption,
                role: "label",
              },
            },
          });

          questionElements.push(
            optionRectWithData,
            optionLabelWithData,
            ...optionContent.elements,
          );
          createdElements.push(
            optionRectWithData,
            optionLabelWithData,
            ...optionContent.elements,
          );

          currentY += optionHeight + OPTION_GAP;
        }

        if (explanationText) {
          const explanationBoxWidth = 700;
          const explanationX = slideX;
          const explanationY = currentY;
          const explanationBoxHeight =estimateExplanationHeight(explanationText)+ 100;
          const explanationIframe = newIframeElement({
            type: "iframe",
            x: explanationX,
            y: explanationY,
            width: explanationBoxWidth,
            height: explanationBoxHeight,
            fillStyle: "solid",
            backgroundColor: "rgba(255, 255, 255, 0)",
            strokeColor: "rgba(255, 255, 255, 0)",
            strokeWidth: 0,
            strokeStyle: "transparent",
            roughness: template.optionRoughness,
            roundness: null,
            groupIds: [groupId],
            opacity: 100,
            customData: {
              generationData: {
                status: "done",
                html: "",
              },
            },
          });

          const explanationIframeWithHtml = newElementWith(explanationIframe, {
            customData: {
              generationData: {
                status: "done",
                html: createExplanationHtml(explanationText, explanationIframe.id),
              },
            },
          });

          questionElements.push(explanationIframeWithHtml);
          createdElements.push(explanationIframeWithHtml);

          currentY += explanationBoxHeight + OPTION_GAP;
        }

        if (questionElements.length > 0) {
          const [minX, minY, maxX, maxY] = getCommonBounds(questionElements);
          const slidePadding = template.slidePadding ?? SLIDE_PADDING;
          const slideBackground = newElement({
            type: "rectangle",
            x: minX - slidePadding,
            y: minY - slidePadding,
            width: maxX - minX + slidePadding * 2,
            height: maxY - minY + slidePadding * 2,
            fillStyle: "solid",
            backgroundColor: template.slideBg,
            strokeColor: template.slideStroke,
            strokeWidth: template.slideStrokeWidth,
            roughness: template.slideRoughness,
            roundness: template.slideRoundness,
            groupIds: [groupId],
            customData: {
              quizSlideBackground: true,
            },
          });

          questionElements.unshift(slideBackground);
          createdElements.splice(slideStartIndex, 0, slideBackground);
        }

        currentY += QUESTION_BLOCK_GAP;

        const [minX, minY, maxX, maxY] = getCommonBounds(questionElements);
        quizSlideAnchors.push({
          centerX: (minX + maxX) / 2,
          centerY: (minY + maxY) / 2,
        });
      }

      const firstAnchor = quizSlideAnchors[0];
      const nextScroll = firstAnchor
        ? getScrollToCenter(firstAnchor.centerX, firstAnchor.centerY, appState)
        : { scrollX: appState.scrollX, scrollY: appState.scrollY };

      return {
        elements: [...elements, ...createdElements],
        files: newFiles,
        appState: {
          ...appState,
          editingGroupId: null,
          selectedGroupIds: {},
          selectedElementIds: {},
          ...nextScroll,
        } as AppState,
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      };
    } catch (error: any) {
      return {
        appState: {
          ...appState,
          errorMessage: error?.message || "Unable to load exam questions.",
        },
        captureUpdate: CaptureUpdateAction.EVENTUALLY,
      };
    }
  },
});

export const actionSetQuizTemplate = register<{ template: QuizTemplate }>({
  name: "setQuizTemplate",
  label: "Set Quiz Template",
  icon: ArrowIcon,
  trackEvent: { category: "menu", action: "setQuizTemplate" },
  viewMode: true,
  perform: (_elements, appState, value) => {
    if (!value?.template || !QUIZ_TEMPLATES[value.template]) {
      return false;
    }

    setCurrentQuizTemplate(value.template);

    const updatedElements = applyQuizTemplate(
      _elements as NonDeletedExcalidrawElement[],
      QUIZ_TEMPLATES[getCurrentQuizTemplate()],
    );

    return {
      elements: updatedElements,
      appState: {
        ...appState,
        toast: { message: `Template: ${value.template}` },
      },
      captureUpdate: CaptureUpdateAction.EVENTUALLY,
    };
  },
});
