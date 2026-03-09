import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Home, Loader2, LogOut, Send, Settings, Sparkles, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import BottomNav from './components/BottomNav';
import { clearLocalUser } from './lib/api';
import AdminScreen from './components/AdminScreen';
import DevotionalScreen from './components/DevotionalScreen';
import FriendsScreen from './components/FriendsScreen';
import GraceChatScreen from './components/GraceChatScreen';
import HomeScreen from './components/HomeScreen';
import LoginScreen from './components/LoginScreen';
import ProfileScreen from './components/ProfileScreen';
import SendGoodNewsScreen from './components/SendGoodNewsScreen';
import SharePage from './components/SharePage';
import WallScreen from './components/WallScreen';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useStreak } from './hooks/useStreak';
import { seedDefaultAds } from './lib/admin';
import { ScriptureEntry } from './types';

type Screen =
  | 'home'
  | 'send_goodnews'
  | 'wall'
  | 'friends'
  | 'profile'
  | 'devotional'
  | 'admin';

function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 bg-dawn dark:bg-dawn flex flex-col items-center justify-center gap-6"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-accent/15 blur-3xl" />
      </div>
      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        className="w-28 h-28 rounded-[2rem] bg-primary flex items-center justify-center shadow-2xl gold-glow"
      >
        <Sparkles className="w-14 h-14 text-white" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-gradient-gold">GoodNews</h1>
        <p className="text-muted-foreground text-sm mt-2">Spread the light, one scripture at a time</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </motion.div>
    </motion.div>
  );
}

// ─── Desktop Sidebar Nav ──────────────────────────────────────────────────────
function DesktopSidebar({ screen, onNavigate, user, onLogout, onGrace }: {
  screen: Screen;
  onNavigate: (s: string, data?: any) => void;
  user: any;
  onLogout: () => void;
  onGrace: () => void;
}) {
  const navItems = [
    { icon: Home,     label: 'Home',          screen: 'home' },
    { icon: Send,     label: 'Send Good News', screen: 'send_goodnews' },
    { icon: BookOpen, label: 'Wall',           screen: 'wall' },
    { icon: Users,    label: 'Friends',        screen: 'friends' },
    { icon: Settings, label: 'Profile',        screen: 'profile' },
  ];

  return (
    <div className="hidden lg:flex flex-col w-64 xl:w-72 h-screen bg-card border-r border-border sticky top-0 shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-3 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md gold-glow">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gradient-gold">GoodNews</h1>
          <p className="text-[10px] text-muted-foreground">Spread the light</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, screen: s }) => (
          <button
            key={s}
            onClick={() => onNavigate(s)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
              screen === s
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className="w-4.5 h-4.5 shrink-0" style={{ width: 18, height: 18 }} />
            {label}
          </button>
        ))}

        {/* Grace AI */}
        <button
          onClick={onGrace}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200"
        >
          <Sparkles className="shrink-0" style={{ width: 18, height: 18 }} />
          Ask Grace AI
        </button>
      </nav>

      {/* User profile footer */}
      <div className="px-3 py-4 border-t border-border space-y-2">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/50">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm shrink-0 overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              user?.displayName?.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{user?.displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.totalSparks || 0} sparks ✨</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut style={{ width: 14, height: 14 }} />
          Sign out
        </button>
      </div>
    </div>
  );
}

function AppInner() {
  const { user, loading } = useAuth();
  const { markActivity } = useStreak();
  const [showSplash, setShowSplash] = useState(true);
  const [screen, setScreen] = useState<Screen>('home');
  const [showGrace, setShowGrace] = useState(false);
  const [screenData, setScreenData] = useState<any>(null);

  useEffect(() => {
    seedDefaultAds();
    const timer = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  const navigate = (s: string, data?: any) => {
    setScreenData(data);
    setScreen(s as Screen);
  };

  const handleLogout = () => {
    clearLocalUser();
    window.location.reload();
  };

  if (showSplash || loading) {
    return (
      <AnimatePresence>
        {(showSplash || loading) && <SplashScreen key="splash" />}
      </AnimatePresence>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen lg:flex lg:items-center lg:justify-center lg:bg-muted/30 lg:p-8">
        <div className="lg:w-full lg:max-w-md lg:rounded-3xl lg:shadow-2xl lg:overflow-hidden">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <LoginScreen onLogin={() => setScreen('home')} />
          </motion.div>
        </div>
      </div>
    );
  }

  const mainContent = (
    <AnimatePresence mode="wait">
      {screen === 'home' && (
        <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <HomeScreen onNavigate={navigate} />
        </motion.div>
      )}
      {screen === 'send_goodnews' && (
        <motion.div key="send" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
          <SendGoodNewsScreen
            initialScripture={screenData as ScriptureEntry | undefined}
            onBack={() => setScreen('home')}
            onSuccess={() => { markActivity(); setScreen('home'); }}
          />
        </motion.div>
      )}
      {screen === 'wall' && (
        <motion.div key="wall" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
          <WallScreen onBack={() => setScreen('home')} />
        </motion.div>
      )}
      {screen === 'friends' && (
        <motion.div key="friends" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
          <FriendsScreen
            onBack={() => setScreen('home')}
            onSendGoodNews={(friend) => navigate('send_goodnews', { preselectedFriend: friend })}
          />
        </motion.div>
      )}
      {screen === 'profile' && (
        <motion.div key="profile" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
          <ProfileScreen
            onBack={() => setScreen('home')}
            onAdmin={() => setScreen('admin')}
            onLogout={handleLogout}
          />
        </motion.div>
      )}
      {screen === 'admin' && (
        <motion.div key="admin" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
          <AdminScreen onBack={() => setScreen('profile')} />
        </motion.div>
      )}
      {screen === 'devotional' && screenData && (
        <motion.div key="devotional" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}>
          <DevotionalScreen
            goodNews={screenData}
            onBack={() => setScreen('home')}
            onComplete={() => setScreen('home')}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Mobile layout */}
      <div className="lg:hidden mobile-container bg-background">
        <div className="h-dvh overflow-y-auto overscroll-none">
          {mainContent}
        </div>
        <BottomNav activeScreen={screen} onNavigate={navigate} onGrace={() => setShowGrace(true)} />
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:flex min-h-screen bg-background">
        <DesktopSidebar
          screen={screen}
          onNavigate={navigate}
          user={user}
          onLogout={handleLogout}
          onGrace={() => setShowGrace(true)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl xl:max-w-3xl mx-auto py-8 px-6">
            {mainContent}
          </div>
        </main>
      </div>

      {/* Grace Chat (shared across layouts) */}
      <AnimatePresence>
        {showGrace && (
          <GraceChatScreen
            key="grace"
            onClose={() => setShowGrace(false)}
            onShareScripture={(scripture: ScriptureEntry) => {
              setShowGrace(false);
              navigate('send_goodnews', scripture);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  // Check for public share link — render without auth
  const params = new URLSearchParams(window.location.search);
  const shareId = params.get('share');
  const shareData = params.get('d');
  if (shareId) {
    return <SharePage entryId={shareId} encodedData={shareData} />;
  }

  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
