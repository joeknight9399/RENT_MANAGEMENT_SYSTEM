import React, { useState, useEffect } from 'react';

const MonthlyBilling = () => {
    const [billingMonth, setBillingMonth] = useState('2026-06');
    const [dueDate, setDueDate] = useState('2026-06-10');

    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [processingId, setProcessingId] = useState(null);

    // Toast notification
    const [toast, setToast] = useState({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 4000);
    };

    const handleMonthChange = (e) => {
        const newMonth = e.target.value;
        setBillingMonth(newMonth);

        if (newMonth) {
            setDueDate(`${newMonth}-10`);
        }
    };

    const fetchPreviews = async () => {
        if (!billingMonth) return;

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');

            const res = await fetch(`/api/v1/admin/billing-preview?month=${billingMonth}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await res.json();

            if (data.status === 'Success') {
                setPreviews(data.data || []);
            } else {
                setError(data.message || 'Failed to load billing previews');
            }
        } catch (err) {
            console.error(err);
            setError('Could not connect to server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch previews when month changes
    useEffect(() => {
        fetchPreviews();
    }, [billingMonth]);

    const openConfirmModal = (item) => {
        setSelectedItem(item);
    };

    const [selectedItem, setSelectedItem] = useState(null);

    const generateInvoice = async () => {
        if (!selectedItem) return;

        setProcessingId(selectedItem.lease_id);
        setSelectedItem(null); // close modal

        try {
            const token = localStorage.getItem('token');
            const readingIds = selectedItem.utilities_list?.map(u => u.reading_id) || [];

            const response = await fetch('/api/v1/admin/generate-invoice', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    lease_id: selectedItem.lease_id,
                    billing_period: `${billingMonth}-01`,
                    due_date: dueDate,
                    rent_amount: selectedItem.rent_amount,
                    utilities_amount: selectedItem.utilities_amount,
                    total_amount: selectedItem.total_amount,
                    reading_ids: readingIds
                })
            });

            const result = await response.json();

            if (response.ok && result.status === 'Success') {
                showToast(`Invoice created for Room ${selectedItem.room_number}`, 'success');

                // Remove from list
                setPreviews(prev => prev.filter(p => p.lease_id !== selectedItem.lease_id));
            } else {
                showToast(result.message || 'Failed to generate invoice', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Something went wrong. Please try again.', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
            {/* Toast */}
            {toast.show && (
                <div className={`fixed top-4 right-4 z-50 px-5 py-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all ${toast.type === 'success'
                    ? 'bg-emerald-900/90 border-emerald-500 text-emerald-100'
                    : 'bg-rose-900/90 border-rose-500 text-rose-100'}`}>
                    <p className="text-sm font-medium">{toast.message}</p>
                </div>
            )}

            <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                    Monthly Billing
                </h2>
                <p className="text-slate-500 mt-1 text-sm">
                    Review pending invoices and issue statements
                </p>
            </div>

            {/* Controls */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:flex gap-4 lg:items-end">
                <div className="space-y-2 flex-1">
                    <label className="text-xs uppercase tracking-widest text-slate-500 font-medium block">
                        Billing Month
                    </label>
                    <input
                        type="month"
                        value={billingMonth}
                        onChange={handleMonthChange}
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-cyan-600 outline-none transition-colors"
                    />
                </div>

                <div className="space-y-2 flex-1">
                    <label className="text-xs uppercase tracking-widest text-slate-500 font-medium block">
                        Due Date
                    </label>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-cyan-600 outline-none transition-colors"
                    />
                </div>

                <button
                    onClick={fetchPreviews}
                    className="mt-auto px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium transition-colors"
                >
                    Refresh
                </button>
            </div>

            {error && (
                <div className="bg-red-950/50 border border-red-900 text-red-400 p-4 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-zinc-950 border border-zinc-900 rounded-2xl">
                    <div className="w-7 h-7 border-2 border-zinc-700 border-t-cyan-500 rounded-full animate-spin mb-3"></div>
                    <p className="text-slate-500 text-sm">Loading billing data...</p>
                </div>
            ) : previews.length === 0 ? (
                <div className="text-center py-20 bg-zinc-950 border border-zinc-900 rounded-2xl border-dashed">
                    <p className="text-slate-500">No pending billings for this month.</p>
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="hidden md:block bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-zinc-900 text-xs uppercase tracking-widest text-slate-500">
                                    <th className="text-left p-5">Room</th>
                                    <th className="text-left p-5">Tenant</th>
                                    <th className="text-left p-5">Rent</th>
                                    <th className="text-left p-5">Utilities</th>
                                    <th className="text-left p-5">Total</th>
                                    <th className="w-40 p-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-900 text-sm">
                                {previews.map((item) => (
                                    <tr key={item.lease_id} className="hover:bg-zinc-900/50 transition-colors">
                                        <td className="p-5 font-semibold text-cyan-400">{item.room_number}</td>
                                        <td className="p-5 font-medium">{item.tenant_name}</td>
                                        <td className="p-5">KES {item.rent_amount?.toLocaleString()}</td>
                                        <td className="p-5">
                                            KES {item.utilities_amount?.toLocaleString()}
                                            {item.utilities_list?.length > 0 && (
                                                <div className="text-xs text-slate-500 mt-1">
                                                    {item.utilities_list.map((u, i) => (
                                                        <div key={i}>• {u.utility_type}: {u.cost}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-5 font-semibold">KES {item.total_amount?.toLocaleString()}</td>
                                        <td className="p-5">
                                            <button
                                                onClick={() => openConfirmModal(item)}
                                                disabled={processingId !== null}
                                                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors text-black font-semibold py-2.5 rounded-xl text-sm"
                                            >
                                                {processingId === item.lease_id ? 'Processing...' : 'Issue Invoice'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4">
                        {previews.map((item) => (
                            <div key={item.lease_id} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-4">
                                <div className="flex justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500">ROOM</p>
                                        <p className="text-xl font-bold text-cyan-400">{item.room_number}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">TENANT</p>
                                        <p className="font-medium">{item.tenant_name}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500">RENT</p>
                                        <p className="font-semibold">KES {item.rent_amount?.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">UTILITIES</p>
                                        <p className="font-semibold">KES {item.utilities_amount?.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-zinc-900 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500">TOTAL DUE</p>
                                        <p className="text-lg font-bold">KES {item.total_amount?.toLocaleString()}</p>
                                    </div>
                                    <button
                                        onClick={() => openConfirmModal(item)}
                                        disabled={processingId !== null}
                                        className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-800 text-black font-semibold rounded-xl"
                                    >
                                        {processingId === item.lease_id ? 'Processing...' : 'Issue Invoice'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Confirmation Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold">Issue Invoice?</h3>
                            <p className="text-slate-400 mt-2">
                                Room <span className="text-cyan-400">{selectedItem.room_number}</span> — {selectedItem.tenant_name}
                            </p>
                        </div>

                        <div className="bg-black/50 p-4 rounded-xl text-sm space-y-2">
                            <div className="flex justify-between">
                                <span>Rent</span>
                                <span>KES {selectedItem.rent_amount?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Utilities</span>
                                <span>KES {selectedItem.utilities_amount?.toLocaleString()}</span>
                            </div>
                            <div className="border-t border-zinc-800 pt-2 flex justify-between font-semibold text-cyan-400">
                                <span>Total</span>
                                <span>KES {selectedItem.total_amount?.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="flex-1 py-3 border border-zinc-700 rounded-xl hover:bg-zinc-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={generateInvoice}
                                className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-black font-semibold rounded-xl transition-colors"
                            >
                                Yes, Issue Invoice
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonthlyBilling;