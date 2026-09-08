import { PageHeader, PageShell } from "@/components/ui/page";
import { Section } from "@/components/ui/surface";

export const metadata = { title: "Terms" };

/**
 * Draft terms describing how the service currently behaves. Not legal advice
 * and not reviewed by a lawyer. See the note at the bottom of the page.
 */
export default function TermsPage() {
  return (
    <PageShell width="reading">
      <PageHeader
        title="Terms"
        description="The short version of what you can expect and what is expected of you."
      />

      <Section title="Using leeeto">
        <ul className="flex flex-col divide-y divide-border text-sm">
          <li className="py-3 first:pt-0">
            You need an account, and you are responsible for what happens under
            it.
          </li>
          <li className="py-3">
            leeeto records practice. It does not run or judge code. The
            source platform still decides whether your solution is correct.
          </li>
          <li className="py-3">
            Do not upload content you do not have the right to store, and do not
            use the service to break the terms of LeetCode or Codeforces.
          </li>
          <li className="py-3">
            Requests are rate limited per account. Automating the interface to
            get around those limits is not allowed.
          </li>
        </ul>
      </Section>

      <Section title="Your content">
        <p className="max-w-[65ch] text-sm text-muted">
          Your notes, solutions and drawings stay yours. Storing and displaying
          them back to you is the only thing leeeto does with them.
        </p>
      </Section>

      <Section title="Availability">
        <p className="max-w-[65ch] text-sm text-muted">
          The service is provided as is. It depends on outside services, and
          those can fail. Keep anything you would be upset to lose backed up
          elsewhere; the CSV export on the dashboard exists for exactly that.
        </p>
      </Section>

      <p className="max-w-[65ch] rounded-panel border border-dashed border-border-strong p-5 text-sm text-muted">
        These are draft terms describing how the service behaves today. They are
        not legal advice and have not been reviewed by a lawyer. Get them
        checked before launching publicly or taking payments.
      </p>
    </PageShell>
  );
}
