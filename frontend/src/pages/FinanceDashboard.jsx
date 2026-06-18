// 📁 src/components/FinanceDashboard.jsx
import React, { useState, useEffect } from 'react';

const FinanceDashboard = () => {
    // State management
    const [summary, setSummary] = useState(null);
    const [ledger, setLedger] = useState([]);
    const [activeTab, setActiveTab] = useState('All'); // Options: All, Paid, Unpaid, Partially_Paid
    const [selectedMonth, setSelectedMonth] = useState('2026-06'); // Default to target month
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch financial summary metrics and data ledger
    useEffect(() => {
        const fetchFinanceData = async () => {
            setLoading(true);
            setError(null);
            try {
                // 1. Fetch Top Stat Cards Data
                const summaryRes = await fetch(`/api/v1/finance/summary?month=${selectedMonth}`);
                const summaryData = await summaryRes.json();

                // 2. Fetch Detailed Ledger Data (Apply status filter conditionally)
                const statusParam = activeTab !== 'All' ? `&status=${activeTab}` : '';
                const ledgerRes = await fetch(`/api/v1/finance/ledger?month=${selectedMonth}${statusParam}`);
                const ledgerData = await ledgerRes.json();

                if (summaryData.status === 'Success' && ledgerData.status === 'Success') {
                    setSummary(summaryData.data);
                    setLedger(ledgerData.data);
                } else {
                    throw new Error('Failed to retrieve full financial data rows');
                }
            } catch (err) {
                console.error(err);
                setError('Error connecting to financial backend API services.');
            } finally {
                setLoading(false);
            }
        };

        fetchFinanceData();
    }, [selectedMonth, activeTab]);

    if (loading) return <div className="p-8 text-center text-gray-600 font-medium">Loading collections data...</div>;
    if (error) return <div className="p-8 text-center text-red-500 font-medium">{error}</div>;

    const metrics = summary?.revenue_metrics;
    const breakdown = summary?.status_breakdown;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Dashboard Header Container */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Collections Dashboard</h1>
                    <p className="text-sm text-gray-500">Track tenant billing status, active payments, and rental cash flow balances</p>
                </div>

                {/* Month Selector Dropdown */}
                <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-gray-600">Billing Period:</label>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* 1. Top Metric Stat Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Expected Revenue</p>
                    <h3 className="text-2xl font-black text-gray-800 mt-1">
                        KES {metrics?.expected_total_revenue?.toLocaleString()}
                    </h3>
                    <p className="text-xs text-gray-500 mt-2">Total bills issued this period</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
                    <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Cash Collected</p>
                    <h3 className="text-2xl font-black text-green-700 mt-1">
                        KES {metrics?.actual_cash_collected?.toLocaleString()}
                    </h3>
                    <p className="text-xs text-gray-500 mt-2">Verified M-Pesa settlements</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-amber-500">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Outstanding Balance</p>
                    <h3 className="text-2xl font-black text-amber-700 mt-1">
                        KES {metrics?.total_outstanding_balance?.toLocaleString()}
                    </h3>
                    <p className="text-xs text-gray-500 mt-2">Remaining pending collections</p>
                </div>
            </div>

            {/* 2. Main Ledger Interactive Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                {/* Navigation Tabs Header */}
                <div className="flex border-b border-gray-200 bg-gray-50 px-4 pt-3 gap-2">
                    {['All', 'Paid', 'Unpaid', 'Partially_Paid'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors duration-150 ${activeTab === tab
                                ? 'bg-white text-blue-600 border border-b-white border-gray-200 shadow-xs'
                                : 'text-gray-500 hover:text-gray-800'
                                }`}
                        >
                            {tab.replace('_', ' ')}
                            <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                {tab === 'All' ? ledger.length : breakdown?.[tab]?.count || 0}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Data Grid Table Wrapper */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
                                <th className="px-6 py-4">Room No</th>
                                <th className="px-6 py-4">Tenant Name</th>
                                <th className="px-6 py-4">Phone Number</th>
                                <th className="px-6 py-4 text-right">Total Due</th>
                                <th className="px-6 py-4 text-right">Paid So Far</th>
                                <th className="px-6 py-4 text-right">Balance Owed</th>
                                <th className="px-6 py-4 text-center">Status Flag</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                            {ledger.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-8 text-gray-400 font-medium">
                                        No active invoice records match this filter context.
                                    </td>
                                </tr>
                            ) : (
                                ledger.map((item) => (
                                    <tr key={item.invoice_id} className="hover:bg-gray-50/70 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900">{item.room_number}</td>
                                        <td className="px-6 py-4 font-medium">{item.tenant_name}</td>
                                        <td className="px-6 py-4 text-gray-500">{item.tenant_phone}</td>
                                        <td className="px-6 py-4 text-right font-semibold">KES {parseFloat(item.total_owed).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-green-600 font-semibold">KES {parseFloat(item.total_paid).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-amber-600 font-semibold">
                                            KES {parseFloat(item.remaining_balance).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${item.invoice_status === 'Paid' ? 'bg-green-100 text-green-700' :
                                                item.invoice_status === 'Partially_Paid' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-red-100 text-red-700'
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