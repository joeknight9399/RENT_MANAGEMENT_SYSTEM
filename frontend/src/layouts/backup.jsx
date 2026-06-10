import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TenantLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = (e) => {
        e.stopPropagation();
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {/* STICKY SIDEBAR NAVIGATION */}
            <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col justify-between p-5 shadow-xl z-10">
                <div className="flex flex-col h-full">
                    {/* Header/Logo Section */}
                    <div className="mb-8 border-b border-slate-800 pb-4">
                        <h1 className="text-xl font-bold tracking-wider text-emerald-400">RMS Portal</h1>
                        <p className="text-xs text-slate-400">Tenant Workspace</p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex flex-col gap-2 flex-grow">
                        <NavLink
                            to="/portal/dashboard"
                            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-emerald-600 text-white font-medium' : 'hover:bg-slate-800 text-slate-400'}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            📊 Dashboard
                        </NavLink>
                        <NavLink
                            to="/portal/billing"
                            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-emerald-600 text-white font-medium' : 'hover:bg-slate-800 text-slate-400'}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            💳 Billing & Invoices
                        </NavLink>
                        <NavLink
                            to="/portal/maintenance"
                            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-emerald-600 text-white font-medium' : 'hover:bg-slate-800 text-slate-400'}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            🔧 Maintenance
                        </NavLink>
                    </nav>

                    {/* User Badge & Logout Section */}
                    <div className="border-t border-slate-800 pt-4 mt-auto">
                        <div className="flex items-center gap-3 px-1 mb-4">
                            <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold capitalize">
                                {user?.full_name?.charAt(0) || 'T'}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-semibold truncate text-white capitalize">{user?.full_name}</p>
                                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full text-left flex items-center gap-3 p-3 rounded-lg hover:bg-red-950/40 text-red-400 transition-colors"
                        >
                            🚪 Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* MAIN APP VIEWPORT */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-800">Welcome Back</h2>
                    <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-medium tracking-wide">
                        Active Account
                    </span>
                </header>

                <main className="flex-1 overflow-y-auto p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default TenantLayout;