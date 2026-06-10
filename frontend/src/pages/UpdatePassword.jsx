import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast'; // Matching your project's toast usage

const UpdatePassword = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);

    // Cancel pending requests if user bails and unmounts the view mid-flight
    useEffect(() => {
        const controller = new AbortController();
        return () => controller.abort();
    }, []);

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();

        // Basic front-end safety validations
        if (newPassword !== confirmPassword) {
            return toast.error("New passwords do not match.");
        }

        if (newPassword.length < 8) {
            return toast.error("Password must be at least 8 characters long.");
        }

        if (currentPassword === newPassword) {
            return toast.error("New password cannot be the same as your current password.");
        }

        setLoading(true);
        const loadToast = toast.loading("Updating password...");

        try {
            const response = await api.patch('/auth/update-password', {
                currentPassword,
                newPassword
            });

            if (response.data.status === 'Success') {
                toast.success("Password updated successfully.", { id: loadToast });

                // Flush form states
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                toast.error(response.data.message || 'Failed to update password.', { id: loadToast });
            }
        } catch (err) {
            console.error("Password change failure:", err);
            toast.error(
                err.response?.data?.message || 'Server error. Please try again later.',
                { id: loadToast }
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-4 md:p-6 space-y-6">
            <div>
                <h2 className="text-lg font-black tracking-tight text-white uppercase font-mono">
                    Security Settings
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                    Change your password to ensure your account remains secure.
                </p>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-4 p-5 bg-[#0a0a0a] border border-slate-900 rounded-2xl shadow-xl">

                {/* Current Password */}
                <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        Current Password
                    </label>
                    <input
                        type={showPasswords ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="w-full bg-[#050505] border border-slate-900 focus:border-cyan-500/50 text-slate-200 text-sm font-medium rounded-xl p-3 outline-none transition-colors min-h-[44px]"
                    />
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        New Password
                    </label>
                    <input
                        type={showPasswords ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full bg-[#050505] border border-slate-900 focus:border-cyan-500/50 text-slate-200 text-sm font-medium rounded-xl p-3 outline-none transition-colors min-h-[44px]"
                    />
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        Confirm New Password
                    </label>
                    <input
                        type={showPasswords ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full bg-[#050505] border border-slate-900 focus:border-cyan-500/50 text-slate-200 text-sm font-medium rounded-xl p-3 outline-none transition-colors min-h-[44px]"
                    />
                </div>

                {/* Visibility Toggle Switch */}
                <div className="flex items-center gap-2 pt-1">
                    <input
                        type="checkbox"
                        id="toggle-pass"
                        checked={showPasswords}
                        onChange={() => setShowPasswords(!showPasswords)}
                        className="rounded border-slate-900 bg-slate-950 text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="toggle-pass" className="text-[11px] text-slate-400 font-bold tracking-wide uppercase cursor-pointer select-none">
                        Show Passwords
                    </label>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-bold tracking-wider uppercase rounded-xl border border-slate-800 transition-all shadow-sm min-h-[46px] flex items-center justify-center disabled:opacity-50"
                >
                    {loading ? "Saving Changes..." : "Update Password"}
                </button>
            </form>
        </div>
    );
};

export default UpdatePassword;