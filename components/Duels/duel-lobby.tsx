"use client";

import { useState } from "react";
import {
  useCreateDuel,
  useCreateDuelFromUrl,
  useJoinDuel,
} from "@/hooks/use-duels";

type ProblemOption = { id: string; title: string };

const inputClass =
  "rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20";

export function DuelLobby({ problems }: { problems: ProblemOption[] }) {
  // With an empty catalogue the picker has nothing to show, so a URL is the
  // only way in — start there rather than on a dead end.
  const [mode, setMode] = useState<"existing" | "url">(
    problems.length > 0 ? "existing" : "url"
  );
  const [problemId, setProblemId] = useState(problems[0]?.id ?? "");
  const [url, setUrl] = useState("");
  const [code, setCode] = useState("");

  const create = useCreateDuel();
  const createFromUrl = useCreateDuelFromUrl();
  const join = useJoinDuel();

  const creating = create.isPending || createFromUrl.isPending;
  const createError = create.error ?? createFromUrl.error;

  const tabClass = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm ${
      active
        ? "bg-black/5 font-medium dark:bg-white/10"
        : "opacity-60 hover:opacity-100"
    }`;

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Start a duel</h2>

        <div className="flex gap-1">
          <button
            type="button"
            className={tabClass(mode === "existing")}
            onClick={() => setMode("existing")}
            disabled={problems.length === 0}
          >
            Your problems
          </button>
          <button
            type="button"
            className={tabClass(mode === "url")}
            onClick={() => setMode("url")}
          >
            Paste a URL
          </button>
        </div>

        {mode === "existing" ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={problemId}
              onChange={(event) => setProblemId(event.target.value)}
              className={`flex-1 ${inputClass}`}
            >
              {problems.map((problem) => (
                <option key={problem.id} value={problem.id}>
                  {problem.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={!problemId || creating}
              onClick={() => create.mutate(problemId)}
              className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create duel"}
            </button>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              createFromUrl.mutate(url);
            }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://leetcode.com/problems/two-sum/"
              aria-label="Problem URL to race on"
              className={`flex-1 ${inputClass}`}
            />
            <button
              type="submit"
              disabled={!url.trim() || creating}
              className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create duel"}
            </button>
          </form>
        )}

        {createError ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            {createError.message}
          </p>
        ) : null}

        {mode === "url" ? (
          <p className="text-xs opacity-60">
            The problem is added to your library too, so its attempts and times
            are tracked like any other.
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Join a duel</h2>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            join.mutate(code);
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="K7M2QP"
            maxLength={6}
            aria-label="Duel join code"
            className={`w-40 font-mono tracking-[0.2em] ${inputClass}`}
          />
          <button
            type="submit"
            disabled={code.length < 6 || join.isPending}
            className="w-fit rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
          >
            {join.isPending ? "Joining…" : "Join"}
          </button>
        </form>

        {join.isError ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            {join.error.message}
          </p>
        ) : null}
      </section>
    </div>
  );
}
