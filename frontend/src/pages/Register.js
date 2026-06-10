import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api'; // Switched to your centralized Axios instance

function Register() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        national_id: '',
        password: '',
        role: 'Tenant',
        invite_code: ''
    });

    const [alert, setAlert] = useState({ show: false, message: '', type: '' }); // type can be 'success' or 'error'
    const [loading, setLoading] = useState(false);

    // Auto-fill invite code from URL parameters if present
    useEffect(() => {
        const code = searchParams.get('code');
        if (code) {
            setFormData(prev => ({ ...prev, invite_code: code }));
        }
    }, [searchParams]);

    // Handle standard input variations
    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setAlert({ show: false, message: '', type: '' });

        // Basic password validation safety catch
        if (formData.password.length < 8) {
            setAlert({ show: true, message: 'Password must be at least 8 characters long.', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            // Using your standard base-configured API wrapper
            const response = await api.post('/auth/register', formData);

            if (response.data.status === 'Success') {
                setAlert({
                    show: true,
                    message: 'Account created successfully! Redirecting to login...',
                    type: 'success'
                });
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (error) {
            console.error('Registration submission error:', error);
            setAlert({
                show: true,
                message: error.response?.data?.message || 'Registration failed. Please check your details and try again.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-950 min-h-screen flex flex-col items-center justify-center p-6 text-slate-100 antialiased selection:bg-cyan-500 selection:text-slate-950">
            <div className="w-full max-w-lg">

                {/* Header Header */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2 font-mono">
                        <span className="w-2 h-6 bg-cyan-500 rounded-full block"></span>
                        CREATE ACCOUNT
                    </h2>
                    <p className="text-slate-400 text-sm mt-1.5">Enter your residency or management registration details</p>
                </div>

                {/* Main Card Element */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-8 shadow-xl">

                    {/* Status Feedback Alert */}
                    {alert.show && (
                        <div className={`mb-6 p-4 rounded-xl text-sm border flex items-start gap-3 transition-all ${alert.type === 'success'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{alert.message}</span>
                        </div>
                    )}

                    <form onSubmit={handleRegisterSubmit} className="space-y-5">

                        {/* Name & Email Field Split */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                                <input type="text" name="full_name" required placeholder="John Doe" value={formData.full_name} onChange={handleChange} className="w-full bg-slate-950/60 px-4 py-3 rounded-xl border border-slate-800 text-slate-200 placeholder-slate-600 focus:border-cyan-500/80 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all duration-200" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                                <input type="email" name="email" required autoComplete="email" placeholder="name@example.com" value={formData.email} onChange={handleChange} className="w-full bg-slate-950/60 px-4 py-3 rounded-xl border border-slate-800 text-slate-200 placeholder-slate-600 focus:border-cyan-500/80 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all duration-200" />
                            </div>
                        </div>

                        {/* Phone & National Identity Card Field Split */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                                <input type="tel" name="phone_number" required placeholder="0712345678" value={formData.phone_number} onChange={handleChange} className="w-full bg-slate-950/60 px-4 py-3 rounded-xl border border-slate-800 text-slate-200 placeholder-slate-600 focus:border-cyan-500/80 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all duration-200" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">National ID / Passport</label>
                                <input type="text" name="national_id" required placeholder="12345678" value={formData.national_id} onChange={handleChange} className="w-full bg-slate-950/60 px-4 py-3 rounded-xl border border-slate-800 text-slate-200 placeholder-slate-600 focus:border-cyan-500/80 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all duration-200" />
                            </div>
                        </div>

                        {/* Access Credential Input */}
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                            <input type="password" name="password" required autoComplete="new-password" placeholder="••••••••" value={formData.password} onChange={handleChange} className="w-full bg-slate-950/60 px-4 py-3 rounded-xl border border-slate-800 text-slate-200 placeholder-slate-600 focus:border-cyan-500/80 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all duration-200" />
                        </div>

                        {/* Portal Access Role Selector */}
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Select Account Type</label>
                            <div className="flex gap-2 p-1.5 bg-slate-950 border border-slate-800 rounded-xl">
                                <button type="button" onClick={() => setFormData({ ...formData, role: 'Tenant' })} className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${formData.role === 'Tenant' ? 'bg-cyan-600 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>Tenant</button>
                                <button type="button" onClick={() => setFormData({ ...formData, role: 'Caretaker' })} className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${formData.role === 'Caretaker' ? 'bg-cyan-600 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>Caretaker</button>
                            </div>
                        </div>

                        {/* Conditional Verification Code Input */}
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                {formData.role === 'Tenant' ? 'Unit Allocation Token' : 'Staff Invitation Code'}
                            </label>
                            <input
                                type="text"
                                name="invite_code"
                                required
                                value={formData.invite_code}
                                placeholder={formData.role === 'Tenant' ? 'E.g., UT-5173' : 'E.g., CT-3000'}
                                onChange={handleChange}
                                className="w-full bg-slate-950/60 px-4 py-3 rounded-xl border border-slate-800 text-cyan-400 tracking-wide font-mono uppercase placeholder-slate-600 focus:border-cyan-500/80 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all duration-200"
                            />
                        </div>

                        {/* Form Submission Actions */}
                        <div className="space-y-3 pt-2">
                            <button type="submit" disabled={loading} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-semibold rounded-xl tracking-wide transition-all active:scale-[0.99] disabled:scale-100 text-xs uppercase font-bold">
                                {loading ? 'Creating account...' : 'Create Account'}
                            </button>

                            <button type="button" onClick={() => navigate('/login')} className="w-full py-3 bg-transparent border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 font-medium rounded-xl transition-all text-xs uppercase font-bold active:scale-[0.99]">
                                Return to Sign In
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Register;