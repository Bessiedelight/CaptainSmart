"use client";
import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";

interface NavigationTriggerProps {
  onClick: () => void;
  isNavOpen: boolean;
  theme?: "light" | "dark"; // light = white elements, dark = black elements
}

const NavigationTrigger: React.FC<NavigationTriggerProps> = ({
  onClick,
  isNavOpen,
  theme = "light", // default to light theme (white elements)
}) => {
  const handleClick = () => {
    console.log("NavigationTrigger clicked!");
    onClick();
  };
  const triggerRef = useRef<HTMLButtonElement>(null);
  const line1Ref = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLDivElement>(null);
  const line3Ref = useRef<HTMLDivElement>(null);

  // Initial animation on mount
  useEffect(() => {
    if (triggerRef.current) {
      gsap.fromTo(
        triggerRef.current,
        {
          opacity: 0,
          y: -20,
          scale: 0.8,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
          delay: 1.2, // Delay to appear after other page elements
        }
      );
    }
  }, []);

  // Animate hamburger lines based on nav state
  useEffect(() => {
    if (!line1Ref.current || !line2Ref.current || !line3Ref.current) return;

    if (isNavOpen) {
      // Transform to X
      gsap.to(line1Ref.current, {
        rotation: 45,
        y: 6,
        duration: 0.3,
        ease: "power2.out",
      });
      gsap.to(line2Ref.current, {
        opacity: 0,
        duration: 0.2,
        ease: "power2.out",
      });
      gsap.to(line3Ref.current, {
        rotation: -45,
        y: -6,
        duration: 0.3,
        ease: "power2.out",
      });
    } else {
      // Transform back to hamburger
      gsap.to(line1Ref.current, {
        rotation: 0,
        y: 0,
        duration: 0.3,
        ease: "power2.out",
      });
      gsap.to(line2Ref.current, {
        opacity: 1,
        duration: 0.2,
        delay: 0.1,
        ease: "power2.out",
      });
      gsap.to(line3Ref.current, {
        rotation: 0,
        y: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  }, [isNavOpen]);

  // Hover animations
  const handleMouseEnter = () => {
    if (!triggerRef.current) return;

    gsap.to(triggerRef.current, {
      scale: 1.1,
      duration: 0.2,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    if (!triggerRef.current) return;

    gsap.to(triggerRef.current, {
      scale: 1,
      duration: 0.2,
      ease: "power2.out",
    });
  };

  return (
    <button
      ref={triggerRef}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`fixed top-6 right-6 z-[60] w-12 h-12 backdrop-blur-sm rounded-full hidden md:flex items-center justify-center transition-colors duration-200 ${
        theme === "light"
          ? "bg-white/10 border border-white/20 hover:bg-white/20"
          : "bg-black/10 border border-black/20 hover:bg-black/20"
      }`}
      aria-label="Toggle navigation menu"
    >
      <div className="w-5 h-4 relative flex items-center justify-center">
        <div className="w-5 h-4 relative">
          <div
            ref={line1Ref}
            className={`absolute top-0 left-1/2 w-full h-0.5 rounded-full transform -translate-x-1/2 ${
              theme === "light" ? "bg-white" : "bg-black"
            }`}
          />
          <div
            ref={line2Ref}
            className={`absolute top-1/2 left-1/2 w-full h-0.5 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
              theme === "light" ? "bg-white" : "bg-black"
            }`}
          />
          <div
            ref={line3Ref}
            className={`absolute bottom-0 left-1/2 w-full h-0.5 rounded-full transform -translate-x-1/2 ${
              theme === "light" ? "bg-white" : "bg-black"
            }`}
          />
        </div>
      </div>
    </button>
  );
};

export default NavigationTrigger;
