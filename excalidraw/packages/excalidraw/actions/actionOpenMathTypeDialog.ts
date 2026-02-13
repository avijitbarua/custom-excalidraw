import { KEYS } from "@excalidraw/common";

import { CaptureUpdateAction } from "@excalidraw/element";

import { register } from "./register";

export const actionOpenMathTypeDialog = register({
  name: "openMathTypeDialog",
  label: "MathType (LaTeX)",
  keywords: ["math", "latex", "equation"],
  viewMode: true,
  trackEvent: { category: "menu", action: "openMathTypeDialog" },
  perform: (_elements, appState) => {
    return {
      appState: {
        ...appState,
        openDialog: { name: "mathType" },
        openMenu: null,
        openPopup: null,
      },
      captureUpdate: CaptureUpdateAction.EVENTUALLY,
    };
  },
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] &&
    event.shiftKey &&
    event.key.toLowerCase() === KEYS.Q,
});