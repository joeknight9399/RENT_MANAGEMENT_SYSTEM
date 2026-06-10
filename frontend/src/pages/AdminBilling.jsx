import React, { useState, useEffect } from 'react';
import api from '../api';

function AdminBilling() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const response = await api.get('/billing/admin-directory');
                setInvoices(response.data.data);
            } catch (err) {
                console.error("Failed to fetch billing directory", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoices();
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-black mb-6 text-white">Financial Ledger</h1>

            {loading ? (
                <div className="text-slate-500">Syncing transaction ledger...</div>
            ) : (
                <div className="bg-[#0a0a0a] border border-slate-900 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900/50 uppercase text-slate-500">
                            <tr>
                                <th className="p-4">Tenant</th>
                                <th className="p-4">Period</th>
                                <th className="p-4">Total</th>
                                <th className="p-4">Paid</th>
                                <th className="p-4">Balance</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900">
                            {invoices.map((inv) => (
                                <tr key={inv.invoice_id} className="hover:bg-white/5 transition">
                                    <td className="p-4 font-bold">{inv.tenant_name} (R{inv.room_number})</td>
                                    <td className="p-4">{inv.billing_period}</td>
                                    <td className="p-4 font-mono text-slate-300">KES {inv.original_bill.toLocaleString()}</td>
                                    <td className="p-4 font-mono text-emerald-400">KES {inv.total_paid_so_far.toLocaleString()}</td>
                                    <td className={`p-4 font-mono ${inv.balance_remaining > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                                        KES {inv.balance_remaining.toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full font-bold ${inv.invoice_status === 'Paid' ? 'bg-emerald-900 text-emerald-300' :
                                            inv.invoice_status === 'Partially_Paid' ? 'bg-amber-900 text-amber-300' : 'bg-rose-900 text-rose-300'
                                            }`}>
                                            {inv.invoice_status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default AdminBilling;