"use client";
import { useEffect } from "react";
import styles from "./page.module.css";
import Intro from "../../components/smooth-scroll/Intro";
import Description from "../../components/smooth-scroll/Description";
import Projects from "../../components/smooth-scroll/Projects";

export default function TestScroll() {
  useEffect(() => {
    (async () => {
      const LocomotiveScroll = (await import("locomotive-scroll")).default;
      const locomotiveScroll = new LocomotiveScroll();
    })();
  }, []);

  useEffect(() => {
    // Add black background to body for this page
    document.body.style.backgroundColor = "black";
    document.body.style.margin = "0px";

    return () => {
      // Clean up when leaving the page
      document.body.style.backgroundColor = "";
      document.body.style.margin = "";
    };
  }, []);

  return (
    <main className={styles.main}>
      <Intro />
      <Description />
      <Projects />
    </main>
  );
}
