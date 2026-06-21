// 📁 src/components/FinanceDashboard.jsx
import React, { useState, useEffect } from 'react';
import api from '../api'; // Maps to frontend/src/api.js

const FinanceDashboard = () => {
    const [summary, setSummary] = useState(null);
    const [ledger, setLedger] = useState([]);
    const [activeTab, setActiveTab] = useState('All');
    const [selectedMonth, setSelectedMonth] = useState('2026-06');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFinanceData = async () => {
            setLoading(true);
            setError(null);
            try {
                // 1. Fetch Top Metric Aggregates 
                const summaryRes = await api.get(`/finance/summary?month=${selectedMonth}`);
                const summaryData = summaryRes.data;

                // 2. Fetch Granular Ledger Matrix rows (Apply status filter conditionally)
                const statusParam = activeTab !== 'All' ? `&status=${activeTab}` : '';
                const ledgerRes = await api.get(`/finance/ledger?month=${selectedMonth}${statusParam}`);
                const ledgerData = ledgerRes.data;

                if (summaryData.status === 'Success' && ledgerData.status === 'Success') {
                    setSummary(summaryData.data);
                    setLedger(ledgerData.data);
                } else {
                    throw new Error('Failed to retrieve full financial data rows');
                }
            } catch (err) {
                console.error('Ledger Fetch Error:', err);
                setError('Error connecting to root operational database node layers.');
            } finally {
                setLoading(false);
            }
        };

        fetchFinanceData();
    }, [selectedMonth, activeTab]);

    if (loading) {
        return (
            <div className="p-8 text-center text-slate-400 font-medium tracking-wide">
                Loading ledger records context...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-400 font-medium tracking-wide border border-red-500/10 bg-red-500/5 rounded-2xl">
                {error}
            </div>
        );
    }

    const metrics = summary?.revenue_metrics;
    const breakdown = summary?.status_breakdown;

    return (
        <div className="space-y-6 text-slate-100">

            {/* ─── HEADER FRAME ─── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/60 pb-5 gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white">Collections Ledger Matrix</h2>
                    <p className="text-xs text-slate-400 mt-1">Real-time cryptographic audit trail of M-Pesa client settlements</p>
                </div>

                <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Billing Frame:</label>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="border border-slate-800 bg-slate-900 rounded-xl px-3 py-1.5 text-xs text-cyan-400 shadow-inner focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                </div>
            </div>

            {/* ─── METRIC CARDS MATRIX ─── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800/80 shadow-md">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Expected Yield Gross</p>
                    <h3 className="text-xl font-black text-slate-200 mt-1">
                        KES {metrics?.expected_total_revenue?.toLocaleString() || '0'}
                    </h3>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800/80 border-l-2 border-l-emerald-500 shadow-md">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Settled Liquid Cash</p>
                    <h3 className="text-xl font-black text-emerald-400 mt-1">
                        KES {metrics?.actual_cash_collected?.toLocaleString() || '0'}
                    </h3>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800/80 border-l-2 border-l-cyan-500 shadow-md">
                    <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">Outstanding Float Delta</p>
                    <h3 className="text-xl font-black text-cyan-400 mt-1">
                        KES {metrics?.total_outstanding_balance?.toLocaleString() || '0'}
                    </h3>
                </div>
            </div>

            {/* ─── DATA TABLE CONTROL GRID ─── */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">

                {/* Navigation Tabs Header */}
                <div className="flex border-b border-slate-800/60 bg-slate-950/40 px-4 pt-3 gap-2 overflow-x-auto scrollbar-none">
                    {['All', 'Paid', 'Unpaid', 'Partially_Paid'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all duration-150 whitespace-nowrap ${activeTab === tab
                                ? 'bg-slate-900 text-cyan-400 border border-b-slate-900 border-slate-800/80'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            {tab.replace('_', ' ')}
                            <span className="ml-2 text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                                {tab === 'All' ? ledger.length : breakdown?.[tab]?.count || 0}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Data Grid Table Wrapper */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/20 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/40">
                                <th className="px-6 py-4.5">Room</th>
                                <th className="px-6 py-4.5">Tenant identity</th>
                                <th className="px-6 py-4.5">Contact Node</th>
                                <th className="px-6 py-4.5 text-right">Target Due</th>
                                <th className="px-6 py-4.5 text-right">Settled Amount</th>
                                <th className="px-6 py-4.5 text-right">Delta Balance</th>
                                <th className="px-6 py-4.5 text-center">Status Matrix</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-xs text-slate-300">
                            {ledger.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-10 text-slate-500 font-medium">
                                        No active invoice contexts linked within this filter branch.
                                    </td>
                                </tr>
                            ) : (
                                ledger.map((item) => (
                                    <tr key={item.invoice_id} className="hover:bg-slate-850/40 transition-colors">
                                        <td className="px-6 py-4 font-bold text-white">{item.room_number}</td>
                                        <td className="px-6 py-4 font-medium text-slate-200">{item.tenant_name}</td>
                                        <td className="px-6 py-4 text-slate-400 font-mono">{item.tenant_phone}</td>
                                        <td className="px-6 py-4 text-right font-semibold">
                                            KES {parseFloat(item.total_owed).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right text-emerald-400 font-semibold">
                                            KES {parseFloat(item.total_paid).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right text-cyan-400 font-semibold">
                                            KES {parseFloat(item.remaining_balance).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border ${item.invoice_status === 'Paid' ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' :
                                                item.invoice_status === 'Partially_Paid' ? 'bg-amber-500/5 text-amber-400 border-amber-500/20' :
                                                    'bg-red-500/5 text-red-400 border-red-500/20'
                                                }`}>
                                                {item.invoice_status.replace('_', ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FinanceDashboard;