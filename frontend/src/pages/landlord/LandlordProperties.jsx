// pages/landlord/LandlordProperties.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Building2, Layers, Key, AlertCircle, Wrench } from 'lucide-react';

const LandlordProperties = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const token = localStorage.getItem('token');
                // Fetch extended asset breakdown
                const res = await axios.get('/api/v1/landlord/overview', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProperties(res.data.data.properties);
                setLoading(false);
            } catch (err) {
                setError("Failed to feed operational asset matrices.");
                setLoading(false);
            }
        };
        fetchAssets();
    }, []);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Occupied': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            case 'Vacant': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'Maintenance': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            default: return 'bg-slate-800 text-slate-400 border-slate-700';
        }
    };

    if (loading) return <div className="text-center py-20 font-mono text-cyan-400 animate-pulse">Streaming Asset Matrices...</div>;
    if (error) return <div className="text-rose-400 text-sm p-4 border border-rose-950 bg-rose-950/20 rounded-xl">{error}</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h2 className="text-3xl font-bold text-slate-100 tracking-tight">Structural Assets</h2>
                <p className="text-slate-400 text-sm mt-1">Granular controls over estate layouts, physical chambers, and operational availability profiles.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {properties.map((estate) => (
                    <div key={estate.id} className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between hover:border-slate-700 transition-all duration-300">
                        <div>
                            {/* Card Header Info */}
                            <div className="flex items-start justify-between border-b border-slate-800/60 pb-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-slate-800 text-cyan-400">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-100">{estate.name}</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">{estate.location}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block">Capacity Metrics</span>
                                    <span className="text-sm font-mono font-bold text-cyan-400">{estate.total_units} Active Chambers</span>
                                </div>
                            </div>

                            {/* Occupancy Progress Indicator */}
                            <div className="mt-6 space-y-2">
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-slate-400">Yield Configuration</span>
                                    <span className="text-indigo-400 font-mono">{estate.occupied_count} / {estate.total_units} Occupied</span>
                                </div>
                                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                                    <div
                                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-500"
                                        style={{ width: `${estate.total_units > 0 ? (estate.occupied_count / estate.total_units) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Context Utility Info */}
                        <div className="mt-8 pt-4 border-t border-slate-800/40 flex items-center justify-between text-xs text-slate-400">
                            <div className="flex gap-4">
                                <span className="flex items-center gap-1.5"><Key className="w-3.5 h-3.5 text-emerald-400" /> {estate.vacant_count} Vacant</span>
                                <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-slate-400" /> Multi-tier System</span>
                            </div>
                            <button className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors flex items-center gap-1">
                                Inspect Units Panel &rarr;
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LandlordProperties;