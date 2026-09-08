"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MagnifyingGlass, X, FunnelSimple } from "@phosphor-icons/react";
import { useProblemFilterOptions } from "@/hooks/use-problems";
import { inputStyles } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { ProblemFilters } from "@/lib/actions/problems";

gsap.registerPlugin(useGSAP);

const SELECTS = [
  {
    key: "difficulty" as const,
    label: "Any difficulty",
    options: [
      ["EASY", "Easy"],
      ["MEDIUM", "Medium"],
      ["HARD", "Hard"],
    ],
  },
  {
    key: "status" as const,
    label: "Any progress",
    options: [
      ["solved", "Solved"],
      ["attempted", "Tried, not solved"],
      ["untouched", "Never attempted"],
    ],
  },
  {
    key: "duration" as const,
    label: "Any best time",
    options: [
      ["under5", "Under 5 min"],
      ["5to15", "5 to 15 min"],
      ["15to30", "15 to 30 min"],
      ["over30", "Over 30 min"],
    ],
  },
  {
    key: "since" as const,
    label: "Any time",
    options: [
      ["7", "Last 7 days"],
      ["30", "Last 30 days"],
      ["90", "Last 90 days"],
    ],
  },
  {
    key: "sort" as const,
    label: "Newest first",
    options: [
      ["oldest", "Oldest first"],
      ["title", "Name, A to Z"],
      ["fastest", "Fastest first"],
      ["slowest", "Slowest first"],
      ["attempts", "Most attempts"],
    ],
  },
];

/**
 * Search plus the filter row.
 *
 * The search box is debounced rather than filtering per keystroke: every change
 * is a new query key, so an undebounced field would fire a server round trip
 * per letter and thrash the cache with entries nobody will look at again.
 *
 * The rest of the controls are plain selects and apply immediately, because
 * each one is a single choice and an Apply button between the choice and the
 * result would just be a second click.
 */
export function ProblemFilterBar({
  filters,
  onChange,
}: {
  filters: ProblemFilters;
  onChange: (filters: ProblemFilters) => void;
}) {
  const { data: options } = useProblemFilterOptions();
  const [search, setSearch] = useState(filters.search ?? "");
  const [showFilters, setShowFilters] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);

  // Debounce the text field only. 300ms is long enough to swallow a burst of
  // typing and short enough that the list feels like it is keeping up.
  useEffect(() => {
    if (search === (filters.search ?? "")) return;

    const timer = setTimeout(
      () => onChange({ ...filters, search: search || undefined }),
      300
    );
    return () => clearTimeout(timer);
  }, [search, filters, onChange]);

  useGSAP(
    () => {
      const element = panel.current;
      if (!element || !showFilters) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.from(element.children, {
        opacity: 0,
        y: -6,
        duration: 0.3,
        ease: "power2.out",
        stagger: 0.03,
      });
    },
    { dependencies: [showFilters], scope: root }
  );

  const set = (key: keyof ProblemFilters, value: string) =>
    onChange({ ...filters, [key]: value || undefined });

  // `search` is excluded: it has its own visible box, so counting it here would
  // put a badge on the Filters button for something already on screen.
  const activeCount = (
    [
      "platform",
      "tag",
      "difficulty",
      "status",
      "duration",
      "since",
      "sort",
    ] as const
  ).filter((key) => filters[key]).length;

  const clear = () => {
    setSearch("");
    onChange({});
  };

  const selectClass = `${inputStyles} w-auto min-w-0 py-1.5 text-sm`;

  return (
    <div ref={root} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <MagnifyingGlass
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search your problems"
            aria-label="Search problems by name"
            className={`${inputStyles} pl-9`}
          />
        </div>

        <Button
          variant={showFilters ? "primary" : "secondary"}
          onClick={() => setShowFilters((value) => !value)}
          aria-expanded={showFilters}
        >
          <FunnelSimple size={16} weight="bold" />
          Filters
          {activeCount > 0 && (
            <span
              data-numeric
              className={`rounded-chip px-1.5 text-xs ${
                showFilters
                  ? "bg-accent-contrast/20"
                  : "bg-accent text-accent-contrast"
              }`}
            >
              {activeCount}
            </span>
          )}
        </Button>

        {(activeCount > 0 || search) && (
          <Button variant="ghost" onClick={clear}>
            <X size={14} weight="bold" />
            Clear
          </Button>
        )}
      </div>

      {showFilters && (
        <div ref={panel} className="flex flex-wrap gap-2">
          {/* Platform is built from the user's own library rather than a fixed
              list, so a custom site appears here as soon as one is labelled. */}
          <select
            value={filters.platform ?? ""}
            onChange={(event) => set("platform", event.target.value)}
            aria-label="Platform"
            className={selectClass}
          >
            <option value="">Any platform</option>
            {options.platforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform === "LEETCODE"
                  ? "LeetCode"
                  : platform === "CODEFORCES"
                    ? "Codeforces"
                    : platform}
              </option>
            ))}
          </select>

          {/* Topics come from the user's own library, same as platforms. */}
          {options.tags.length > 0 && (
            <select
              value={filters.tag ?? ""}
              onChange={(event) => set("tag", event.target.value)}
              aria-label="Topic"
              className={selectClass}
            >
              <option value="">Any topic</option>
              {options.tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          )}

          {SELECTS.map((group) => (
            <select
              key={group.key}
              value={(filters[group.key] as string) ?? ""}
              onChange={(event) => set(group.key, event.target.value)}
              aria-label={group.label}
              className={selectClass}
            >
              <option value="">{group.label}</option>
              {group.options.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}
    </div>
  );
}
