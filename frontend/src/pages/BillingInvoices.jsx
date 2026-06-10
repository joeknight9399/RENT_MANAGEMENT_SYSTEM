import React, { useState, useEffect } from 'react';
import api from '../api';

export default function BillingInvoices() {
    const [loading, setLoading] = useState(true);
    const [statements, setStatements] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');

    const fetchBillingData = async () => {
        try {
            setErrorMsg('');
            const response = await api.get('/users/billing-history');
            if (response.data.status === 'Success') {
                setStatements(response.data.data);
            }
        } catch (err) {
            console.error("Ledger sync failure:", err);
            setErrorMsg(err.response?.data?.message || 'Failed to sync with financial gateway.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBillingData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center font-mono text-xs tracking-widest text-cyan-500 gap-3">
                <div className="h-4 w-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                FETCHING SECURE FINANCIAL LEDGER LOGS...
            </div>
        );
    }

    // Calculate quick metrics from state array
    const pendingInvoices = statements.filter(s => s.status === 'Unpaid' || s.status === 'Pending');
    const totalOutstanding = pendingInvoices.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

    return (
        <div className="min-h-screen bg-[#050505] text-slate-100 font-sans animate-in fade-in duration-300">

            {/* Header Identity Section */}
            <div className="border-b border-slate-900/80 pb-6 mb-8">
                <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-400 font-mono">Financial Ledger</span>
                <h1 className="text-2xl font-black text-white tracking-tight mt-0.5 uppercase">
                    Billing & Invoices
                </h1>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Review structural statements, real-time account balances, and historical clearings.
                </p>
            </div>

            {errorMsg && (
                <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-4 mb-6 font-mono text-xs text-red-400">
                    ⚠️ {errorMsg.toUpperCase()}
                </div>
            )}

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#0a0a0a] border border-slate-900 rounded-2xl p-6">
                    <h3 className="text-[10px] font-bold text-slate-500 tracking-widest uppercase font-mono">Total Outstanding</h3>
                    <p className="text-3xl font-black text-white tracking-tight mt-2">
                        KES {totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[10px] text-amber-400 font-mono bg-amber-950/20 border border-amber-900/30 px-2 py-0.5 rounded mt-3 inline-block uppercase">
                        {pendingInvoices.length} Pending Actions
                    </span>
                </div>

                <div className="bg-[#0a0a0a] border border-slate-900 rounded-2xl p-6 md:col-span-2 flex flex-col justify-between">
                    <div>
                        <h3 className="text-[10px] font-bold text-slate-500 tracking-widest uppercase font-mono">Payment Protocol Safeguard</h3>
                        <p className="text-xs text-slate-400 mt-2 font-mono leading-relaxed">
                            Rent-OS transactions route securely through encrypted mobile verification pathways. Balances update immediately following structural confirmation of payment.
                        </p>
                    </div>
                    <div className="text-[11px] text-slate-600 font-mono border-t border-slate-900/60 pt-3 mt-4">
                        Status: Secure Gateway Online
                    </div>
                </div>
            </div>

            {/* Statements Ledger Table Component Layout */}
            <div className="bg-[#0a0a0a] border border-slate-900 rounded-2xl p-6">
                <h3 className="text-[10px] font-bold text-slate-500 tracking-widest uppercase font-mono mb-4">Account Statement History</h3>

                {statements.length === 0 ? (
                    <div className="border border-dashed border-slate-900 p-12 rounded-xl text-center font-mono text-xs text-slate-600">
                        NO TRANSACTION OR INVOICE ENTRIES ENCOUNTERED IN THE ACCOUNT LEDGER PROFILE.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse font-mono text-xs">
                            <thead>
                                <tr className="border-b border-slate-900 text-slate-500 text-[10px] uppercase tracking-wider">
                                    <th className="pb-3 font-bold">Statement ID</th>
                                    <th className="pb-3 font-bold">Description</th>
                                    <th className="pb-3 font-bold">Due Date</th>
                                    <th className="pb-3 font-bold">Amount</th>
                                    <th className="pb-3 font-bold text-right">Settlement Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/40 text-slate-300">
                                {statements.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-slate-900/20 transition-colors">
                                        <td className="py-4 font-bold text-slate-400 truncate max-w-[120px]">{invoice.id}</td>
                                        <td className="py-4 font-sans text-slate-200 normal-case">{invoice.description || 'Monthly Unit Rent'}</td>
                                        <td className="py-4 text-slate-400">
                                            {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="py-4 font-bold text-white">
                                            KES {parseFloat(invoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-4 text-right">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${invoice.status === 'Paid'
                                                ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30'
                                                : invoice.status === 'Pending' || invoice.status === 'Processing'
                                                    ? 'bg-cyan-950/20 text-cyan-400 border-cyan-900/30 animate-pulse'
                                                    : 'bg-red-950/20 text-red-400 border-red-900/30'
                                                }`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}