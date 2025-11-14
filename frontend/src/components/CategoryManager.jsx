import React, { useState } from 'react';
import axios from 'axios';
import { Tag, PlusCircle, X } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL;

/**
 * CategoryManager Component - Manage custom categories
 */
function CategoryManager({ userId, categories, onCategoriesUpdated }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setAdding(true);
    try {
      await axios.post(`${API_URL}/categories`, {
        user_id: userId,
        name: newCategoryName.trim()
      });

      setNewCategoryName('');
      setShowAddForm(false);
      
      // Refresh categories list
      if (onCategoriesUpdated) {
        onCategoriesUpdated();
      }
    } catch (error) {
      console.error('Error adding category:', error);
      if (error.response?.status === 500) {
        alert('Category already exists or invalid name');
      } else {
        alert('Failed to add category');
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Tag className="w-5 h-5" />
          My Categories ({categories.length})
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-1"
        >
          {showAddForm ? (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <PlusCircle className="w-4 h-4" />
              Add Category
            </>
          )}
        </button>
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <form onSubmit={handleAddCategory} className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Coffee, Gas, Subscriptions..."
              required
            />
            <button
              type="submit"
              disabled={adding}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
            >
              {adding ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      )}

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="text-center py-8">
          <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">No custom categories yet</p>
          <p className="text-sm text-gray-400">
            Categories will be created automatically as you add expenses,<br />
            or you can create them manually above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-center"
            >
              <span className="text-sm font-medium text-blue-900">
                {category.name}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          💡 <strong>Tip:</strong> The AI will learn from your category choices and improve over time!
        </p>
      </div>
    </div>
  );
}

export default CategoryManager;