import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import axios from 'axios';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ResetPassword from './components/ResetPassword';

const API_URL = process.env.REACT_APP_API_URL;

/**
 * Main App Component
 * This is the root component that manages authentication and renders the dashboard
 */
function App() {
  // Authentication state
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dashboard data state
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [monthlyLimit, setMonthlyLimit] = useState(null);
  const [cancelled, setCancelled] = useState(false);

  const [authLock, setAuthLock] = useState(localStorage.getItem('authLock'));

  const navigate = useNavigate();

  // GLOBAL auth lock helper
  const isAuthLocked = () => authLock === 'password-recovery' && window.location.pathname !== '/ResetPassword';
  
  useEffect(() => {
    const syncAuthLock = (e) => {
      if (e.key === 'authLock') {
        setAuthLock(e.newValue);
      }
    };

    window.addEventListener('storage', syncAuthLock);
    return () => window.removeEventListener('storage', syncAuthLock);
  }, []);
  
  /* ---------------------------------- */
  /* Load monthly limit                 */
  /* ---------------------------------- */
  useEffect(() => {
    const savedLimit = localStorage.getItem('monthlyLimit');
    if (savedLimit) {
      setMonthlyLimit(parseFloat(savedLimit));
    }
  }, [])
  
  /* ---------------------------------- */
  /* Detect recovery + session bootstrap*/
  /* ---------------------------------- */
  useEffect(() => {
    // Check if this is a password recovery session from URL hash
    const detectRecoveryFromHash = () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      if (hashParams.get('type') === 'recovery') {
        console.log('🔒 Recovery hash detected');

        localStorage.setItem('authLock', 'password-recovery');
        setAuthLock('password-recovery');
        setLoading(false);
        return true;
      }
      return false;
    };

    const isRecovery = detectRecoveryFromHash();

    if (!isRecovery) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!isAuthLocked()) {
          setSession(session);
        }
        setLoading(false);
      });
    }

    /* Auth state listener */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);

      if (isAuthLocked()) {
        console.log('🔒 Auth locked – ignoring event');
        return;
      }

      // Handle SIGNED_IN events
      if (event === 'SIGNED_IN') {
        setSession(session);
      }

      // If user signs out, clear reset flag
      if (event === 'SIGNED_OUT') {
        setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  /* ---------------------------------- */
  /* Fetch user data after login        */
  /* ---------------------------------- */
  useEffect(() => {
    if (session?.user && !isAuthLocked()) {
      fetchExpenses();
      fetchCategories();
    }
  }, [session]);

  /* ---------------------------------- */
  /* Cross-tab password reset complete  */
  /* ---------------------------------- */
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'passwordReset') {
        console.log('🔓 Password reset completed');
        
        localStorage.removeItem('authLock');
        setAuthLock(null);

        supabase.auth.signOut().then(() => {
          alert("Password reset successful. Please log in.");
          navigate('/', { replace: true });
        });
      }

      if (e.key === 'passwordResetCancelled') {
        console.log('🚫 Password recovery cancelled from another tab');

        setCancelled(true);
        setMessage('⚠️ Password reset was cancelled. Redirecting to login.');

        supabase.auth.signOut();

        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1500);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [navigate]);

  /* ---------------------------------- */
  /* API Calls                          */
  /* ---------------------------------- */
  const fetchExpenses = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await axios.get(
        `${API_URL}/expenses/${session.user.id}`
      );
      setExpenses(response.data.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const fetchCategories = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await axios.get(
        `${API_URL}/categories/${session.user.id}`
      );
      setCategories(response.data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  /* ---------------------------------- */
  /* Handlers                           */
  /* ---------------------------------- */
  const handleSignOut = async () => {
    localStorage.removeItem('authLock');
    setAuthLock(null);
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  };

  const handlePasswordResetComplete = () => {
    if (cancelled) {
      setMessage('❌ Password reset was cancelled.');
      return;
    }
    
    localStorage.removeItem('authLock');
    setAuthLock(null);
    localStorage.setItem('passwordReset',Date.now());
  };

    const handleExpenseAdded = (newExpense) => {
    setExpenses([newExpense, ...expenses]);
    fetchCategories(); // Refresh categories in case a new one was created
  };

  const handleExpenseDeleted = (expenseId) => {
    setExpenses(expenses.filter((e) => e.id !== expenseId));
  };

  const handleExpenseUpdated = (updateExpense) => {
    setExpenses(expenses.map((e) =>
      e.id === updateExpense.id ? updateExpense : e
    ));
    // Refresh categories in case a new one was added during edit
    fetchCategories();
  }

  const handleMonthlyLimit = (limit) => {
    setMonthlyLimit(limit);
    if (limit) {
      localStorage.setItem('monthlyLimit', limit.toString());
    } else {
      localStorage.removeItem('monthlyLimit');
    }
  };

  /* ---------------------------------- */
  /* Loading                            */
  /* ---------------------------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-cyan-600 rounded-full" />
      </div>
    );
  }

  /* ---------------------------------- */
  /* Render                             */
  /* ---------------------------------- */
  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthLocked() ? (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 text-white">
              <div className="text-center max-w-md">
                <h2 className="text-2xl font-bold mb-3">
                  Password Reset in Progress
                </h2>
                <p className="mb-6 text-gray-300">
                  Complete the reset in the other tab or cancel below.
                </p>
                <button
                  onClick={() => {
                    localStorage.removeItem('authLock');
                    setAuthLock(null);
                    localStorage.setItem('passwordRecoveryCancelled', Date.now());
                    supabase.auth.signOut();
                    navigate('/', { replace: true });
                  }}
                  className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
                >
                  Cancel & Return to Login
                </button>
              </div>
            </div>
          ) : session ? (
            <Dashboard
              session={session}
              expenses={expenses}
              categories={categories}
              activeTab={activeTab}
              monthlyLimit={monthlyLimit}
              setActiveTab={setActiveTab}
              handleExpenseAdded={handleExpenseAdded}
              handleExpenseDeleted={handleExpenseDeleted}
              handleExpenseUpdated={handleExpenseUpdated}
              handleMonthlyLimit={handleMonthlyLimit}
              fetchExpenses={fetchExpenses}
              fetchCategories={fetchCategories}
              handleSignOut={handleSignOut}
            />
          ) : (
            <Auth />
          )
        }
      />

      <Route
        path="/ResetPassword"
        element={
          <ResetPassword
            onPasswordResetComplete={handlePasswordResetComplete}
          />
        }
      />
    </Routes>
  );
}

export default App;