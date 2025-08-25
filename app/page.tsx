"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { gsap } from "gsap";

import { Playfair_Display, Press_Start_2P } from "next/font/google";
import Link from "next/link";
import NewsAndStories from "@/components/NewsAndStories";
import History from "@/components/History";
import Navigation from "@/components/Navigation";
import NavigationTrigger from "@/components/NavigationTrigger";
import ExploreSheet from "@/components/ExploreSheet";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const pressStart2P = Press_Start_2P({
  subsets: ["latin"],
  weight: ["400"],
});

export default function HomePage() {
  // —— new: grab your NextAuth session (with accessToken & refreshToken)
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isExploreSheetOpen, setIsExploreSheetOpen] = useState(false);

  // Refs for animations
  const navRef = useRef<HTMLElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuItemsRef = useRef<HTMLDivElement[]>([]);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const centerSvgRef = useRef<SVGSVGElement>(null);
  const smartRef = useRef<HTMLHeadingElement>(null);

  // Sample images for the slideshow (you can replace with your actual image URLs)
  const slides = ["/home images/cap.png"];

  // Auto-slide every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 10000);

    return () => clearInterval(timer);
  }, [slides.length]);

  // Initial page load animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Set initial states to prevent FOUC
      gsap.set(navRef.current, { y: -100, opacity: 0 });
      gsap.set(titleRef.current, { scale: 0.8, opacity: 0 });
      gsap.set(descriptionRef.current, { y: 30, opacity: 0 });
      gsap.set(buttonRef.current, { y: 20, opacity: 0 });
      gsap.set(scrollIndicatorRef.current, { x: 20, opacity: 0 });

      // Animate navigation
      gsap.to(navRef.current, {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: "power3.out",
        delay: 0.5,
      });

      // Animate hero content with stagger
      const tl = gsap.timeline({ delay: 1 });

      tl.to(titleRef.current, {
        scale: 1,
        opacity: 1,
        duration: 1.2,
        ease: "power3.out",
      })
        .to(
          descriptionRef.current,
          { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
          "-=0.6"
        )
        .to(
          buttonRef.current,
          { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
          "-=0.4"
        )
        .to(
          scrollIndicatorRef.current,
          { x: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
          "-=0.3"
        );

      // Subtle floating animation for scroll indicator
      gsap.to(scrollIndicatorRef.current, {
        y: -10,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
        delay: 1.6, // Start after the initial animation
      });

      // Subtle floating animations for text
      gsap.to(titleRef.current, {
        y: -3,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
        delay: 2, // Start after initial animations
      });

      gsap.to(smartRef.current, {
        y: -3,
        duration: 10,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
        delay: 2.5, // Slightly offset from CAPTAIN
      });
    });

    return () => ctx.revert();
  }, []);

  // Mobile menu animations
  useEffect(() => {
    if (isMobileMenuOpen && mobileMenuRef.current) {
      gsap.set(mobileMenuRef.current, { opacity: 0, y: -20 });
      gsap.set(mobileMenuItemsRef.current, { opacity: 0, x: -30 });

      const tl = gsap.timeline();
      tl.to(mobileMenuRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out",
      }).to(
        mobileMenuItemsRef.current,
        {
          opacity: 1,
          x: 0,
          duration: 0.3,
          stagger: 0.1,
          ease: "power2.out",
        },
        "-=0.1"
      );
    }
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => {
    if (mobileMenuRef.current) {
      const tl = gsap.timeline({
        onComplete: () => setIsMobileMenuOpen(false),
      });

      tl.to(mobileMenuItemsRef.current, {
        opacity: 0,
        x: -30,
        duration: 0.2,
        stagger: 0.05,
        ease: "power2.in",
      }).to(
        mobileMenuRef.current,
        {
          opacity: 0,
          y: -20,
          duration: 0.2,
          ease: "power2.in",
        },
        "-=0.1"
      );
    } else {
      setIsMobileMenuOpen(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const addToMobileMenuItemsRef = (el: HTMLDivElement | null) => {
    if (el && !mobileMenuItemsRef.current.includes(el)) {
      mobileMenuItemsRef.current.push(el);
    }
  };

  // Clear mobile menu items refs when menu closes
  useEffect(() => {
    if (!isMobileMenuOpen) {
      mobileMenuItemsRef.current = [];
    }
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-white">
      {/* New Navigation Components */}
      <NavigationTrigger
        onClick={() => setIsNavOpen(true)}
        isNavOpen={isNavOpen}
      />
      <Navigation isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />

      {/* Navigation */}
      <nav
        ref={navRef}
        className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 sm:p-6 lg:px-12"
      >
        <Link href={"/admin"}>
          <div className="text-white text-xl sm:text-2xl font-serif italic hidden sm:block">
            <svg
              width="40"
              height="38"
              viewBox="0 0 122 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="animate-spin"
              style={{ animationDuration: "30s" }}
            >
              <circle cx="60.5" cy="60.5" r="12.5" fill="white" />
              <circle cx="61" cy="61" r="32" stroke="white" strokeWidth="13" />
              <circle cx="114.5" cy="59.5" r="7.5" fill="white" />
              <circle
                cx="48.4914"
                cy="112.416"
                r="7.5"
                transform="rotate(105 48.4914 112.416)"
                fill="white"
              />
              <circle
                cx="15.1597"
                cy="32.2331"
                r="7.5"
                transform="rotate(-163.235 15.1597 32.2331)"
                fill="white"
              />
              <circle
                cx="74.3445"
                cy="8.34457"
                r="7.5"
                transform="rotate(-73.2353 74.3445 8.34457)"
                fill="white"
              />
              <circle cx="110.5" cy="83.5" r="7.5" fill="white" />
              <circle
                cx="24.9493"
                cy="100.342"
                r="7.5"
                transform="rotate(105 24.9493 100.342)"
                fill="white"
              />
              <circle
                cx="94.6292"
                cy="19.9858"
                r="7.5"
                transform="rotate(-73.2353 94.6292 19.9858)"
                fill="white"
              />
              <circle cx="94.5" cy="102.5" r="7.5" fill="white" />
              <circle
                cx="10.1856"
                cy="81.1856"
                r="7.5"
                transform="rotate(105 10.1856 81.1856)"
                fill="white"
              />
              <circle
                cx="31.1945"
                cy="16.1323"
                r="7.5"
                transform="rotate(-163.235 31.1945 16.1323)"
                fill="white"
              />
              <circle
                cx="108.445"
                cy="35.3794"
                r="7.5"
                transform="rotate(-73.2353 108.445 35.3794)"
                fill="white"
              />
              <circle cx="71.5" cy="112.5" r="7.5" fill="white" />
              <circle
                cx="8.1856"
                cy="57.1856"
                r="7.5"
                transform="rotate(105 8.1856 57.1856)"
                fill="white"
              />
              <circle
                cx="53.5173"
                cy="8.36865"
                r="7.5"
                transform="rotate(-163.235 53.5173 8.36865)"
                fill="white"
              />
            </svg>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link href={"/smart-news"}>
            <div className="text-white hover:text-gray-300 transition-colors font-medium cursor-pointer">
              SMART NEWS
            </div>
          </Link>
          {/* <Link href={"/video-and-podcast"}>
            <div className="text-white hover:text-gray-300 transition-colors font-medium cursor-pointer">
              VIDEO & PODCAST
            </div>
          </Link> */}
          <Link href={"/expose-corner"}>
            <div className="text-white hover:text-gray-300 transition-colors font-medium cursor-pointer">
              EXPOSE CORNER
            </div>
          </Link>

          {/* <Link href={"/store"}>
            <div className="text-white hover:text-gray-300 transition-colors font-medium cursor-pointer">
              MERCHANDISE STORE
            </div>
          </Link>
          <Link href={"/sneakers"}>
            <div className="text-white hover:text-gray-300 transition-colors font-medium cursor-pointer">
              DONATIONS & SUPPORT
            </div>
          </Link> */}
        </div>

        {/* Mobile Navigation & Profile */}
        <div className="flex items-center space-x-3">
          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Profile */}
          <div></div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden absolute top-full left-0 right-0 bg-black/90 backdrop-blur-sm"
          >
            <div className="flex flex-col space-y-4 p-6">
              <Link href={"/smart-news"} onClick={closeMobileMenu}>
                <div
                  ref={addToMobileMenuItemsRef}
                  className="text-white hover:text-gray-300 transition-colors font-medium cursor-pointer text-lg"
                >
                  SMART NEWS
                </div>
              </Link>
              <Link href={"/video-and-podcast"} onClick={closeMobileMenu}>
                <div
                  ref={addToMobileMenuItemsRef}
                  className="text-white hover:text-gray-300 transition-colors font-medium cursor-pointer text-lg"
                >
                  VIDEO & PODCAST
                </div>
              </Link>
              <Link href={"/expose-corner"} onClick={closeMobileMenu}>
                <div
                  ref={addToMobileMenuItemsRef}
                  className="text-white hover:text-gray-300 transition-colors font-medium cursor-pointer text-lg"
                >
                  EXPOSE CORNER
                </div>
              </Link>
              <Link href={"/store"} onClick={closeMobileMenu}>
                <div
                  ref={addToMobileMenuItemsRef}
                  className="text-white hover:text-gray-300 transition-colors font-medium cursor-pointer text-lg"
                >
                  MERCHANDISE STORE
                </div>
              </Link>
              <Link href={"/sneakers"} onClick={closeMobileMenu}>
                <div
                  ref={addToMobileMenuItemsRef}
                  className="text-white hover:text-gray-300 transition-colors font-medium cursor-pointer text-lg"
                >
                  DONATIONS & SUPPORT
                </div>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section with Slideshow */}
      <section className="relative h-screen flex items-center overflow-hidden">
        {/* Background Images Slideshow */}
        <div className="absolute inset-0">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={slide}
                alt={`Fashion slide ${index + 1}`}
                fill
                className="object-cover object-center"
                priority={index === 0}
              />
            </div>
          ))}
          {/* Semi-transparent overlay */}
          <div className="absolute inset-0 bg-black/40"></div>

          {/* Animated colorful gradient overlay - bottom 1/3 only */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3">
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(-45deg, 
                  rgba(255, 100, 100, 0.2) 0%, 
                  rgba(255, 255, 150, 0.2) 25%, 
                  rgba(150, 255, 150, 0.2) 50%, 
                  rgba(255, 255, 150, 0.2) 75%, 
                  rgba(255, 100, 100, 0.2) 100%
                )`,
                backgroundSize: "300% 300%",
                animation: "gradientMove 15s linear infinite",
                maskImage:
                  "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 40%, rgba(0,0,0,0.4) 70%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 40%, rgba(0,0,0,0.4) 70%, transparent 100%)",
              }}
            ></div>
          </div>

          <style jsx>{`
            @keyframes gradientMove {
              0% {
                background-position: 0% 50%;
              }
              50% {
                background-position: 100% 50%;
              }
              100% {
                background-position: 0% 50%;
              }
            }
          `}</style>
        </div>

        {/* Hero Content */}
        <div ref={heroContentRef} className="relative z-10 w-full min-h-screen">
          <div className="w-full h-screen relative">
            {/* CAPTAIN - Far Left, Lower */}
            <div className="absolute left-8 sm:left-12 md:left-16 lg:left-20 bottom-64 sm:bottom-68 md:bottom-72">
              <h1
                ref={titleRef}
                className={`${pressStart2P.className} text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] leading-none tracking-wider`}
                style={{
                  color: "rgba(255, 255, 255, 0.4)",
                  textShadow: "0 0 30px rgba(255, 255, 255, 0.3)",
                  mixBlendMode: "overlay",
                }}
              >
                CAPTAIN
              </h1>
            </div>

            {/* SMART - Far Right, Lower Bottom */}
            <div className="absolute right-8 sm:right-12 md:right-16 lg:right-20 bottom-16 sm:bottom-20 md:bottom-24">
              <h1
                ref={smartRef}
                className={`${pressStart2P.className} text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] leading-none tracking-wider`}
                style={{
                  color: "rgba(255, 255, 255, 0.4)",
                  textShadow: "0 0 30px rgba(255, 255, 255, 0.3)",
                  mixBlendMode: "overlay",
                }}
              >
                SMART
              </h1>
            </div>

            {/* Explore Button - At Very Bottom of Screen */}
            <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0">
              <div className="py-4 px-16">
                <button
                  onClick={() => setIsExploreSheetOpen(true)}
                  className="bg-white/20 backdrop-blur-md text-white px-12 py-4 text-lg font-semibold tracking-wide uppercase border border-white/30 rounded-none transform transition duration-150 ease-out hover:-translate-y-1 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                >
                  EXPLORE
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          ref={scrollIndicatorRef}
          className="hidden sm:block absolute bottom-8 right-8 text-white"
        >
          <div className="w-px h-16 bg-white/50 mx-auto mb-2"></div>
          <ChevronRight className="w-6 h-6 rotate-90" />
        </div>

        {/* Slide navigation arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-2 sm:left-8 top-1/2 transform -translate-y-1/2 z-40 text-white hover:text-gray-300 transition-colors p-2 sm:p-0 hover:scale-110 transition-transform duration-200"
        >
          <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 sm:right-8 top-1/2 transform -translate-y-1/2 z-40 text-white hover:text-gray-300 transition-colors p-2 sm:p-0 hover:scale-110 transition-transform duration-200"
        >
          <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      </section>
      <div className="w-full">
        <History />
      </div>
      <div className="w-full">
        <NewsAndStories />
      </div>

      {/* Explore Sheet */}
      <ExploreSheet
        isOpen={isExploreSheetOpen}
        onClose={() => setIsExploreSheetOpen(false)}
      />
    </div>
  );
}
