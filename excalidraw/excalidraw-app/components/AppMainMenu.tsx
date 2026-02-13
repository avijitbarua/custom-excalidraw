import { eyeIcon, LibraryIcon } from "@excalidraw/excalidraw/components/icons";
import { MainMenu } from "@excalidraw/excalidraw/index";
import React from "react";

import { isDevEnv } from "@excalidraw/common";
import { actionImportExamQuestions } from "@excalidraw/excalidraw/actions";
import { useExcalidrawActionManager } from "@excalidraw/excalidraw/components/App";

import type { Theme } from "@excalidraw/element/types";

import { LanguageList } from "../app-language/LanguageList";

import { ExamImportDialog } from "./ExamImportDialog";

import { saveDebugState } from "./DebugCanvas";

export const AppMainMenu: React.FC<{
  theme: Theme | "system";
  setTheme: (theme: Theme | "system") => void;
  refresh: () => void;
}> = React.memo((props) => {
  const actionManager = useExcalidrawActionManager();
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);
  const [examId, setExamId] = React.useState("");

  const openImportDialog = React.useCallback(() => {
    setExamId((prev) => prev.trim());
    setIsImportDialogOpen(true);
  }, []);

  const handleImport = React.useCallback(() => {
    const trimmed = examId.trim();
    if (!trimmed) {
      return;
    }
    actionManager.executeAction(actionImportExamQuestions, "ui", {
      examId: trimmed,
    });
    setIsImportDialogOpen(false);
  }, [actionManager, examId]);

  return (
    <>
      <MainMenu>
        <MainMenu.DefaultItems.LoadScene />
        <MainMenu.DefaultItems.SaveToActiveFile />
        <MainMenu.DefaultItems.Export />
        <MainMenu.DefaultItems.SaveAsImage />
        <MainMenu.DefaultItems.CommandPalette className="highlighted" />
        {actionManager.isActionEnabled(actionImportExamQuestions) && (
          <MainMenu.Item icon={LibraryIcon} onSelect={openImportDialog}>
            Import Exam Questions
          </MainMenu.Item>
        )}
        <MainMenu.DefaultItems.Help />
        <MainMenu.DefaultItems.ClearCanvas />
        {isDevEnv() && (
          <MainMenu.Item
            icon={eyeIcon}
            onClick={() => {
              if (window.visualDebug) {
                delete window.visualDebug;
                saveDebugState({ enabled: false });
              } else {
                window.visualDebug = { data: [] };
                saveDebugState({ enabled: true });
              }
              props?.refresh();
            }}
          >
            Visual Debug
          </MainMenu.Item>
        )}
        <MainMenu.Separator />
        <MainMenu.DefaultItems.ToggleTheme
          allowSystemTheme
          theme={props.theme}
          onSelect={props.setTheme}
        />
        <MainMenu.ItemCustom>
          <LanguageList style={{ width: "100%" }} />
        </MainMenu.ItemCustom>
        <MainMenu.DefaultItems.ChangeCanvasBackground />
      </MainMenu>
      {isImportDialogOpen && (
        <ExamImportDialog
          value={examId}
          onChange={setExamId}
          onInsert={handleImport}
          onClose={() => setIsImportDialogOpen(false)}
        />
      )}
    </>
  );
});
