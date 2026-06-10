import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function AdminDashboard() {
    const { logout } = useContext(AuthContext);
    return (
        <div className="p-8 bg-slate-900 min-h-screen text-slate-100">
            <h1 className="text-2xl font-bold">Landlord Command Center</h1>
            <p class="text-slate-400 mt-2">Welcome to the administrative master controls.</p>
            <button onClick={logout} className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold">Sign Out</button>
        </div>
    );
}
export default AdminDashboard;