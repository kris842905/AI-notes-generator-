import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Bell, Sun, Moon, LogOut, User as UserIcon, Check } from 'lucide-react';
import api from '../../services/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      fetchNotifications();
      // Poll notifications every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Handle outside clicks to close notifications dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.slice(0, 5)); // Keep top 5 latest
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch unread notifications count', err);
    }
  };

  const handleNotificationsClick = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      await fetchNotifications();
      if (unreadCount > 0) {
        try {
          await api.post('/notifications/mark-read');
          setUnreadCount(0);
        } catch (err) {
          console.error('Failed to mark notifications read', err);
        }
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass border-b border-border/80 flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="text-white font-bold text-xl font-display">N</span>
        </div>
        <div>
          <span className="text-xl font-bold font-display tracking-tight bg-gradient-to-r from-primary to-indigo-600 dark:to-indigo-400 bg-clip-text text-transparent">
            AI Notes Generator
          </span>
          <span className="text-[10px] block font-semibold text-muted-foreground uppercase tracking-widest leading-none mt-0.5">
            Student Edition
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggler */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleNotificationsClick}
            className="p-2 rounded-xl bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full text-[10px] font-bold flex items-center justify-center border border-background animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-border bg-card p-4 shadow-xl animate-slide-up">
              <div className="flex items-center justify-between border-b pb-2 mb-2">
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount === 0 && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Check size={12} /> Read
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto scroll-thin">
                {notifications.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No notifications yet.</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-2.5 rounded-xl text-xs transition-colors duration-150 ${
                        notif.isRead ? 'bg-background/40' : 'bg-primary/5 dark:bg-primary/10 border border-primary/10'
                      }`}
                    >
                      <p className="font-medium text-foreground leading-relaxed">{notif.message}</p>
                      <span className="text-[10px] text-muted-foreground block mt-1">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 pl-4 border-l border-border/80">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-sm font-semibold text-foreground leading-none">{user.name}</span>
              <span className="text-[10px] font-medium text-muted-foreground leading-none mt-1">
                {user.role === 'ROLE_ADMIN' ? 'Admin' : 'Student'}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm">
              <UserIcon size={16} />
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-xl bg-secondary hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
