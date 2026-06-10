import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function TenantLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Role Guard: Ensure only Tenants can access this layout
    if (user && user.role !== 'Tenant') {
        return <Navigate to={`/${user.role.toLowerCase()}/dashboard`} replace />;
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Clean declarative route matrix utilizing precise inline SVGs
    const navItems = [
        { path: '/portal/dashboard', label: 'Overview', icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
        { path: '/portal/billing', label: 'My Billing', icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },

        { path: '/portal/broadcasts', label: 'Notices & Alerts', icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.574 15.786a1 1 0 01-.196-.832 7.477 7.477 0 00.118-1.289v-2.265a4.5 4.5 0 00-.025-.455M4 10a7.5 7.5 0 0114.896-.836M21 17a1 1 0 01-1 1H4a1 1 0 01-1-1m3 0a3.99 3.99 0 006 3.32m0 0A3.99 3.99 0 0018 17" /></svg> },
        { path: '/portal/password', label: 'Security & Access', icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> },
    ];

    const activePage = navItems.find(item => item.path === location.pathname)?.label || 'Menu';

    return (
        <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden antialiased selection:bg-cyan-500 selection:text-slate-950">

            {/* ─── MOBILE BACKDROP OVERLAY ─── */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden transition-all duration-200"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ─── UNIFIED DIRECTORY SIDEBAR ─── */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-800/80 bg-slate-900 flex flex-col justify-between shrink-0
                transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                md:transform-none md:static md:h-full
                transition-transform duration-200 ease-in-out
            `}>
                <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden">

                    {/* Shared Core Branding Token */}
                    <div className="h-20 px-6 border-b border-slate-800/60 flex-shrink-0 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-cyan-500 rounded-full block"></span>
                            <div>
                                <h2 className="text-base font-bold tracking-tight text-white">Keja Digital</h2>
                                <p className="text-[11px] text-slate-500 font-semibold tracking-wide uppercase">Tenant Portal</p>
                            </div>
                        </div>

                        {/* Mobile Overlay Closure Interaction */}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
                            aria-label="Close menu drawer"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Operational Route Anchors */}
                    <nav className="p-4 space-y-1.5 flex-grow pb-6">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
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
                                        {item.icon(`w-5 h-5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`)}
                                        <span>{item.label}</span>
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Premium Profile Metadata Card & Logout Node */}
                    <div className="p-4 border-t border-slate-800/60 bg-slate-900/50 flex-shrink-0">
                        <div className="flex items-center gap-3 px-2 mb-4">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm select-none">
                                {user?.full_name?.charAt(0) || 'T'}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-semibold truncate text-slate-200">{user?.full_name || 'Resident User'}</p>
                                <p className="text-[11px] text-slate-500 truncate font-medium mt-0.5">{user?.email}</p>
                            </div>
                        </div>

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

            {/* ─── DYNAMIC CANVASS RUNTIME VIEWPORT ─── */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

                {/* Global Structural App Viewport Header */}
                <header className="h-20 border-b border-slate-800/60 flex items-center justify-between px-4 md:px-8 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 flex-shrink-0">
                    <div className="flex items-center gap-4">

                        {/* Hamburger Controller - Populates on Compact Media Viewports */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 md:hidden transition-all"
                            aria-label="Open portal panel navigation menu"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <h1 className="text-sm font-semibold text-slate-200 tracking-tight md:text-base">
                            {activePage}
                        </h1>
                    </div>

                    {/* Account Operational Token Badge */}
                    <span className="hidden sm:flex bg-cyan-500/5 text-cyan-400 border border-cyan-500/10 text-xs font-medium px-3 py-1.5 rounded-full items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                        Active Leasehold Context
                    </span>
                </header>

                {/* Subroute Dom Outlet Canvas Node Injection */}
                <main className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-8">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

export default TenantLayout;