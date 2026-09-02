"use client";

import { Bell, Search, Settings, Menu, LogOut, User, HelpCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function Navbar({ onMenu }: { onMenu: () => void }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications = [
    { id: 1, title: "New candidate match", message: "Priya Nair matched 92% for ML Engineer role", time: "2m ago", unread: true },
    { id: 2, title: "Interview scheduled", message: "Liam Chen interview tomorrow at 10 AM", time: "1h ago", unread: true },
    { id: 3, title: "Offer accepted", message: "Sofia Martinez accepted Senior ML Engineer offer", time: "3h ago", unread: false },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-sf-tertiary bg-white/80 backdrop-blur-xl">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenu}
            className="p-2 rounded-xl text-tx-tertiary hover:bg-sf-secondary hover:text-tx-primary lg:hidden"
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <div className="hidden sm:flex items-center relative">
            <Search size={16} className="absolute left-3 text-tx-tertiary" />
            <input
              type="text"
              placeholder="Search candidates, jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 lg:w-80 h-10 pl-9 pr-4 rounded-xl border border-sf-tertiary bg-sf-secondary text-sm text-tx-primary placeholder:text-tx-muted focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
            />
            <kbd className="absolute right-3 hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded bg-sf-tertiary text-[10px] font-medium text-tx-tertiary">
              <span>⌘</span>K
            </kbd>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Help */}
          <button className="p-2.5 rounded-xl text-tx-tertiary hover:bg-sf-secondary hover:text-tx-primary transition-colors">
            <HelpCircle size={18} />
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl text-tx-tertiary hover:bg-sf-secondary hover:text-tx-primary transition-colors"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-danger-500 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-sf-tertiary bg-white shadow-xl animate-scale-in">
                <div className="flex items-center justify-between p-4 border-b border-sf-tertiary">
                  <h3 className="text-sm font-semibold text-tx-primary">Notifications</h3>
                  <button className="text-[10px] font-medium text-brand-600 hover:text-brand-700">
                    Mark all read
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-sf-tertiary last:border-0 hover:bg-sf-secondary/50 transition-colors cursor-pointer ${
                        notification.unread ? "bg-brand-50/30" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {notification.unread && (
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                        )}
                        <div className={notification.unread ? "" : "ml-5"}>
                          <p className="text-sm font-medium text-tx-primary">{notification.title}</p>
                          <p className="text-xs text-tx-tertiary mt-0.5">{notification.message}</p>
                          <p className="text-[10px] text-tx-muted mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-sf-tertiary">
                  <button className="w-full py-2 text-xs font-medium text-brand-600 hover:text-brand-700">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-sf-secondary transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white text-xs font-bold shadow-brand-sm">
                AK
              </div>
              <span className="hidden sm:block text-sm font-medium text-tx-primary">Admin</span>
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-sf-tertiary bg-white shadow-xl animate-scale-in overflow-hidden">
                <div className="p-4 border-b border-sf-tertiary">
                  <p className="text-sm font-semibold text-tx-primary">Admin User</p>
                  <p className="text-xs text-tx-tertiary">admin@talentos.ai</p>
                </div>
                <div className="p-2">
                  <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-tx-secondary hover:bg-sf-secondary hover:text-tx-primary transition-colors">
                    <User size={16} />
                    Profile
                  </button>
                  <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-tx-secondary hover:bg-sf-secondary hover:text-tx-primary transition-colors">
                    <Settings size={16} />
                    Settings
                  </button>
                </div>
                <div className="p-2 border-t border-sf-tertiary">
                  <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-danger-600 hover:bg-danger-50 transition-colors">
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
