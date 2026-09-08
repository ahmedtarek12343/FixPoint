"use client";

import { useState } from "react";
import { Sword, SignIn } from "@phosphor-icons/react";
import {
  useCreateDuel,
  useCreateDuelFromUrl,
  useJoinDuel,
} from "@/hooks/use-duels";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/surface";
import { Field, inputStyles } from "@/components/ui/field";
import { ErrorNote } from "@/components/ui/feedback";

type ProblemOption = { id: string; title: string };

export function DuelLobby({ problems }: { problems: ProblemOption[] }) {
  // With an empty catalogue the picker has nothing to show, so a URL is the
  // only way in: start there rather than on a dead end.
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
    `rounded-control px-3 py-1.5 text-sm transition-colors duration-200 ${
      active
        ? "bg-accent-wash font-medium text-accent"
        : "text-muted hover:bg-surface-sunken hover:text-foreground"
    }`;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <Panel className="flex flex-col gap-5 p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Host a duel</h2>

          <div
            role="tablist"
            aria-label="How to pick the problem"
            className="flex gap-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "existing"}
              className={tabClass(mode === "existing")}
              onClick={() => setMode("existing")}
              disabled={problems.length === 0}
            >
              From your library
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "url"}
              className={tabClass(mode === "url")}
              onClick={() => setMode("url")}
            >
              Paste a link
            </button>
          </div>
        </div>

        {mode === "existing" ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Field label="Problem" htmlFor="duel-problem" className="flex-1">
              <select
                id="duel-problem"
                value={problemId}
                onChange={(event) => setProblemId(event.target.value)}
                className={inputStyles}
              >
                {problems.map((problem) => (
                  <option key={problem.id} value={problem.id}>
                    {problem.title}
                  </option>
                ))}
              </select>
            </Field>

            <Button
              disabled={!problemId || creating}
              onClick={() => create.mutate(problemId)}
            >
              <Sword size={16} weight="bold" />
              {creating ? "Creating" : "Create duel"}
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              createFromUrl.mutate(url);
            }}
            className="flex flex-col gap-4 sm:flex-row sm:items-end"
          >
            <Field
              label="Problem link"
              htmlFor="duel-url"
              hint="It is added to your library too, so its times are tracked like any other."
              className="flex-1"
            >
              <input
                id="duel-url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://leetcode.com/problems/two-sum/"
                className={inputStyles}
              />
            </Field>

            <Button type="submit" disabled={!url.trim() || creating}>
              <Sword size={16} weight="bold" />
              {creating ? "Creating" : "Create duel"}
            </Button>
          </form>
        )}

        {createError && <ErrorNote>{createError.message}</ErrorNote>}
      </Panel>

      <Panel className="flex flex-col gap-5 p-6 sm:p-7">
        <h2 className="text-xl font-semibold">Join a duel</h2>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            join.mutate(code);
          }}
          className="flex flex-col gap-4"
        >
          <Field
            label="Join code"
            htmlFor="duel-code"
            hint="Six characters, from whoever is hosting."
          >
            <input
              id="duel-code"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="K7M2QP"
              maxLength={6}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              data-numeric
              className={`${inputStyles} w-44 text-center font-mono text-lg tracking-[0.3em]`}
            />
          </Field>

          <Button
            type="submit"
            variant="secondary"
            className="w-fit"
            disabled={code.length < 6 || join.isPending}
          >
            <SignIn size={16} weight="bold" />
            {join.isPending ? "Joining" : "Join"}
          </Button>
        </form>

        {join.isError && <ErrorNote>{join.error.message}</ErrorNote>}
      </Panel>
    </div>
  );
}
