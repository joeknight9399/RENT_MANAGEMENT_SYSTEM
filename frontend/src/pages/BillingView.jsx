import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';

export default function BillingView() {
    const [loading, setLoading] = useState(true);
    const [statements, setStatements] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');

    // Modal & Transaction Processing States
    const [processingPayment, setProcessingPayment] = useState(false);
    const [activeInvoice, setActiveInvoice] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');

    // Using a ref to track active polling timers across renders/unmounts
    const pollingIntervalRef = useRef(null);

    const fetchBillingData = async (silent = false) => {
        try {
            if (!silent) setErrorMsg('');
            const response = await api.get('/users/billing-history');
            if (response.data.status === 'Success') {
                setStatements(response.data.data);
            }
        } catch (err) {
            console.error("Ledger sync failure:", err);
            if (!silent) {
                setErrorMsg(err.response?.data?.message || 'Could not connect to the billing system.');
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // Clean up any rogue background polling if user navigates away mid-transaction
    useEffect(() => {
        fetchBillingData();
        return () => {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        };
    }, []);

    const handleTriggerPaymentModal = (invoice) => {
        setActiveInvoice(invoice);
        setPhoneNumber('');
    };

    // Polls the backend to check if the Safaricom callback has been processed
    const pollPaymentStatus = (checkoutRequestID, loadingToastId) => {
        let attempts = 0;
        const maxAttempts = 12; // Poll every 3 seconds for up to 36 seconds

        pollingIntervalRef.current = setInterval(async () => {
            attempts += 1;
            try {
                const checkRes = await api.get(`/users/payment-status/${checkoutRequestID}`);
                const status = checkRes.data.status;

                if (status === 'Completed') {
                    clearInterval(pollingIntervalRef.current);
                    setProcessingPayment(false);
                    setActiveInvoice(null);
                    toast.success("Payment verified! Account statement updated.", { id: loadingToastId });
                    fetchBillingData(true); // Silent reload to refresh table rows
                } else if (status === 'Failed') {
                    clearInterval(pollingIntervalRef.current);
                    setProcessingPayment(false);
                    toast.error(checkRes.data.message || "Transaction declined or timed out.", { id: loadingToastId });
                    fetchBillingData(true);
                }
            } catch (err) {
                console.warn("Polling lookup glitch:", err);
            }

            if (attempts >= maxAttempts) {
                clearInterval(pollingIntervalRef.current);
                setProcessingPayment(false);
                toast.error("Verification taking longer than usual. Check your statement shortly.", { id: loadingToastId });
                fetchBillingData(true);
            }
        }, 3000);
    };

    const handleExecutePayment = async (e) => {
        e.preventDefault();
        if (!phoneNumber) return toast.error("Please enter your M-Pesa phone number.");

        // Normalize local numbers to standard Kenyan prefix formats if necessary
        setProcessingPayment(true);
        const loadingToast = toast.loading("Requesting STK Push prompt on your device...");

        try {
            const response = await api.post('/users/initiate-payment', {
                invoiceId: activeInvoice.id,
                phoneNumber: phoneNumber.trim()
            });

            if (response.data.status === 'Success') {
                toast.loading("Prompt dispatched! Enter your M-Pesa PIN on your handset...", { id: loadingToast });

                // Expecting backend to pass back the tracking CheckoutRequestID from Daraja
                const { checkoutRequestID } = response.data;
                if (checkoutRequestID) {
                    pollPaymentStatus(checkoutRequestID, loadingToast);
                } else {
                    // Fallback graceful UI update if API handles polling purely socket/webhook side
                    setTimeout(() => {
                        fetchBillingData(true);
                        setProcessingPayment(false);
                        setActiveInvoice(null);
                        toast.success("Records re-synchronized.", { id: loadingToast });
                    }, 9000);
                }
            }
        } catch (err) {
            console.error("Payment pipeline execution error:", err);
            setProcessingPayment(false);
            toast.error(err.response?.data?.message || "Failed to trigger M-Pesa push. Verify the line and try again.", { id: loadingToast });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-sm font-semibold tracking-wide text-cyan-500 gap-3">
                <div className="h-5 w-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                Loading your billing statements...
            </div>
        );
    }

    const pendingInvoices = statements.filter(s => s.status === 'Unpaid' || s.status === 'Pending');
    const totalOutstanding = pendingInvoices.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

    return (
        <div className="min-h-screen bg-[#050505] text-slate-100 font-sans p-4 md:p-6 animate-in fade-in duration-300">

            <div className="border-b border-slate-900/80 pb-6 mb-8">
                <span className="text-xs font-bold tracking-wider uppercase text-indigo-400">Payment History</span>
                <h1 className="text-2xl font-black text-white tracking-tight mt-0.5">My Bills & Invoices</h1>
                <p className="text-sm text-slate-400 mt-0.5">View your current balance, past payments, and settle outstanding bills.</p>
            </div>

            {errorMsg && (
                <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-4 mb-6 text-sm text-red-400">
                    ⚠️ {errorMsg}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#0a0a0a] border border-slate-900 rounded-2xl p-6">
                    <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Total Unpaid Amount</h3>
                    <p className="text-3xl font-black text-white tracking-tight mt-2">
                        KES {totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-xs text-amber-400 font-medium bg-amber-950/20 border border-amber-900/30 px-2.5 py-1 rounded-lg mt-3 inline-block">
                        {pendingInvoices.length} Bills Waiting Payment
                    </span>
                </div>

                <div className="bg-[#0a0a0a] border border-slate-900 rounded-2xl p-6 md:col-span-2 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Safe and Secure Payments</h3>
                        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                            All payments are securely completed on your own mobile phone via Safaricom M-Pesa. Your records will automatically update immediately after you authorize the transaction on your device.
                        </p>
                    </div>
                    <div className="text-xs text-slate-500 border-t border-slate-900/60 pt-3 mt-4 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Official M-Pesa Gateway Online
                    </div>
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-slate-900 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-slate-200 tracking-wide mb-4">Account Statement History</h3>

                {statements.length === 0 ? (
                    <div className="border border-dashed border-slate-800 p-12 rounded-xl text-center text-sm text-slate-500">
                        No invoices or payments found in your account history.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-slate-900 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="pb-3 font-bold">Invoice ID</th>
                                    <th className="pb-3 font-bold">Description</th>
                                    <th className="pb-3 font-bold">Due Date</th>
                                    <th className="pb-3 font-bold">Amount</th>
                                    <th className="pb-3 font-bold text-center">Status</th>
                                    <th className="pb-3 font-bold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/40 text-slate-300">
                                {statements.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-slate-900/20 transition-colors">
                                        <td className="py-4 font-mono font-bold text-slate-400 truncate max-w-[120px]">{invoice.id}</td>
                                        <td className="py-4 text-slate-200 font-medium">{invoice.description || 'Monthly Rent'}</td>
                                        <td className="py-4 text-slate-400">
                                            {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="py-4 font-bold text-white">
                                            KES {parseFloat(invoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${invoice.status === 'Paid'
                                                ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30'
                                                : invoice.status === 'Pending' || invoice.status === 'Processing'
                                                    ? 'bg-cyan-950/20 text-cyan-400 border-cyan-900/30 animate-pulse'
                                                    : 'bg-red-950/20 text-red-400 border-red-900/30'
                                                }`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right">
                                            {invoice.status !== 'Paid' ? (
                                                <button
                                                    onClick={() => handleTriggerPaymentModal(invoice)}
                                                    disabled={invoice.status === 'Pending' || processingPayment}
                                                    className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-40 min-h-[40px]"
                                                >
                                                    {invoice.status === 'Pending' ? 'Processing...' : 'Pay Now'}
                                                </button>
                                            ) : (
                                                <span className="text-slate-500 text-xs font-semibold select-none">Paid ✓</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* M-PESA CHECKOUT MODAL */}
            {activeInvoice && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white text-slate-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl transition-all border border-slate-200">

                        <div className="bg-[#41B649] px-6 py-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-2">
                                <svg className="w-16 h-8 fill-current" viewBox="0 0 100 50">
                                    <rect x="0" y="5" width="90" height="36" rx="6" fill="white" />
                                    <text x="8" y="30" fontFamily="sans-serif" fontWeight="900" fontSize="16" fill="#41B649">M-PESA</text>
                                    <circle cx="84" cy="15" r="4" fill="#E41C24" />
                                </svg>
                                <span className="font-bold text-base tracking-wide">M-Pesa Checkout</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
                                    setProcessingPayment(false);
                                    setActiveInvoice(null);
                                }}
                                disabled={processingPayment}
                                className="text-white/80 hover:text-white font-bold text-xl p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full hover:bg-black/10 disabled:opacity-30"
                                aria-label="Cancel payment"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 bg-slate-50 border-b border-slate-200 text-sm">
                            <div className="flex justify-between py-1.5">
                                <span className="text-slate-500 font-medium">Paying To:</span>
                                <span className="font-bold text-slate-800">KEJA DIGITAL</span>
                            </div>
                            <div className="flex justify-between py-1.5">
                                <span className="text-slate-500 font-medium">Description:</span>
                                <span className="font-semibold text-slate-700 truncate max-w-[200px]">{activeInvoice.description || 'House Rent Payment'}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-t border-slate-200 mt-2 pt-2">
                                <span className="text-slate-800 font-bold text-base">Amount Due:</span>
                                <span className="font-black text-lg text-[#41B649]">
                                    KES {parseFloat(activeInvoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleExecutePayment} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                    Enter Safaricom M-Pesa Phone Number
                                </label>
                                <input
                                    type="tel"
                                    placeholder="e.g., 0712345678 or 0112345678"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    disabled={processingPayment}
                                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-[#41B649] transition-colors disabled:bg-slate-100 disabled:text-slate-400"
                                    required
                                />
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-3 text-xs text-amber-800 leading-relaxed">
                                <span className="text-lg shrink-0">💡</span>
                                <div>
                                    <strong className="font-bold">What happens next?</strong> After clicking pay below, keep your device unlocked. Confirm the instant green overlay prompt, type your secure <strong className="font-bold">M-Pesa PIN</strong>, and hit submit. The terminal will automatically register the transaction status.
                                </div>
                            </div>

                            <div className="pt-2 space-y-2">
                                <button
                                    type="submit"
                                    disabled={processingPayment}
                                    className="w-full bg-[#41B649] hover:bg-[#369b3d] text-white text-base font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 min-h-[52px]"
                                >
                                    {processingPayment ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Verifying Transaction PIN...
                                        </>
                                    ) : (
                                        `Pay KES ${parseFloat(activeInvoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
                                        setProcessingPayment(false);
                                        setActiveInvoice(null);
                                    }}
                                    disabled={processingPayment}
                                    className="w-full bg-transparent hover:bg-slate-100 text-slate-500 hover:text-slate-700 text-sm font-bold py-2 rounded-xl transition-all min-h-[44px] disabled:opacity-0"
                                >
                                    Cancel & Go Back
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}