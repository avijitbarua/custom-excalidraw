import type * as React from "react";

export {};

type MathfieldElement = HTMLElement & {
  getValue?: (format?: string) => string;
  setValue?: (value: string) => void;
  focus?: () => void;
  mathVirtualKeyboardPolicy?: "auto" | "manual" | "onfocus" | "off";
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "math-field": React.DetailedHTMLProps<
        React.HTMLAttributes<MathfieldElement>,
        MathfieldElement
      >;
    }
  }
}
