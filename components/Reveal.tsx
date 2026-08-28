"use client";

// The scroll-reveal wrapper: it adds .is-visible when the block enters view,
// and the animation itself lives in CSS (.reveal in globals.css). The
// IntersectionObserver fires once and then disconnects; for a reduced-motion
// reader the CSS has already switched the movement off.

import { useEffect, useRef, type ReactNode } from "react";

export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("is-visible");
            io.disconnect();
          }
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${className}`} style={{ ["--d" as string]: `${delay}ms` }}>
      {children}
    </div>
  );
}
