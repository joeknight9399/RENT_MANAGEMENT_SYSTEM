import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardHome = () => {
    // 1. Appended broadcasts array state hook 
    const [data, setData] = useState({ balance: 0, invoices: [], activeTickets: 0 });
    const [broadcasts, setBroadcasts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');

                // IMPORTANT: Changed from '/api/dashboard' to '/api/v1/dashboard'
                const res = await fetch('/api/v1/dashboard', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await res.json();

                if (result.status === 'Success') {
                    setData(result.data);
                } else {
                    console.error("API returned error:", result.message);
                }

                // 2. Separate clean dispatch query pulling live estate notifications
                const broadcastRes = await fetch('/api/v1/tenant/broadcasts', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const broadcastResult = await broadcastRes.json();
                if (broadcastResult.status === 'Success') {
                    setBroadcasts(broadcastResult.data || []);
                }

            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="text-center p-10 text-slate-500">Loading your portal...</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Outstanding Balance */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase">Total Outstanding</p>
                    <h4 className="text-3xl font-black text-slate-900 mt-2">
                        {Number(data.balance).toLocaleString()} <span className="text-sm font-medium text-slate-500">KES</span>
                    </h4>
                    <button
                        onClick={() => navigate('/payments')}
                        className="mt-4 text-xs bg-slate-900 text-white font-bold py-1.5 px-3 rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                        Pay Now
                    </button>
                </div>

                {/* Maintenance Count */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase">Active Tickets</p>
                    <h4 className="text-3xl font-black text-slate-900 mt-2">{data.activeTickets}</h4>
                    <button
                        onClick={() => navigate('/maintenance')}
                        className="mt-4 w-full text-xs text-blue-600 font-semibold bg-blue-50 py-2 rounded-lg hover:bg-blue-100 transition-all"
                    >
                        + Log New Issue
                    </button>
                </div>

                {/* 3. Operational Broadcasts Notification Feed Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Estate Announcements</p>
                        {broadcasts.length === 0 ? (
                            <div className="text-xs text-slate-400 italic py-4">
                                No active management notices issued. All systems clear.
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[110px] overflow-y-auto pr-1">
                                {broadcasts.slice(0, 2).map((notice) => (
                                    <div key={notice.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight bg-indigo-50 px-1.5 py-0.5 rounded">
                                                {notice.category || 'Notice'}
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-mono">
                                                {new Date(notice.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-700 font-medium leading-relaxed truncate">
                                            {notice.title}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {broadcasts.length > 0 && (
                        <button
                            onClick={() => navigate('/notices')}
                            className="mt-2 text-left text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wider"
                        >
                            View Notice Archives ({broadcasts.length}) →
                        </button>
                    )}
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h4 className="text-base font-bold text-slate-900 mb-4">Recent Ledger Invoices</h4>
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs text-slate-400 uppercase font-semibold">
                        <tr>
                            <th className="p-3">Invoice ID</th>
                            <th className="p-3">Period</th>
                            <th className="p-3">Due Date</th>
                            <th className="p-3">Amount</th>
                            <th className="p-3 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.invoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="p-3 font-mono text-xs text-slate-500">#{inv.id.slice(0, 8)}</td>
                                <td className="p-3 font-medium text-slate-800">{new Date(inv.billing_period).toLocaleDateString()}</td>
                                <td className="p-3 text-xs text-slate-400">{new Date(inv.due_date).toLocaleDateString()}</td>
                                <td className="p-3 font-semibold text-slate-900">{Number(inv.total_amount).toLocaleString()} KES</td>
                                <td className="p-3 text-right">
                                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                        }`}>
                                        {inv.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DashboardHome;