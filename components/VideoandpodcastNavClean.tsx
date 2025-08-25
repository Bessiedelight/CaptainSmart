"use client";
import { useState } from "react";
import NavigationTrigger from "@/components/NavigationTrigger";
import Navigation from "@/components/Navigation";

export default function VideoandpodcastNavClean() {
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

      {/* Main Hero Section - Black Background */}
      <div className="bg-black px-6 sm:px-8 lg:px-12 py-6 sm:py-8 lg:py-12">
        <div className="flex justify-between items-start mb-6 sm:mb-8">
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
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white tracking-tight uppercase"
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
    </div>
  );
}
