"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Briefcase,
  Cpu,
  FileUp,
  Home,
  PieChart,
  Settings,
  Users,
  X,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    items: [
      { name: "Dashboard", href: "/", icon: Home },
      { name: "Analytics", href: "/analytics", icon: BarChart3, badge: "New" },
    ],
  },
  {
    title: "Recruitment",
    items: [
      { name: "Candidates", href: "/candidates", icon: Users },
      { name: "Jobs", href: "/jobs", icon: Briefcase },
      { name: "Matching", href: "/matching", icon: Cpu },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { name: "Reports", href: "/reports", icon: PieChart },
      { name: "Pipeline", href: "/pipeline", icon: FileUp },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Recruitment", "Intelligence"]);

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) =>
      prev.includes(title) ? prev.filter((g) => g !== title) : [...prev, title]
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white border-r border-sf-tertiary transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-sf-tertiary">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-brand-sm">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-tx-primary tracking-tight">TalentOS</span>
              <span className="block text-[10px] text-tx-tertiary font-medium">Intelligence</span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-tx-tertiary hover:bg-sf-secondary lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navGroups.map((group, idx) => (
            <div key={idx} className={idx > 0 ? "mt-6" : ""}>
              {group.title && (
                <button
                  onClick={() => toggleGroup(group.title!)}
                  className="flex items-center justify-between w-full px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-tx-tertiary hover:text-tx-secondary"
                >
                  <span>{group.title}</span>
                  {expandedGroups.includes(group.title!) ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                </button>
              )}
              {(!group.title || expandedGroups.includes(group.title)) && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-brand-50 text-brand-700 shadow-sm"
                            : "text-tx-secondary hover:bg-sf-secondary hover:text-tx-primary"
                        }`}
                      >
                        <Icon
                          size={18}
                          className={isActive ? "text-brand-600" : "text-tx-tertiary"}
                        />
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-full bg-brand-100 text-brand-700">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sf-tertiary">
          <div className="p-3 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/50 border border-brand-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-brand-600 text-white text-xs font-bold">
                AK
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-tx-primary truncate">Admin User</p>
                <p className="text-[10px] text-tx-tertiary truncate">admin@talentos.ai</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
