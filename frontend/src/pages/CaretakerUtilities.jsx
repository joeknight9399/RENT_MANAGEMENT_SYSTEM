import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import ArrivalsModal from '../components/caretaker/ArrivalsModal';
import MetricLogModal from '../components/caretaker/MetricLogModal';

const API_BASE = 'http://localhost:5000/api/v1/caretaker';

export default function CaretakerUtilities() {
    const [arrivalsCount, setArrivalsCount] = useState(0);
    const [activeLeasesCount, setActiveLeasesCount] = useState(0);
    const [isArrivalsOpen, setIsArrivalsOpen] = useState(false);
    const [isMetricsOpen, setIsMetricsOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        // Fetch background metrics just to keep statistics accurate on dashboard cards
        const fetchDashboardSummary = async () => {
            try {
                const [arrivalsRes, leasesRes] = await Promise.all([
                    axios.get(`${API_BASE}/pending-move-ins`, { withCredentials: true }),
                    axios.get(`${API_BASE}/active-leases`, { withCredentials: true })
                ]);
                if (arrivalsRes.data.status === 'Success') setArrivalsCount(arrivalsRes.data.data.length);
                if (leasesRes.data.status === 'Success') setActiveLeasesCount(leasesRes.data.data.length);
            } catch (err) {
                console.error("Dashboard statistics sync failure:", err);
            }
        };
        fetchDashboardSummary();
    }, [refreshTrigger]);

    return (
        <div className="p-6 bg-[#070708] min-h-screen text-slate-300">
            {/* Header Banner */}
            <div className="mb-8">
                <h1 className="text-xl font-bold text-slate-100 uppercase tracking-wider font-mono">Operations & Utilities Command</h1>
                <p className="text-xs text-slate-500 mt-1">Execute building lifecycle handshakes and log physical property records.</p>
            </div>

            {/* Status Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="bg-[#111] border border-slate-900 rounded-xl p-5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold">Awaiting Key Handover</p>
                        <h3 className="text-2xl font-bold font-mono text-indigo-400 mt-1">{arrivalsCount}</h3>
                    </div>
                    <div className="p-3 bg-indigo-950/40 border border-indigo-900/40 text-indigo-400 rounded-lg text-lg">🔑</div>
                </div>

                <div className="bg-[#111] border border-slate-900 rounded-xl p-5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold">Occupied Core Units</p>
                        <h3 className="text-2xl font-bold font-mono text-emerald-400 mt-1">{activeLeasesCount}</h3>
                    </div>
                    <div className="p-3 bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 rounded-lg text-lg">🏢</div>
                </div>
            </div>

            {/* Action Cards Control Deck */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                {/* Action Card 1: Arrivals */}
                <div className="bg-[#111] border border-slate-900 rounded-xl p-6 flex flex-col justify-between hover:border-slate-800 transition-all shadow-xl">
                    <div>
                        <div className="text-2xl mb-3">🚪</div>
                        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide font-mono">Tenant Arrivals Portal</h2>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                            Verify token registration records, review pre-allocated digital contracts, and clear tenants into rooms upon key handovers.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsArrivalsOpen(true)}
                        className="mt-6 w-full py-2.5 px-4 bg-[#161618] hover:bg-[#1e1e22] text-slate-200 font-mono text-xs font-bold uppercase border border-slate-800 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        Process Arrivals {arrivalsCount > 0 && <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />}
                    </button>
                </div>

                {/* Action Card 2: Utilities Logging */}
                <div className="bg-[#111] border border-slate-900 rounded-xl p-6 flex flex-col justify-between hover:border-slate-800 transition-all shadow-xl">
                    <div>
                        <div className="text-2xl mb-3">💧</div>
                        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide font-mono">Utility Billing Registry</h2>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                            Log monthly physical resource usage readings for electricity lines and water meters. Invoices generate cleanly on save.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsMetricsOpen(true)}
                        className="mt-6 w-full py-2.5 px-4 bg-indigo-700 hover:bg-indigo-600 text-white font-mono text-xs font-bold uppercase rounded-lg transition-all shadow-lg shadow-indigo-950/30"
                    >
                        Log Meter Readings
                    </button>
                </div>
            </div>

            {/* Pop-up Modals Integration Components */}
            <ArrivalsModal
                isOpen={isArrivalsOpen}
                onClose={() => { setIsArrivalsOpen(false); setRefreshTrigger(p => p + 1); }}
            />
            <MetricLogModal
                isOpen={isMetricsOpen}
                onClose={() => { setIsMetricsOpen(false); setRefreshTrigger(p => p + 1); }}
            />
        </div>
    );
}