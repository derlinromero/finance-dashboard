import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import axios from 'axios';
import Auth from './components/Auth';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import CSVUpload from './components/CSVUpload';
import Charts from './components/Charts';
import BudgetAlerts from './components/BudgetAlerts';
import CategoryManager from './components/CategoryManager';
import { LogOut, Sparkles } from 'lucide-react';

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

  // Check for existing session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data when user logs in
  useEffect(() => {
    if (session?.user) {
      fetchExpenses();
      fetchCategories();
    }
  }, [session]);

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
  
  const handleGenerateDemo = async () => {
    if (!window.confirm('Generate demo expenses? This will add sample data.')) {
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

  // Show auth screen if not logged in
  if (!session) {
    return <Auth />;
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-blue-600" />
                AI Finance Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {session.user.user_metadata?.full_name || session.user.email?.split('@')[0]}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleGenerateDemo}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-semibold"
              >
                Generate Demo Data
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'budgets', label: 'Budgets' },
              { id: 'categories', label: 'Categories' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Add Expense and CSV Upload */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ExpenseForm
                userId={session.user.id}
                categories={categories}
                onExpenseAdded={handleExpenseAdded}
              />
              <CSVUpload
                userId={session.user.id}
                onUploadComplete={fetchExpenses}
              />
            </div>

            {/* Expense List */}
            <ExpenseList
              expenses={expenses}
              categories={categories}
              onExpenseDeleted={handleExpenseDeleted}
              onExpenseUpdated={handleExpenseUpdated}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <Charts userId={session.user.id} />
        )}

        {activeTab === 'budgets' && (
          <BudgetAlerts
            userId={session.user.id}
            categories={categories}
          />
        )}

        {activeTab === 'categories' && (
          <CategoryManager
            userId={session.user.id}
            categories={categories}
            onCategoriesUpdated={fetchCategories}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Built with ❤️ using React, FastAPI, Supabase & AI
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;