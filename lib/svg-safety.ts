/**
 * SVG is an executable document format: it can carry <script> and on* event
 * handlers. Snapshots arrive through a Server Action, which is a public POST,
 * so the markup is untrusted even though our own editor produced it.
 *
 * This is defence in depth. The primary mitigation is rendering snapshots via
 * `<img src="data:image/svg+xml,…">`, which never executes scripts — that one
 * holds even if this filter is wrong.
 */
export function isSvgSafe(svg: string): boolean {
  return !/<script|\son\w+\s*=/i.test(svg);
}

export function looksLikeSvg(svg: string): boolean {
  return svg.includes("<svg");
}
