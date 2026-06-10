import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function CaretakerLayout() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Role Guard: Ensure only Caretakers can access this layout
    if (user && user.role !== 'Caretaker') {
        return <Navigate to={`/${user.role.toLowerCase()}/dashboard`} replace />;
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Human-vetted administrative route dictionary with clean SVGs
    const navItems = [
        { path: '/caretaker/tickets', label: 'Maintenance', icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
        { path: '/caretaker/new-utility-page', label: 'Meter Readings', icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
        { path: '/caretaker/announcements', label: 'Broadcasts', icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg> },
        { path: '/caretaker/expenses', label: 'Petty Cash', icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        { path: '/caretaker/invite', label: 'Invite Tenant', icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg> },
        { path: '/caretaker/password', label: 'Security Settings', icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> },
    ];

    const activePage = navItems.find(item => item.path === location.pathname)?.label || 'Menu';

    return (
        <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden antialiased selection:bg-cyan-500 selection:text-slate-950">

            {/* ─── MOBILE BACKDROP DRAWER OVERLAY ─── */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden transition-all duration-200"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ─── PERSISTENT DIRECTORY SIDEBAR ─── */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-800/80 bg-slate-900 flex flex-col justify-between shrink-0
                transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                md:transform-none md:static md:h-full
                transition-transform duration-200 ease-in-out
            `}>
                <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden">

                    {/* Uniform System Header Branding */}
                    <div className="h-20 px-6 border-b border-slate-800/60 flex-shrink-0 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-cyan-500 rounded-full block"></span>
                            <div>
                                <h2 className="text-base font-bold tracking-tight text-white">Keja Digital</h2>
                                <p className="text-[11px] text-slate-500 font-semibold tracking-wide uppercase">Caretaker Portal</p>
                            </div>
                        </div>

                        {/* Mobile Overlay Menu Close Anchor */}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
                            aria-label="Close menu view"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Operational App Navigation Directories */}
                    <nav className="p-4 space-y-1.5 flex-grow pb-6">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) =>
                                    `w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-150 group relative ${isActive
                                        ? 'bg-slate-950 border border-slate-800/80 text-cyan-400 font-semibold'
                                        : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && (
                                            <span className="absolute left-0 top-3 bottom-3 w-1 bg-cyan-500 rounded-r-md"></span>
                                        )}
                                        {item.icon(`w-5 h-5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`)}
                                        <span>{item.label}</span>
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Bottom Session Sign-Out Control */}
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

            {/* ─── DYNAMIC SUB-VIEW WORKSPACE CANVAS ─── */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

                {/* Standard Structural Navigation Context Bar */}
                <header className="h-20 border-b border-slate-800/60 flex items-center justify-between px-4 md:px-8 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 flex-shrink-0">
                    <div className="flex items-center gap-4">

                        {/* Mobile Side Panel Hamburger Menu Trigger */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 md:hidden transition-all"
                            aria-label="Open mobile navigation panel"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <h1 className="text-sm font-semibold text-slate-200 tracking-tight md:text-base">
                            {activePage}
                        </h1>
                    </div>

                    {/* Node Role Status Token */}
                    <span className="hidden sm:flex bg-cyan-500/5 text-cyan-400 border border-cyan-500/10 text-xs font-medium px-3 py-1.5 rounded-full items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                        On-Site Operations Context
                    </span>
                </header>

                {/* Sub-view Outlet Render Context window */}
                <main className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-8">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

export default CaretakerLayout;