import { Excalidraw, CaptureUpdateAction } from "@excalidraw/excalidraw";
import { trackEvent } from "@excalidraw/excalidraw/analytics";
import { getDefaultAppState } from "@excalidraw/excalidraw/appState";
import {
  CommandPalette,
  DEFAULT_CATEGORIES,
} from "@excalidraw/excalidraw/components/CommandPalette/CommandPalette";
import { ErrorDialog } from "@excalidraw/excalidraw/components/ErrorDialog";
import { OverwriteConfirmDialog } from "@excalidraw/excalidraw/components/OverwriteConfirm/OverwriteConfirm";
import { openConfirmModal } from "@excalidraw/excalidraw/components/OverwriteConfirm/OverwriteConfirmState";
import { ShareableLinkDialog } from "@excalidraw/excalidraw/components/ShareableLinkDialog";
import Trans from "@excalidraw/excalidraw/components/Trans";
import {
  APP_NAME,
  EVENT,
  THEME,
  VERSION_TIMEOUT,
  debounce,
  getVersion,
  getFrame,
  isTestEnv,
  preventUnload,
  resolvablePromise,
  isDevEnv,
} from "@excalidraw/common";
import polyfill from "@excalidraw/excalidraw/polyfill";
import { useCallback, useEffect, useRef, useState } from "react";
import { loadFromBlob } from "@excalidraw/excalidraw/data/blob";
import { useCallbackRefState } from "@excalidraw/excalidraw/hooks/useCallbackRefState";
import { t } from "@excalidraw/excalidraw/i18n";

import {
  isElementLink,
  newEmbeddableElement,
  newIframeElement,
} from "@excalidraw/element";
import {
  bumpElementVersions,
  restoreAppState,
  restoreElements,
} from "@excalidraw/excalidraw/data/restore";
import { newElementWith } from "@excalidraw/element";
import { isInitializedImageElement } from "@excalidraw/element";
import {
  parseLibraryTokensFromUrl,
  useHandleLibrary,
} from "@excalidraw/excalidraw/data/library";

import type { RestoredDataState } from "@excalidraw/excalidraw/data/restore";
import type {
  FileId,
  NonDeletedExcalidrawElement,
  OrderedExcalidrawElement,
} from "@excalidraw/element/types";
import type {
  AppState,
  ExcalidrawImperativeAPI,
  BinaryFiles,
  ExcalidrawInitialDataState,
  UIAppState,
  PointerDownState,
} from "@excalidraw/excalidraw/types";
import type { ResolutionType } from "@excalidraw/common/utility-types";
import type { ResolvablePromise } from "@excalidraw/common/utils";

import CustomStats from "./CustomStats";
import { Provider, useAtomValue, appJotaiStore } from "./app-jotai";
import {
  FIREBASE_STORAGE_PREFIXES,
  STORAGE_KEYS,
  SYNC_BROWSER_TABS_TIMEOUT,
} from "./app_constants";
import { AppFooter } from "./components/AppFooter";
import { AppMainMenu } from "./components/AppMainMenu";
import { AppWelcomeScreen } from "./components/AppWelcomeScreen";
import { HtmlPreviewDialog } from "./components/HtmlPreviewDialog";
import { WebpageEmbedDialog } from "./components/WebpageEmbedDialog";
import { TopErrorBoundary } from "./components/TopErrorBoundary";

import { exportToBackend, importFromBackend } from "./data";

import { updateStaleImageStatuses } from "./data/FileManager";
import { importFromLocalStorage } from "./data/localStorage";

import { loadFilesFromFirebase } from "./data/firebase";
import {
  LibraryIndexedDBAdapter,
  LibraryLocalStorageMigrationAdapter,
  LocalData,
  localStorageQuotaExceededAtom,
} from "./data/LocalData";
import { isBrowserStorageStateNewer } from "./data/tabSync";
import { useHandleAppTheme } from "./useHandleAppTheme";
import { getPreferredLanguage } from "./app-language/language-detector";
import { useAppLangCode } from "./app-language/language-state";
import DebugCanvas, {
  debugRenderer,
  isVisualDebuggerEnabled,
  loadSavedDebugState,
} from "./components/DebugCanvas";

import "./index.scss";

import { AppSidebar } from "./components/AppSidebar";

polyfill();

const HTML_PREVIEW_EXAMPLE = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Physics Quiz - Hydrogen Spectrum</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body {
      font-family: 'Hind Siliguri', sans-serif;
      background-color: #fdf2f8;
    }
    .math-text {
      font-family: 'Times New Roman', Times, serif;
    }
  </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4">

  <main class="w-full max-w-4xl bg-white rounded-[2.5rem] border-2 border-purple-200 shadow-xl overflow-hidden p-8 md:p-12">
    <section class="mb-10">
      <h1 class="text-xl md:text-2xl font-semibold text-gray-800 leading-relaxed mb-4">
        হাইড্রোজেনের পারমাণবিক বর্ণালির লাইমেন সিরিজে রেখা সৃষ্টিকারী চতুর্থ শক্তিস্তর থেকে আগত ইলেকট্রনের বিকিরিত শক্তির তরঙ্গ সংখ্যা কত হবে? 
        <span class="math-text block mt-2 text-purple-700 text-lg">
          [R<sub>H</sub> = 10.97 × 10<sup>6</sup> m<sup>-1</sup>]
        </span>
      </h1>
    </section>

    <section class="space-y-4 mb-8">
      <label class="group block cursor-pointer">
        <input type="radio" name="quiz" class="hidden peer">
        <div class="flex items-center p-4 rounded-xl border-2 border-purple-300 bg-white transition-all duration-200 peer-checked:bg-purple-50 peer-checked:border-purple-600 hover:border-purple-400 hover:shadow-md">
          <span class="text-purple-700 font-bold mr-3">১.</span>
          <span class="math-text text-lg text-gray-700">2.056655 × 10<sup>6</sup> m<sup>-1</sup></span>
        </div>
      </label>

      <label class="group block cursor-pointer">
        <input type="radio" name="quiz" class="hidden peer">
        <div class="flex items-center p-4 rounded-xl border-2 border-purple-300 bg-white transition-all duration-200 peer-checked:bg-purple-50 peer-checked:border-purple-600 hover:border-purple-400 hover:shadow-md">
          <span class="text-purple-700 font-bold mr-3">২.</span>
          <span class="math-text text-lg text-gray-700">10.284375 × 10<sup>-6</sup> m<sup>-1</sup></span>
        </div>
      </label>

      <label class="group block cursor-pointer" id="correct-option">
        <input type="radio" name="quiz" class="hidden peer">
        <div class="flex items-center p-4 rounded-xl border-2 border-purple-300 bg-white transition-all duration-200 peer-checked:bg-purple-50 peer-checked:border-purple-600 hover:border-purple-400 hover:shadow-md">
          <span class="text-purple-700 font-bold mr-3">৩.</span>
          <span class="math-text text-lg text-gray-700">10.284375 × 10<sup>6</sup> m<sup>-1</sup></span>
        </div>
      </label>

      <label class="group block cursor-pointer">
        <input type="radio" name="quiz" class="hidden peer">
        <div class="flex items-center p-4 rounded-xl border-2 border-purple-300 bg-white transition-all duration-200 peer-checked:bg-purple-50 peer-checked:border-purple-600 hover:border-purple-400 hover:shadow-md">
          <span class="text-purple-700 font-bold mr-3">৪.</span>
          <span class="math-text text-lg text-gray-700">10.284375 × 10<sup>5</sup> m<sup>-1</sup></span>
        </div>
      </label>
    </section>

    <section class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <button onclick="toggleAnswer()" class="px-8 py-2 rounded-xl border-2 border-red-400 bg-red-50 text-red-600 font-semibold text-lg hover:bg-red-100 transition-colors active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-300">
        Answer
      </button>
            
      <div id="answer-reveal" class="hidden animate-in fade-in slide-in-from-left-4 duration-300">
        <div class="flex items-center gap-2 text-green-600 font-bold text-lg px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
          <i data-lucide="check-circle-2" class="w-5 h-5"></i>
          সঠিক উত্তর: ৩
        </div>
      </div>
    </section>

    <div id="explanation" class="hidden mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200 text-gray-600 text-sm italic">
      <p>ব্যাখ্যা: লাইমেন সিরিজের জন্য n<sub>1</sub> = 1 এবং চতুর্থ শক্তিস্তর থেকে আগত ইলেকট্রনের জন্য n<sub>2</sub> = 4। তরঙ্গ সংখ্যা (ν̄) = R<sub>H</sub> (1/n<sub>1</sub>² - 1/n<sub>2</sub>²)</p>
    </div>

  </main>

  <script>
    lucide.createIcons();

    function toggleAnswer() {
      const revealDiv = document.getElementById('answer-reveal');
      const explanationDiv = document.getElementById('explanation');
            
      if (revealDiv.classList.contains('hidden')) {
        revealDiv.classList.remove('hidden');
        explanationDiv.classList.remove('hidden');
      } else {
        revealDiv.classList.add('hidden');
        explanationDiv.classList.add('hidden');
      }
    }
  </script>
</body>
</html>`;

window.EXCALIDRAW_THROTTLE_RENDER = true;

declare global {
  interface BeforeInstallPromptEventChoiceResult {
    outcome: "accepted" | "dismissed";
  }

  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<BeforeInstallPromptEventChoiceResult>;
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

let pwaEvent: BeforeInstallPromptEvent | null = null;

// Adding a listener outside of the component as it may (?) need to be
// subscribed early to catch the event.
//
// Also note that it will fire only if certain heuristics are met (user has
// used the app for some time, etc.)
window.addEventListener(
  "beforeinstallprompt",
  (event: BeforeInstallPromptEvent) => {
    // prevent Chrome <= 67 from automatically showing the prompt
    event.preventDefault();
    // cache for later use
    pwaEvent = event;
  },
);

let isSelfEmbedding = false;

if (window.self !== window.top) {
  try {
    const parentUrl = new URL(document.referrer);
    const currentUrl = new URL(window.location.href);
    if (parentUrl.origin === currentUrl.origin) {
      isSelfEmbedding = true;
    }
  } catch (error) {
    // ignore
  }
}

const shareableLinkConfirmDialog = {
  title: t("overwriteConfirm.modal.shareableLink.title"),
  description: (
    <Trans
      i18nKey="overwriteConfirm.modal.shareableLink.description"
      bold={(text) => <strong>{text}</strong>}
      br={() => <br />}
    />
  ),
  actionLabel: t("overwriteConfirm.modal.shareableLink.button"),
  color: "danger",
} as const;

const initializeScene = async (opts: {
  excalidrawAPI: ExcalidrawImperativeAPI;
}): Promise<
  { scene: ExcalidrawInitialDataState | null } & (
    | { isExternalScene: true; id: string; key: string }
    | { isExternalScene: false; id?: null; key?: null }
  )
> => {
  const searchParams = new URLSearchParams(window.location.search);
  const id = searchParams.get("id");
  const jsonBackendMatch = window.location.hash.match(
    /^#json=([a-zA-Z0-9_-]+),([a-zA-Z0-9_-]+)$/,
  );
  const externalUrlMatch = window.location.hash.match(/^#url=(.*)$/);

  const localDataState = importFromLocalStorage();

  let scene: Omit<
    RestoredDataState,
    // we're not storing files in the scene database/localStorage, and instead
    // fetch them async from a different store
    "files"
  > & {
    scrollToContent?: boolean;
  } = {
    elements: restoreElements(localDataState?.elements, null, {
      repairBindings: true,
      deleteInvisibleElements: true,
    }),
    appState: restoreAppState(localDataState?.appState, null),
  };

  const isExternalScene = !!(id || jsonBackendMatch);
  if (isExternalScene) {
    if (
      // don't prompt if scene is empty
      !scene.elements.length ||
      // otherwise, prompt whether user wants to override current scene
      (await openConfirmModal(shareableLinkConfirmDialog))
    ) {
      if (jsonBackendMatch) {
        const imported = await importFromBackend(
          jsonBackendMatch[1],
          jsonBackendMatch[2],
        );

        scene = {
          elements: bumpElementVersions(
            restoreElements(imported.elements, null, {
              repairBindings: true,
              deleteInvisibleElements: true,
            }),
            localDataState?.elements,
          ),
          appState: restoreAppState(
            imported.appState,
            // local appState when importing from backend to ensure we restore
            // localStorage user settings which we do not persist on server.
            localDataState?.appState,
          ),
        };
      }
      scene.scrollToContent = true;
      window.history.replaceState({}, APP_NAME, window.location.origin);
    } else {
      // https://github.com/excalidraw/excalidraw/issues/1919
      if (document.hidden) {
        return new Promise((resolve, reject) => {
          window.addEventListener(
            "focus",
            () => initializeScene(opts).then(resolve).catch(reject),
            {
              once: true,
            },
          );
        });
      }

      window.history.replaceState({}, APP_NAME, window.location.origin);
    }
  } else if (externalUrlMatch) {
    window.history.replaceState({}, APP_NAME, window.location.origin);

    const url = externalUrlMatch[1];
    try {
      const request = await fetch(window.decodeURIComponent(url));
      const data = await loadFromBlob(await request.blob(), null, null);
      if (
        !scene.elements.length ||
        (await openConfirmModal(shareableLinkConfirmDialog))
      ) {
        return { scene: data, isExternalScene };
      }
    } catch (error: any) {
      return {
        scene: {
          appState: {
            errorMessage: t("alerts.invalidSceneUrl"),
          },
        },
        isExternalScene,
      };
    }
  }

  if (scene) {
    return isExternalScene && jsonBackendMatch
      ? {
          scene,
          isExternalScene,
          id: jsonBackendMatch[1],
          key: jsonBackendMatch[2],
        }
      : { scene, isExternalScene: false };
  }
  return { scene: null, isExternalScene: false };
};

const ExcalidrawWrapper = () => {
  const [errorMessage, setErrorMessage] = useState("");

  const { editorTheme, appTheme, setAppTheme } = useHandleAppTheme();

  const [langCode, setLangCode] = useAppLangCode();

  // initial state
  // ---------------------------------------------------------------------------

  const initialStatePromiseRef = useRef<{
    promise: ResolvablePromise<ExcalidrawInitialDataState | null>;
  }>({ promise: null! });
  if (!initialStatePromiseRef.current.promise) {
    initialStatePromiseRef.current.promise =
      resolvablePromise<ExcalidrawInitialDataState | null>();
  }

  const debugCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    trackEvent("load", "frame", getFrame());
    // Delayed so that the app has a time to load the latest SW
    setTimeout(() => {
      trackEvent("load", "version", getVersion());
    }, VERSION_TIMEOUT);
  }, []);

  const [excalidrawAPI, excalidrawRefCallback] =
    useCallbackRefState<ExcalidrawImperativeAPI>();

  useHandleLibrary({
    excalidrawAPI,
    adapter: LibraryIndexedDBAdapter,
    // TODO maybe remove this in several months (shipped: 24-03-11)
    migrationAdapter: LibraryLocalStorageMigrationAdapter,
  });

  const [, forceRefresh] = useState(false);

  useEffect(() => {
    if (isDevEnv()) {
      const debugState = loadSavedDebugState();

      if (debugState.enabled && !window.visualDebug) {
        window.visualDebug = {
          data: [],
        };
      } else {
        delete window.visualDebug;
      }
      forceRefresh((prev) => !prev);
    }
  }, [excalidrawAPI]);

  useEffect(() => {
    if (!excalidrawAPI) {
      return;
    }

    const loadImages = (
      data: ResolutionType<typeof initializeScene>,
      isInitialLoad = false,
    ) => {
      if (!data.scene) {
        return;
      }
      const fileIds =
        data.scene.elements?.reduce((acc, element) => {
          if (isInitializedImageElement(element)) {
            return acc.concat(element.fileId);
          }
          return acc;
        }, [] as FileId[]) || [];

      if (data.isExternalScene) {
        loadFilesFromFirebase(
          `${FIREBASE_STORAGE_PREFIXES.shareLinkFiles}/${data.id}`,
          data.key,
          fileIds,
        ).then(({ loadedFiles, erroredFiles }) => {
          excalidrawAPI.addFiles(loadedFiles);
          updateStaleImageStatuses({
            excalidrawAPI,
            erroredFiles,
            elements: excalidrawAPI.getSceneElementsIncludingDeleted(),
          });
        });
      } else if (isInitialLoad) {
        if (fileIds.length) {
          LocalData.fileStorage
            .getFiles(fileIds)
            .then(({ loadedFiles, erroredFiles }) => {
              if (loadedFiles.length) {
                excalidrawAPI.addFiles(loadedFiles);
              }
              updateStaleImageStatuses({
                excalidrawAPI,
                erroredFiles,
                elements: excalidrawAPI.getSceneElementsIncludingDeleted(),
              });
            });
        }
        // on fresh load, clear unused files from IDB (from previous
        // session)
        LocalData.fileStorage.clearObsoleteFiles({ currentFileIds: fileIds });
      }
    };

    initializeScene({ excalidrawAPI }).then(async (data) => {
      loadImages(data, /* isInitialLoad */ true);
      initialStatePromiseRef.current.promise.resolve(data.scene);
    });

    const onHashChange = async (event: HashChangeEvent) => {
      event.preventDefault();
      const libraryUrlTokens = parseLibraryTokensFromUrl();
      if (!libraryUrlTokens) {
        excalidrawAPI.updateScene({ appState: { isLoading: true } });

        initializeScene({ excalidrawAPI }).then((data) => {
          loadImages(data);
          if (data.scene) {
            excalidrawAPI.updateScene({
              elements: restoreElements(data.scene.elements, null, {
                repairBindings: true,
              }),
              appState: restoreAppState(data.scene.appState, null),
              captureUpdate: CaptureUpdateAction.IMMEDIATELY,
            });
          }
        });
      }
    };

    const syncData = debounce(() => {
      if (isTestEnv()) {
        return;
      }
      if (!document.hidden) {
        // don't sync if local state is newer or identical to browser state
        if (isBrowserStorageStateNewer(STORAGE_KEYS.VERSION_DATA_STATE)) {
          const localDataState = importFromLocalStorage();
          setLangCode(getPreferredLanguage());
          excalidrawAPI.updateScene({
            ...localDataState,
            captureUpdate: CaptureUpdateAction.NEVER,
          });
          LibraryIndexedDBAdapter.load().then((data) => {
            if (data) {
              excalidrawAPI.updateLibrary({
                libraryItems: data.libraryItems,
              });
            }
          });
        }

        if (isBrowserStorageStateNewer(STORAGE_KEYS.VERSION_FILES)) {
          const elements = excalidrawAPI.getSceneElementsIncludingDeleted();
          const currFiles = excalidrawAPI.getFiles();
          const fileIds =
            elements?.reduce((acc, element) => {
              if (
                isInitializedImageElement(element) &&
                // only load and update images that aren't already loaded
                !currFiles[element.fileId]
              ) {
                return acc.concat(element.fileId);
              }
              return acc;
            }, [] as FileId[]) || [];
          if (fileIds.length) {
            LocalData.fileStorage
              .getFiles(fileIds)
              .then(({ loadedFiles, erroredFiles }) => {
                if (loadedFiles.length) {
                  excalidrawAPI.addFiles(loadedFiles);
                }
                updateStaleImageStatuses({
                  excalidrawAPI,
                  erroredFiles,
                  elements: excalidrawAPI.getSceneElementsIncludingDeleted(),
                });
              });
          }
        }
      }
    }, SYNC_BROWSER_TABS_TIMEOUT);

    const onUnload = () => {
      LocalData.flushSave();
    };

    const visibilityChange = (event: FocusEvent | Event) => {
      if (event.type === EVENT.BLUR || document.hidden) {
        LocalData.flushSave();
      }
      if (
        event.type === EVENT.VISIBILITY_CHANGE ||
        event.type === EVENT.FOCUS
      ) {
        syncData();
      }
    };

    window.addEventListener(EVENT.HASHCHANGE, onHashChange, false);
    window.addEventListener(EVENT.UNLOAD, onUnload, false);
    window.addEventListener(EVENT.BLUR, visibilityChange, false);
    document.addEventListener(EVENT.VISIBILITY_CHANGE, visibilityChange, false);
    window.addEventListener(EVENT.FOCUS, visibilityChange, false);
    return () => {
      window.removeEventListener(EVENT.HASHCHANGE, onHashChange, false);
      window.removeEventListener(EVENT.UNLOAD, onUnload, false);
      window.removeEventListener(EVENT.BLUR, visibilityChange, false);
      window.removeEventListener(EVENT.FOCUS, visibilityChange, false);
      document.removeEventListener(
        EVENT.VISIBILITY_CHANGE,
        visibilityChange,
        false,
      );
    };
  }, [excalidrawAPI, setLangCode]);

  useEffect(() => {
    const unloadHandler = (event: BeforeUnloadEvent) => {
      LocalData.flushSave();

      if (
        excalidrawAPI &&
        LocalData.fileStorage.shouldPreventUnload(
          excalidrawAPI.getSceneElements(),
        )
      ) {
        if (import.meta.env.VITE_APP_DISABLE_PREVENT_UNLOAD !== "true") {
          preventUnload(event);
        } else {
          console.warn(
            "preventing unload disabled (VITE_APP_DISABLE_PREVENT_UNLOAD)",
          );
        }
      }
    };
    window.addEventListener(EVENT.BEFORE_UNLOAD, unloadHandler);
    return () => {
      window.removeEventListener(EVENT.BEFORE_UNLOAD, unloadHandler);
    };
  }, [excalidrawAPI]);

  const onChange = (
    elements: readonly OrderedExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles,
  ) => {
    // this check is redundant, but since this is a hot path, it's best
    // not to evaludate the nested expression every time
    if (!LocalData.isSavePaused()) {
      LocalData.save(elements, appState, files, () => {
        if (excalidrawAPI) {
          let didChange = false;

          const elements = excalidrawAPI
            .getSceneElementsIncludingDeleted()
            .map((element) => {
              if (
                LocalData.fileStorage.shouldUpdateImageElementStatus(element)
              ) {
                const newElement = newElementWith(element, { status: "saved" });
                if (newElement !== element) {
                  didChange = true;
                }
                return newElement;
              }
              return element;
            });

          if (didChange) {
            excalidrawAPI.updateScene({
              elements,
              captureUpdate: CaptureUpdateAction.NEVER,
            });
          }
        }
      });
    }

    // Render the debug scene if the debug canvas is available
    if (debugCanvasRef.current && excalidrawAPI) {
      debugRenderer(
        debugCanvasRef.current,
        appState,
        elements,
        window.devicePixelRatio,
      );
    }
  };

  const handleQuizOptionPointerUp = useCallback(
    (
      _activeTool: AppState["activeTool"],
      pointerDownState: PointerDownState,
    ) => {
      if (!excalidrawAPI || pointerDownState.drag.hasOccurred) {
        return;
      }

      const hitElement = pointerDownState.hit.element;
      const sceneElements = excalidrawAPI.getSceneElements();

      const quizOption = hitElement?.customData?.quizOption as
        | {
            optionElementId?: string;
            isCorrect?: boolean;
          }
        | undefined;

      if (quizOption?.optionElementId) {
        const nextElements = sceneElements.map((element) => {
          if (element.id !== quizOption.optionElementId) {
            return element;
          }

          return newElementWith(element, {
            backgroundColor: quizOption.isCorrect ? "#2ecc71" : "#e74c3c",
            fillStyle: "solid",
          });
        });

        excalidrawAPI.updateScene({
          elements: nextElements,
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
        return;
      }

      const answerButton = hitElement?.customData?.answerButton as
        | { explanationElementIds?: string[] }
        | undefined;

      if (!answerButton?.explanationElementIds?.length) {
        return;
      }

      const explanationElements = answerButton.explanationElementIds
        .map((explanationId) =>
          sceneElements.find((element) => element.id === explanationId),
        )
        .filter((element): element is OrderedExcalidrawElement => !!element);

      if (!explanationElements.length) {
        return;
      }

      const shouldShow = explanationElements.some(
        (element) => element.opacity === 0,
      );

      explanationElements.forEach((explanationElement) => {
        excalidrawAPI.mutateElement(explanationElement, {
          opacity: shouldShow ? 100 : 0,
        });
      });
    },
    [excalidrawAPI],
  );

  const [latestShareableLink, setLatestShareableLink] = useState<string | null>(
    null,
  );
  const [isHtmlPreviewDialogOpen, setIsHtmlPreviewDialogOpen] = useState(false);
  const [htmlPreviewValue, setHtmlPreviewValue] =
    useState(HTML_PREVIEW_EXAMPLE);
  const [isWebpageEmbedDialogOpen, setIsWebpageEmbedDialogOpen] =
    useState(false);
  const [webpageEmbedUrl, setWebpageEmbedUrl] = useState(
    "https://www.bdpreparationhub.com/notes/3e410c4b47e5f71b84",
  );

  const insertHtmlPreview = useCallback(
    (html: string) => {
      if (!excalidrawAPI || !html.trim()) {
        return;
      }

      const appState = excalidrawAPI.getAppState();
      const width = 900;
      const height = 700;
      const x = appState.scrollX + appState.width / 2 - width / 2;
      const y = appState.scrollY + appState.height / 2 - height / 2;

      const element = newIframeElement({
        type: "iframe",
        x,
        y,
        width,
        height,
        strokeColor: "transparent",
        backgroundColor: "transparent",
        fillStyle: appState.currentItemFillStyle,
        strokeWidth: appState.currentItemStrokeWidth,
        strokeStyle: appState.currentItemStrokeStyle,
        roughness: appState.currentItemRoughness,
        roundness: null,
        opacity: appState.currentItemOpacity,
        locked: false,
        customData: {
          generationData: {
            status: "done",
            html,
          },
        },
      });

      excalidrawAPI.updateScene({
        elements: [...excalidrawAPI.getSceneElements(), element],
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });

      requestAnimationFrame(() => {
        excalidrawAPI.scrollToContent(element, { animate: true });
      });
    },
    [excalidrawAPI],
  );

  const openHtmlPreviewDialog = useCallback(() => {
    setHtmlPreviewValue((prev) => (prev.trim() ? prev : HTML_PREVIEW_EXAMPLE));
    setIsHtmlPreviewDialogOpen(true);
  }, []);

  const handleInsertHtmlPreview = useCallback(() => {
    insertHtmlPreview(htmlPreviewValue);
    setIsHtmlPreviewDialogOpen(false);
  }, [insertHtmlPreview, htmlPreviewValue]);

  const insertWebpageEmbed = useCallback(
    (url: string) => {
      if (!excalidrawAPI || !url.trim()) {
        return;
      }

      const appState = excalidrawAPI.getAppState();
      const width = 900;
      const height = 700;
      const x = appState.scrollX + appState.width / 2 - width / 2;
      const y = appState.scrollY + appState.height / 2 - height / 2;

      const element = newEmbeddableElement({
        type: "embeddable",
        x,
        y,
        width,
        height,
        strokeColor: "transparent",
        backgroundColor: "transparent",
        fillStyle: appState.currentItemFillStyle,
        strokeWidth: appState.currentItemStrokeWidth,
        strokeStyle: appState.currentItemStrokeStyle,
        roughness: appState.currentItemRoughness,
        roundness: null,
        opacity: appState.currentItemOpacity,
        locked: false,
        link: url.trim(),
      });

      excalidrawAPI.updateScene({
        elements: [...excalidrawAPI.getSceneElements(), element],
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });

      requestAnimationFrame(() => {
        excalidrawAPI.scrollToContent(element, { animate: true });
      });
    },
    [excalidrawAPI],
  );

  const openWebpageEmbedDialog = useCallback(() => {
    setWebpageEmbedUrl((prev) => prev.trim() || "https://");
    setIsWebpageEmbedDialogOpen(true);
  }, []);

  const handleInsertWebpageEmbed = useCallback(() => {
    insertWebpageEmbed(webpageEmbedUrl);
    setIsWebpageEmbedDialogOpen(false);
  }, [insertWebpageEmbed, webpageEmbedUrl]);

  const onExportToBackend = async (
    exportedElements: readonly NonDeletedExcalidrawElement[],
    appState: Partial<AppState>,
    files: BinaryFiles,
  ) => {
    if (exportedElements.length === 0) {
      throw new Error(t("alerts.cannotExportEmptyCanvas"));
    }
    try {
      const { url, errorMessage } = await exportToBackend(
        exportedElements,
        {
          ...appState,
          viewBackgroundColor: appState.exportBackground
            ? appState.viewBackgroundColor
            : getDefaultAppState().viewBackgroundColor,
        },
        files,
      );

      if (errorMessage) {
        throw new Error(errorMessage);
      }

      if (url) {
        setLatestShareableLink(url);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        const { width, height } = appState;
        console.error(error, {
          width,
          height,
          devicePixelRatio: window.devicePixelRatio,
        });
        throw new Error(error.message);
      }
    }
  };

  const renderCustomStats = (
    elements: readonly NonDeletedExcalidrawElement[],
    appState: UIAppState,
  ) => {
    return (
      <CustomStats
        setToast={(message) => excalidrawAPI!.setToast({ message })}
        appState={appState}
        elements={elements}
      />
    );
  };

  const localStorageQuotaExceeded = useAtomValue(localStorageQuotaExceededAtom);

  // browsers generally prevent infinite self-embedding, there are
  // cases where it still happens, and while we disallow self-embedding
  // by not whitelisting our own origin, this serves as an additional guard
  if (isSelfEmbedding) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          height: "100%",
        }}
      >
        <h1>I'm not a pretzel!</h1>
      </div>
    );
  }

  return (
    <div style={{ height: "100%" }} className="excalidraw-app">
      <Excalidraw
        excalidrawAPI={excalidrawRefCallback}
        onChange={onChange}
        initialData={initialStatePromiseRef.current.promise}
        onPointerUp={handleQuizOptionPointerUp}
        UIOptions={{
          canvasActions: {
            toggleTheme: true,
            export: {
              onExportToBackend,
            },
          },
        }}
        langCode={langCode}
        renderCustomStats={renderCustomStats}
        detectScroll={false}
        handleKeyboardGlobally={true}
        autoFocus={true}
        theme={editorTheme}
        renderTopRightUI={(isMobile) => {
          return null;
        }}
        onLinkOpen={(element, event) => {
          if (element.link && isElementLink(element.link)) {
            event.preventDefault();
            excalidrawAPI?.scrollToContent(element.link, { animate: true });
          }
        }}
      >
        <AppMainMenu
          theme={appTheme}
          setTheme={(theme) => setAppTheme(theme)}
          refresh={() => forceRefresh((prev) => !prev)}
        />
        <AppWelcomeScreen />
        <OverwriteConfirmDialog>
          <OverwriteConfirmDialog.Actions.ExportToImage />
          <OverwriteConfirmDialog.Actions.SaveToDisk />
        </OverwriteConfirmDialog>
        <AppFooter onChange={() => excalidrawAPI?.refresh()} />
        {localStorageQuotaExceeded && (
          <div className="alert alert--danger">
            {t("alerts.localStorageQuotaExceeded")}
          </div>
        )}
        {latestShareableLink && (
          <ShareableLinkDialog
            link={latestShareableLink}
            onCloseRequest={() => setLatestShareableLink(null)}
            setErrorMessage={setErrorMessage}
          />
        )}
        <AppSidebar />

        {errorMessage && (
          <ErrorDialog onClose={() => setErrorMessage("")}>
            {errorMessage}
          </ErrorDialog>
        )}

        {isHtmlPreviewDialogOpen && (
          <HtmlPreviewDialog
            value={htmlPreviewValue}
            onChange={setHtmlPreviewValue}
            onInsert={handleInsertHtmlPreview}
            onClose={() => setIsHtmlPreviewDialogOpen(false)}
          />
        )}

        {isWebpageEmbedDialogOpen && (
          <WebpageEmbedDialog
            value={webpageEmbedUrl}
            onChange={setWebpageEmbedUrl}
            onInsert={handleInsertWebpageEmbed}
            onClose={() => setIsWebpageEmbedDialogOpen(false)}
          />
        )}

        <CommandPalette
          customCommandPaletteItems={[
            {
              label: "Insert HTML preview",
              category: DEFAULT_CATEGORIES.app,
              keywords: ["html", "preview", "iframe", "wireframe", "code"],
              perform: () => {
                openHtmlPreviewDialog();
              },
            },
            {
              label: "Insert webpage preview",
              category: DEFAULT_CATEGORIES.app,
              keywords: ["url", "web", "embed", "iframe", "page"],
              perform: () => {
                openWebpageEmbedDialog();
              },
            },
            {
              ...CommandPalette.defaultItems.toggleTheme,
              perform: () => {
                setAppTheme(
                  editorTheme === THEME.DARK ? THEME.LIGHT : THEME.DARK,
                );
              },
            },
            {
              label: t("labels.installPWA"),
              category: DEFAULT_CATEGORIES.app,
              predicate: () => !!pwaEvent,
              perform: () => {
                if (pwaEvent) {
                  pwaEvent.prompt();
                  pwaEvent.userChoice.then(() => {
                    // event cannot be reused, but we'll hopefully
                    // grab new one as the event should be fired again
                    pwaEvent = null;
                  });
                }
              },
            },
          ]}
        />
        {isVisualDebuggerEnabled() && excalidrawAPI && (
          <DebugCanvas
            appState={excalidrawAPI.getAppState()}
            scale={window.devicePixelRatio}
            ref={debugCanvasRef}
          />
        )}
      </Excalidraw>
    </div>
  );
};

const ExcalidrawApp = () => {
  return (
    <TopErrorBoundary>
      <Provider store={appJotaiStore}>
        <ExcalidrawWrapper />
      </Provider>
    </TopErrorBoundary>
  );
};

export default ExcalidrawApp;
