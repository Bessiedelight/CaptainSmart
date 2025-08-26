"use client";
import { useEffect } from "react";
import styles from "./SecondHome.module.css";
import Intro from "./smooth-scroll/Intro";
import Description from "./smooth-scroll/Description";
import Projects from "./smooth-scroll/Projects";

export default function SecondHome() {
  // useEffect(() => {
  //   (async () => {
  //     const LocomotiveScroll = (await import("locomotive-scroll")).default;
  //     const locomotiveScroll = new LocomotiveScroll();
  //   })();
  // }, []);

  return (
    <main className={styles.main}>
      <Intro />
      <Description />
      <Projects />
    </main>
  );
}
