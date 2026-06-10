import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function TenantPortal() {
    const { logout } = useContext(AuthContext);
    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <h1 className="text-2xl font-bold text-slate-800">Tenant Resident Portal</h1>
            <p className="text-slate-600 mt-2">Welcome to your dashboard view.</p>
            <button onClick={logout} className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold">Sign Out</button>
        </div>
    );
}
export default TenantPortal;