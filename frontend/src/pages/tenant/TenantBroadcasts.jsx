import React, { useState, useEffect } from 'react';

// 🤖 DYNAMIC BASE URL: Automatically switches between live cloud production and your local development server
const currentIP = window.location.hostname;
const isProduction = currentIP !== 'localhost' && currentIP !== '127.0.0.1';
const BACKEND_URL = isProduction
    ? 'https://rentmanagementsystem-production.up.railway.app'
    : `http://${currentIP}:5000`;

const TenantBroadcasts = () => {
    const [broadcasts, setBroadcasts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        // Using AbortController to handle components unmounting before fetch finishes
        const controller = new AbortController();

        const fetchBroadcasts = async () => {
            try {
                setLoading(true);
                setErrorMsg('');

                // 🔥 Fixed: Prefixed the endpoint with our smart dynamic BACKEND_URL
                const response = await fetch(`${BACKEND_URL}/api/v1/tenant/broadcasts`, {
                    signal: controller.signal,
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                const result = await response.json();

                if (response.ok && result.status === 'Success') {
                    setBroadcasts(result.data || []);
                } else if (response.status === 444) {
                    // Gateway custom status: tenant is authenticated but lacks an active lease assignment
                    setErrorMsg(result.message || 'No active property assignment found.');
                } else {
                    setErrorMsg(result.message || 'Failed to pull broadcast streams.');
                }
            } catch (err) {
                if (err.name === 'AbortError') return; // Silence intentional cleanups
                console.error('Notice Board Fetch Error:', err);
                setErrorMsg('Network error connecting to the gateway.');
            } finally {
                setLoading(false);
            }
        };

        fetchBroadcasts();

        // Cleanup function to prevent setting state on an unmounted component
        return () => controller.abort();
    }, []);

    // Handles backend time formats (HH:MM:SS) and trims trailing seconds for UI neatness
    const formatTime = (timeString) => {
        if (!timeString) return '';
        const parts = timeString.split(':');
        return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : timeString;
    };

    return (
        <div className="p-6 bg-[#030303] min-h-screen text-slate-100">
            {/* Header section */}
            <div className="mb-8">
                <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                    Notice Board
                </h1>
                <p className="text-xs text-slate-500 mt-1">Official building updates and management logs.</p>
            </div>

            {/* Content Feed Container */}
            {loading ? (
                <div className="space-y-4">
                    <div className="h-28 bg-[#0a0a0a] rounded-xl border border-slate-900 animate-pulse" />
                    <div className="h-28 bg-[#0a0a0a] rounded-xl border border-slate-900 animate-pulse" />
                </div>
            ) : errorMsg ? (
                <div className="text-center py-12 border border-dashed border-red-950/40 rounded-2xl bg-[#0a0a0a]/40 max-w-4xl">
                    <p className="text-xs font-mono text-red-400">{errorMsg}</p>
                </div>
            ) : broadcasts.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-900 rounded-2xl bg-[#0a0a0a]/40 max-w-4xl">
                    <p className="text-xs font-mono text-slate-600">Zero administrative broadcasts on record.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 max-w-4xl">
                    {broadcasts.map((notice) => (
                        <div
                            key={notice.id}
                            className="p-5 bg-[#0a0a0a] border border-slate-900 hover:border-slate-800 transition-colors rounded-xl shadow-md"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-sm font-bold text-slate-200">{notice.title}</h3>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/40 text-indigo-400 border border-indigo-900/40 uppercase tracking-wider">
                                    Broadcast
                                </span>
                            </div>

                            {/* Scheduled block - only shows if date exists */}
                            {notice.eventDate && (
                                <div className="mb-4 p-3 bg-amber-950/10 border border-amber-900/30 rounded-lg flex flex-col gap-1">
                                    <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                                        ⚠️ Scheduled Maintenance / Event
                                    </span>
                                    <p className="text-xs text-amber-200/90 font-mono">
                                        Date: {new Date(notice.eventDate).toLocaleDateString('en-KE', {
                                            weekday: 'short',
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                        {notice.startTime && notice.endTime && (
                                            <span className="text-slate-500 font-sans">
                                                {" "}• Time Window: <b className="font-mono text-amber-300">{formatTime(notice.startTime)} - {formatTime(notice.endTime)}</b>
                                            </span>
                                        )}
                                    </p>
                                </div>
                            )}

                            <p className="text-xs text-slate-400 leading-relaxed mb-4 whitespace-pre-line">
                                {notice.content}
                            </p>

                            <div className="text-[10px] text-slate-600 font-mono flex items-center gap-1 pt-2 border-t border-slate-900/60">
                                <span>📡 Logged:</span>
                                <span>{new Date(notice.createdAt).toLocaleString('en-KE')}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TenantBroadcasts;