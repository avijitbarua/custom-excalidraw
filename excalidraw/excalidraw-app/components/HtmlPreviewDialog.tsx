import { Dialog } from "@excalidraw/excalidraw/components/Dialog";
import { FilledButton } from "@excalidraw/excalidraw/components/FilledButton";
import React from "react";

import "./HtmlPreviewDialog.scss";

export type HtmlPreviewDialogProps = {
  value: string;
  onChange: (value: string) => void;
  onInsert: () => void;
  onClose: () => void;
};

export const HtmlPreviewDialog: React.FC<HtmlPreviewDialogProps> = React.memo(
  ({ value, onChange, onInsert, onClose }) => {
    return (
      <Dialog
        size="wide"
        className="HtmlPreviewDialog"
        title="Insert HTML preview"
        onCloseRequest={onClose}
      >
        <div className="HtmlPreviewDialog__body">
          <div className="HtmlPreviewDialog__header">
            <div>
              <h3 className="HtmlPreviewDialog__title">HTML Notepad</h3>
              <p className="HtmlPreviewDialog__subtitle">
                Paste full HTML or a snippet. Click Insert to render it on the
                whiteboard.
              </p>
            </div>
          </div>

          <div className="HtmlPreviewDialog__editor">
            <div className="HtmlPreviewDialog__editorHeader">
              <span className="HtmlPreviewDialog__dot HtmlPreviewDialog__dot--red" />
              <span className="HtmlPreviewDialog__dot HtmlPreviewDialog__dot--yellow" />
              <span className="HtmlPreviewDialog__dot HtmlPreviewDialog__dot--green" />
              <span className="HtmlPreviewDialog__filename">untitled.html</span>
            </div>
            <textarea
              className="HtmlPreviewDialog__textarea"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              spellCheck={false}
              placeholder="<!DOCTYPE html>"
            />
          </div>

          <div className="HtmlPreviewDialog__actions">
            <FilledButton
              label="Cancel"
              variant="outlined"
              color="muted"
              onClick={onClose}
            />
            <FilledButton
              label="Insert"
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
