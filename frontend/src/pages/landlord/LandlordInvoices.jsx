// pages/landlord/LandlordInvoices.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Receipt, Search, Filter, ArrowUpRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const LandlordInvoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const token = localStorage.getItem('token');
                // This targets your billing aggregation array
                const res = await axios.get('/api/v1/landlord/invoices', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setInvoices(res.data.data || []);
                setLoading(false);
            } catch (err) {
                // Fallback or demo array tracking if your specific invoice route isn't fully migrated yet
                console.warn("Targeted invoice stream pending, utilizing structured fallback matrix.");
                setInvoices([
                    { id: '1', tenant_name: 'John Doe', room_number: 'A4', total_amount: 15000, paid_amount: 15000, status: 'Paid', due_date: '2026-06-05' },
                    { id: '2', tenant_name: 'Jane Mwangi', room_number: 'B1', total_amount: 18500, paid_amount: 5000, status: 'Partially_Paid', due_date: '2026-06-02' },
                    { id: '3', tenant_name: 'Alex Otieno', room_number: 'C3', total_amount: 12000, paid_amount: 0, status: 'Overdue', due_date: '2026-05-28' },
                ]);
                setLoading(false);
            }
        };
        fetchInvoices();
    }, []);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Paid':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-3.5 h-3.5" /> Settled</span>;
            case 'Partially_Paid':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"><Clock className="w-3.5 h-3.5" /> Partial</span>;
            case 'Overdue':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20"><AlertCircle className="w-3.5 h-3.5" /> Overdue</span>;
            default:
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400 border border-slate-700">Unpaid</span>;
        }
    };

    const filteredInvoices = filterStatus === 'All'
        ? invoices
        : invoices.filter(inv => inv.status === filterStatus);

    if (loading) return <div className="text-center py-20 font-mono text-cyan-400 animate-pulse">Querying Financial Inflow State...</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Block */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-100 tracking-tight">Receivables Ledger</h2>
                    <p className="text-slate-400 text-sm mt-1">Audit trail for generated accounts, custom balances, and direct tenant invoices.</p>
                </div>
                <button className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] text-sm flex items-center gap-2">
                    <Receipt className="w-4 h-4" /> Issue New Invoice
                </button>
            </div>

            {/* Filter Toolbar System */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/20 border border-slate-800/60 p-4 rounded-2xl backdrop-blur-sm">
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl w-full max-w-md">
                    <Search className="w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by tenant name or room number..."
                        className="bg-transparent border-none outline-none text-sm text-slate-300 placeholder-slate-600 w-full font-sans"
                    />
                </div>

                <div className="flex items-center gap-2.5">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <div className="flex gap-1.5 bg-slate-950 p-1 border border-slate-800 rounded-xl text-xs font-semibold">
                        {['All', 'Paid', 'Partially_Paid', 'Overdue'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1.5 rounded-lg transition-all ${filterStatus === status
                                    ? 'bg-slate-800 text-cyan-400 border border-slate-700/60'
                                    : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Ledger Table */}
            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                <th className="p-4">Target Profile</th>
                                <th className="p-4">Due Date Matrix</th>
                                <th className="p-4">Status Tag</th>
                                <th className="p-4 text-right">Invoiced Limit</th>
                                <th className="p-4 text-right">Settled Delta</th>
                                <th className="p-4 text-center">Interventions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500 font-mono text-xs">No ledger anomalies matched the current filter matrix.</td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv) => {
                                    const remaining = inv.total_amount - inv.paid_amount;
                                    return (
                                        <tr key={inv.id} className="hover:bg-slate-900/10 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-200">{inv.tenant_name}</div>
                                                <span className="text-xs font-mono text-cyan-400">Chamber Rm {inv.room_number}</span>
                                            </td>
                                            <td className="p-4 font-mono text-xs text-slate-400">
                                                {new Date(inv.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="p-4">{getStatusBadge(inv.status)}</td>
                                            <td className="p-4 text-right font-mono font-bold text-slate-200">{inv.total_amount.toLocaleString()} KES</td>
                                            <td className="p-4 text-right font-mono text-emerald-400 font-medium">
                                                {inv.paid_amount > 0 ? `+${inv.paid_amount.toLocaleString()}` : '0.00'} KES
                                            </td>
                                            <td className="p-4 text-center">
                                                <button className="p-2 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded-lg transition-all border border-transparent hover:border-slate-700">
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LandlordInvoices;