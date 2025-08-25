"use client";

import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import Link from "next/link";

interface ExploreSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExploreSheet: React.FC<ExploreSheetProps> = ({ isOpen, onClose }) => {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen || !sheetRef.current) return;

    // Use gsap.context to scope selectors and auto-cleanup
    const ctx = gsap.context(() => {
      const sheet = sheetRef.current!;
      const overlay = overlayRef.current!;
      const content = contentRef.current!;
      const title = titleRef.current!;
      const items = sheet.querySelectorAll<HTMLAnchorElement>(".explore-item");

      // initial states
      gsap.set(overlay, { opacity: 0, backdropFilter: "blur(0px)" });
      gsap.set(sheet, { y: "100%", autoAlpha: 1 });
      gsap.set(content, {
        opacity: 0,
        y: 36,
        scale: 0.995,
        willChange: "transform, opacity",
      });
      gsap.set(title, {
        opacity: 0,
        scale: 0.98,
        y: 6,
        willChange: "transform, opacity",
      });
      gsap.set(items, {
        opacity: 0,
        y: 18,
        scale: 0.995,
        willChange: "transform, opacity",
      });

      // open timeline: smoother, nicer pop + settle
      const tl = gsap.timeline({
        defaults: { clearProps: "transform,opacity" },
      });

      tl.to(overlay, {
        opacity: 1,
        backdropFilter: "blur(4px)",
        duration: 0.35,
        ease: "power2.out",
      })
        .to(
          sheet,
          {
            y: "0%",
            duration: 0.72,
            ease: "expo.out",
            force3D: true,
          },
          "-=0.18"
        )
        // content appears slightly after sheet, with a gentle lift
        .to(
          content,
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: "power3.out",
          },
          "-=0.48"
        )
        // title pops slightly bigger then settles for a friendly feel
        .to(
          title,
          {
            opacity: 1,
            scale: 1.03,
            y: 0,
            duration: 0.36,
            ease: "back.out(1.6)",
          },
          "-=0.45"
        )
        .to(
          title,
          {
            scale: 1,
            duration: 0.28,
            ease: "power2.out",
          },
          "-=0.1"
        )
        // nav items come in with gentle stagger + slight scale
        .to(
          items,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.34,
            stagger: 0.08,
            ease: "power2.out",
          },
          "-=0.28"
        );
    }, sheetRef);

    return () => ctx.revert();
  }, [isOpen]);

  const handleClose = () => {
    if (!sheetRef.current) {
      onClose();
      return;
    }
    const sheet = sheetRef.current!;
    const overlay = overlayRef.current!;
    const content = contentRef.current!;
    const title = titleRef.current!;
    const items = sheet.querySelectorAll<HTMLAnchorElement>(".explore-item");

    // Close timeline: smoother exit with nice scale down + fade
    const tl = gsap.timeline({
      onComplete: onClose,
    });

    tl.to(items, {
      opacity: 0,
      y: 14,
      scale: 0.995,
      duration: 0.18,
      stagger: 0.06,
      ease: "power2.in",
    })
      .to(
        title,
        {
          opacity: 0,
          scale: 0.98,
          y: 6,
          duration: 0.2,
          ease: "power2.in",
        },
        "-=0.12"
      )
      .to(
        content,
        {
          opacity: 0,
          y: 36,
          scale: 0.997,
          duration: 0.26,
          ease: "power3.in",
        },
        "-=0.16"
      )
      .to(
        sheet,
        {
          y: "100%",
          duration: 0.6,
          ease: "expo.in",
        },
        "-=0.2"
      )
      .to(
        overlay,
        {
          opacity: 0,
          backdropFilter: "blur(0px)",
          duration: 0.34,
          ease: "power2.in",
        },
        "-=0.45"
      );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 font-sans">
      {/* Overlay - click to close */}
      <div
        ref={overlayRef}
        onClick={handleClose}
        className="absolute inset-0 bg-black/45"
        aria-hidden
      />

      {/* Sheet */}
      <div ref={sheetRef} className="absolute inset-0 bg-white">
        {/* Close button — top-left */}
        <button
          onClick={handleClose}
          aria-label="Close explore"
          className="absolute top-6 left-6 z-30 p-2 rounded-md hover:bg-black/5 transition"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Centered content */}
        <div
          ref={contentRef}
          className="h-full flex items-center justify-center p-8"
        >
          <div className="w-full max-w-[1100px] flex flex-col items-center justify-center text-center px-6">
            {/* Header: icon + title (bigger now) */}
            <div
              ref={titleRef}
              className="flex items-center gap-8 mb-14 justify-center"
            >
              {/* white circular background with black svg, no shadow, larger */}
              <div
                className="flex-shrink-0 bg-white rounded-full flex items-center justify-center"
                style={{
                  width: 84,
                  height: 84,
                }}
              >
                <svg
                  width="56"
                  height="52"
                  viewBox="0 0 122 120"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="transform-gpu"
                  style={
                    {
                      animationDuration: "30s",
                      animationName: "spin-slow",
                      animationIterationCount: "infinite",
                      animationTimingFunction: "linear",
                    } as React.CSSProperties
                  }
                >
                  <circle cx="60.5" cy="60.5" r="12.5" fill="#000" />
                  <circle
                    cx="61"
                    cy="61"
                    r="32"
                    stroke="#000"
                    strokeWidth="13"
                  />
                  <circle cx="114.5" cy="59.5" r="7.5" fill="#000" />
                  <circle
                    cx="48.4914"
                    cy="112.416"
                    r="7.5"
                    transform="rotate(105 48.4914 112.416)"
                    fill="#000"
                  />
                  <circle
                    cx="15.1597"
                    cy="32.2331"
                    r="7.5"
                    transform="rotate(-163.235 15.1597 32.2331)"
                    fill="#000"
                  />
                  <circle
                    cx="74.3445"
                    cy="8.34457"
                    r="7.5"
                    transform="rotate(-73.2353 74.3445 8.34457)"
                    fill="#000"
                  />
                  <circle cx="110.5" cy="83.5" r="7.5" fill="#000" />
                  <circle
                    cx="24.9493"
                    cy="100.342"
                    r="7.5"
                    transform="rotate(105 24.9493 100.342)"
                    fill="#000"
                  />
                  <circle
                    cx="94.6292"
                    cy="19.9858"
                    r="7.5"
                    transform="rotate(-73.2353 94.6292 19.9858)"
                    fill="#000"
                  />
                  <circle cx="94.5" cy="102.5" r="7.5" fill="#000" />
                  <circle
                    cx="10.1856"
                    cy="81.1856"
                    r="7.5"
                    transform="rotate(105 10.1856 81.1856)"
                    fill="#000"
                  />
                  <circle
                    cx="31.1945"
                    cy="16.1323"
                    r="7.5"
                    transform="rotate(-163.235 31.1945 16.1323)"
                    fill="#000"
                  />
                  <circle
                    cx="108.445"
                    cy="35.3794"
                    r="7.5"
                    transform="rotate(-73.2353 108.445 35.3794)"
                    fill="#000"
                  />
                  <circle cx="71.5" cy="112.5" r="7.5" fill="#000" />
                  <circle
                    cx="8.1856"
                    cy="57.1856"
                    r="7.5"
                    transform="rotate(105 8.1856 57.1856)"
                    fill="#000"
                  />
                  <circle
                    cx="53.5173"
                    cy="8.36865"
                    r="7.5"
                    transform="rotate(-163.235 53.5173 8.36865)"
                    fill="#000"
                  />
                </svg>
              </div>

              {/* larger title (still responsive) */}
              <h2 className="text-[3.2rem] md:text-[4.2rem] leading-tight tracking-wider text-black">
                EXPLORE COMPONENTS
              </h2>
            </div>

            {/* Navigation */}
            <div className="flex justify-center w-full">
              <nav className="flex items-center text-[0.98rem] uppercase tracking-wide text-black/90">
                {[
                  { href: "/smart-news", label: "SMART NEWS" },
                  { href: "/expose-corner", label: "EXPOSE CORNER" },
                  { href: "/store", label: "STORE" },
                  { href: "/video-and-podcast", label: "VIDEO PODCASTS" },
                ].map((item, idx, arr) => (
                  <React.Fragment key={item.href}>
                    <Link href={item.href} legacyBehavior>
                      <a className="explore-item nav-link px-6 py-2">
                        {item.label}
                      </a>
                    </Link>
                    {idx !== arr.length - 1 && (
                      <div
                        className="h-6 w-[1px] bg-black/20 mx-6"
                        aria-hidden
                      />
                    )}
                  </React.Fragment>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .transform-gpu {
          transform: translateZ(0);
          will-change: transform;
        }

        /* Underline animation for nav links (targets the actual <a>) */
        .nav-link {
          position: relative;
          display: inline-block;
          text-decoration: none;
          color: inherit;
          transition: color 160ms ease;
        }
        .nav-link::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: -6px;
          height: 2px;
          background: #000;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 220ms cubic-bezier(0.2, 0.9, 0.3, 1);
          border-radius: 2px;
        }
        .nav-link:hover::after,
        .nav-link:focus::after {
          transform: scaleX(1);
        }

        /* keep title responsive and avoid wrapping on most screens */
        @media (max-width: 800px) {
          h2 {
            font-size: clamp(20px, 7vw, 36px);
          }
        }
      `}</style>
    </div>
  );
};

export default ExploreSheet;
