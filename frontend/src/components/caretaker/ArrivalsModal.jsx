import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE = 'http://localhost:5000/api/v1/caretaker';

export default function ArrivalsModal({ isOpen, onClose }) {
    const [arrivals, setArrivals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            axios.get(`${API_BASE}/pending-move-ins`, { withCredentials: true })
                .then(res => { if (res.data.status === 'Success') setArrivals(res.data.data); })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

    const handleConfirm = async (leaseId) => {
        setProcessingId(leaseId);
        const activeToast = toast.loading('Executing physical handshake registration...');
        try {
            const res = await axios.patch(`${API_BASE}/leases/${leaseId}/confirm-move-in`, {}, { withCredentials: true });
            if (res.data.status === 'Success') {
                toast.success(res.data.message, { id: activeToast });
                setArrivals(prev => prev.filter(item => item.lease_id !== leaseId));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Handshake failed', { id: activeToast });
        } finally {
            setProcessingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#111] border border-slate-900 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-5 border-b border-slate-900 flex justify-between items-center bg-[#141416]">
                    <div>
                        <h3 className="text-sm font-bold text-slate-200 font-mono uppercase">Arrival Deployment Queue</h3>
                        <p className="text-[10px] text-slate-500">Confirm physical key collection to flip units into Occupied operational states.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-300 font-mono text-xs p-1">✕ CLOSE</button>
                </div>

                <div className="p-5 max-h-[400px] overflow-y-auto space-y-3">
                    {loading ? (
                        <div className="text-xs text-slate-600 font-mono py-8 text-center animate-pulse">[ SCANNING NETWORK CHANNELS... ]</div>
                    ) : arrivals.length === 0 ? (
                        <div className="text-center py-12 text-xs font-mono text-slate-600">[ ALL CORES MOVED IN • QUEUE EMPTY ]</div>
                    ) : (
                        arrivals.map(arrival => (
                            <div key={arrival.lease_id} className="p-4 bg-[#161618] border border-slate-900 rounded-lg flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-bold text-slate-200">{arrival.full_name}</h4>
                                        <span className="text-[9px] bg-[#0c0c0e] border border-slate-800 text-indigo-400 font-mono px-1.5 py-0.5 rounded uppercase">{arrival.category}</span>
                                    </div>
                                    <p className="text-[11px] text-emerald-400 font-mono font-semibold">Assigned Unit: {arrival.room_number}</p>
                                    <p className="text-[10px] text-slate-500 font-mono">✉️ {arrival.email} | 📞 {arrival.phone_number}</p>
                                </div>
                                <button
                                    onClick={() => handleConfirm(arrival.lease_id)}
                                    disabled={processingId === arrival.lease_id}
                                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-30 text-white font-mono text-[10px] font-bold uppercase rounded transition-all"
                                >
                                    {processingId === arrival.lease_id ? 'SYNCING...' : 'CONFIRM HANDOVER'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}