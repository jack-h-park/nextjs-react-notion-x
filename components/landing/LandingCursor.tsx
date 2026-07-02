import { gsap } from "gsap";
import { useEffect, useRef } from "react";

import styles from "./landing.module.css";

/**
 * Maximal-mode custom cursor: an instant dot + a lagging ring that swells
 * over interactive targets, plus magnetic pull on [data-magnetic] CTAs.
 * Mounted only in maximal (LandingPage); bails on touch pointers and
 * reduced motion. The native cursor is hidden by CSS in the same scope,
 * so this component and that rule must ship together.
 */
const isInteractive = (target: EventTarget | null) =>
  target instanceof Element && target.closest("a, button");

export function LandingCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!finePointer || reducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.set([dot, ring], { xPercent: -50, yPercent: -50, autoAlpha: 0 });

      const dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power2" });
      const dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power2" });
      const ringX = gsap.quickTo(ring, "x", { duration: 0.4, ease: "power3" });
      const ringY = gsap.quickTo(ring, "y", { duration: 0.4, ease: "power3" });

      let seen = false;
      const onMove = (event: PointerEvent) => {
        if (!seen) {
          seen = true;
          gsap.to([dot, ring], { autoAlpha: 1, duration: 0.25 });
        }
        dotX(event.clientX);
        dotY(event.clientY);
        ringX(event.clientX);
        ringY(event.clientY);
      };
      const onLeave = () => {
        seen = false;
        gsap.to([dot, ring], { autoAlpha: 0, duration: 0.25 });
      };

      // Ring swells over anything clickable (delegated, so it also covers
      // content that mounts later).
      const onOver = (event: PointerEvent) => {
        if (isInteractive(event.target)) {
          gsap.to(ring, { scale: 1.9, duration: 0.3, ease: "power3.out" });
          gsap.to(dot, { scale: 0.5, duration: 0.3, ease: "power3.out" });
        }
      };
      const onOut = (event: PointerEvent) => {
        if (isInteractive(event.target)) {
          gsap.to([ring, dot], { scale: 1, duration: 0.3, ease: "power3.out" });
        }
      };

      document.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerover", onOver, { passive: true });
      document.addEventListener("pointerout", onOut, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);

      // Magnetic CTAs: the element leans toward the cursor while hovered,
      // then snaps back elastically. x/y compose with GSAP entrance tweens.
      const magnetCleanups: Array<() => void> = [];
      for (const magnet of document.querySelectorAll<HTMLElement>(
        "[data-magnetic]",
      )) {
        const pullX = gsap.quickTo(magnet, "x", {
          duration: 0.3,
          ease: "power3",
        });
        const pullY = gsap.quickTo(magnet, "y", {
          duration: 0.3,
          ease: "power3",
        });
        const onMagnetMove = (event: PointerEvent) => {
          const rect = magnet.getBoundingClientRect();
          pullX((event.clientX - (rect.left + rect.width / 2)) * 0.28);
          pullY((event.clientY - (rect.top + rect.height / 2)) * 0.28);
        };
        const onMagnetLeave = () => {
          gsap.to(magnet, {
            x: 0,
            y: 0,
            duration: 0.6,
            ease: "elastic.out(1, 0.45)",
          });
        };
        magnet.addEventListener("pointermove", onMagnetMove, {
          passive: true,
        });
        magnet.addEventListener("pointerleave", onMagnetLeave);
        magnetCleanups.push(() => {
          magnet.removeEventListener("pointermove", onMagnetMove);
          magnet.removeEventListener("pointerleave", onMagnetLeave);
          gsap.set(magnet, { x: 0, y: 0 });
        });
      }

      return () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerover", onOver);
        document.removeEventListener("pointerout", onOut);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        for (const cleanup of magnetCleanups) cleanup();
      };
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      <div ref={dotRef} className={styles.cursorDot} aria-hidden="true" />
      <div ref={ringRef} className={styles.cursorRing} aria-hidden="true" />
    </>
  );
}
