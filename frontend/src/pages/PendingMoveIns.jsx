import React, { useState, useEffect } from 'react';
import caretakerAPI from './caretakerAPI'; // import the axios instance from Step 1

export default function PendingMoveIns({ onMoveInSuccess }) {
    const [arrivals, setArrivals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    const fetchPendingArrivals = async () => {
        try {
            setLoading(true);
            const response = await caretakerAPI.get('/pending-move-ins');
            if (response.data.status === 'Success') {
                setArrivals(response.data.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load pending arrivals.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingArrivals();
    }, []);

    const handleConfirmMoveIn = async (leaseId) => {
        setProcessingId(leaseId);
        try {
            const response = await caretakerAPI.patch(`/leases/${leaseId}/confirm-move-in`);
            if (response.data.status === 'Success') {
                setArrivals(prev => prev.filter(item => item.lease_id !== leaseId));
                if (onMoveInSuccess) onMoveInSuccess(); // Tells the Utility component to refresh instantly!
                alert(response.data.message);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Move-in confirmation failed.');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="text-xs text-slate-500 animate-pulse p-4">Scanning gateway for arrivals...</div>;
    if (error) return <div className="text-xs text-red-400 bg-red-950/30 p-3 rounded border border-red-900/50">{error}</div>;

    return (
        <div className="bg-[#111] border border-slate-900 rounded-xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-sm font-bold text-slate-100 tracking-wide">Pending Token Check-Ins</h2>
                    <p className="text-[11px] text-slate-500">Tenants awaiting physical arrival key handoff.</p>
                </div>
                <span className="px-2 py-0.5 bg-indigo-950 text-indigo-400 border border-indigo-900 text-[10px] font-mono rounded-full font-bold">
                    {arrivals.length} Waiting
                </span>
            </div>

            {arrivals.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-900 rounded-lg bg-[#0d0d0d]">
                    <p className="text-xs text-slate-600 font-medium">No pending arrivals today.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {arrivals.map((arrival) => (
                        <div key={arrival.lease_id} className="flex items-center justify-between p-3.5 bg-[#141414] border border-slate-900 rounded-lg">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-200">{arrival.full_name}</span>
                                    <span className="text-[9px] bg-slate-900 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded uppercase font-mono font-bold">
                                        {arrival.category}
                                    </span>
                                </div>
                                <p className="text-[10px] text-emerald-500 font-semibold mt-0.5">Assigned Room: {arrival.room_number}</p>
                            </div>
                            <button
                                onClick={() => handleConfirmMoveIn(arrival.lease_id)}
                                disabled={processingId === arrival.lease_id}
                                className="px-4 py-2 text-[11px] font-bold uppercase bg-emerald-700 hover:bg-emerald-600 text-emerald-50 rounded transition-all disabled:opacity-30"
                            >
                                {processingId === arrival.lease_id ? 'Processing...' : 'Confirm Move-In'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}