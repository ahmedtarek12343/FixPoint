"use client";

import { useState } from "react";
import { useDeleteSnapshot, useSnapshots } from "@/hooks/use-snapshots";

/**
 * Renders SVG through `<img src="data:...">` rather than inlining the markup.
 * An `<img>` never runs scripts inside an SVG, so even a hostile document saved
 * through the action is inert here. (The action rejects scripted SVG too — this
 * is the layer that doesn't depend on getting that filter exactly right.)
 */
function svgDataUrl(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function SnapshotGallery({ problemId }: { problemId: string }) {
  const { data: snapshots } = useSnapshots(problemId);
  const remove = useDeleteSnapshot(problemId);
  const [preview, setPreview] = useState<string | null>(null);

  if (snapshots.length === 0) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Snapshots</h2>
        <p className="text-sm text-muted">
          No snapshots yet — open the whiteboard, draw something, then hit
          Snapshot to keep a copy of it here.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">
        Snapshots{" "}
        <span className="text-sm font-normal text-muted">
          ({snapshots.length})
        </span>
      </h2>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {snapshots.map((snapshot) => (
          <li
            key={snapshot.id}
            className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3"
          >
            <button
              type="button"
              onClick={() => setPreview(snapshot.svg)}
              className="overflow-hidden rounded-lg border border-border bg-white"
              aria-label={`Enlarge snapshot from ${new Date(snapshot.createdAt).toLocaleString()}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a data: URL can't go through next/image */}
              <img
                src={svgDataUrl(snapshot.svg)}
                alt={snapshot.label ?? "Whiteboard snapshot"}
                className="h-40 w-full object-contain"
              />
            </button>

            <div className="flex items-center justify-between gap-2 text-xs text-muted">
              <span>
                {snapshot.label ??
                  new Date(snapshot.createdAt).toLocaleDateString()}
              </span>
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() => remove.mutate(snapshot.id)}
                className="underline underline-offset-4 hover:opacity-100"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {preview ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Snapshot preview"
          onClick={() => setPreview(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-8"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- data: URL */}
          <img
            src={svgDataUrl(preview)}
            alt="Whiteboard snapshot"
            className="max-h-full max-w-full rounded-lg bg-white"
          />
        </div>
      ) : null}
    </section>
  );
}
