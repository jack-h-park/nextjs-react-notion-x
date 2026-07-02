import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type LandingVibe = "atmospheric" | "maximal";

const STORAGE_KEY = "landing-vibe";
const DEFAULT_VIBE: LandingVibe = "atmospheric";

type VibeContextValue = {
  vibe: LandingVibe;
  setVibe: (vibe: LandingVibe) => void;
};

const VibeContext = createContext<VibeContextValue>({
  vibe: DEFAULT_VIBE,
  setVibe: () => undefined,
});

function isVibe(value: string | null): value is LandingVibe {
  return value === "atmospheric" || value === "maximal";
}

/**
 * Landing "vibe" — the live A/B layer between the two visual directions
 * (atmospheric rich vs experimental maximal) while the owner decides.
 *
 * SSR always renders the default so hydration matches; the stored or
 * ?vibe= preference is applied in an effect afterwards (same pattern as
 * DarkModeProvider's body-class toggle). ?vibe=maximal wins over storage
 * so a direction can be shared by URL.
 *
 * Decision gate: once a direction is chosen, the losing mode's CSS/JS and
 * this provider's toggle are DELETED — this is a comparison tool, not a
 * permanent user preference (docs/ui/landing-storyboard.md §8).
 */
export function VibeProvider({ children }: { children: ReactNode }) {
  const [vibe, setVibeState] = useState<LandingVibe>(DEFAULT_VIBE);

  useEffect(() => {
    const fromQuery = new URLSearchParams(window.location.search).get("vibe");
    if (isVibe(fromQuery)) {
      setVibeState(fromQuery);
      try {
        localStorage.setItem(STORAGE_KEY, fromQuery);
      } catch {
        /* storage unavailable (private mode) — session-only */
      }
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isVibe(stored)) setVibeState(stored);
    } catch {
      /* storage unavailable — keep default */
    }
  }, []);

  const setVibe = useCallback((next: LandingVibe) => {
    setVibeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable — session-only */
    }
  }, []);

  return (
    <VibeContext.Provider value={{ vibe, setVibe }}>
      {children}
    </VibeContext.Provider>
  );
}

export function useVibe() {
  return useContext(VibeContext);
}
