import React, { useState } from 'react';
import axios from 'axios';
import { Tag, Edit2, X, Trash2, Save } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL;

/**
 * CategoryManager Component - Manage custom categories
 */
function CategoryManager({ userId, categories, onCategoriesUpdated }) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleDelete = async (categoryId) => {
    if (!window.confirm("Delete this category? Existing expenses will keep it.")) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/categories/${categoryId}`);
      if (onCategoriesUpdated) {
        onCategoriesUpdated();
      }
      alert('✅ Category deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  const startEdit = (category) => {
    setEditingId(category.id);
    setEditName(category.name);
  };

  const saveEdit = async (categoryId) => {
    try {
      await axios.put(`${API_URL}/categories/${categoryId}`, {
        name: editName.trim()
      });

      setEditingId(null);
      setEditName('');

      if (onCategoriesUpdated) {
        onCategoriesUpdated();
      }

      alert('✅ Category updated successfully!');
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  }

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-xl border border-cyan-100 p-6 hover:shadow-2xl hover:scale-[1.01] transition-all duration-300">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
          <Tag className="w-5 h-5 text-cyan-600" />
          My Categories ({categories.length})
        </h2>
        
      </div>

      <div className="mb-4 p-3 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg">
        <p className="text-sm text-cyan-900">
          💡 <strong>Tip:</strong> Categories are automatically created when you add or edit expenses. Here you can rename or delete them.
        </p>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="text-center py-8">
          <Tag className="w-12 h-12 text-cyan-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">No custom categories yet</p>
          <p className="text-sm text-gray-400">
            Add your first expense to create categories automatically!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="px-4 py-3 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg flex items-center justify-between hover:shadow-md transition-all duration-200"
            >
              {editingId === category.id ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-2 py-1 border border-cyan-300 rounded mr-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(category.id)}
                      className="text-green-600 hover:text-green-800 transition-all duration-200 p-1 hover:bg-green-50 rounded"
                      title="Save"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-gray-600 hover:text-gray-800 transition-all duration-200 p-1 hover:bg-gray-100 rounded"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium text-cyan-900">
                    {category.name}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(category)}
                      className="text-cyan-600 hover:text-cyan-800 transition-all duration-200 p-1 hover:bg-cyan-50 rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-red-600 hover:text-red-800 transition-all duration-200 p-1 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-cyan-200">
        <p className="text-xs text-gray-500">
          💡 <strong>Tip:</strong> The AI will learn from your category choices and improve over time!
        </p>
      </div>
    </div>
  );
}

export default CategoryManager;