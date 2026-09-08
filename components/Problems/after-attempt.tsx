"use client";

import { useState } from "react";
import { Tag as TagIcon, PencilSimple, Sparkle } from "@phosphor-icons/react";
import {
  useEditProblemMeta,
  useRateProblem,
  useSetProblemTags,
} from "@/hooks/use-problems";
import { TagEditor } from "./tag-editor";
import { DifficultyPicker } from "./difficulty-picker";
import { Modal } from "@/components/ui/modal";
import { Field, inputStyles } from "@/components/ui/field";
import {
  MAX_PLATFORM_LABEL_LENGTH,
  MAX_TITLE_LENGTH,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { DifficultyMeter, Tag } from "@/components/ui/chip";
import type { AttemptDto } from "@/lib/actions/attempts";

/**
 * The two things the app can only learn from the user, asked at the one moment
 * they actually know the answer: just after they stop working on a problem.
 *
 *   Topics      - LeetCode and Codeforces publish these, so the question only
 *                 appears for problems from anywhere else, or when a fetch
 *                 failed. Asked whether the attempt was solved or given up.
 *   Difficulty  - how hard it felt to THEM, which no platform can know. Asked
 *                 only after a solve: after giving up the answer is "too hard"
 *                 and asking is just noise.
 *
 * Both are asked in a single dialog. Two modals firing back to back after one
 * button press is the kind of thing that trains people to dismiss dialogs
 * without reading them.
 */

const skipKey = (kind: "topics" | "difficulty", problemId: string) =>
  `leeeto:skip:${kind}:${problemId}`;

function wasSkipped(kind: "topics" | "difficulty", problemId: string) {
  try {
    return localStorage.getItem(skipKey(kind, problemId)) === "1";
  } catch {
    // Private modes throw on access rather than returning null. Not having
    // asked yet is the safe assumption.
    return false;
  }
}

export function useAfterAttemptPrompt({
  problemId,
  tagCount,
  hasRating,
  activeAttempt,
  lastStatus,
}: {
  problemId: string;
  tagCount: number;
  hasRating: boolean;
  activeAttempt: AttemptDto | null;
  /** Status of the most recent attempt, which is the one that just ended. */
  lastStatus: string | null;
}) {
  const [asking, setAsking] = useState<{
    topics: boolean;
    difficulty: boolean;
  } | null>(null);

  const running = activeAttempt !== null;
  // Previous value in state rather than a ref: reading a ref during render is
  // not allowed, and comparing a prop against a state copy of its last value is
  // the documented way to react to a change without an effect.
  const [wasRunning, setWasRunning] = useState(running);

  if (running !== wasRunning) {
    setWasRunning(running);

    // The edge that matters is running -> not running. Mounting onto a problem
    // with no attempt in flight is not an attempt ending.
    if (!running) {
      const topics = tagCount === 0 && !wasSkipped("topics", problemId);
      const difficulty =
        lastStatus === "SOLVED" &&
        !hasRating &&
        !wasSkipped("difficulty", problemId);

      if (topics || difficulty) setAsking({ topics, difficulty });
    }
  }

  return {
    asking,
    close: () => setAsking(null),
    /** Remembers the skip per question, so answering one later is still asked. */
    skip: () => {
      try {
        if (asking?.topics) localStorage.setItem(skipKey("topics", problemId), "1");
        if (asking?.difficulty) {
          localStorage.setItem(skipKey("difficulty", problemId), "1");
        }
      } catch {}
      setAsking(null);
    },
  };
}

export function AfterAttemptDialog({
  problemId,
  source,
  platformDifficulty,
  initialTags,
  initialDifficulty,
  initialTitle = "",
  platformTitle,
  initialPlatformLabel = null,
  askTopics,
  askDifficulty,
  askMeta = false,
  open,
  onClose,
  onSkip,
}: {
  problemId: string;
  source: string;
  /** The platform's rating, for the "they disagree" note. */
  platformDifficulty: string | null;
  initialTags: string[];
  initialDifficulty: string | null;
  initialTitle?: string;
  /** The platform's own title, shown when the user has renamed it. */
  platformTitle?: string;
  initialPlatformLabel?: string | null;
  askTopics: boolean;
  askDifficulty: boolean;
  /** Name and platform. Offered on the edit path, never in the post-attempt
   *  prompt: nobody wants to be asked to name a problem they just solved. */
  askMeta?: boolean;
  open: boolean;
  onClose: () => void;
  onSkip?: () => void;
}) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [difficulty, setDifficulty] = useState<string | null>(initialDifficulty);
  const [title, setTitle] = useState(initialTitle);
  const [platformLabel, setPlatformLabel] = useState(initialPlatformLabel ?? "");
  const [wasOpen, setWasOpen] = useState(open);

  const saveTags = useSetProblemTags(problemId);
  const rate = useRateProblem(problemId);
  const saveMeta = useEditProblemMeta(problemId);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setTags(initialTags);
      setDifficulty(initialDifficulty);
      setTitle(initialTitle);
      setPlatformLabel(initialPlatformLabel ?? "");
    }
  }

  const isCustom = source === "CUSTOM";
  const saving = saveTags.isPending || rate.isPending || saveMeta.isPending;
  const titleIsBlank = askMeta && !title.trim();

  const heading = askMeta
    ? "Edit this problem"
    : askTopics && askDifficulty
      ? "Two quick things"
      : askDifficulty
        ? "How hard was that?"
        : "What was this one about?";

  const save = async () => {
    // Sequential rather than parallel: Server Actions are queued per client
    // anyway, so firing them at once buys nothing and makes the failure case
    // harder to reason about. Each await also stops later writes running after
    // an earlier one has already failed.
    if (askMeta && title.trim()) {
      await saveMeta.mutateAsync({
        title: title.trim(),
        // Only sent for custom problems; the server ignores it otherwise.
        ...(isCustom ? { platformLabel: platformLabel.trim() || null } : {}),
      });
    }
    if (askDifficulty && difficulty) await rate.mutateAsync(difficulty);
    if (askTopics) await saveTags.mutateAsync(tags);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={heading}
      description={
        askDifficulty && !askTopics
          ? "Your answer, not the platform's. The gap between the two is the useful part."
          : undefined
      }
      footer={
        <>
          {onSkip && (
            <Button variant="ghost" onClick={onSkip} disabled={saving}>
              Not now
            </Button>
          )}
          <Button
            // A rating is required when the dialog exists to ask for one, but
            // not on the edit path, where renaming alone is a valid reason to
            // have opened it.
            disabled={
              saving || titleIsBlank || (askDifficulty && !askMeta && !difficulty)
            }
            onClick={save}
          >
            {saving ? "Saving" : "Save"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-7">
        {askMeta && (
          <section className="flex flex-col gap-4">
            <Field
              label="Name"
              htmlFor="problem-title"
              hint={
                isCustom
                  ? "Custom problems are named from their link, which is usually not what you would call it."
                  : "Your name for it. The platform keeps its own, and nobody else sees yours."
              }
              error={titleIsBlank ? "A problem needs a name." : null}
            >
              <input
                id="problem-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={MAX_TITLE_LENGTH}
                aria-invalid={titleIsBlank || undefined}
                className={inputStyles}
              />
            </Field>

            {/* Only worth showing once the two differ. */}
            {!isCustom && platformTitle && platformTitle !== title.trim() && (
              <p className="text-xs text-muted">
                {source.toLowerCase()} calls it{" "}
                <span className="font-medium">{platformTitle}</span>.
              </p>
            )}

            {isCustom && (
              <Field
                label="Platform"
                htmlFor="problem-platform"
                hint="Which site this came from, so you can filter by it later. Leave blank and it files under Other."
              >
                <input
                  id="problem-platform"
                  value={platformLabel}
                  onChange={(event) => setPlatformLabel(event.target.value)}
                  maxLength={MAX_PLATFORM_LABEL_LENGTH}
                  placeholder="HackerRank, AtCoder, CSES"
                  className={inputStyles}
                />
              </Field>
            )}
          </section>
        )}

        {askDifficulty && (
          <section className="flex flex-col gap-3">
            {askTopics && (
              <h3 className="text-sm font-medium">How hard was it for you?</h3>
            )}

            <DifficultyPicker
              value={difficulty}
              onChange={setDifficulty}
              disabled={saving}
            />

            {/* The platform's opinion, stated so nobody mistakes the question
                for "guess what LeetCode says". */}
            {platformDifficulty && !isCustom && (
              <p className="text-xs text-muted">
                {source.toLowerCase()} rates it{" "}
                <span className="font-medium">
                  {platformDifficulty.toLowerCase()}
                </span>
                . Yours is stored separately and does not change theirs.
              </p>
            )}

            {isCustom && (
              <p className="flex items-start gap-1.5 text-xs text-muted">
                <Sparkle size={13} className="mt-px shrink-0 text-accent" />
                <span>
                  Nothing rates custom problems, so your answer becomes this
                  problem&rsquo;s difficulty as well as your own.
                </span>
              </p>
            )}
          </section>
        )}

        {askTopics && (
          <section className="flex flex-col gap-3">
            {askDifficulty && (
              <h3 className="text-sm font-medium">
                What topics does it cover?
              </h3>
            )}
            <p className="text-xs text-muted">
              This problem came from a source that does not publish topics, so
              it is currently missing from your topic breakdown.
            </p>
            <TagEditor value={tags} onChange={setTags} id="problem-topics" />
          </section>
        )}
      </div>
    </Modal>
  );
}

/**
 * The metadata row on the problem header: topics, your rating, and the way back
 * in to change either of them long after the attempt is over.
 */
export function ProblemMetaRow({
  problemId,
  source,
  platformDifficulty,
  title,
  platformTitle,
  platformLabel,
  tags,
  yourDifficulty,
}: {
  problemId: string;
  source: string;
  platformDifficulty: string | null;
  title: string;
  platformTitle: string;
  platformLabel: string | null;
  tags: string[];
  yourDifficulty: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2.5">
      {yourDifficulty && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="text-muted">You rated it</span>
          <DifficultyMeter difficulty={yourDifficulty} />
          {/* Only worth saying when the two actually disagree. */}
          {platformDifficulty && platformDifficulty !== yourDifficulty && (
            <span className="text-xs text-muted">
              ({source.toLowerCase()} says {platformDifficulty.toLowerCase()})
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-chip border border-dashed border-border-strong px-2 py-0.5 text-xs text-muted transition-[color,border-color,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-px hover:border-accent hover:text-accent"
        >
          {tags.length === 0 && !yourDifficulty ? (
            <>
              <TagIcon size={12} />
              Name it, rate it, tag it
            </>
          ) : (
            <>
              <PencilSimple size={12} />
              Edit
            </>
          )}
        </button>
      </div>

      {/* Editing later always offers both, regardless of what was asked at the
          time, because this is the "put it in afterwards" path. */}
      <AfterAttemptDialog
        problemId={problemId}
        source={source}
        platformDifficulty={platformDifficulty}
        initialTags={tags}
        initialDifficulty={yourDifficulty}
        initialTitle={title}
        platformTitle={platformTitle}
        initialPlatformLabel={platformLabel}
        askTopics
        askDifficulty
        askMeta
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
