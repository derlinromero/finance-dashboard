import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import axios from 'axios';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Dashboard data state
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [monthlyLimit, setMonthlyLimit] = useState(null);

  const navigate = useNavigate();
  
  // Load monthly limit from localStorage on mount
  useEffect(() => {
    const savedLimit = localStorage.getItem('monthlyLimit');
    if (savedLimit) {
      setMonthlyLimit(parseFloat(savedLimit));
    }
  }, [])
  
  // Check for existing session on mount
  useEffect(() => {
    // Check if this is a password recovery session from URL hash
    const checkRecoveryStatus = () => {
      const hash = window.location.hash;
      console.log('Current hash:', hash);
      
      if (hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type')
        console.log('Type paramenter:', type);

        if (type === 'recovery') {
          setIsResettingPassword(true);
          setLoading(false);
          // Store that we're in recovery mode before navigating
          sessionStorage.setItem('isPasswordRecovery', 'true');
          // Navigate immediately
          setTimeout(() => {
            navigate('/ResetPassword', { replace: true });
          }, 100);
          return true;
        }
      }
      return false;
    };

    const isRecovery = checkRecoveryStatus();

    if (!isRecovery) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setLoading(false);
      });
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);

      // Only handle PASSWORD_RECOVERY if we don't have the hash in current URL
      if (event === 'PASSWORD_RECOVERY') {
        const currentHash = window.location.hash;
        const hasRecoveryHash = currentHash.includes('type=recovery');

        // Only navigate if we don't already have the recovery hash
        if (!hasRecoveryHash) {
          // Notify other tabs that reset link was opened
          localStorage.setItem('passwordResetLinkOpened', Date.now().toString());

          setIsResettingPassword(true);
          // Don't navigate here, just block the session
          console.log('PASSWORD_RECOVERY detected in old tab, blocking session');
          return;
        }
      }

      // Check if we're in recovery mode
      const hasRecoveryFlag = sessionStorage.getItem('isPasswordRecovery') === 'true';

      // Handle SIGNED_IN events
      if (event === 'SIGNED_IN') {
        if (hasRecoveryFlag) {
          console.log('SIGNED_IN during password recovery, ignoring');
          return;
        } else {
          console.log('Normal SIGNED_IN, clearing reset flag and setting session');
          setIsResettingPassword(false);
          setSession(session);
          return;
        }
      }

      // If user signs out, clear reset flag
      if (event === 'SIGNED_OUT') {
        console.log('SIGNED_OUT, clearing session');
        setIsResettingPassword(false);
        setSession(null);
      }
      
      // Only set session if not resetting password
      if (!isResettingPassword && !hasRecoveryFlag) {
        console.log('Setting session for event:', event);
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch data when user logs in (but not during password reset)
  useEffect(() => {
    if (session?.user && !isResettingPassword) {
      fetchExpenses();
      fetchCategories();
    }
  }, [session, isResettingPassword]);

  // Listen for password reset completion from other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'passwordReset') {
        setIsResettingPassword(false);
        // Sign out to force fresh login
        supabase.auth.signOut().then(() => {
          alert("Password has been reset. Please log in with your new password.");
          navigate('/', { replace: true });
        });
      }

      // Detect when password reset link is opened in another tab
      if (e.key === 'passwordResetLinkOpened') {
        // ONLY close if we DON'T have the recovery hash (we're the OLD tab)
        const currentHash = window.location.hash;
        const hasRecoveryHash = currentHash.includes('type=recovery');

        if (!hasRecoveryHash) {
          console.log('Old tab detected rest link opened, attempting to close');
          setIsResettingPassword(true);
        } else {
          console.log('New reset tab detected event, ignoring');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate]);

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsResettingPassword(false);
    navigate('/', { replace: true });
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
  
  const handleGenerateDemo = async () => {
    if (!window.confirm('Generate demo expenses?')) {
      return;
    }

    try {
      await axios.post(`${API_URL}/demo/generate/${session.user.id}`);
      fetchExpenses();
      fetchCategories();
      alert('Demo data generated successfully!');
    } catch (error) {
      console.error('Error generating demo:', error);
      alert('Failed to generate demo data');
    }
  };

  const handlePasswordResetComplete = () => {
    setIsResettingPassword(false);
    // Notify other tabs
    localStorage.setItem("passwordReset", Date.now());
    // Sign out and redirect to login
    supabase.auth.signOut().then(() => {
      navigate('/', {replace: true});
    });
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          isResettingPassword ? (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
              <div className="bg-white p-8 rounded-lg shadow-2xl w-96 text-center">
                <div className="mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Password Reset in Progress
                </h2>
                <p className="text-gray-600 mb-4">
                  A new tab has been opened for you to reset your password.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  You can safely close this tab and complete the password reset in the other window.
                </p>
                <button
                  onClick={() => {
                    setIsResettingPassword(false);
                    sessionStorage.removeItem('isPasswordRecovery');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
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
              handleGenerateDemo={handleGenerateDemo}
              handleSignOut={handleSignOut}
              handleMonthlyLimit={handleMonthlyLimit}
              fetchExpenses={fetchExpenses}
              fetchCategories={fetchCategories}
            />
          ) : (
            <Auth />
          )
        } 
      />
      <Route 
        path="/ResetPassword" 
        element={<ResetPassword onPasswordResetComplete={handlePasswordResetComplete} />} 
      />
    </Routes>
  );
}

export default App;