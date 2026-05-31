"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

const TABS = [
  { href: "/workspace/shinten", label: "新店管理" },
  { href: "/workspace/todo", label: "ToDo" },
  { href: "/workspace/shoondan", label: "新規商談" },
] as const;

export function WorkspaceNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-border bg-card px-4 py-1.5">
      {TABS.map((tab) => (
        <Button
          key={tab.href}
          variant={pathname.startsWith(tab.href) ? "default" : "ghost"}
          size="sm"
          render={<Link href={tab.href} />}
        >
          {tab.label}
        </Button>
      ))}
    </nav>
  );
}
