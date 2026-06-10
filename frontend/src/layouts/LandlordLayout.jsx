// components/layouts/LandlordLayout.jsx
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Receipt, Wrench, FileText, LogOut, Shield } from 'lucide-react';

const LandlordLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { name: 'Overview', path: '/landlord/dashboard', icon: LayoutDashboard },
        { name: 'Properties', path: '/landlord/properties', icon: Building2 },
        { name: 'Invoices & Rent', path: '/landlord/invoices', icon: Receipt },
        { name: 'Maintenance', path: '/landlord/maintenance', icon: Wrench },
        { name: 'Expenses', path: '/landlord/expenses', icon: FileText },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-cyan-500/30">
            {/* Sidebar Navigation */}
            <aside className="w-64 border-r border-slate-800 bg-slate-900/40 backdrop-blur-md flex flex-col justify-between fixed h-full z-20">
                <div>
                    {/* Header Branding */}
                    <div className="h-20 flex items-center px-6 border-b border-slate-800 gap-3">
                        <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/30 animate-pulse">
                            <Shield className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <h1 className="font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">HQ PORTAL</h1>
                            <span className="text-xs text-slate-500 font-semibold tracking-widest uppercase">Landlord OS</span>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="p-4 space-y-1.5 mt-4">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${isActive
                                        ? 'bg-gradient-to-r from-cyan-950/40 to-slate-900 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* User Account / Footer Actions */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/30">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-rose-400 font-medium rounded-xl hover:bg-rose-950/20 border border-transparent hover:border-rose-900/30 transition-all duration-300"
                    >
                        <LogOut className="w-5 h-5" />
                        Disconnect System
                    </button>
                </div>
            </aside>

            {/* Main Framework Body viewport */}
            <main className="flex-1 pl-64 min-h-screen flex flex-col">
                {/* Top bar control context */}
                <header className="h-20 border-b border-slate-800 bg-slate-950/60 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                        <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase">Core Systems Synchronized</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-semibold text-slate-300">System Administrator</p>
                            <span className="text-xs font-mono text-cyan-400">Level Master-Auth</span>
                        </div>
                        <div className="w-10 h-10 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center font-bold text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.1)]">
                            SA
                        </div>
                    </div>
                </header>

                {/* Workspace Dynamic Entry point */}
                <div className="p-8 flex-1 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900/50">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default LandlordLayout;