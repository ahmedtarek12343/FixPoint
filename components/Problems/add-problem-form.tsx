"use client";

import { useForm } from "@tanstack/react-form";
import { useAddProblem } from "@/hooks/use-problems";
import type { AddProblemInput } from "@/lib/actions/problems";

/** Validators can hand back strings or objects depending on the source. */
function errorText(error: unknown) {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

const inputClass =
  "rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20";

export function AddProblemForm() {
  const addProblem = useAddProblem();

  const form = useForm({
    defaultValues: {
      url: "",
      title: "",
      difficulty: "",
      tags: "",
    } as AddProblemInput,
    onSubmit: async ({ value }) => {
      await addProblem.mutateAsync(value);
      form.reset();
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
      className="flex flex-col gap-3"
    >
      <form.Field
        name="url"
        validators={{
          onChange: ({ value }) =>
            value.trim() ? undefined : "Paste a problem URL.",
        }}
      >
        {(field) => (
          <div className="flex flex-col gap-1">
            <input
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="https://leetcode.com/problems/two-sum/"
              className={inputClass}
            />
            {field.state.meta.isTouched && field.state.meta.errors.length > 0 ? (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errorText(field.state.meta.errors[0])}
              </p>
            ) : null}
          </div>
        )}
      </form.Field>

      <div className="flex flex-col gap-3 sm:flex-row">
        <form.Field name="title">
          {(field) => (
            <input
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="Title (optional — guessed from the URL)"
              className={`flex-1 ${inputClass}`}
            />
          )}
        </form.Field>

        <form.Field name="difficulty">
          {(field) => (
            <select
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              className={inputClass}
            >
              <option value="">Difficulty…</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          )}
        </form.Field>
      </div>

      <form.Field name="tags">
        {(field) => (
          <input
            name={field.name}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            placeholder="Topics, comma separated (dp, graphs, two pointers)"
            className={inputClass}
          />
        )}
      </form.Field>

      {addProblem.isError ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          {addProblem.error.message}
        </p>
      ) : null}

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            {isSubmitting ? "Adding…" : "Add problem"}
          </button>
        )}
      </form.Subscribe>
    </form>
  );
}
