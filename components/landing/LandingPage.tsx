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
      {/* Maximal: page-wide morphing field above the mesh, below content;
          custom cursor above everything. Both self-bail on mobile/reduced
          motion (maximal-lite = the boosted mesh alone). */}
      {vibe === "maximal" && <MorphField />}
      {vibe === "maximal" && <LandingCursor />}
      <VibeToggle />
      {/* ScrollSmoother structure — wrapper/content pair (storyboard §4). */}
      <div data-smooth-wrapper className={styles.smoothWrapper}>
        <div data-smooth-content className={styles.smoothContent}>
          <Hero />
          <main>
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
