import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL;

// Colors for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

/**
 * Charts Component - Visualize spending data
 */
function Charts({ userId, monthlyLimit }) {
  const [monthlyData, setMonthlyData] = useState([]);
  const [allTimeCategoryData, setAllTimeCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [monthlyCategoryData, setMonthlyCategoryData] =useState([]);
  const [loadingMonthData, setLoadingMonthData] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [userId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch monthly trends
      const monthlyResponse = await axios.get(
        `${API_URL}/analytics/monthly/${userId}`
      );
      setMonthlyData(monthlyResponse.data.data);

      // Fetch All time expenses per category
      const allTimeCategoryDataResponse = await axios.get(
        `${API_URL}/analytics/category-all/${userId}`
      );
      setAllTimeCategoryData(allTimeCategoryDataResponse.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthClick = async (data) => {
    if (!data || !data.month) return;

    const clickedMonth = data.month;
    setSelectedMonth(clickedMonth);
    setShowModal(true);
    setLoadingMonthData(true);

    try {
      // Fetch category data for this specific month
      const response = await axios.get(
        `${API_URL}/analytics/category/${userId}?month=${clickedMonth}`
      );
      setMonthlyCategoryData(response.data.data);
    } catch (error) {
      console.error('Error fetching month category data:', error);
      setMonthlyCategoryData([]);
    } finally {
      setLoadingMonthData(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-center text-gray-500">Loading analytics...</p>
      </div>
    );
  }

  const hasMonthlyData = monthlyData && monthlyData.length > 0;
  const hasAllTimeCategoryData = allTimeCategoryData && allTimeCategoryData.length > 0;
  
  if (!hasMonthlyData && !hasAllTimeCategoryData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-center text-gray-500 py-8">
          No expenses yet. Add some expenses to see analytics!
        </p>
      </div>
    );
  }

  const generateColors = (count) => {
    return Array.from({length: count}, (_, i) =>
      `hsl(${(i * 137.508) % 360}, 70%, 50%)` // golden-angle to avoid repeats
    );
  };

  const colors = generateColors(allTimeCategoryData.length);
  
  return (
    <>
      <div className="space-y-6">
        {/* Monthly Trends */}
        {monthlyData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Monthly Spending Trends
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  style={{ fontSize: '14px' }}
                />
                <YAxis 
                  style={{ fontSize: '14px' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  formatter={(value) => [`$${value.toFixed(2)}`, 'Total Spent']}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Total Spent"
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{r: 6, onClick: (e, payload) => handleMonthClick(payload.payload) }}
                />

                {/* Monthly Limit Reference Line */}
                {monthlyLimit && (
                  <ReferenceLine
                    y={monthlyLimit}
                    stroke="red"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{
                      value: `Limit: $${monthlyLimit.toFixed(2)}`,
                      position: 'right',
                      fill: 'red',
                      fontSize: 12,
                      fontWeight: 'bold'
                    }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>

            {/* Custom Legend for Monthly Limit*/}
            {monthlyLimit && (
              <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-blue-600"></div>
                  <span className="text-gray-700">Total Spent</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="32" height="4">
                    <line x1="0" y1="2" x2="32" y2="2" stroke="red" strokeWidth="2" strokeDasharray="5 5" />
                  </svg>
                  <span className="text-gray-700">Monthly Limit: ${monthlyLimit.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* All-Time Category Spending */}
        {allTimeCategoryData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Money Spent by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={allTimeCategoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="category" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  style={{ fontSize: '14px' }}
                />
                <YAxis 
                  style={{ fontSize: '14px' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  formatter={(value) => [`$${value.toFixed(2)}`, 'Total Spent']}
                />
                <Bar dataKey="amount">
                  {allTimeCategoryData.map((entry, index) => (
                    <Cell key={index} fill={colors[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      {/* Mondal for Month Category Breakdown */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold">
                  Category Breackdown - {selectedMonth}
                </h2>
                {monthlyCategoryData.length > 0 && (
                  <p className="text-lg text-gray-600 mt-1">
                    Total Spent: <span className="font-semibold text-blue-600">
                      ${monthlyCategoryData.reduce((sum, c) => sum + c.amount, 0).toFixed(2)}
                    </span>
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            {loadingMonthData ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading category data...</p>
              </div>
            ) : monthlyCategoryData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No expenses found for this month.</p>
              </div>
            ) : (
              <>
                {/* Bar Chart */}
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyCategoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="category"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      style={{fontSize: '14px' }}
                    />
                    <YAxis
                      style={{fontSize: '14px' }}
                    />
                    <Tooltip
                      formatter={(value) => [`$${value.toFixed(2)}`, 'Spent']}
                    />
                    <Bar dataKey="amount">
                      {monthlyCategoryData.map((entry, index) => (
                      <Cell key={index} fill={colors[index]}/>
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Charts;