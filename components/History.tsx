"use client";
import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const History = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineLineRef = useRef<HTMLDivElement>(null);
  const timelineItemsRef = useRef<HTMLDivElement[]>([]);
  const imageRefs = useRef<HTMLDivElement[]>([]);
  const yearBadgeRefs = useRef<HTMLDivElement[]>([]);
  const titleRefs = useRef<HTMLHeadingElement[]>([]);
  const locationRefs = useRef<HTMLDivElement[]>([]);
  const descriptionRefs = useRef<HTMLParagraphElement[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const historyData = [
    {
      year: "1980",
      title: "BORN",
      location: "CENTRAL REGION, GHANA",
      description:
        "Blessed Godsbrain Yirenkyi Smart was born on May 5, 1980, in the Central Region of Ghana. He hails from a Fante background with roots in Gomoa Techiman, setting the foundation for his future as Ghana's most outspoken media personality.",
      image: "/history/kid.jpg",
      side: "left",
    },
    {
      year: "2000",
      title: "EDUCATION & EARLY CAREER",
      location: "KUMASI",
      description:
        "After completing secondary education at Apam Senior High School, he obtained a diploma in Mass Communication and degree from Garden City University College. Started his media journey at Fox FM in Kumasi with modest roles.",
      image: "/history/family.jpg",
      side: "right",
    },
    {
      year: "2013",
      title: "MEDIA BREAKTHROUGH",
      location: "ACCRA",
      description:
        "Joined Adom FM where he gained prominence hosting the morning show 'Dwaso Nsem'. His fearless commentary on politics and social issues quickly made him a household name across Ghana, establishing his reputation as an uncompromising voice.",
      image: "/history/adult.jpeg",
      side: "left",
    },
  ];

  const addToTimelineItemsRef = (el: HTMLDivElement | null) => {
    if (el && !timelineItemsRef.current.includes(el)) {
      timelineItemsRef.current.push(el);
    }
  };

  const addToYearBadgeRefs = (el: HTMLDivElement | null) => {
    if (el && !yearBadgeRefs.current.includes(el)) {
      yearBadgeRefs.current.push(el);
    }
  };

  const addToTitleRefs = (el: HTMLHeadingElement | null) => {
    if (el && !titleRefs.current.includes(el)) {
      titleRefs.current.push(el);
    }
  };

  const addToLocationRefs = (el: HTMLDivElement | null) => {
    if (el && !locationRefs.current.includes(el)) {
      locationRefs.current.push(el);
    }
  };

  const addToDescriptionRefs = (el: HTMLParagraphElement | null) => {
    if (el && !descriptionRefs.current.includes(el)) {
      descriptionRefs.current.push(el);
    }
  };

  const addToImageRefs = (el: HTMLDivElement | null) => {
    if (el && !imageRefs.current.includes(el)) {
      imageRefs.current.push(el);
    }
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Set initial states
      gsap.set(titleRef.current, { opacity: 0, y: 50 });
      gsap.set(timelineLineRef.current, { height: 0 });
      gsap.set(imageRefs.current, { opacity: 0 });
      gsap.set(yearBadgeRefs.current, { opacity: 0, scale: 0 });
      gsap.set(titleRefs.current, { opacity: 0, y: 30 });
      gsap.set(locationRefs.current, { opacity: 0, x: -30 });
      gsap.set(descriptionRefs.current, { opacity: 0, y: 40 });
      gsap.set(buttonRef.current, { opacity: 0, y: 30 });

      // Animate title on scroll
      gsap.to(titleRef.current, {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: titleRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      });

      // Animate timeline line progressively with smooth height animation
      gsap.to(timelineLineRef.current, {
        height: "100%",
        duration: 3,
        ease: "power2.out",
        scrollTrigger: {
          trigger: timelineRef.current,
          start: "top 60%",
          end: "bottom 40%",
          scrub: 1,
        },
      });

      // Animate timeline items with different animations for images and text
      timelineItemsRef.current.forEach((item, index) => {
        // Simple image fade-in animation
        gsap.to(imageRefs.current[index], {
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: item,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        });

        // Text animations timeline - different from images
        const textTl = gsap.timeline({
          scrollTrigger: {
            trigger: item,
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        });

        // Year badge pops in
        textTl.to(yearBadgeRefs.current[index], {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          ease: "back.out(1.7)",
        });

        // Title slides down
        textTl.to(
          titleRefs.current[index],
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
          },
          "-=0.2"
        );

        // Location slides from left
        textTl.to(
          locationRefs.current[index],
          {
            opacity: 1,
            x: 0,
            duration: 0.6,
            ease: "power2.out",
          },
          "-=0.4"
        );

        // Description fades up
        textTl.to(
          descriptionRefs.current[index],
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power2.out",
          },
          "-=0.3"
        );
      });

      // Animate button
      gsap.to(buttonRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: buttonRef.current,
          start: "top 90%",
          toggleActions: "play none none reverse",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Main Title */}
        <h2
          ref={titleRef}
          className="text-2xl sm:text-3xl lg:text-4xl font-black text-black mb-16 text-left leading-tight"
          style={{
            fontFamily: "Arial Black, Arial, sans-serif",
            letterSpacing: "-0.01em",
            fontWeight: 900,
            textTransform: "uppercase",
          }}
        >
          FROM HUMBLE
          <br />
          BEGINNINGS
        </h2>

        {/* Timeline */}
        <div ref={timelineRef} className="relative">
          {/* Central Timeline Line */}
          <div
            ref={timelineLineRef}
            className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gray-300"
          ></div>

          {/* Timeline Items */}
          <div className="space-y-20">
            {historyData.map((item, index) => (
              <div
                key={index}
                ref={addToTimelineItemsRef}
                className="relative flex items-center"
              >
                {/* Year Badge */}
                <div className="absolute left-1/2 transform -translate-x-1/2 z-10">
                  <div
                    ref={addToYearBadgeRefs}
                    className="bg-black text-white px-3 py-1 text-lg sm:text-xl font-bold"
                  >
                    {item.year}
                  </div>
                </div>

                {/* Content Layout */}
                <div
                  className={`w-full flex items-center ${
                    item.side === "left" ? "flex-row" : "flex-row-reverse"
                  }`}
                >
                  {/* Image Side */}
                  <div className="w-1/2 px-8">
                    <div
                      className={`${item.side === "left" ? "pr-16" : "pl-16"}`}
                    >
                      <div
                        ref={addToImageRefs}
                        className="timeline-image relative aspect-[3/2] overflow-hidden bg-gray-200"
                      >
                        <Image
                          src={item.image}
                          alt={`Captain Smart ${item.title} - ${item.year}`}
                          fill
                          className="object-cover object-center"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Content Side */}
                  <div className="w-1/2 px-8">
                    <div
                      className={`timeline-content ${
                        item.side === "left" ? "pl-16" : "pr-16"
                      }`}
                    >
                      <h3
                        ref={addToTitleRefs}
                        className="text-lg sm:text-xl font-bold text-black mb-2"
                      >
                        {item.title}
                      </h3>
                      <div
                        ref={addToLocationRefs}
                        className="flex items-center mb-3"
                      >
                        <MapPin className="text-black mr-2 w-4 h-4" />
                        <span className="text-black font-semibold text-sm">
                          {item.location}
                        </span>
                      </div>
                      <p
                        ref={addToDescriptionRefs}
                        className="text-gray-700 leading-relaxed text-sm"
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* See Full Timeline Button */}
        <div className="flex justify-center mt-20">
          <Button
            ref={buttonRef}
            variant="outline"
            className="border-2 border-black text-black hover:bg-black hover:text-white px-8 py-3 text-lg font-semibold rounded-full transition-all duration-300"
          >
            SEE FULL TIMELINE
          </Button>
        </div>
      </div>
    </section>
  );
};

export default History;
