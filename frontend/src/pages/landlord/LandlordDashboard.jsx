import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DollarSign, Building, AlertTriangle, TrendingUp, Users, ArrowUpRight } from 'lucide-react';

const LandlordDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchIntel = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('/api/v1/landlord/overview', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setDashboardData(res.data.data);
                setLoading(false);
            } catch (err) {
                console.error("Dashboard ingestion break:", err);
                setError("Failed to stream core metrics from the main array.");
                setLoading(false);
            }
        };
        fetchIntel();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-500/10"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="border border-rose-500/20 bg-rose-950/20 text-rose-400 p-6 rounded-2xl flex items-center gap-3 max-w-2xl mx-auto shadow-[0_0_30px_rgba(244,63,94,0.05)]">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <p className="font-medium tracking-wide">{error}</p>
            </div>
        );
    }

    const { metrics, properties, recentPayments } = dashboardData;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Dynamic Identity Welcomer */}
            <div>
                <h2 className="text-3xl font-bold text-slate-100 tracking-tight">Macro Overview</h2>
                <p className="text-slate-400 text-sm mt-1">Cross-estate telemetry, portfolio yields, and maintenance operations.</p>
            </div>

            {/* Primary Financial Metric Array */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1: Revenue Yields */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                    <div className="absolute top-0 right-0 p-6 opacity-10 text-cyan-400 group-hover:opacity-20 transition-all">
                        <DollarSign className="w-16 h-16" />
                    </div>
                    <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Gross Revenue (KES)</p>
                    <p className="text-2xl font-mono font-bold text-cyan-400 mt-2">
                        {metrics.totalRevenue.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10 w-fit">
                        <TrendingUp className="w-3.5 h-3.5" /> Total Inbound Settled
                    </div>
                </div>

                {/* Card 2: Net Operations Yield */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                    <div className="absolute top-0 right-0 p-6 opacity-10 text-emerald-400 group-hover:opacity-20 transition-all">
                        <TrendingUp className="w-16 h-16" />
                    </div>
                    <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Net Profit Margin</p>
                    <p className="text-2xl font-mono font-bold text-emerald-400 mt-2">
                        {metrics.netProfit.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-slate-500 mt-4.5">After deductions / structural overhead</p>
                </div>

                {/* Card 3: Macro Occupancy Metric */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                    <div className="absolute top-0 right-0 p-6 opacity-10 text-indigo-400 group-hover:opacity-20 transition-all">
                        <Users className="w-16 h-16" />
                    </div>
                    <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Occupancy Threshold</p>
                    <p className="text-2xl font-mono font-bold text-indigo-400 mt-2">{metrics.occupancyRate}%</p>
                    <div className="mt-4 text-xs text-slate-400 flex gap-3">
                        <span><strong className="text-slate-200">{metrics.unitBreakdown.occupied_units}</strong> Occupied</span>
                        <span><strong className="text-slate-200">{metrics.unitBreakdown.vacant_units}</strong> Open</span>
                    </div>
                </div>

                {/* Card 4: System Risk / Outstanding Receivables */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                    <div className="absolute top-0 right-0 p-6 opacity-10 text-amber-400 group-hover:opacity-20 transition-all">
                        <AlertTriangle className="w-16 h-16" />
                    </div>
                    <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Outstanding Invoices</p>
                    <p className="text-2xl font-mono font-bold text-amber-400 mt-2">
                        {metrics.totalOutstanding.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-xs text-amber-400/80 bg-amber-500/5 px-2.5 py-1 rounded-lg border border-amber-500/10 w-fit">
                        <span>{metrics.ticketBreakdown.pending_tickets} Actionable Ground Tickets</span>
                    </div>
                </div>
            </div>

            {/* Secondary Structural Grid: Estates vs Feed Audit */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Side Column: Estate Infrastructure Yields */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                            <Building className="w-4 h-4 text-cyan-400" /> Estate Matrix Breakdown
                        </h3>
                    </div>

                    <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-xs font-semibold tracking-wider uppercase">
                                        <th className="p-4">Property Name</th>
                                        <th className="p-4">Location Matrix</th>
                                        <th className="p-4 text-center">Allocated Units</th>
                                        <th className="p-4 text-right">Status Profile</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 text-sm">
                                    {properties.map((estate) => {
                                        const occPct = estate.total_units > 0 ? Math.round((estate.occupied_count / estate.total_units) * 100) : 0;
                                        return (
                                            <tr key={estate.id} className="hover:bg-slate-900/20 transition-colors">
                                                <td className="p-4 font-semibold text-slate-200">{estate.name}</td>
                                                <td className="p-4 text-slate-400">{estate.location}</td>
                                                <td className="p-4 text-center font-mono text-slate-300">{estate.total_units}</td>
                                                <td className="p-4 text-right">
                                                    <div className="inline-flex flex-col items-end">
                                                        <span className="font-mono text-xs font-semibold text-cyan-400">{occPct}% Filled</span>
                                                        <span className="text-[11px] text-slate-500">{estate.vacant_count} vacant chambers</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Side Column: Live Ledger Transaction Stream */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4 text-emerald-400" /> Real-Time Settlement Inflow
                    </h3>

                    <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
                        {recentPayments.length === 0 ? (
                            <p className="text-slate-500 text-xs text-center py-6">No historical records detected inside the active array cycle.</p>
                        ) : (
                            recentPayments.map((payment) => (
                                <div key={payment.id} className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl flex justify-between items-center group hover:border-emerald-500/20 transition-all">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">{payment.tenant_name}</p>
                                        <p className="text-[11px] text-slate-400 font-medium">
                                            {payment.property_name} • <span className="font-mono text-cyan-400">Rm {payment.room_number}</span>
                                        </p>
                                        <span className="inline-block text-[10px] font-mono font-semibold uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md border border-slate-700">
                                            {payment.payment_method}
                                        </span>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="font-mono text-sm font-bold text-emerald-400">+{parseFloat(payment.amount_paid).toLocaleString('en-KE')} KES</p>
                                        <p className="text-[10px] text-slate-500 font-mono">
                                            {new Date(payment.paid_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LandlordDashboard;