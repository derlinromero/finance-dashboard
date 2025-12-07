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
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                formatter={(value) => [`$${value.toFixed(2)}`, 'Spent']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Total Spent"
                dot={{ fill: '#3b82f6', r: 4 }}
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
                style={{ fontSize: '10px' }}
              />
              <YAxis 
                style={{ fontSize: '12px' }}
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
  );
}

export default Charts;