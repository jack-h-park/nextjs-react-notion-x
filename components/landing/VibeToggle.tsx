import styles from "./landing.module.css";
import { type LandingVibe, STORAGE_KEY, useVibe } from "./VibeProvider";

const OPTIONS: ReadonlyArray<{ value: LandingVibe; label: string }> = [
  { value: "atmospheric", label: "Atmospheric" },
  { value: "maximal", label: "Maximal" },
];

/**
 * Floating comparison switch for the two visual directions. Lives outside
 * the ScrollSmoother content (fixed elements inside the transformed
 * wrapper would lose their fixing). Removed at the §8 decision gate.
 *
 * Switching does a full reload with ?vibe=… rather than a live swap: the
 * two modes mount/tear down ScrollSmoother pins, a WebGL canvas, and the
 * custom cursor, and reverting all that mid-scroll leaves pin-spacers and
 * transforms in a bad state. A fresh load is the path that already works
 * (and this is a decision tool, not a hot user setting).
 */
export function VibeToggle() {
  const { vibe } = useVibe();

  const switchTo = (next: LandingVibe) => {
    if (next === vibe) return;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable — the query param below still carries it */
    }
    const url = new URL(window.location.href);
    url.searchParams.set("vibe", next);
    window.location.assign(url.toString());
  };

  return (
    <div className={styles.vibeToggle} role="group" aria-label="Visual mode">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={styles.vibeOption}
          aria-pressed={vibe === option.value}
          onClick={() => switchTo(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
