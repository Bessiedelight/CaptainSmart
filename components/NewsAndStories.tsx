"use client";
import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface NewsItem {
  id: number;
  title: string;
  category: string;
  tags: string[];
  image: string;
  date: string;
}

const NewsAndStories = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);
  const navigationRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sample news data - you can replace with your actual data
  const newsItems: NewsItem[] = [
    {
      id: 1,
      title:
        "Steven Bartlett's FlightStory Appoints Guardian International CEO Claire Blunt As Chief Financial and Operating Officer",
      category: "UNCATEGORIZED",
      tags: ["INVESTMENTS", "STEVEN BARTLETT"],
      image: "/home images/cap1.png",
      date: "2024-01-15",
    },
    {
      id: 2,
      title: "Steven Bartlett Named In TIME100 Creators List 2025",
      category: "UNCATEGORIZED",
      tags: [],
      image: "/home images/kwame1.png",
      date: "2024-01-10",
    },
    {
      id: 3,
      title:
        "Steven Bartlett's FlightStory Buys Rights To New Three-way Auction",
      category: "NEWS",
      tags: [],
      image: "/home images/cap2.png",
      date: "2024-01-05",
    },
  ];

  // Add card to refs array
  const addToCardRefs = (el: HTMLDivElement | null) => {
    if (el && !cardRefs.current.includes(el)) {
      cardRefs.current.push(el);
    }
  };

  // Navigation functions with smooth animation
  const goToPrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : newsItems.length - 1;
    setCurrentIndex(newIndex);

    // Animate cards out and in
    gsap.to(cardRefs.current, {
      opacity: 0.7,
      scale: 0.95,
      duration: 0.2,
      ease: "power2.out",
      onComplete: () => {
        gsap.to(cardRefs.current, {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          ease: "power2.out",
        });
      },
    });
  };

  const goToNext = () => {
    const newIndex = currentIndex < newsItems.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);

    // Animate cards out and in
    gsap.to(cardRefs.current, {
      opacity: 0.7,
      scale: 0.95,
      duration: 0.2,
      ease: "power2.out",
      onComplete: () => {
        gsap.to(cardRefs.current, {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          ease: "power2.out",
        });
      },
    });
  };

  // Initial animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Set initial states
      gsap.set(titleRef.current, { opacity: 0, y: 30 });
      gsap.set(cardRefs.current, { opacity: 0, y: 50 });
      gsap.set(navigationRef.current, { opacity: 0, x: 30 });

      // Create scroll-triggered animation
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse",
        },
      });

      // Animate title
      tl.to(titleRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
      });

      // Animate cards with stagger
      tl.to(
        cardRefs.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: "power2.out",
        },
        "-=0.4"
      );

      // Animate navigation
      tl.to(
        navigationRef.current,
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          ease: "power2.out",
        },
        "-=0.3"
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Card hover animations - lighter effect
  const handleCardHover = (index: number, isHovering: boolean) => {
    const card = cardRefs.current[index];
    if (!card) return;

    const image = card.querySelector(".news-image");
    const overlay = card.querySelector(".news-overlay");
    const content = card.querySelector(".news-content");

    if (isHovering) {
      gsap.to(image, { scale: 1.03, duration: 0.4, ease: "power2.out" });
      gsap.to(overlay, { opacity: 0.2, duration: 0.3, ease: "power2.out" });
      gsap.to(content, { y: -3, duration: 0.3, ease: "power2.out" });
    } else {
      gsap.to(image, { scale: 1, duration: 0.4, ease: "power2.out" });
      gsap.to(overlay, { opacity: 0.3, duration: 0.3, ease: "power2.out" });
      gsap.to(content, { y: 0, duration: 0.3, ease: "power2.out" });
    }
  };

  return (
    <section
      ref={sectionRef}
      className="bg-black py-24 px-6 sm:px-8 lg:px-16 xl:px-20"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-20">
          <h2
            ref={titleRef}
            className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold tracking-wider"
          >
            NEWS & STORIES
          </h2>

          {/* Navigation Arrows */}
          <div ref={navigationRef} className="flex items-center space-x-3">
            <button
              onClick={goToPrevious}
              className="w-12 h-12 bg-white hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105"
            >
              <ChevronLeft className="w-5 h-5 text-black" />
            </button>
            <button
              onClick={goToNext}
              className="w-12 h-12 bg-white hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105"
            >
              <ChevronRight className="w-5 h-5 text-black" />
            </button>
          </div>
        </div>

        {/* News Cards Grid */}
        <div
          ref={cardsContainerRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16"
        >
          {newsItems.map((item, index) => (
            <div
              key={item.id}
              ref={addToCardRefs}
              className="group cursor-pointer"
              onMouseEnter={() => handleCardHover(index, true)}
              onMouseLeave={() => handleCardHover(index, false)}
            >
              {/* Image Container */}
              <div className="relative h-72 mb-8 overflow-hidden rounded-lg">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="news-image object-cover transition-transform duration-400"
                />
                <div className="news-overlay absolute inset-0 bg-black opacity-30 transition-opacity duration-300"></div>
              </div>

              {/* Content */}
              <div className="news-content space-y-4">
                {/* Tags */}
                <div className="flex flex-wrap gap-3">
                  <span className="px-4 py-2 bg-white text-black text-xs font-bold tracking-wider rounded-sm">
                    {item.category}
                  </span>
                  {item.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-4 py-2 border border-white text-white text-xs font-bold tracking-wider rounded-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h3 className="text-white text-xl font-bold leading-snug group-hover:text-white transition-colors duration-300 line-clamp-3">
                  {item.title}
                </h3>

                {/* Date */}
                <p className="text-gray-400 text-sm font-medium">
                  {new Date(item.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Navigation Dots */}
        <div className="flex justify-center mt-16 md:hidden">
          <div className="flex space-x-3">
            {newsItems.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "bg-white" : "bg-gray-600"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsAndStories;
