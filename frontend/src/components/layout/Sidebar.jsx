import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Sparkles, 
  Layers, 
  Award, 
  MessageSquare, 
  Bookmark,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Notes', path: '/notes', icon: FileText },
    { name: 'AI Summaries', path: '/summaries', icon: Sparkles },
    { name: 'Flashcards', path: '/flashcards', icon: Layers },
    { name: 'Quizzes', path: '/quizzes', icon: Award },
    { name: 'AI Tutor Chat', path: '/chat', icon: MessageSquare },
    { name: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
  ];

  return (
    <aside 
      className={`glass border-r border-border/80 h-[calc(100vh-73px)] sticky top-[73px] transition-all duration-300 z-30 flex flex-col justify-between ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      <div className="flex flex-col gap-2 p-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group font-medium ${
                isActive 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`
            }
          >
            <item.icon size={20} className="shrink-0" />
            <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
              isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0 pointer-events-none'
            }`}>
              {item.name}
            </span>
          </NavLink>
        ))}
      </div>

      <div className="p-4 flex justify-end">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
          aria-label="Toggle Sidebar"
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
