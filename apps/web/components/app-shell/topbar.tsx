"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import { logout } from "@/lib/api/auth";

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAppShell();
  const [value, setValue] = useState(pathname === "/search" ? (searchParams.get("q") ?? "") : "");

  useEffect(() => {
    if (pathname !== "/search") return;
    const timer = setTimeout(() => {
      const qs = value.trim() ? `?q=${encodeURIComponent(value.trim())}` : "";
      router.replace(`/search${qs}`);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleFocus = () => {
    if (pathname !== "/search") {
      router.push(value.trim() ? `/search?q=${encodeURIComponent(value.trim())}` : "/search");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-line bg-cream/90 px-7.5 py-4 backdrop-blur-md">
      <div className="flex min-w-55 flex-1 items-center gap-2.75 rounded-full border border-line bg-paper px-4.5 py-2.75">
        <span className="h-3.25 w-3.25 shrink-0 rounded-full border-2 border-[#8a8067]" aria-hidden="true" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={handleFocus}
          placeholder="Search files and folders"
          className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-ink outline-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 rounded-full border border-line bg-paper py-1.5 pr-3.5 pl-1.5"
        >
          <span className="flex h-7.5 w-7.5 items-center justify-center overflow-hidden rounded-full bg-gold font-display text-sm">
            {user?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              (user?.name ?? "?").charAt(0).toUpperCase()
            )}
          </span>
          <span className="text-sm font-semibold">{user?.name.split(" ")[0] ?? "..."}</span>
        </Link>
        <button onClick={handleLogout} className="font-mono text-[11px] tracking-[0.1em] text-ink-muted uppercase">
          Log out
        </button>
      </div>
    </div>
  );
}
