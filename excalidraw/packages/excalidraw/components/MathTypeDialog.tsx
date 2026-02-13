import { useEffect, useMemo, useRef, useState } from "react";

import { IMAGE_MIME_TYPES, randomId } from "@excalidraw/common";
import { newImageElement } from "@excalidraw/element";

import type { FileId } from "@excalidraw/element/types";
import type { BinaryFiles, DataURL } from "../types";

import { copyToClipboard } from "../clipboard";
import {
  renderLatexToSvgDataUrl,
  renderLatexToSvgMarkup,
} from "../utils/latexUtils";
import { useUIAppState } from "../context/ui-appState";

import { Dialog } from "./Dialog";
import { useApp } from "./App";

import "./MathTypeDialog.scss";

export const MathTypeDialog = () => {
  const uiAppState = useUIAppState();

  if (uiAppState.openDialog?.name !== "mathType") {
    return null;
  }

  return <MathTypeDialogBase />;
};

const MathTypeDialogBase = () => {
  const app = useApp();
  const initialValueRef = useRef("\\frac{a}{b}");
  const [latexInput, setLatexInput] = useState("\\frac{a}{b}");
  const [previewSvg, setPreviewSvg] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasEdited, setHasEdited] = useState(false);
  const renderIdRef = useRef(0);

  const canCopy = useMemo(
    () => Boolean(latexInput.trim()) && !isRendering,
    [latexInput, isRendering],
  );

  useEffect(() => {
    const value = latexInput.trim();
    if (!value) {
      setPreviewSvg(null);
      setError(null);
      return;
    }

    const currentRenderId = ++renderIdRef.current;
    setIsRendering(true);
    setError(null);

    const handle = window.setTimeout(async () => {
      try {
        const rendered = renderLatexToSvgMarkup(value);
        if (renderIdRef.current !== currentRenderId) {
          return;
        }
        if (!rendered) {
          setPreviewSvg(null);
          setError("Unable to render LaTeX. Check the syntax.");
        } else {
          setPreviewSvg(rendered);
        }
      } catch (err) {
        if (renderIdRef.current !== currentRenderId) {
          return;
        }
        setPreviewSvg(null);
        setError("Unable to render LaTeX. Check the syntax.");
      } finally {
        if (renderIdRef.current === currentRenderId) {
          setIsRendering(false);
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(handle);
    };
  }, [latexInput]);

  const resetDialogState = () => {
    setLatexInput(initialValueRef.current);
    setPreviewSvg(null);
    setError(null);
    setHasEdited(false);
  };

  const handleCloseRequest = (force = false) => {
    if (!force && hasEdited && latexInput.trim().length > 0) {
      const confirmClose = window.confirm(
        "You have an equation in progress. Discard it and close?",
      );
      if (!confirmClose) {
        return;
      }
    }

    resetDialogState();
    app.setOpenDialog(null);
  };

  const copyLatexToClipboard = async () => {
    const value = latexInput.trim();
    if (!value) {
      setError("Enter a LaTeX expression.");
      return;
    }

    setIsRendering(true);
    setError(null);

    try {
      const rendered = await renderLatexToSvgDataUrl(value);
      if (!rendered) {
        setError("Unable to render LaTeX. Check the syntax.");
        return;
      }

      const fileId = randomId() as FileId;
      const now = Date.now();
      const files: BinaryFiles = {
        [fileId]: {
          id: fileId,
          dataURL: rendered.dataUrl as DataURL,
          mimeType: IMAGE_MIME_TYPES.svg,
          created: now,
          lastRetrieved: now,
        },
      };

      const imageElement = newImageElement({
        type: "image",
        x: 0,
        y: 0,
        width: Math.max(1, rendered.width),
        height: Math.max(1, rendered.height),
        fileId,
        status: "saved",
      });

      await copyToClipboard([imageElement], files, null);

      handleCloseRequest(true);
    } catch (err) {
      setError("Unable to copy to clipboard.");
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <Dialog
      className="MathTypeDialog"
      onCloseRequest={() => handleCloseRequest()}
      size="small"
      title="MathType"
      autofocus={false}
    >
      <div className="MathTypeDialog__content">
        <label className="MathTypeDialog__label" htmlFor="mathTypeInput">
          LaTeX input
        </label>
        <textarea
          id="mathTypeInput"
          className="TextInput MathTypeDialog__input"
          rows={4}
          value={latexInput}
          onChange={(event) => {
            setLatexInput(event.target.value);
            setHasEdited(true);
          }}
          placeholder="e.g. \\frac{a}{b}"
        />

        <div className="MathTypeDialog__preview">
          {isRendering && (
            <div className="MathTypeDialog__hint">Rendering…</div>
          )}
          {!isRendering && previewSvg && (
            <div
              className="MathTypeDialog__svg"
              dangerouslySetInnerHTML={{ __html: previewSvg }}
            />
          )}
          {!isRendering && !previewSvg && (
            <div className="MathTypeDialog__hint">
              Preview will appear here.
            </div>
          )}
          {error && <div className="MathTypeDialog__error">{error}</div>}
        </div>

        <div className="MathTypeDialog__actions">
          <button
            type="button"
            className="MathTypeDialog__button"
            onClick={copyLatexToClipboard}
            disabled={!canCopy}
          >
            Copy SVG
          </button>
          <button
            type="button"
            className="MathTypeDialog__button MathTypeDialog__button--secondary"
            onClick={() => handleCloseRequest()}
          >
            Cancel
          </button>
        </div>
      </div>
    </Dialog>
  );
};
