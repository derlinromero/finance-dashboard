import React, { useState } from 'react';
import { Trash2, AlertTriangle, Edit2, X, Save } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_API_URL;

/**
 * ExpenseList Component - Display and manage expenses
 */
function ExpenseList({ expenses, categories, onExpenseDeleted, onExpenseUpdated }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    amount: '',
    category: '',
    date: ''
  });
  
  const handleDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/expenses/${expenseId}`);
      onExpenseDeleted(expenseId);
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense');
    }
  };

  const startEdit = (expense) => {
    setEditingId(expense.id);
    
    // Format date properly to avoid timezone issues
    let dateStr = expense.date;
    if (dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0];
    }
    
    setEditForm({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: dateStr
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({title: '', amount: '', category: '', date: ''});
  };

  const saveEdit = async (expenseId) => {
    try {
      const payload = {
        title: editForm.title.trim(),
        amount: parseFloat(editForm.amount),
        category: editForm.category,
        date: editForm.date
      };

      console.log('Sending update payload:', payload);
      console.log('Payload types:', {
        title: typeof payload.title,
        amount: typeof payload.amount,
        category: typeof payload.category,
        date: typeof payload.date
      });
      
      const response = await axios.put(`${API_URL}/expenses/${expenseId}`, payload);

      console.log('Update response:', response.data);

      // Handle both array and single object reponse
      const updatedExpense = Array.isArray(response.data.data)
        ? response.data.data[0]
        : response.data.data;

      // Notify parent to update the list
      if (onExpenseUpdated && updatedExpense) {
        onExpenseUpdated(updatedExpense);
      }

      setEditingId(null)
      setEditForm({title: '', amount: '', category: '', date: ''});
    } catch (error) {
      console.error('Error updating expense:', error);
      console.error('Error response:', error.response?.data);
      alert('Failed to update expense');
    }
  };

  if (!expenses || expenses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Recent Expenses</h2>
        <p className="text-gray-500 text-center py-8">
          No expenses yet. Add your first expense above!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">
        Recent Expenses ({expenses.length})
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr 
                key={expense.id} 
                className={`border-b border-gray-100 hover:bg-gray-50 ${
                  expense.is_anomaly ? 'bg-red-50' : ''
                }`}
              >
                {/* Date Colum */}
                <td className="py-3 px-4 text-sm text-gray-600">
                  {editingId === expense.id ? (
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    format(new Date(expense.date + 'T00:00:00'), 'MMM dd, yyyy')
                  )}
                </td>

                {/* Description Column */}
                <td className="py-3 px-4">
                  {editingId === expense.id ? (
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900">{expense.title}</span>
                      {expense.is_anomaly && (
                        <AlertTriangle
                          className="w-4 h-4 text-red-500"
                          title="Unusual expense amount detected"
                        />
                      )}
                    </div>
                  )}
                </td>

                {/* Category Column */}
                <td className="py-3 px-4">
                  {editingId === expense.id ? (
                    <input
                      type="text"
                      list="edit-categories-list"
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value})}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      {expense.category}
                    </span>
                  )}
                </td>

                {/* Amount Column */}
                <td className="py-3 px-4 text-right font-semibold text-gray-900">
                  {editingId === expense.id ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({ ...editForm, amount: e.target.value})}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"/>
                  ) : (
                    `$${parseFloat(expense.amount).toFixed(2)}`
                  )}
                </td>

                {/* Actions Column */}
                <td className="py-3 px-4 text-center">
                  {editingId === expense.id ? (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => saveEdit(expense.id)}
                        className="text-green-600 hover:text-green-800 transition"
                        title="Save changes"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-gray-600 hover:text-gray-800 transition"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => startEdit(expense)}
                        className="text-blue-600 hover:text-blue-800 transition"
                        title="Edit expense"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-600 hover:text-red-800 transition"
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Datalist for category autocomplete in edit mode */}
        <datalist id="edit-categories-list">
          {categories && categories.map((cat) => (
            <option key={cat.id} value={cat.name} />
          ))}
      </datalist>
      </div>
      
      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-700">Total</span>
          <span className="text-2xl font-bold text-gray-900">
            ${expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ExpenseList;