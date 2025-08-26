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

      // Enable hardware acceleration and optimize for performance
      gsap.set([sheet, overlay, content, title, ...items], {
        force3D: true,
        willChange: "transform, opacity",
      });

      // Initial states - simplified for better performance
      gsap.set(overlay, { opacity: 0 });
      gsap.set(sheet, { y: "100%", autoAlpha: 1 });
      gsap.set(content, { opacity: 0, y: 20 });
      gsap.set(title, { opacity: 0, y: 10 });
      gsap.set(items, { opacity: 0, y: 15 });

      // Simplified open timeline for better performance
      const tl = gsap.timeline({
        defaults: {
          ease: "power2.out",
          clearProps: "willChange",
        },
        onComplete: () => {
          // Clean up willChange after animation
          gsap.set([sheet, overlay, content, title, ...items], {
            clearProps: "willChange",
          });
        },
      });

      tl.to(overlay, {
        opacity: 1,
        duration: 0.25,
      })
        .to(
          sheet,
          {
            y: "0%",
            duration: 0.4,
            ease: "power3.out",
          },
          "-=0.1"
        )
        .to(
          content,
          {
            opacity: 1,
            y: 0,
            duration: 0.3,
          },
          "-=0.2"
        )
        .to(
          title,
          {
            opacity: 1,
            y: 0,
            duration: 0.25,
          },
          "-=0.15"
        )
        .to(
          items,
          {
            opacity: 1,
            y: 0,
            duration: 0.2,
            stagger: 0.05,
          },
          "-=0.1"
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

    // Enable hardware acceleration for close animation
    gsap.set([sheet, overlay, content, title, ...items], {
      force3D: true,
      willChange: "transform, opacity",
    });

    // Simplified close timeline for better performance
    const tl = gsap.timeline({
      onComplete: onClose,
      defaults: { ease: "power2.in" },
    });

    tl.to(items, {
      opacity: 0,
      y: 10,
      duration: 0.15,
      stagger: 0.03,
    })
      .to(
        title,
        {
          opacity: 0,
          y: 5,
          duration: 0.15,
        },
        "-=0.1"
      )
      .to(
        content,
        {
          opacity: 0,
          y: 20,
          duration: 0.2,
        },
        "-=0.1"
      )
      .to(
        sheet,
        {
          y: "100%",
          duration: 0.3,
          ease: "power3.in",
        },
        "-=0.1"
      )
      .to(
        overlay,
        {
          opacity: 0,
          duration: 0.2,
        },
        "-=0.2"
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
