"use client";

import { useForm } from "@tanstack/react-form";
import {
  useAddSolution,
  useDeleteSolution,
  useProblemSolutions,
} from "@/hooks/use-solutions";
import { LANGUAGES, MAX_SOLUTION_LENGTH } from "@/lib/constants";

export function SolutionsPanel({ problemId }: { problemId: string }) {
  const { data: solutions } = useProblemSolutions(problemId);
  const add = useAddSolution(problemId);
  const remove = useDeleteSolution();

  const form = useForm({
    defaultValues: { code: "", language: LANGUAGES[0] as string },
    onSubmit: async ({ value }) => {
      await add.mutateAsync(value);
      form.reset();
    },
  });

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Solutions</h2>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
        className="flex flex-col gap-2"
      >
        <form.Field
          name="code"
          validators={{
            onChange: ({ value }) =>
              value.trim() ? undefined : "Paste your solution first.",
          }}
        >
          {(field) => (
            <textarea
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              maxLength={MAX_SOLUTION_LENGTH}
              rows={8}
              spellCheck={false}
              placeholder="Paste the code that worked…"
              className="w-full rounded-md border border-black/15 px-3 py-2 font-mono text-sm dark:border-white/20"
            />
          )}
        </form.Field>

        <div className="flex flex-wrap items-center gap-3">
          <form.Field name="language">
            {(field) => (
              <select
                name={field.name}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                aria-label="Language"
                className="rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20"
              >
                {LANGUAGES.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            )}
          </form.Field>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting] as const}
          >
            {([canSubmit, isSubmitting]) => (
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
              >
                {isSubmitting ? "Saving…" : "Save solution"}
              </button>
            )}
          </form.Subscribe>

          {add.isError ? (
            <span className="text-sm text-red-600 dark:text-red-400">
              {add.error.message}
            </span>
          ) : null}
        </div>
      </form>

      {solutions.length === 0 ? (
        <p className="text-sm opacity-70">No solutions saved yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {solutions.map((solution) => (
            <li
              key={solution.id}
              className="flex flex-col gap-2 rounded-lg border border-black/10 p-4 dark:border-white/10"
            >
              <div className="flex items-center justify-between gap-3 text-xs opacity-60">
                <span>
                  <span className="rounded-full border border-black/10 px-2 py-0.5 dark:border-white/20">
                    {solution.language}
                  </span>
                  <span className="ml-2">
                    {new Date(solution.createdAt).toLocaleString()}
                  </span>
                </span>
                <button
                  type="button"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(solution.id)}
                  className="underline underline-offset-4 hover:opacity-100"
                >
                  Delete
                </button>
              </div>

              {/* overflow-x-auto so a long line scrolls inside the block
                  instead of stretching the page. */}
              <pre className="overflow-x-auto rounded-md bg-black/5 p-3 text-xs dark:bg-white/10">
                <code>{solution.code}</code>
              </pre>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
