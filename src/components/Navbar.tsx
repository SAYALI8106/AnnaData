import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Leaf, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';

const publicNavItems = [
  { label: 'Home', path: '/' },
  { label: 'Dashboard', path: '/dashboard' }, // ✅ AVAILABLE TO ALL
];

const privateNavItems = [
  { label: 'Donate Food', path: '/donate' },
  { label: 'Request Food', path: '/request' },
  { label: 'Live Tracking', path: '/tracking' },
];
const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [requestCount, setRequestCount] = useState(0);

  const location = useLocation();

  // 🔥 AUTH LISTENER
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  // 🔥 REAL-TIME REQUEST COUNT (FOR DONOR)
  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(collection(db, 'requests'), (snapshot) => {
      const count = snapshot.docs.filter((doc) => {
        const d = doc.data();
        return d.donorId === user.uid && d.status === 'pending';
      }).length;

      setRequestCount(count);
    });

    return () => unsub();
  }, [user]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/30 backdrop-blur-lg">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Leaf className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl text-foreground">
            FoodBridge
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <div className="hidden md:flex items-center gap-1">
          {(user
            ? [...publicNavItems, ...privateNavItems]
            : publicNavItems
          ).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* 🔔 REQUESTS (ONLY FOR LOGGED USER) */}
          {user && (
            <Link to="/requests" className="relative ml-2">
              <Bell className="w-5 h-5" />

              {requestCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 rounded-full">
                  {requestCount}
                </span>
              )}
            </Link>
          )}
        </div>

        {/* AUTH SECTION */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {/* USER INFO */}
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>

              <Button variant="hero" size="sm" onClick={() => signOut(auth)}>
                Logout
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="hero" size="sm">
                Login
              </Button>
            </Link>
          )}
        </div>

        {/* MOBILE BUTTON */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-card border-t"
          >
            <div className="p-4 flex flex-col gap-2">
              {(user
                ? [...publicNavItems, ...privateNavItems]
                : publicNavItems
              ).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm"
                >
                  {item.label}
                </Link>
              ))}

              {/* 🔔 MOBILE REQUESTS */}
              {user && (
                <Link
                  to="/requests"
                  className="px-4 py-3 rounded-lg flex justify-between items-center"
                >
                  Requests
                  {requestCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 rounded-full">
                      {requestCount}
                    </span>
                  )}
                </Link>
              )}

              {/* AUTH */}
              <div className="flex gap-2 mt-2">
                {user ? (
                  <Button className="flex-1" onClick={() => signOut(auth)}>
                    Logout
                  </Button>
                ) : (
                  <Link to="/auth" className="flex-1">
                    <Button className="w-full">Login</Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
