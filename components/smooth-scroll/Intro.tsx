"use client";
import React, { useLayoutEffect, useRef } from "react";
import styles from "./Intro.module.css";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Raleway } from "next/font/google";

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["700"],
});

export default function Intro() {
  const background = useRef(null);
  const introImage = useRef(null);
  const titleRef = useRef(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Main background and image animation - delayed trigger
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: document.documentElement,
        scrub: 1.5, // Smoother scrubbing
        start: "top+=500px", // Start animation after scrolling 500px more
        end: "+=1000px", // Longer animation duration
      },
    });

    timeline
      .from(background.current, {
        clipPath: `inset(15%)`,
        ease: "power2.out",
      })
      .to(
        introImage.current,
        {
          height: "200px",
          ease: "power2.out",
        },
        0
      );

    // Smooth text animation
    gsap.fromTo(
      titleRef.current,
      {
        opacity: 0,
        y: 50,
        scale: 0.9,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: titleRef.current,
          start: "top 80%",
          end: "top 50%",
          toggleActions: "play none none reverse",
        },
      }
    );

    // Image reveal animation - starts hidden and reveals on scroll
    gsap.fromTo(
      introImage.current,
      {
        clipPath: "inset(100% 0% 0% 0%)", // Start completely hidden from top
        opacity: 1,
        scale: 1,
      },
      {
        clipPath: "inset(0% 0% 0% 0%)", // Reveal the full image
        duration: 1.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: introImage.current,
          start: "top 85%",
          end: "top 50%",
          toggleActions: "play none none reverse",
        },
      }
    );
  }, []);

  return (
    <div className={styles.homeHeader}>
      <div className={styles.backgroundImage} ref={background}>
        <Image
          src={"/images/house.jpg"}
          fill={true}
          alt="background image"
          priority={true}
          className="filter grayscale brightness-50"
        />
      </div>
      <div className={styles.intro}>
        <div
          ref={introImage}
          data-scroll
          data-scroll-speed="0.3"
          className={styles.introImage}
        >
          <Image
            src={"/images/kwame2.png"}
            alt="intro image"
            fill={true}
            priority={true}
          />
        </div>
        <h1 ref={titleRef} className={raleway.className}>
          ONE GHANA
        </h1>
      </div>
    </div>
  );
}
