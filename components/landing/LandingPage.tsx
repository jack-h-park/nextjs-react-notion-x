import dynamic from "next/dynamic";

import { geistMono, geistSans } from "@/lib/fonts";
import { cn } from "@/lib/utils";

import { ChainSection } from "./ChainSection";
import { Hero } from "./Hero";
import styles from "./landing.module.css";
import { LandingCursor } from "./LandingCursor";
import { LandingFooter } from "./LandingFooter";
import { PillarsGrid } from "./PillarsGrid";
import { ScopeDiscipline } from "./ScopeDiscipline";
import { SectionNav } from "./SectionNav";
import { SelectedWork } from "./SelectedWork";
import { Trajectory } from "./Trajectory";
import { useLandingMotion } from "./useLandingMotion";
import { useVibe, VibeProvider } from "./VibeProvider";
import { VibeToggle } from "./VibeToggle";

const MorphField = dynamic(
  () => import("./three/MorphField").then((m) => m.MorphField),
  { ssr: false },
);

function LandingPageInner() {
  const { vibe } = useVibe();
  const rootRef = useLandingMotion(vibe);

  return (
    // data-theme="jp" is required: the type-scale/radius/font tokens used by
    // landing.module.css only exist under that scope (styles/jp-theme.css).
    // data-vibe scopes the visual-direction overrides (storyboard §8).
    <div
      ref={rootRef}
      data-theme="jp"
      data-vibe={vibe}
      className={cn(geistSans.variable, geistMono.variable, styles.page)}
    >
      {/* Page paint layer — fixed, outside the smoother so it can never be
          transformed away; owns the base background + ambient mesh. */}
      <div className={styles.vibeBackdrop} aria-hidden="true" />
      {/* Page-wide morph field above the mesh, below content. Maximal is the
          bold set-piece (also replaces the hero ParticleField); atmospheric
          gets a faint "ambient" variant so particles persist past the hero
          without stealing focus. Both self-bail on mobile/reduced motion. */}
      {vibe === "maximal" && <MorphField variant="bold" />}
      {vibe === "atmospheric" && <MorphField variant="ambient" />}
      {/* Per-section atmosphere: its hue crossfades by chapter (data-atmo,
          driven in useLandingMotion) so sections read as movements without
          hard boundaries. Behind content, over the mesh + particles. */}
      <div className={styles.vibeAtmoTint} aria-hidden="true" />
      {vibe === "maximal" && <LandingCursor />}
      <VibeToggle />
      <SectionNav />
      {/* ScrollSmoother structure — wrapper/content pair (storyboard §4). */}
      <div data-smooth-wrapper className={styles.smoothWrapper}>
        <div data-smooth-content className={styles.smoothContent}>
          <Hero />
          <main className={styles.landingMain}>
            <ChainSection />
            <PillarsGrid />
            <ScopeDiscipline />
            <SelectedWork />
            <Trajectory />
            <LandingFooter />
          </main>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <VibeProvider>
      <LandingPageInner />
    </VibeProvider>
  );
}
