import React from 'react';
import ExpenseForm from './ExpenseForm';
import ExpenseList from './ExpenseList';
import CSVUpload from './CSVUpload';
import Charts from './Charts';
import BudgetAlerts from './BudgetAlerts';
import CategoryManager from './CategoryManager';
import { LogOut, Sparkles } from 'lucide-react';

function Dashboard({ session, fetchExpenses, fetchCategories, expenses, categories, handleExpenseAdded, handleExpenseDeleted, handleExpenseUpdated, activeTab, setActiveTab, handleGenerateDemo, handleSignOut }) {
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

export default Dashboard;