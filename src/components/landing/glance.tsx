"use client";

import { motion, useReducedMotion } from "motion/react";

import { GLANCE } from "@/content/landing";

const MARKS = [
  // skills-matched: a target/check
  <path key="a" d="M12 3v4M12 17v4M3 12h4M17 12h4" strokeLinecap="round" />,
  // transparent scoring: a bar breakdown
  <path key="b" d="M6 17V9M12 17V5M18 17v-4" strokeLinecap="round" />,
  // human-approved: a checkmark
  <path key="c" d="M5 12.5l4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />,
];

export function Glance() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="border-b border-border px-6 py-12">
      <ul className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-3">
        {GLANCE.map((item, i) => (
          <motion.li
            key={item.title}
            className="flex flex-col gap-2.5"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: reduceMotion ? 0.01 : 0.3, delay: i * (reduceMotion ? 0 : 0.08) }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              className="text-accent"
              aria-hidden="true"
            >
              {MARKS[i]}
            </svg>
            <h3 className="font-display font-semibold tracking-tight">{item.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{item.body}</p>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
