"use client";

import { useForm } from "@tanstack/react-form";
import { FloppyDisk } from "@phosphor-icons/react";
import { useAddSolution, useProblemSolutions } from "@/hooks/use-solutions";
import { SolutionCard } from "@/components/Solutions/solution-card";
import { LANGUAGES, MAX_SOLUTION_LENGTH } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/surface";
import { Field, inputStyles } from "@/components/ui/field";
import { ErrorNote } from "@/components/ui/feedback";

export function SolutionsPanel({ problemId }: { problemId: string }) {
  const { data: solutions } = useProblemSolutions(problemId);
  const add = useAddSolution(problemId);

  const form = useForm({
    defaultValues: { code: "", language: LANGUAGES[0] as string },
    onSubmit: async ({ value }) => {
      await add.mutateAsync(value);
      form.reset();
    },
  });

  return (
    <Section title="Solutions">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <form.Field
          name="code"
          validators={{
            // onMount as well as onChange. A field that has only ever been
            // empty has never fired an onChange, so the form reported
            // canSubmit: true and the Save button was live over an empty
            // textarea until the first keystroke.
            onMount: ({ value }) =>
              value.trim() ? undefined : "Paste your solution first.",
            onChange: ({ value }) =>
              value.trim() ? undefined : "Paste your solution first.",
          }}
        >
          {(field) => (
            <Field label="Code" htmlFor="solution-code">
              <textarea
                id="solution-code"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                maxLength={MAX_SOLUTION_LENGTH}
                rows={8}
                spellCheck={false}
                placeholder="Paste the code that worked"
                className={`${inputStyles} font-mono`}
              />
            </Field>
          )}
        </form.Field>

        <div className="flex flex-wrap items-end gap-4">
          <form.Field name="language">
            {(field) => (
              <Field label="Language" htmlFor="solution-language" className="w-44">
                <select
                  id="solution-language"
                  name={field.name}
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  className={inputStyles}
                >
                  {LANGUAGES.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </form.Field>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting] as const}
          >
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                <FloppyDisk size={16} weight="bold" />
                {isSubmitting ? "Saving" : "Save solution"}
              </Button>
            )}
          </form.Subscribe>
        </div>

        {add.isError && <ErrorNote>{add.error.message}</ErrorNote>}
      </form>

      {solutions.length === 0 ? (
        <p className="text-sm text-muted">
          Nothing saved for this problem yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {solutions.map((solution) => (
            <li key={solution.id}>
              <SolutionCard solution={solution} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
