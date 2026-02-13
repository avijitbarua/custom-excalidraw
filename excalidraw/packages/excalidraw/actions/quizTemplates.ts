import { newElementWith } from "@excalidraw/element";
import { ROUNDNESS } from "@excalidraw/common";

import type {
  RoundnessType,
  NonDeletedExcalidrawElement,
  ExcalidrawTextElement,
} from "@excalidraw/element/types";

export type QuizTemplate =
  | "playful"
  | "chalk"
  | "sticky"
  | "whiteboard"
  | "noteboard"
  | "insta";

export type QuizTemplateStyles = {
  optionBg: string;
  optionStroke: string;
  optionStrokeWidth: number;
  optionRoughness: number;
  optionRoundness: { type: RoundnessType; value?: number } | null;
  slideBg: string;
  slideStroke: string;
  slideStrokeWidth: number;
  slideRoughness: number;
  slideRoundness: { type: RoundnessType; value?: number } | null;
  slidePadding: number;
  answerBg: string;
  answerStroke: string;
  answerText: string;
  explanationBg: string;
  explanationStroke: string;
  labelColor: string;
  labelFormat: "alpha" | "numeric";
};

export const QUIZ_TEMPLATES: Record<QuizTemplate, QuizTemplateStyles> = {
  playful: {
    optionBg: "#fff6ff",
    optionStroke: "#7b3ff2",
    optionStrokeWidth: 2,
    optionRoughness: 0.7,
    optionRoundness: { type: ROUNDNESS.ADAPTIVE_RADIUS },
    slideBg: "#fff0fb",
    slideStroke: "#c4a0ff",
    slideStrokeWidth: 2,
    slideRoughness: 0.6,
    slideRoundness: { type: ROUNDNESS.ADAPTIVE_RADIUS },
    slidePadding: 28,
    answerBg: "#dce9ff",
    answerStroke: "#4d7cff",
    answerText: "#1f3b8f",
    explanationBg: "#fff3d6",
    explanationStroke: "#ff9f40",
    labelColor: "#5c2bd9",
    labelFormat: "alpha",
  },
  chalk: {
    optionBg: "#f1f5f9",
    optionStroke: "#0f172a",
    optionStrokeWidth: 3,
    optionRoughness: 0,
    optionRoundness: null,
    slideBg: "#ffffff",
    slideStroke: "#0f172a",
    slideStrokeWidth: 3,
    slideRoughness: 0,
    slideRoundness: null,
    slidePadding: 24,
    answerBg: "#e2e8f0",
    answerStroke: "#0f172a",
    answerText: "#0f172a",
    explanationBg: "#e9f2ff",
    explanationStroke: "#1d4ed8",
    labelColor: "#0f172a",
    labelFormat: "numeric",
  },
  sticky: {
    optionBg: "#fff7a8",
    optionStroke: "#b08900",
    optionStrokeWidth: 2,
    optionRoughness: 0.6,
    optionRoundness: { type: ROUNDNESS.ADAPTIVE_RADIUS },
    slideBg: "#fff2a8",
    slideStroke: "#d2a100",
    slideStrokeWidth: 2,
    slideRoughness: 0.8,
    slideRoundness: { type: ROUNDNESS.ADAPTIVE_RADIUS },
    slidePadding: 36,
    answerBg: "#ffd36a",
    answerStroke: "#c27c00",
    answerText: "#7a4b00",
    explanationBg: "#fff1c1",
    explanationStroke: "#d4a017",
    labelColor: "#7a4b00",
    labelFormat: "alpha",
  },
  whiteboard: {
    optionBg: "#ffffff",
    optionStroke: "#0ea5e9",
    optionStrokeWidth: 2,
    optionRoughness: 0.2,
    optionRoundness: { type: ROUNDNESS.ADAPTIVE_RADIUS },
    slideBg: "#ffffff",
    slideStroke: "#cbd5f5",
    slideStrokeWidth: 2,
    slideRoughness: 0.2,
    slideRoundness: { type: ROUNDNESS.ADAPTIVE_RADIUS },
    slidePadding: 20,
    answerBg: "#e0f2fe",
    answerStroke: "#0284c7",
    answerText: "#075985",
    explanationBg: "#f1f5f9",
    explanationStroke: "#94a3b8",
    labelColor: "#0f172a",
    labelFormat: "numeric",
  },
  noteboard: {
    optionBg: "#fdf2f8",
    optionStroke: "#db2777",
    optionStrokeWidth: 2,
    optionRoughness: 0.5,
    optionRoundness: { type: ROUNDNESS.PROPORTIONAL_RADIUS },
    slideBg: "#fff7fb",
    slideStroke: "#f9a8d4",
    slideStrokeWidth: 2,
    slideRoughness: 0.5,
    slideRoundness: { type: ROUNDNESS.PROPORTIONAL_RADIUS },
    slidePadding: 26,
    answerBg: "#fbcfe8",
    answerStroke: "#be185d",
    answerText: "#831843",
    explanationBg: "#fff1f2",
    explanationStroke: "#fb7185",
    labelColor: "#9d174d",
    labelFormat: "alpha",
  },
  insta: {
    optionBg: "#f5f3ff",
    optionStroke: "#7c3aed",
    optionStrokeWidth: 2,
    optionRoughness: 0.4,
    optionRoundness: { type: ROUNDNESS.ADAPTIVE_RADIUS },
    slideBg: "#fdf4ff",
    slideStroke: "#f0abfc",
    slideStrokeWidth: 2,
    slideRoughness: 0.4,
    slideRoundness: { type: ROUNDNESS.ADAPTIVE_RADIUS },
    slidePadding: 30,
    answerBg: "#fee2e2",
    answerStroke: "#ef4444",
    answerText: "#991b1b",
    explanationBg: "#ede9fe",
    explanationStroke: "#a855f7",
    labelColor: "#6d28d9",
    labelFormat: "numeric",
  },
};

export const QUIZ_TEMPLATE_OPTIONS: Array<{
  value: QuizTemplate;
  label: string;
}> = [
  { value: "playful", label: "Playful" },
  { value: "chalk", label: "Chalkboard" },
  { value: "sticky", label: "Sticky Note" },
  { value: "whiteboard", label: "Whiteboard" },
  { value: "noteboard", label: "Noteboard" },
  { value: "insta", label: "Insta Card" },
];

const QUIZ_TEMPLATE_STORAGE_KEY = "excalidraw.quizTemplate";

const readStoredQuizTemplate = () => {
  try {
    const stored = window.localStorage.getItem(QUIZ_TEMPLATE_STORAGE_KEY);
    if (stored && stored in QUIZ_TEMPLATES) {
      return stored as QuizTemplate;
    }
  } catch {
    // ignore
  }
  return "playful" as QuizTemplate;
};

let currentQuizTemplate: QuizTemplate = readStoredQuizTemplate();
export const getCurrentQuizTemplate = () => currentQuizTemplate;

export const setCurrentQuizTemplate = (template: QuizTemplate) => {
  currentQuizTemplate = template;
  try {
    window.localStorage.setItem(QUIZ_TEMPLATE_STORAGE_KEY, template);
  } catch {
    // ignore
  }
};

const isQuizOptionLabel = (element: NonDeletedExcalidrawElement) => {
  if (element.type !== "text") {
    return false;
  }
  const textElement = element as ExcalidrawTextElement;
  if (element.customData?.quizOption?.role === "label") {
    return true;
  }
  return (
    /^[A-Z]\.$/.test(textElement.text.trim()) ||
    /^\d+\.$/.test(textElement.text.trim())
  );
};

export const applyQuizTemplate = (
  elements: readonly NonDeletedExcalidrawElement[],
  template: QuizTemplateStyles,
) => {
  const explanationBoxIds = new Set<string>();
  elements.forEach((element) => {
    const ids = element.customData?.answerButton?.explanationElementIds as
      | string[]
      | undefined;
    ids?.forEach((id) => explanationBoxIds.add(id));
  });

  return elements.map((element) => {
    if (element.customData?.quizOption && element.type === "rectangle") {
      return newElementWith(element, {
        backgroundColor: template.optionBg,
        strokeColor: template.optionStroke,
        strokeWidth: template.optionStrokeWidth,
        roughness: template.optionRoughness,
        roundness: template.optionRoundness,
      });
    }

    if (
      element.customData?.quizSlideBackground &&
      element.type === "rectangle"
    ) {
      return newElementWith(element, {
        backgroundColor: template.slideBg,
        strokeColor: template.slideStroke,
        strokeWidth: template.slideStrokeWidth,
        roughness: template.slideRoughness,
        roundness: template.slideRoundness,
      });
    }

    if (isQuizOptionLabel(element)) {
      return newElementWith(element, {
        strokeColor: template.labelColor,
      });
    }

    if (element.customData?.answerButton && element.type === "rectangle") {
      return newElementWith(element, {
        backgroundColor: template.answerBg,
        strokeColor: template.answerStroke,
        strokeWidth: template.optionStrokeWidth,
        roughness: template.optionRoughness,
        roundness: template.optionRoundness,
      });
    }

    if (element.customData?.answerButton && element.type === "text") {
      return newElementWith(element, {
        strokeColor: template.answerText,
      });
    }

    if (explanationBoxIds.has(element.id) && element.type === "rectangle") {
      return newElementWith(element, {
        backgroundColor: template.explanationBg,
        strokeColor: template.explanationStroke,
        strokeWidth: template.optionStrokeWidth,
        roughness: template.optionRoughness,
        roundness: template.optionRoundness,
      });
    }

    return element;
  });
};
