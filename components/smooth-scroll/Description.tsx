import React, { useLayoutEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";
import styles from "./Description.module.css";

const phrases = [
  "Is Ghana truly one nation?",
  "Can we unite as one people?",
  "What makes us Ghanaian?",
  "How do we build together?",
  "Are we stronger united?",
];

export default function Description() {
  return (
    <div className={styles.description}>
      {phrases.map((phrase, index) => {
        return (
          <AnimatedText key={index} index={index}>
            {phrase}
          </AnimatedText>
        );
      })}
    </div>
  );
}

function AnimatedText({
  children,
  index,
}: {
  children: string;
  index: number;
}) {
  const text = useRef(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Set initial state - very subtle
    gsap.set(text.current, {
      opacity: 0,
      y: 15,
    });

    // Simple, smooth entrance animation
    gsap.to(text.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power1.out",
      delay: index * 0.08, // Very subtle stagger
      scrollTrigger: {
        trigger: text.current,
        start: "top 85%",
        toggleActions: "play none none reverse",
      },
    });
  }, [index]);

  return <p ref={text}>{children}</p>;
}
