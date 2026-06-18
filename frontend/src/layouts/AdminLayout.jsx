// 📁 src/layouts/AdminLayout.jsx
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminLayout() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Role Guard: Ensure only Admins can see this layout
    if (user && user.role !== 'Admin') {
        return <Navigate to={`/${user.role.toLowerCase()}/dashboard`} replace />;
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Structural Nav Matrix utilizing clean SVGs instead of raw emojis
    const navLinks = [
        { path: '/admin/overview', label: 'Overview', icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" /></svg> },
        { path: '/admin/properties', label: 'Properties', icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
        { path: '/admin/units', label: 'Unit Management', icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
        { path: '/admin/provisioning', label: 'Staff Provisioning', icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
        { path: '/admin/invites', label: 'Tenant Invites', icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg> },
        { path: '/admin/users', label: 'User Registry', icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
        { path: '/admin/billing-generation', label: 'Billing Generation', icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },

        // 🌟 INJECTED FINANCE NODAL LINK
        {
            path: '/admin/finance',
            label: 'Collections Ledger',
            icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        },

        { path: '/admin/password', label: 'Security & Access', icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> },
        { path: '/admin/settings', label: 'System Settings', icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    ];

    const activePage = navLinks.find(link => link.path === location.pathname)?.label || 'Menu';

    return (
        <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden antialiased selection:bg-cyan-500 selection:text-slate-950">

            {/* ─── MOBILE BACKDROP OVERLAY ─── */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden transition-all duration-200"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ─── SIDEBAR MENU ─── */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-800/80 bg-slate-900 flex flex-col justify-between shrink-0
                transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                md:transform-none md:static md:h-full
                transition-transform duration-200 ease-in-out
            `}>
                <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden">

                    {/* System Branding Header */}
                    <div className="h-20 px-6 border-b border-slate-800/60 flex-shrink-0 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-cyan-500 rounded-full block"></span>
                            <div>
                                <h2 className="text-base font-bold tracking-tight text-white">
                                    Keja Digital
                                </h2>
                                <p className="text-[11px] text-slate-500 font-semibold tracking-wide uppercase">
                                    Admin Console
                                </p>
                            </div>
                        </div>

                        {/* Close Drawer Button for Mobile */}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
                            aria-label="Close menu"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Navigation Directory Link Array */}
                    <nav className="p-4 space-y-1.5 flex-grow pb-6">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) =>
                                    `w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-150 group relative ${isActive
                                        ? 'bg-slate-950 border border-slate-800/80 text-cyan-400 font-semibold shadow-inner'
                                        : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && (
                                            <span className="absolute left-0 top-3 bottom-3 w-1 bg-cyan-500 rounded-r-md"></span>
                                        )}
                                        {link.icon(`w-5 h-5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`)}
                                        <span>{link.label}</span>
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Bottom System Termination Component */}
                    <div className="p-4 border-t border-slate-800/60 bg-slate-900/50 flex-shrink-0">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-400/80 border border-red-500/10 hover:border-red-500/20 bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-all duration-150 active:scale-[0.99]"
                        >
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            Terminate Session
                        </button>
                    </div>
                </div>
            </aside>

            {/* ─── MAIN APP CONTAINER ─── */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

                {/* Global Sticky App Header */}
                <header className="h-20 border-b border-slate-800/60 flex items-center justify-between px-4 md:px-8 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 flex-shrink-0">
                    <div className="flex items-center gap-4">

                        {/* Mobile Sidebar Hamburger Toggle */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 md:hidden transition-all"
                            aria-label="Open side panel menu"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <h1 className="text-sm font-semibold text-slate-200 tracking-tight md:text-base">
                            {activePage}
                        </h1>
                    </div>

                    {/* Operational Node Health Badge */}
                    <span className="hidden sm:flex bg-cyan-500/5 text-cyan-400 border border-cyan-500/10 text-xs font-medium px-3 py-1.5 rounded-full items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                        Root Authority Context
                    </span>
                </header>

                {/* Sub-view Target Injection Container */}
                <main className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-8">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;