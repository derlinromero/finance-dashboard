import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';

/**
 * MonthlyLimitForm Component - Set monthly spending limit
 */
function MonthlyLimitForm({ monthlyLimit, handleMonthlyLimit }) {
  const [limitInput, setLimitInput] = useState(monthlyLimit || '');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (limitInput && parseFloat(limitInput) > 0) {
      handleMonthlyLimit(parseFloat(limitInput));
      setLimitInput('');
      setShowSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }
  };

  const handleClearLimit = () => {
    handleMonthlyLimit(null);
    setLimitInput('');
    setShowSuccess(false);
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-xl border border-cyan-100 p-6 hover:shadow-2xl hover:scale-[1.01] transition-all durantion-300">
      <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-cyan-600" />
        Set Monthly Spending Limit
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Set a monthly limit to see it as a red dotted line on your analytics chart
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monthly Limit ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={limitInput}
            onChange={(e) => setLimitInput(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter amount (e.g., 2000.00)"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-cyan-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Set Limit
          </button>
          
          {monthlyLimit && (
            <button
              type="button"
              onClick={handleClearLimit}
              className="bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Clear Limit
            </button>
          )}
        </div>
      </form>

      {/* Success Message */}
      {showSuccess && monthlyLimit && (
        <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-cyan-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 font-medium">
            ✓ Monthly limit set to ${monthlyLimit.toFixed(2)}
          </p>
        </div>
      )}

      {/* Current Limit Display */}
      {monthlyLimit && !showSuccess && (
        <div className="mt-4 p-3 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg">
          <p className="text-sm text-cyan-700">
            <span className="font-semibold">Current limit:</span> ${monthlyLimit.toFixed(2)}/month
          </p>
        </div>
      )}
    </div>
  );
}

export default MonthlyLimitForm;