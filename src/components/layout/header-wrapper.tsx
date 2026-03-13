"use client";

import { useEffect, useRef, useState } from "react";

export function HeaderWrapper({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const threshold = 10;

    const onScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 60) {
        setHidden(false);
      } else if (currentY - lastScrollY.current > threshold) {
        setHidden(true);
      } else if (lastScrollY.current - currentY > threshold) {
        setHidden(false);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`sticky top-0 z-50 transition-transform duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      {children}
    </div>
  );
}
