/**
 * Required-field asterisk — use inside FormLabel or <label>.
 * Slightly emphasized (text-lg) to match the original app-wide style.
 */
export function RequiredMark() {
  return (
    <sup
      className="ml-0.5 text-destructive text-lg font-normal leading-none -top-0"
      aria-hidden="true"
    >
      *
    </sup>
  );
}
