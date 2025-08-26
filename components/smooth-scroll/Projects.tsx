import React, { useState, useLayoutEffect, useRef } from "react";
import styles from "./Projects.module.css";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const projects = [
  {
    title: "Radio Host",
    src: "newone.png",
  },
  {
    title: "TV Presenter",
    src: "newone.png",
  },
  {
    title: "Social Commentator",
    src: "newone.png",
  },
  {
    title: "Community Leader",
    src: "newone.png",
  },
];

export default function Projects() {
  const [selectedProject, setSelectedProject] = useState(0);
  const container = useRef(null);
  const imageContainer = useRef(null);
  const textColumn1 = useRef(null);
  const textColumn2 = useRef(null);
  const projectListRef = useRef(null);
  const underlineRefs = useRef([]);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Pin the image
    ScrollTrigger.create({
      trigger: imageContainer.current,
      pin: true,
      start: "top-=100px",
      end: () =>
        `+=${container.current.offsetHeight - window.innerHeight + 100}`,
    });

    // Animate text columns
    gsap.fromTo(
      textColumn1.current,
      {
        opacity: 0,
        y: 40,
        x: -20,
      },
      {
        opacity: 1,
        y: 0,
        x: 0,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: textColumn1.current,
          start: "top 80%",
          end: "top 50%",
          toggleActions: "play none none reverse",
        },
      }
    );

    gsap.fromTo(
      textColumn2.current,
      {
        opacity: 0,
        y: 40,
        x: 20,
      },
      {
        opacity: 1,
        y: 0,
        x: 0,
        duration: 1,
        ease: "power2.out",
        delay: 0.2,
        scrollTrigger: {
          trigger: textColumn2.current,
          start: "top 80%",
          end: "top 50%",
          toggleActions: "play none none reverse",
        },
      }
    );

    // Animate project list items
    const projectItems = projectListRef.current.children;
    gsap.fromTo(
      projectItems,
      {
        opacity: 0,
        y: 30,
        x: -30,
      },
      {
        opacity: 1,
        y: 0,
        x: 0,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.15,
        scrollTrigger: {
          trigger: projectListRef.current,
          start: "top 85%",
          end: "top 60%",
          toggleActions: "play none none reverse",
        },
      }
    );

    // Animate underlines sequentially
    gsap.set(underlineRefs.current, {
      scaleX: 0,
      transformOrigin: "left center",
    });

    gsap.to(underlineRefs.current, {
      scaleX: 1,
      duration: 1.2,
      ease: "power2.out",
      stagger: 0.5,
      scrollTrigger: {
        trigger: projectListRef.current,
        start: "top 75%",
        end: "top 50%",
        toggleActions: "play none none reverse",
      },
    });
  }, []);

  return (
    <div ref={container} className={styles.projects}>
      <div className={styles.projectDescription}>
        <div ref={imageContainer} className={styles.imageContainer}>
          <Image
            src={`/images/${projects[selectedProject].src}`}
            fill={true}
            alt="project image"
            priority={true}
          />
        </div>
        <div ref={textColumn1} className={styles.column}>
          <p>
            Captain Smart shares wisdom about unity and progress. His advice
            guides people toward better choices and stronger communities.
          </p>
        </div>
        <div ref={textColumn2} className={styles.column}>
          <p>
            Through his journey, Captain Smart has learned that true leadership
            comes from serving others. He believes in the power of education and
            honest communication to transform lives.
          </p>
        </div>
      </div>
      <div ref={projectListRef} className={styles.projectList}>
        {projects.map((project, index) => {
          return (
            <div
              key={index}
              onMouseOver={() => {
                setSelectedProject(index);
              }}
              className={styles.projectEl}
            >
              <h2>
                {project.title}
                <div
                  ref={(el) => (underlineRefs.current[index] = el)}
                  className={styles.underline}
                />
              </h2>
            </div>
          );
        })}
      </div>
    </div>
  );
}
