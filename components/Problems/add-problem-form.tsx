"use client";

import { useForm } from "@tanstack/react-form";
import { Plus } from "@phosphor-icons/react";
import { useAddProblem } from "@/hooks/use-problems";
import type { AddProblemInput } from "@/lib/actions/problems";
import { Button } from "@/components/ui/button";
import { Collapsible } from "@/components/ui/collapsible";
import { Field, inputStyles } from "@/components/ui/field";
import { ErrorNote } from "@/components/ui/feedback";

/** Validators can hand back strings or objects depending on the source. */
function errorText(error: unknown) {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

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
    // Collapsed by default. The form is five controls tall and you only use it
    // when adding something, so on every other visit it was pushing the list
    // you actually came for below the fold.
    <Collapsible
      id="add-problem"
      summary={
        <span className="flex flex-col gap-0.5">
          <span className="font-medium">Add a problem</span>
          <span className="text-sm text-muted">
            Paste a LeetCode or Codeforces link
          </span>
        </span>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
        className="flex flex-col gap-5 border-t border-border p-6 sm:p-7"
      >
        <form.Field
          name="url"
          validators={{
            onChange: ({ value }) =>
              value.trim() ? undefined : "Paste a problem URL.",
          }}
        >
          {(field) => {
            const error =
              field.state.meta.isTouched && field.state.meta.errors.length > 0
                ? errorText(field.state.meta.errors[0])
                : null;

            return (
              <Field
                label="Problem link"
                htmlFor="problem-url"
                hint="A LeetCode or Codeforces URL. Anything else is saved as a custom problem."
                error={error}
              >
                <input
                  id="problem-url"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="https://leetcode.com/problems/two-sum/"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "problem-url-error" : undefined}
                  className={inputStyles}
                />
              </Field>
            );
          }}
        </form.Field>

        {/* Everything below is optional: it is only there to override what the
            source platform already tells us. */}
        <div className="grid gap-5 sm:grid-cols-[1fr_10rem]">
          <form.Field name="title">
            {(field) => (
              <Field
                label="Title"
                htmlFor="problem-title"
                hint="Leave blank to use the real one."
              >
                <input
                  id="problem-title"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  className={inputStyles}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="difficulty">
            {(field) => (
              <Field
                label="Difficulty"
                htmlFor="problem-difficulty"
                hint="Usually fetched."
              >
                <select
                  id="problem-difficulty"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  className={inputStyles}
                >
                  <option value="">Fetch it</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </Field>
            )}
          </form.Field>
        </div>

        {/* No topics field. You have not read the problem yet, so you do not
            know whether it is a graph problem; asking here got shrugs and empty
            values. LeetCode and Codeforces supply topics on their own, and for
            anything else the app asks once, after the first attempt, when you
            actually know the answer. See components/Problems/tag-prompt.tsx. */}

        {addProblem.isError && (
          <ErrorNote>{addProblem.error.message}</ErrorNote>
        )}

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting] as const}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              className="w-fit"
              disabled={!canSubmit || isSubmitting}
            >
              <Plus size={16} weight="bold" />
              {isSubmitting ? "Adding" : "Add problem"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </Collapsible>
  );
}
