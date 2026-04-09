"use client";

import { usePathname } from "next/navigation";

type NavItem = {
  key: "explore" | "my-goals" | "profile";
  label: string;
};

const items: NavItem[] = [
  { key: "explore", label: "Explore" },
  { key: "my-goals", label: "My Goals" },
  { key: "profile", label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  const activeKey: NavItem["key"] =
    pathname?.startsWith("/profile") ? "profile" : pathname?.startsWith("/my-goals") ? "my-goals" : "explore";

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 border-t border-slate-200 bg-white/95 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-[450px] items-stretch justify-between px-2 py-1.5 gap-1">
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <button
              key={item.key}
              type="button"
              className={
                "flex-1 min-h-[44px] rounded-full text-xs font-medium " +
                "flex items-center justify-center px-2 " +
                (isActive
                  ? "bg-[#35D07F] text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 border border-slate-200")
              }
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

