"use client";

import { useScrollProgress } from "@/hooks/use-scroll-progress";

export function ScrollProgressBar() {
  const progress = useScrollProgress();

  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-line">
      <div
        className="h-full rounded-r-[3px] bg-rust transition-[width] duration-100 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
