"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  CornersIn,
  CornersOut,
  PencilSimpleLine,
} from "@phosphor-icons/react";
import { buttonStyles } from "@/components/ui/button";
import { useSaveWhiteboard, useWhiteboard } from "@/hooks/use-whiteboard";
import { useCreateSnapshot } from "@/hooks/use-snapshots";
import type { WhiteboardScene } from "@/lib/actions/whiteboard";
import "@excalidraw/excalidraw/index.css";

// Excalidraw is a large, browser-only editor: `ssr: false` keeps it out of the
// server render, and the toggle below keeps it out of the bundle entirely
// until someone actually opens the board.
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
    loading: () => (
      <p className="p-4 text-sm text-muted">Loading whiteboard…</p>
    ),
  }
);

const AUTOSAVE_DELAY_MS = 1500;

/** Only the handful of methods we call — avoids importing Excalidraw's types
 *  just to hold a reference to its API. */
type ExcalidrawApi = {
  getSceneElements: () => readonly unknown[];
  getAppState: () => Record<string, unknown>;
  getFiles: () => Record<string, unknown>;
};

function WhiteboardEditor({
  problemId,
  fullscreen,
}: {
  problemId: string;
  fullscreen: boolean;
}) {
  const { data } = useWhiteboard(problemId);
  const save = useSaveWhiteboard(problemId);
  const snapshot = useCreateSnapshot(problemId);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dirty, setDirty] = useState(false);
  const [api, setApi] = useState<ExcalidrawApi | null>(null);

  const takeSnapshot = async () => {
    if (!api) return;

    // Imported here rather than at module scope so the exporter ships with the
    // editor chunk instead of the page bundle.
    const { exportToSvg } = await import("@excalidraw/excalidraw");

    const svgElement = await exportToSvg({
      elements: api.getSceneElements() as never,
      appState: { ...api.getAppState(), exportBackground: true } as never,
      files: api.getFiles() as never,
      exportPadding: 16,
    });

    snapshot.mutate({ svg: new XMLSerializer().serializeToString(svgElement) });
  };

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const handleChange = (
    elements: readonly unknown[],
    appState: { viewBackgroundColor?: string }
  ) => {
    setDirty(true);
    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(() => {
      // Only `elements` and one appState field are persisted. The full appState
      // holds non-serializable values (collaborators is a Map, plus transient
      // cursor and selection state) that would either fail to serialize or come
      // back as noise.
      const scene: WhiteboardScene = {
        elements: [...elements],
        appState: { viewBackgroundColor: appState.viewBackgroundColor },
      };

      save.mutate(scene, { onSuccess: () => setDirty(false) });
    }, AUTOSAVE_DELAY_MS);
  };

  const status = save.isPending
    ? "Saving…"
    : dirty
      ? "Unsaved changes"
      : data.updatedAt
        ? `Saved ${new Date(data.updatedAt).toLocaleTimeString()}`
        : "Nothing saved yet";

  return (
    // `flex-1` (flex-basis: 0) only belongs in fullscreen, where the parent has
    // a real height to distribute. In the docked panel the parent is an
    // auto-height column, so a basis-0 child collapses it to nothing and the
    // fixed-height box below overflows a zero-height parent — which is what was
    // squashing the page.
    <div
      className={
        fullscreen ? "flex min-h-0 flex-1 flex-col gap-2" : "flex flex-col gap-2"
      }
    >
      {/*
        Excalidraw fills its container, so the container needs a real height.
        Docked, it also gets a native drag handle via `resize-y` — no JS, and it
        works because `overflow` is not `visible`.
      */}
      <div
        className={
          fullscreen
            ? "min-h-0 flex-1 overflow-hidden"
            : "h-[32rem] min-h-[16rem] resize-y overflow-hidden rounded-panel border border-border"
        }
      >
        <Excalidraw
          excalidrawAPI={(instance: unknown) =>
            setApi(instance as ExcalidrawApi)
          }
          initialData={
            data.scene
              ? {
                  elements: data.scene.elements as never,
                  appState: data.scene.appState as never,
                  scrollToContent: true,
                }
              : undefined
          }
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
        <button
          type="button"
          disabled={!api || snapshot.isPending}
          onClick={takeSnapshot}
          className="rounded-control border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-surface disabled:opacity-50"
        >
          {snapshot.isPending ? "Saving snapshot…" : "Snapshot"}
        </button>

        <span>{status}</span>

        {save.isError ? (
          <span className="text-danger">
            {save.error.message}
          </span>
        ) : null}
        {snapshot.isError ? (
          <span className="text-danger">
            {snapshot.error.message}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/**
 * One state with three values instead of two booleans. `open` + `fullscreen`
 * allowed four combinations for three real states, and the invalid one
 * (fullscreen while closed) is exactly what made "Minimise" close the board
 * instead of dropping it back to docked.
 */
type Mode = "closed" | "docked" | "fullscreen";

export function WhiteboardPanel({
  problemId,
  title = "Whiteboard",
}: {
  problemId: string;
  title?: string;
}) {
  const [mode, setMode] = useState<Mode>("closed");

  const open = mode !== "closed";
  const fullscreen = mode === "fullscreen";

  // Escape leaves fullscreen. Excalidraw also uses Escape internally (to clear
  // a selection), so this only listens while fullscreen is actually on.
  useEffect(() => {
    if (!fullscreen) return;

    // Escape steps down to docked, the same as Minimise — never all the way
    // closed, which would throw away what you were looking at.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMode("docked");
    };

    document.addEventListener("keydown", onKeyDown);
    // Stop the page behind the overlay from scrolling under it.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [fullscreen]);

  const buttonClass = buttonStyles({ variant: "secondary", size: "sm" });

  return (
    <section
      // The scale in globals.css owns every layer in this app; nothing invents
      // its own z value.
      style={fullscreen ? { zIndex: "var(--z-overlay)" } : undefined}
      // Fullscreen is a class swap on the same element, NOT a portal or a
      // different branch of the tree: moving the editor would unmount it and
      // throw away the undo stack and current viewport.
      className={
        fullscreen
          ? "fixed inset-0 flex flex-col gap-3 bg-background p-4"
          : "flex flex-col gap-3"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>

        <div className="flex items-center gap-2">
          {mode === "closed" ? (
            <button
              type="button"
              onClick={() => setMode("docked")}
              className={buttonClass}
            >
              <PencilSimpleLine size={15} />
              Open whiteboard
            </button>
          ) : null}

          {mode === "docked" ? (
            <>
              <button
                type="button"
                onClick={() => setMode("fullscreen")}
                className={buttonClass}
              >
                <CornersOut size={15} />
                Fullscreen
              </button>
              <button
                type="button"
                onClick={() => setMode("closed")}
                className={buttonClass}
              >
                Close
              </button>
            </>
          ) : null}

          {mode === "fullscreen" ? (
            <>
              {/* Steps down to docked, not closed. */}
              <button
                type="button"
                onClick={() => setMode("docked")}
                className={buttonClass}
              >
                <CornersIn size={15} />
                Minimise (Esc)
              </button>
              <button
                type="button"
                onClick={() => setMode("closed")}
                className={buttonClass}
              >
                Close
              </button>
            </>
          ) : null}
        </div>
      </div>

      {open ? (
        // Its own boundary so loading the board never blanks the page around it.
        <Suspense
          fallback={<div className="skeleton h-72 rounded-panel" />}
        >
          <WhiteboardEditor problemId={problemId} fullscreen={fullscreen} />
        </Suspense>
      ) : (
        <p className="text-sm text-muted">
          Sketch the tree, the pointers, the state machine. It saves itself and
          is here next time. Drag the bottom edge to resize, or go fullscreen.
        </p>
      )}
    </section>
  );
}
