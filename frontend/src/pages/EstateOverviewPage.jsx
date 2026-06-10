import React, { useState, useEffect } from 'react';
import api from '../api';

const EstateOverviewPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get('/admin-dashboard/stats');
            setStats(response.data.data);
        } catch (err) {
            console.error('Dashboard Load Error:', err);
            setError('Unable to load estate statistics at the moment.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-8 h-8 border-2 border-slate-700 border-t-sky-400 rounded-full animate-spin"></div>
                <p className="text-sm text-slate-500">
                    Loading estate statistics...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <div className="bg-slate-900 border border-rose-900/50 rounded-2xl p-5 flex items-center gap-4">
                    <div className="text-2xl">⚠️</div>

                    <div>
                        <h3 className="font-semibold text-rose-300">
                            Unable to Load Dashboard
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                            {error}
                        </p>
                    </div>

                    <button
                        onClick={fetchStats}
                        className="ml-auto px-4 py-2 rounded-xl border border-slate-700 text-sm text-slate-300 hover:bg-slate-800 transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const occupiedUnits =
        (stats?.total_units || 0) - (stats?.vacant_units || 0);

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">

            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                    Estate Overview
                </h1>

                <p className="text-slate-400 text-sm mt-2">
                    Financial performance, occupancy and maintenance insights.
                </p>
            </div>

            {/* Featured Metrics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <StatCard
                    featured
                    label="Total Expected Rent"
                    value={`KES ${stats?.total_expected?.toLocaleString() || '0'}`}
                    valueColor="text-emerald-300"
                    accent="bg-emerald-500"
                    icon="💰"
                    className="lg:col-span-2"
                />

                <StatCard
                    label="Total Collected"
                    value={`KES ${stats?.total_collected?.toLocaleString() || '0'}`}
                    valueColor="text-sky-300"
                    accent="bg-sky-500"
                    icon="📥"
                />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <StatCard
                    label="Occupancy Rate"
                    value={`${occupiedUnits} / ${stats?.total_units || 0}`}
                    valueColor="text-amber-300"
                    accent="bg-amber-500"
                    icon="🏢"
                />

                <StatCard
                    label="Pending Approvals"
                    value={stats?.pending_approvals || 0}
                    valueColor="text-violet-300"
                    accent="bg-violet-500"
                    icon="⚖️"
                />

                <StatCard
                    label="Active Maintenance"
                    value={stats?.active_tickets || 0}
                    valueColor="text-rose-300"
                    accent="bg-rose-500"
                    icon="🛠️"
                />
            </div>
        </div>
    );
};

const StatCard = ({
    label,
    value,
    valueColor,
    icon,
    accent,
    featured = false,
    className = '',
}) => {
    return (
        <div
            className={`
                relative
                overflow-hidden
                bg-slate-900
                border border-slate-800
                rounded-2xl
                p-6
                transition-all
                duration-200
                hover:border-slate-700
                hover:-translate-y-1
                ${className}
            `}
        >
            {/* Accent Line */}
            <div className={`absolute top-0 left-0 h-1 w-full ${accent}`} />

            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-slate-400 font-medium">
                        {label}
                    </p>
                </div>

                <div className="text-xl">
                    {icon}
                </div>
            </div>

            <div className="mt-6">
                <p
                    className={`
                        ${valueColor}
                        ${featured ? 'text-4xl' : 'text-3xl'}
                        font-bold
                        tracking-tight
                    `}
                >
                    {value}
                </p>
            </div>
        </div>
    );
};

export default EstateOverviewPage;