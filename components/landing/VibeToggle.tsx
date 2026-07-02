import styles from "./landing.module.css";
import { type LandingVibe, useVibe } from "./VibeProvider";

const OPTIONS: ReadonlyArray<{ value: LandingVibe; label: string }> = [
  { value: "atmospheric", label: "Atmospheric" },
  { value: "maximal", label: "Maximal" },
];

/**
 * Floating comparison switch for the two visual directions. Lives outside
 * the ScrollSmoother content (fixed elements inside the transformed
 * wrapper would lose their fixing). Removed at the §8 decision gate.
 */
export function VibeToggle() {
  const { vibe, setVibe } = useVibe();

  return (
    <div className={styles.vibeToggle} role="group" aria-label="Visual mode">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={styles.vibeOption}
          aria-pressed={vibe === option.value}
          onClick={() => setVibe(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
