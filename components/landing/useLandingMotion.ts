import { gsap } from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useEffect, useRef } from "react";

import type { LandingVibe } from "./VibeProvider";

/**
 * Scroll-motion layer for the landing page (storyboard §4).
 *
 * Everything animates FROM an offset back to the markup's final state, so
 * the page is complete without JS and under prefers-reduced-motion — the
 * matchMedia block simply never runs and the static markup stands.
 *
 * Desktop additionally gets the pinned Chain set-piece and data-speed/lag
 * parallax depth; mobile keeps native scroll with entrance tweens only.
 *
 * The vibe is a dependency: toggling it reverts the whole GSAP context and
 * rebuilds (maximal swaps the Selected Work entrances for the pinned
 * horizontal gallery, storyboard §8).
 */
export function useLandingMotion(vibe: LandingVibe) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

    const mm = gsap.matchMedia();

    mm.add(
      {
        motionOK: "(prefers-reduced-motion: no-preference)",
        isDesktop: "(min-width: 769px)",
      },
      (context) => {
        const { motionOK, isDesktop } = context.conditions as {
          motionOK: boolean;
          isDesktop: boolean;
        };
        if (!motionOK) return;

        let disposed = false;
        const splits: SplitText[] = [];

        const ctx = gsap.context(() => {
          // ── Inertia scrolling + data-speed/data-lag parallax ────────
          // Wheel only (smoothTouch stays 0) so mobile keeps native scroll.
          // Parallax effects are desktop-only: on touch the depth layer
          // reads as jitter rather than depth.
          // A vibe toggle re-runs this whole effect, so kill any smoother
          // left from the previous run before creating the new one.
          ScrollSmoother.get()?.kill();
          ScrollSmoother.create({
            wrapper: "[data-smooth-wrapper]",
            content: "[data-smooth-content]",
            smooth: 1.2,
            effects: isDesktop,
          });

          // Per-section atmosphere is set up at the END of this context,
          // after the pins — a pin adds a spacer that shifts every trigger
          // below it, so atmo triggers created before the pins would read
          // stale positions (the closing never firing → rail stuck on
          // Trajectory). Init the first chapter here to avoid a null state.
          root.dataset.atmo = "hero";

          // ── Hero: eyebrow → headline lines → supporting items ──────
          const headline = root.querySelector<HTMLElement>(
            '[data-anim="hero-headline"]',
          );
          // Split only after webfonts settle so line boxes are final (CLS
          // guard). autoSplit re-splits on resize so masked lines never clip
          // after an orientation change; the rise plays only once.
          void document.fonts.ready.then(() => {
            if (disposed || !headline) return;
            ctx.add(() => {
              let heroPlayed = false;
              const split = new SplitText(headline, {
                type: "lines",
                mask: "lines",
                autoSplit: true,
                onSplit(self) {
                  if (heroPlayed) return;
                  heroPlayed = true;
                  return gsap
                    .timeline({ defaults: { ease: "power3.out" } })
                    .from('[data-anim="hero-eyebrow"]', {
                      autoAlpha: 0,
                      y: 16,
                      duration: 0.5,
                    })
                    .from(
                      self.lines,
                      { yPercent: 110, duration: 0.9, stagger: 0.1 },
                      "-=0.2",
                    )
                    .from(
                      '[data-anim="hero-item"]',
                      { autoAlpha: 0, y: 16, duration: 0.6, stagger: 0.1 },
                      "-=0.5",
                    );
                },
              });
              splits.push(split);
            });
          });

          // ── Section overlines + intros: staged, not simultaneous ────
          for (const title of gsap.utils.toArray<HTMLElement>(
            '[data-reveal="title"]',
          )) {
            gsap.from(title, {
              autoAlpha: 0,
              y: 14,
              duration: 0.5,
              ease: "power3.out",
              scrollTrigger: { trigger: title, start: "top 88%" },
            });
          }
          for (const intro of gsap.utils.toArray<HTMLElement>(
            '[data-reveal="intro"]',
          )) {
            gsap.from(intro, {
              autoAlpha: 0,
              y: 22,
              duration: 0.7,
              delay: 0.08,
              ease: "power3.out",
              scrollTrigger: { trigger: intro, start: "top 88%" },
            });
          }

          // ── The Chain ───────────────────────────────────────────────
          if (isDesktop) {
            // Signature set-piece: the section pins and the dependency
            // chain builds under the reader's scroll — node, then the tick
            // that feeds the next node, in strict order. The Full-gradient
            // divider "outputs" the chain into the rest of the page.
            const section = root.querySelector<HTMLElement>(
              '[data-anim="chain-section"]',
            );
            const nodes = gsap.utils.toArray<HTMLElement>(
              '[data-anim="chain-node"]',
            );
            if (section && nodes.length > 0) {
              const tl = gsap.timeline({
                defaults: { ease: "none" },
                scrollTrigger: {
                  trigger: section,
                  start: "top top",
                  end: "+=140%",
                  pin: true,
                  scrub: 1,
                  anticipatePin: 1,
                },
              });
              for (const node of nodes) {
                tl.from(node, { "--tick": 0, duration: 0.25 }).from(
                  node,
                  { autoAlpha: 0, y: 40, duration: 0.55 },
                  "<+=0.1",
                );
              }
              tl.from(
                '[data-anim="chain-outro"]',
                { autoAlpha: 0, y: 16, duration: 0.5 },
                "+=0.15",
              ).from('[data-anim="chain-divider"]', {
                scaleX: 0,
                transformOrigin: "left center",
                duration: 0.7,
              });
            }
          } else {
            // Mobile: native scroll, scrubbed sequential reveal (no pin).
            gsap.from('[data-anim="chain-node"]', {
              autoAlpha: 0,
              y: 24,
              stagger: 0.25,
              ease: "none",
              scrollTrigger: {
                trigger: '[data-anim="chain-node"]',
                start: "top 80%",
                end: "+=400",
                scrub: 1,
              },
            });
            gsap.from('[data-anim="chain-outro"]', {
              autoAlpha: 0,
              y: 16,
              duration: 0.6,
              ease: "power3.out",
              scrollTrigger: {
                trigger: '[data-anim="chain-outro"]',
                start: "top 85%",
              },
            });
            gsap.from('[data-anim="chain-divider"]', {
              scaleX: 0,
              transformOrigin: "left center",
              ease: "none",
              scrollTrigger: {
                trigger: '[data-anim="chain-divider"]',
                start: "top 95%",
                end: "top 70%",
                scrub: 1,
              },
            });
          }

          // ── Pillars: batch stagger with settle-in scale ─────────────
          gsap.from('[data-anim="pillar-card"]', {
            autoAlpha: 0,
            y: 28,
            scale: 0.97,
            duration: 0.6,
            stagger: 0.09,
            ease: "power3.out",
            scrollTrigger: {
              trigger: '[data-anim="pillar-card"]',
              start: "top 78%",
            },
          });

          // ── Scope: statement read at scroll speed, word by word ─────
          const statement = root.querySelector<HTMLElement>(
            '[data-anim="scope-statement"]',
          );
          if (statement) {
            // autoSplit keeps word targets valid across resizes; the scrub
            // tween is re-created per split (returned animation contract).
            const split = new SplitText(statement, {
              type: "words",
              autoSplit: true,
              onSplit(self) {
                return gsap.from(self.words, {
                  autoAlpha: 0.12,
                  stagger: 0.04,
                  ease: "none",
                  scrollTrigger: {
                    trigger: statement,
                    start: "top 78%",
                    end: "bottom 45%",
                    scrub: 1,
                  },
                });
              },
            });
            splits.push(split);
          }
          gsap.from('[data-anim="scope-costs"]', {
            autoAlpha: 0,
            y: 16,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: {
              trigger: '[data-anim="scope-costs"]',
              start: "top 82%",
            },
          });

          // ── Selected Work ────────────────────────────────────────────
          const workSection = root.querySelector<HTMLElement>(
            '[data-anim="work-section"]',
          );
          const workList = root.querySelector<HTMLElement>(
            '[data-anim="work-list"]',
          );
          if (vibe === "maximal" && isDesktop && workSection && workList) {
            // Maximal: pinned horizontal gallery. The layout only goes
            // horizontal once this attribute lands (CSS keys off it), so
            // reduced-motion / no-JS keep the vertical stack.
            workSection.dataset.workGallery = "";
            const distance = () =>
              Math.max(workList.scrollWidth - window.innerWidth + 120, 0);
            gsap.to(workList, {
              x: () => -distance(),
              ease: "none",
              scrollTrigger: {
                trigger: workSection,
                start: "top top",
                end: () => `+=${distance()}`,
                pin: true,
                scrub: 1,
                anticipatePin: 1,
                invalidateOnRefresh: true,
              },
            });
          } else {
            // Atmospheric / mobile: vertical stack with settle-in entrances.
            for (const card of gsap.utils.toArray<HTMLElement>(
              '[data-anim="work-card"]',
            )) {
              gsap.from(card, {
                autoAlpha: 0,
                y: 36,
                scale: 0.985,
                duration: 0.7,
                ease: "power3.out",
                scrollTrigger: { trigger: card, start: "top 82%" },
              });
            }
          }
          for (const stat of gsap.utils.toArray<HTMLElement>("[data-count]")) {
            const raw = stat.dataset.value ?? "0";
            const target = Number(raw);
            if (!Number.isFinite(target)) continue;
            const decimals = raw.split(".")[1]?.length ?? 0;
            const prefix = stat.dataset.prefix ?? "";
            const suffix = stat.dataset.suffix ?? "";
            const counter = { value: 0 };
            gsap.from(stat, {
              autoAlpha: 0,
              scale: 0.92,
              y: 8,
              duration: 0.5,
              ease: "back.out(1.6)",
              scrollTrigger: { trigger: stat, start: "top 88%", once: true },
            });
            gsap.to(counter, {
              value: target,
              duration: 1.2,
              ease: "power2.out",
              scrollTrigger: { trigger: stat, start: "top 88%", once: true },
              onUpdate() {
                stat.textContent = `${prefix}${counter.value.toFixed(decimals)}${suffix}`;
              },
            });
          }

          // ── Trajectory: progress line scrubbed to scroll ────────────
          gsap.from('[data-anim="timeline-progress"]', {
            scaleY: 0,
            transformOrigin: "top center",
            ease: "none",
            scrollTrigger: {
              trigger: '[data-anim="timeline-wrap"]',
              start: "top 75%",
              end: "bottom 60%",
              scrub: 1,
            },
          });
          for (const item of gsap.utils.toArray<HTMLElement>(
            '[data-anim="timeline-item"]',
          )) {
            gsap.from(item, {
              autoAlpha: 0,
              x: -12,
              duration: 0.5,
              ease: "power3.out",
              scrollTrigger: { trigger: item, start: "top 85%" },
            });
          }
          gsap.from('[data-anim="education"]', {
            autoAlpha: 0,
            y: 12,
            duration: 0.5,
            ease: "power3.out",
            scrollTrigger: {
              trigger: '[data-anim="education"]',
              start: "top 90%",
            },
          });

          // ── Closing: quiet entrance, CTA scale-in ───────────────────
          gsap.from('[data-anim="closing-headline"]', {
            autoAlpha: 0,
            y: 16,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: {
              trigger: '[data-anim="closing-headline"]',
              start: "top 82%",
            },
          });
          gsap.from('[data-anim="closing-cta"]', {
            autoAlpha: 0,
            scale: 0.96,
            duration: 0.5,
            ease: "power3.out",
            scrollTrigger: {
              trigger: '[data-anim="closing-cta"]',
              start: "top 88%",
            },
          });

          // ── Per-section atmosphere (storyboard §8) ──────────────────
          // A deterministic scroll-spy, NOT competing per-section triggers:
          // overlapping onEnter/onEnterBack ranges made the closing flicker
          // and Trajectory stick. On every scroll we pick the LAST section
          // whose top has passed a reference line — exactly one active, no
          // fight. data-atmo drives the tint hue, the rail, and the calm.
          //
          // The line sits at 55% of the viewport: below the closing
          // headline's max-scroll top (~44%), so Contact reliably owns the
          // bottom instead of being absorbed into Trajectory.
          const atmoEls = [
            { key: "hero", sel: '[data-anim="hero-headline"]' },
            { key: "chain", sel: '[data-anim="chain-section"]' },
            { key: "pillars", sel: '[data-anim="pillar-card"]' },
            { key: "discipline", sel: '[data-anim="scope-statement"]' },
            { key: "work", sel: '[data-anim="work-section"]' },
            { key: "trajectory", sel: '[data-anim="timeline-wrap"]' },
            { key: "closing", sel: '[data-anim="closing-headline"]' },
          ]
            .map(({ key, sel }) => ({
              key,
              el: root.querySelector<HTMLElement>(sel),
            }))
            .filter((s): s is { key: string; el: HTMLElement } => !!s.el);

          const updateAtmo = () => {
            const line = window.innerHeight * 0.55;
            let active = atmoEls[0]?.key ?? "hero";
            for (const s of atmoEls) {
              if (s.el.getBoundingClientRect().top <= line) active = s.key;
              else break; // sections are in order; the rest are lower still
            }
            if (root.dataset.atmo !== active) root.dataset.atmo = active;
          };

          // The spy reads live getBoundingClientRect on each update, so it
          // needs no precomputed positions — and must NOT call
          // ScrollTrigger.refresh() here: a manual refresh mid-setup
          // corrupts the Chain pin's spacer under ScrollSmoother and blocks
          // scrolling past Selected Work (a viewport resize would silently
          // fix it, which is exactly the symptom). ScrollSmoother runs its
          // own refresh after this context.
          ScrollTrigger.create({
            trigger: "[data-smooth-content]",
            start: "top top",
            end: "bottom bottom",
            onUpdate: updateAtmo,
            onRefresh: updateAtmo,
          });
          updateAtmo();
        }, root);

        return () => {
          disposed = true;
          for (const split of splits) split.revert();
          ctx.revert();
          // ctx.revert() unpins, but the layout attribute is ours to clear.
          root
            .querySelector('[data-work-gallery]')
            ?.removeAttribute("data-work-gallery");
          ScrollSmoother.get()?.kill();
        };
      },
    );

    return () => mm.revert();
  }, [vibe]);

  return rootRef;
}
