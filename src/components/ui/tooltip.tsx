"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function Tooltip({
  content,
  children,
}: {
  content: string;
  children: React.ReactNode;
}) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      const nextTop = rect.top > 48 ? rect.top - 10 : rect.bottom + 10;
      setPosition({
        top: nextTop,
        left: rect.left + rect.width / 2,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-flex"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
      >
        {children}
      </span>
      {isOpen
        ? createPortal(
            <div
              role="tooltip"
              className="pointer-events-none fixed z-[100] -translate-x-1/2 rounded-md bg-slate-950 px-2 py-1 text-[11px] font-medium text-white shadow-lg"
              style={{
                top: position.top,
                left: position.left,
                transform: `translate(-50%, ${position.top > 48 ? "-100%" : "0"})`,
              }}
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
