"use client";

import { useEffect, useState } from "react";
import { animate } from "motion/react";

/** Ticks a number up once `active`. Demo data throughout the landing page, never a live value. */
export function Counter({
  value,
  active,
  reduceMotion,
  duration = 0.6,
}: {
  value: number;
  active: boolean;
  reduceMotion: boolean;
  duration?: number;
}) {
  const [display, setDisplay] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    // Reduced motion already has the right value from the initializer above — nothing to
    // animate, so there's nothing to synchronize here.
    if (!active || reduceMotion) return;
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [active, reduceMotion, value, duration]);

  return <>{display}</>;
}
