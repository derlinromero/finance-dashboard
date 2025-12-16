import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword({ onPasswordResetComplete }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verify that this is actually a password recovery session
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();

        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const isPasswordRecovery = hashParams.get('type') === 'recovery';

        console.log('ResetPassword - Hash:', window.location.hash);
        console.log('ResetPassword - Session:', session);

        // Check if we have either a recovery type or an active session
        if (!isPasswordRecovery && !session) {
            console.log('No recovery session found, redirecting to home');
            // If not a recovery session, redirect to home
            navigate('/');
        }
    };

    checkSession();
  }, [navigate]);

  /* ---------------------------------- */
  /* Listen for cancel from other tab */
  /* ---------------------------------- */
  useEffect(() => {
    const handleStorage = (e) => {
        if (e.key === 'passwordRecoveryCancelled') {
            console.log('🚫 Password recovery cancelled');

            setCancelled(true);
            setMessage('⚠️ Password reset was cancelled. Redirecting to login.');

            // Kill recovery session immediately
            supabase.auth.signOut();

            setTimeout(() => {
                navigate('/', { replace: true });
            }, 1500);
        }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [navigate]);

  /* ---------------------------------- */
  /* Handle password update              */
  /* ---------------------------------- */
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (cancelled) {
        setMessage('❌ Password reset was cancelled.');
        return;
    }

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
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (error) throw error;

        setMessage('✅ Password updated successfully! Redirecting to login...');

        // TERMINATE RECOVERY SESSION
        await supabase.auth.signOut();

        // Notify other tabs
        onPasswordResetComplete?.();

        // Redirect THIS tab
        setTimeout(() => {
            navigate('/', { replace: true });
        }, 1500);
    } catch (error) {
        setMessage('❌ ' + error.message);
        setLoading(false);
    }
  };

  /* ---------------------------------- */
  /* Render                              */
  /* ---------------------------------- */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900">
        <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-cyan-200 w-96">
            <h2 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Reset Your Password
            </h2>
            <p className="text-center text-slate-600 mb-6 text-sm">
                Enter your new password below
            </p>

            <div className="mb-6 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                <p className="text-sm text-cyan-800">
                    💡 <strong>Tip:</strong> You can safely close the previous tab where you clicked the reset link.
                </p>
            </div>

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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                        required
                        minLength={6}
                        disabled={loading || cancelled}
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                        required
                        minLength={6}
                        disabled={loading || cancelled}
                    />
                </div>

                {message && (
                    <div className={`text-sm p-3 rounded ${
                        message.includes('❌')
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                    }`}>
                        {message}
                    </div>
                )}

                <button
                  type="submit"
                  disabled={loading || cancelled}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-2 rounded-lg font-semibold hover:from-cyan-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                    {loading ? 'Updating...' : 'Update Password'}
                </button>
            </form>
        </div>
    </div>
  );
}