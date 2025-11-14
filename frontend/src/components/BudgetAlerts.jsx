import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle, DollarSign } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL;

/**
 * BudgetAlerts Component - Set budgets and view alerts
 */
function BudgetAlerts({ userId, categories }) {
  const [budgets, setBudgets] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBudget, setNewBudget] = useState({
    category: '',
    limit_amount: '',
    month: new Date().toISOString().slice(0, 7) + '-01'
  });

  useEffect(() => {
    fetchBudgets();
  }, [userId]);

  const fetchBudgets = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
      const response = await axios.get(
        `${API_URL}/budgets/${userId}?month=${currentMonth}`
      );
      setBudgets(response.data.data);
      
      // Check for alerts
      checkBudgetAlerts(response.data.data);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  };

  const checkBudgetAlerts = async (budgetList) => {
    try {
      // Get current month spending by category
      const currentMonth = new Date().toISOString().slice(0, 7);
      const response = await axios.get(
        `${API_URL}/analytics/category/${userId}?month=${currentMonth}`
      );
      const spending = response.data.data;

      // Compare with budgets
      const newAlerts = [];
      budgetList.forEach(budget => {
        const categorySpending = spending.find(s => s.category === budget.category);
        if (categorySpending) {
          const percentage = (categorySpending.amount / budget.limit_amount) * 100;
          if (percentage >= 80) {
            newAlerts.push({
              category: budget.category,
              spent: categorySpending.amount,
              limit: budget.limit_amount,
              percentage: percentage.toFixed(1),
              isOver: percentage >= 100
            });
          }
        }
      });

      setAlerts(newAlerts);
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  };

  const handleAddBudget = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`${API_URL}/budgets`, {
        user_id: userId,
        category: newBudget.category,
        limit_amount: parseFloat(newBudget.limit_amount),
        month: newBudget.month
      });

      setNewBudget({
        category: '',
        limit_amount: '',
        month: new Date().toISOString().slice(0, 7) + '-01'
      });
      setShowAddForm(false);
      fetchBudgets();
    } catch (error) {
      console.error('Error adding budget:', error);
      alert('Failed to add budget');
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`rounded-lg p-4 border-2 ${
                alert.isOver
                  ? 'bg-red-50 border-red-300'
                  : 'bg-yellow-50 border-yellow-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertCircle
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    alert.isOver ? 'text-red-600' : 'text-yellow-600'
                  }`}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {alert.isOver ? '🚨 Budget Exceeded!' : '⚠️ Approaching Budget Limit'}
                  </h3>
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>{alert.category}</strong>: You've spent ${alert.spent.toFixed(2)} 
                    of ${alert.limit.toFixed(2)} ({alert.percentage}%)
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Budgets List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Monthly Budgets
          </h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
          >
            {showAddForm ? 'Cancel' : '+ Add Budget'}
          </button>
        </div>

        {/* Add Budget Form */}
        {showAddForm && (
          <form onSubmit={handleAddBudget} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({...newBudget, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Limit ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newBudget.limit_amount}
                  onChange={(e) => setNewBudget({...newBudget, limit_amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="500.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Month
                </label>
                <input
                  type="date"
                  value={newBudget.month}
                  onChange={(e) => setNewBudget({...newBudget, month: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
            >
              Set Budget
            </button>
          </form>
        )}

        {/* Budgets Table */}
        {budgets.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No budgets set yet. Add your first budget above!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Limit</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((budget) => {
                  const alert = alerts.find(a => a.category === budget.category);
                  return (
                    <tr key={budget.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-900">{budget.category}</td>
                      <td className="py-3 px-4 text-right font-semibold">
                        ${parseFloat(budget.limit_amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {alert ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                            alert.isOver 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            <AlertCircle className="w-3 h-3" />
                            {alert.percentage}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            On Track
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default BudgetAlerts;