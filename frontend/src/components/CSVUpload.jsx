import React, { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL;

/**
 * CSVUpload Component - Upload CSV files with expenses
 * Expected CSV format: title, amount, date (optional)
 */
function CSVUpload({ userId, onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResult(null);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        `${API_URL}/upload/csv/${userId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setResult(response.data);
      setFile(null);
      
      // Notify parent to refresh expenses
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload CSV. Check console for details.');
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = 
`title,amount,date,category
Walmart Groceries,85.50,2024-01-15,Groceries
Starbucks Coffee,5.75,2024-01-16,
Shell Gas,45.00,2024-01-17,Transportation
Netflix,15.99,2024-01-18,Entertainment`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_expenses.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-xl border border-cyan-100 p-6 hover:shadow-2xl transition-all duration-300">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5" />
        Upload CSV
      </h2>

      <div className="space-y-4">
        {/* Instructions */}
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-4">
          <h3 className="font-semibold text-cyan-900 mb-2">CSV Format</h3>
          <p className="text-sm text-cyan-800 mb-2">
            Your CSV should have these columns:
          </p>
          <ul className="text-sm text-cyan-800 list-disc list-inside space-y-1">
            <li><strong>title</strong> - Description of expense</li>
            <li><strong>amount</strong> - Cost in dollars (e.g., 45.50)</li>
            <li><strong>date</strong> - Date (YYYY-MM-DD format)</li>
            <li><strong>category</strong> - Optional (defaults to "Uncategorized")</li>
          </ul>
          <button
            onClick={downloadSampleCSV}
            className="mt-3 text-sm text-cyan-600 hover:text-cyan-700 hover:underline flex items-center gap-1 transition-colors duration-200"
          >
            <FileText className="w-4 h-4" />
            Download sample CSV
          </button>
        </div>

        {/* File Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100 file:transition-colors file:duration-200"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {file.name}
            </p>
          )}
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-2 rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>Processing...</>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Upload & Process
            </>
          )}
        </button>

        {/* Results */}
        {result && (
          <div className={`rounded-lg p-4 ${
            result.errors && result.errors.length > 0 
              ? 'bg-yellow-50 border border-yellow-200' 
              : 'bg-green-50 border border-green-200'
          }`}>
            <div className="flex items-start gap-2">
              {result.errors && result.errors.length > 0 ? (
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-gray-900 mb-1">
                  Upload Complete!
                </p>
                <p className="text-sm text-gray-700">
                  ✅ {result.expenses_added} expenses added successfully
                </p>
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-yellow-800">
                      ⚠️ {result.errors.length} errors:
                    </p>
                    <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                      {result.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CSVUpload;