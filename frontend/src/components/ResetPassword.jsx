import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword({ onPasswordResetComplete }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verify that this is actually a password recovery session
    const checkSession = async () => {
        const { data: { session }, error } = await supabase.auth.getSession();

        const hash = window.location.hash;
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const isPasswordRecovery = hashParams.get('type') === 'recovery';

        const isRecoverySession = sessionStorage.getItem('isPasswordRecovery') === 'true';
        
        console.log('ResetPassword - Hash:', hash);
        console.log('ResetPassword - Type', hashParams.get('tpye'));
        console.log('ResetPassword - Session:', session);
        console.log('ResetPassword - SessionStorage flag:', isRecoverySession);

        // Check if we have either a recovery type or an active session
        if (!isPasswordRecovery && !session && !isRecoverySession) {
            console.log('No recovery session found, redirecting to home');
            // If not a recovery session, redirect to home
            navigate('/');
        }
    };

    checkSession();
  }, [navigate]);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    // Validate passwords match
    if (newPassword !== confirmPassword) {
        setMessage('❌ Passwords do not match');
        return;
    }

    // Validate password length
    if (newPassword.length < 6) {
        setMessage('❌ Password must be at least 6 characters');
        return;
    }

    setLoading(true);
    setMessage('');

    try {
        const {data, error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (error) throw error;

        setMessage('✅ Password updated successfully! Redirecting to login...');

        // Clear the recovery flag
        sessionStorage.removeItem('isPasswordRecovery');

        // Call the callback to notify App.jsx
        if (onPasswordResetComplete) {
            setTimeout(() => {
                onPasswordResetComplete();
            }, 2000);
        }
    } catch (error) {
        setMessage('❌ ' + error.message);
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="bg-white p-8 rounded-lg shadow-2xl w-96">
            <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">
                Reset Your Password
            </h2>
            <p className="text-center text-gray-600 mb-6 text-sm">
                Enter your new password below
            </p>

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                    </label>
                    <input
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        minLength={6}
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password
                    </label>
                    <input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        minLength={6}
                        disabled={loading}
                    />
                </div>

                {message && (
                    <div className={`text-sm p-3 rounded ${
                        message.includes('❌')
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-gree-700'
                    }`}>
                        {message}
                    </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Updating...' : 'Update Password'}
                </button>
            </form>
        </div>
    </div>
  );
}