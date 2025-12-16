import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, Sparkles } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL;

/**
 * ExpenseForm Component - Manual expense entry with AI category suggestions
 */
function ExpenseForm({ userId, categories, onExpenseAdded }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);

  // Get AI suggestion when title and amount are entered
  useEffect(() => {
    const getSuggestion = async () => {
      if (title.length > 3 && amount > 0) {
        try {
          const response = await axios.post(`${API_URL}/categories/suggest`, {
            title,
            amount: parseFloat(amount),
            user_id: userId
          });
          setAiSuggestion(response.data.suggested_category);
          setShowSuggestion(true);
        } catch (error) {
          console.error('Error getting suggestion:', error);
        }
      }
    };

    // Debounce the API call
    const timer = setTimeout(getSuggestion, 500);
    return () => clearTimeout(timer);
  }, [title, amount, userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {

      // Ensure date is in YYYY-MM-DD format
      const formattedDate = date.includes('T') ? date.split('T')[0] : date;

      const response = await axios.post(`${API_URL}/expenses`, {
        user_id: userId,
        title: title.trim(),
        amount: parseFloat(amount),
        category: category || aiSuggestion || 'Uncategorized',
        date: formattedDate
      });

      const newExpense = Array.isArray(response.data.data)
        ? response.data.data[0]
        : response.data.data;

      // Show success notification
      alert("✅ Expense added successfully!")

      // Reset form
      setTitle('');
      setAmount('');
      setCategory('');
      setDate(new Date().toISOString().split('T')[0]);
      setAiSuggestion('');
      setShowSuggestion(false);

      if (onExpenseAdded && newExpense) {
        onExpenseAdded(newExpense);
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense. Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-xl border border-cyan-100 p-6 hover:shadow-2xl transition-all duration-300">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <PlusCircle className="w-5 h-5" />
        Add New Expense
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Starbucks Coffee"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || parseFloat(val) >= 0) setAmount(val);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        {/* AI Suggestion Banner */}
        {showSuggestion && aiSuggestion && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">AI Suggests:</span> {aiSuggestion}
              </p>
              <button
                type="button"
                onClick={() => setCategory(aiSuggestion)}
                className="text-xs text-blue-600 hover:underline mt-1"
              >
                Use this category
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose or let AI suggest...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
              <option value="__new__" className="font-semibold text-blue-600">
                + Add New Category
              </option>
            </select>
            {category === '__new__' && (
              <input
                type="text"
                placeholder="Enter new category name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focur:ring-2 focus:ring-blue-500 mt-2"
                onChange={(e) => setCategory(e.target.value)}
                autoFocus
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-2 rounded-lg font-semibold hover:from-cyan-700 hover:to-blue-700 transition-all duration-200"
        >
          {loading ? 'Adding...' : 'Add Expense'}
        </button>
      </form>
    </div>
  );
}

export default ExpenseForm;