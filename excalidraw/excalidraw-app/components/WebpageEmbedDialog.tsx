import { Dialog } from "@excalidraw/excalidraw/components/Dialog";
import { FilledButton } from "@excalidraw/excalidraw/components/FilledButton";
import { TextField } from "@excalidraw/excalidraw/components/TextField";
import React from "react";

import "./WebpageEmbedDialog.scss";

export type WebpageEmbedDialogProps = {
  value: string;
  onChange: (value: string) => void;
  onInsert: () => void;
  onClose: () => void;
};

export const WebpageEmbedDialog: React.FC<WebpageEmbedDialogProps> = React.memo(
  ({ value, onChange, onInsert, onClose }) => {
    return (
      <Dialog
        size="regular"
        className="WebpageEmbedDialog"
        title="Insert webpage preview"
        onCloseRequest={onClose}
      >
        <div className="WebpageEmbedDialog__body">
          <div className="WebpageEmbedDialog__header">
            <div>
              <h3 className="WebpageEmbedDialog__title">Webpage Notepad</h3>
              <p className="WebpageEmbedDialog__subtitle">
                Paste a URL to embed it on the whiteboard.
              </p>
            </div>
          </div>

          <div className="WebpageEmbedDialog__editor">
            <div className="WebpageEmbedDialog__editorHeader">
              <span className="WebpageEmbedDialog__dot WebpageEmbedDialog__dot--red" />
              <span className="WebpageEmbedDialog__dot WebpageEmbedDialog__dot--yellow" />
              <span className="WebpageEmbedDialog__dot WebpageEmbedDialog__dot--green" />
              <span className="WebpageEmbedDialog__filename">link.url</span>
            </div>
            <div className="WebpageEmbedDialog__input">
              <TextField
                label="Webpage URL"
                placeholder="https://www.example.com"
                value={value}
                onChange={onChange}
                fullWidth
              />
            </div>
          </div>

          <div className="WebpageEmbedDialog__actions">
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
