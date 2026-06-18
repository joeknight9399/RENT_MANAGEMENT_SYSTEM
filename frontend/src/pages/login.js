import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// 🤖 DYNAMIC BASE URL: Automatically detects if you are live or running locally
const currentIP = window.location.hostname;
const isProduction = currentIP !== 'localhost' && currentIP !== '127.0.0.1';
const BACKEND_URL = isProduction
    ? 'https://rentmanagementsystem-production.up.railway.app'
    : `http://${currentIP}:5000`;

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { setToken, setUser } = useAuth();

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setAlert({ show: false, message: '', type: '' });

        try {
            // Updated to use the smart BACKEND_URL variable
            const response = await axios.post(`${BACKEND_URL}/api/v1/auth/login`, { email, password });

            if (response.data.status === 'Success') {
                const token = response.data.token;
                const user = response.data.data.user;

                setToken(token);
                setUser(user);
                localStorage.setItem('token', token);
                localStorage.setItem('role', user.role);

                if (user.role === 'Caretaker') {
                    navigate('/caretaker');
                } else if (user.role === 'Admin') {
                    navigate('/admin');
                } else {
                    navigate('/portal');
                }
            }
        } catch (error) {
            setAlert({
                show: true,
                message: error.response?.data?.message || 'Invalid email or password. Please try again.',
                type: 'bg-red-500/10 text-red-400 border-red-500/20'
            });
            console.error("Login Error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-950 min-h-screen flex flex-col items-center justify-center p-6 text-slate-100 antialiased selection:bg-cyan-500 selection:text-slate-950">
            <div className="w-full max-w-md">
                {/* Branding Heading */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
                        <span className="w-2 h-6 bg-cyan-500 rounded-full block"></span>
                        Keja Digital
                    </h2>
                    <p className="text-slate-400 text-sm mt-1.5">Sign in to manage your property portal</p>
                </div>

                {/* Main Card Container */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-8 shadow-xl backdrop-blur-sm">
                    {alert.show && (
                        <div className={`mb-6 p-4 rounded-xl text-sm border flex items-start gap-3 ${alert.type}`}>
                            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>{alert.message}</span>
                        </div>
                    )}

                    <form onSubmit={handleLoginSubmit} className="space-y-5">
                        {/* Email Input Field Group */}
                        <div className="flex flex-col">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                autoComplete="username"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full bg-slate-950/60 px-4 py-3 rounded-xl border border-slate-800 text-slate-200 placeholder-slate-600 focus:border-cyan-500/80 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all duration-200"
                            />
                        </div>

                        {/* Password Input Field Group */}
                        <div className="flex flex-col">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                                Password
                            </label>
                            <div className="relative w-full">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-950/60 px-4 py-3 pr-12 rounded-xl border border-slate-800 text-slate-200 placeholder-slate-600 focus:border-cyan-500/80 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all duration-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit CTA Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-semibold rounded-xl tracking-wide transition-all duration-150 active:scale-[0.99]"
                        >
                            {loading ? 'Verifying Account...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                {/* Footer Redirection Link */}
                <div className="mt-6 text-center">
                    <p className="text-slate-500 text-sm">
                        Need access to your unit?{' '}
                        <span
                            onClick={() => navigate('/register')}
                            className="text-cyan-400 hover:text-cyan-300 cursor-pointer font-medium hover:underline underline-offset-4 transition-all"
                        >
                            Contact Admin or Register
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;