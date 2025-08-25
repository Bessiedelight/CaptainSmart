"use client";
import { useState } from "react";
import NavigationTrigger from "@/components/NavigationTrigger";
import Navigation from "@/components/Navigation";

export default function Navbar() {
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <div className="w-full">
      {/* Navigation Components */}
      <NavigationTrigger
        onClick={() => setIsNavOpen(true)}
        isNavOpen={isNavOpen}
        theme="light"
      />
      <Navigation isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />

      {/* Main Hero Section - Black Background (was green in original) */}
      <div className="bg-black px-6 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-16">
        <div className="flex justify-between items-start mb-8 sm:mb-12">
          {/* Left Section - Brand Name */}
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase">
              CAPTAIN SMART
            </h1>
          </div>

          {/* Right Section - Navigation Trigger */}
          <div></div>
        </div>

        {/* Main Title */}
        <div className="text-center">
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white tracking-tight uppercase"
            style={{
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontWeight: "900",
              letterSpacing: "-0.02em",
              lineHeight: "1.2",
              transform: "scaleY(1.1)",
            }}
          >
            VIDEO PODCAST
          </h1>
        </div>
      </div>

      {/* Bottom Section - White Background */}
      <div className="bg-white px-6 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto text-center">
          <p
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-black tracking-wide leading-relaxed uppercase font-semibold"
            style={{
              transform: "scaleY(1.05)",
              lineHeight: "1.4",
            }}
          >
            DISCOVER THE LATEST INSIGHTS FROM CAPTAIN SMART INTO HIS VENTURES,
            STRATEGIES, AND GROUNDBREAKING INITIATIVES THAT ARE SURE TO INSPIRE
            AND INFORM.
          </p>
        </div>
      </div>
    </div>
  );
}
