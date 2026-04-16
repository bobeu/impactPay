"use client";

import { usePathname } from "next/navigation";
import { Compass, FolderHeart, User } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  key: "explore" | "my-goals" | "profile";
  label: string;
  icon: typeof Compass;
  href: string;
};

const items: NavItem[] = [
  { key: "explore", label: "Explore", icon: Compass, href: "/" },
  { key: "my-goals", label: "My Goals", icon: FolderHeart, href: "/my-goals" },
  { key: "profile", label: "Profile", icon: User, href: "/profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  const activeKey: NavItem["key"] =
    pathname?.startsWith("/profile") ? "profile" : pathname?.startsWith("/my-goals") ? "my-goals" : "explore";

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 border-t border-slate-100 bg-white/80 backdrop-blur-md z-50 transition-all duration-300"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-4 h-16">
        {items.map((item) => {
          const isActive = item.key === activeKey;
          const Icon = item.icon;
          return (
            <a
              key={item.key}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all duration-200 w-16 h-full border-t-2",
                isActive 
                  ? "border-primary text-primary" 
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {item.label}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

