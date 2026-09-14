"use client";

import { useEffect, useRef, useState } from "react";

export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState("");
  const intersecting = useRef(new Map<string, boolean>());

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    intersecting.current = new Map(ids.map((id) => [id, false]));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          intersecting.current.set(entry.target.id, entry.isIntersecting);
        });
        setActive(ids.find((id) => intersecting.current.get(id)) ?? "");
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  return active;
}
