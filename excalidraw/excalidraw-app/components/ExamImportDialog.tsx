import { Dialog } from "@excalidraw/excalidraw/components/Dialog";
import { FilledButton } from "@excalidraw/excalidraw/components/FilledButton";
import { TextField } from "@excalidraw/excalidraw/components/TextField";
import React from "react";

import "./ExamImportDialog.scss";

export type ExamImportDialogProps = {
  value: string;
  onChange: (value: string) => void;
  onInsert: () => void;
  onClose: () => void;
};

export const ExamImportDialog: React.FC<ExamImportDialogProps> = React.memo(
  ({ value, onChange, onInsert, onClose }) => {
    return (
      <Dialog
        size="regular"
        className="ExamImportDialog"
        title="Import Exam Questions"
        onCloseRequest={onClose}
      >
        <div className="ExamImportDialog__body">
          <div className="ExamImportDialog__header">
            <div>
              <h3 className="ExamImportDialog__title">Exam Notepad</h3>
              <p className="ExamImportDialog__subtitle">
                Enter the Exam ID to load questions into the whiteboard.
              </p>
            </div>
          </div>

          <div className="ExamImportDialog__editor">
            <div className="ExamImportDialog__editorHeader">
              <span className="ExamImportDialog__dot ExamImportDialog__dot--red" />
              <span className="ExamImportDialog__dot ExamImportDialog__dot--yellow" />
              <span className="ExamImportDialog__dot ExamImportDialog__dot--green" />
              <span className="ExamImportDialog__filename">exam-id.txt</span>
            </div>
            <div className="ExamImportDialog__input">
              <TextField
                label="Exam ID"
                placeholder="e.g. 12345"
                value={value}
                onChange={onChange}
                fullWidth
              />
            </div>
          </div>

          <div className="ExamImportDialog__actions">
            <FilledButton
              label="Cancel"
              variant="outlined"
              color="muted"
              onClick={onClose}
            />
            <FilledButton
              label="Import"
              color="primary"
              size="large"
              onClick={onInsert}
              disabled={!value.trim()}
            />
          </div>
        </div>
      </Dialog>
    );
  },
);
