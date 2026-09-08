import { PageHeader, PageShell } from "@/components/ui/page";
import { Section } from "@/components/ui/surface";

export const metadata = { title: "Privacy" };

/**
 * A plain-language description of what the code in this repository actually
 * does with data. Every claim below is traceable to a file, which is the only
 * way a privacy page is worth anything.
 *
 * It is NOT legal advice and has not been reviewed by a lawyer. Before taking
 * payments or launching publicly, have someone qualified check it against the
 * jurisdictions you operate in.
 */
export default function PrivacyPage() {
  return (
    <PageShell width="reading">
      <PageHeader
        title="Privacy"
        description="What leeeto stores, where it goes, and what it never does."
      />

      <Section title="What is stored">
        <ul className="flex flex-col divide-y divide-border text-sm">
          <li className="py-3 first:pt-0">
            Your name, email address and avatar, as provided by your sign-in
            provider. Authentication is handled by Clerk, and leeeto never sees
            or stores a password.
          </li>
          <li className="py-3">
            The problems you add, and for each attempt: when it started, when it
            ended, how long it took, and whether you solved it or gave up.
          </li>
          <li className="py-3">
            Notes, saved solutions, whiteboard drawings and snapshots you
            create.
          </li>
          <li className="py-3">
            Duels you take part in, including your finishing time and position.
          </li>
        </ul>
      </Section>

      <Section title="Where it goes">
        <ul className="flex flex-col divide-y divide-border text-sm">
          <li className="py-3 first:pt-0">
            Your data is stored in a Postgres database hosted by Neon.
          </li>
          <li className="py-3">
            Problem titles, difficulty and topics are fetched from LeetCode and
            Codeforces. Those requests identify the problem only. Nothing about
            you is sent to them.
          </li>
          <li className="py-3">
            Redis, hosted by Upstash, holds request-rate counters keyed to your
            account id and a shared cache of public problem metadata.
          </li>
        </ul>
      </Section>

      <Section title="What never happens">
        <ul className="flex flex-col divide-y divide-border text-sm">
          <li className="py-3 first:pt-0">
            Your attempts, times, notes and solutions are visible only to you.
            The one exception is a duel, where the people in it see each
            other&rsquo;s finishing times.
          </li>
          <li className="py-3">
            Nothing is sold, and nothing is shared with advertisers.
          </li>
          <li className="py-3">
            There are no third-party analytics or advertising trackers on this
            site.
          </li>
        </ul>
      </Section>

      <Section title="Deleting your account">
        <p className="max-w-[65ch] text-sm text-muted">
          Deleting your account removes your user record, and every attempt,
          note, solution, whiteboard, snapshot and duel entry attached to it is
          deleted with it. Shared problem entries are not user data and remain
          in the catalogue.
        </p>
      </Section>

      <p className="max-w-[65ch] rounded-panel border border-dashed border-border-strong p-5 text-sm text-muted">
        This page is an accurate description of the current code, not legal
        advice, and it has not been reviewed by a lawyer. Have it checked
        against your jurisdiction before launching publicly or taking payments.
      </p>
    </PageShell>
  );
}
