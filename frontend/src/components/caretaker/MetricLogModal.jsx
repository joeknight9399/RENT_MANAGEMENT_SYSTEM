import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE = 'http://localhost:5000/api/v1/caretaker';

export default function MetricLogModal({ isOpen, onClose }) {
    const [units, setUnits] = useState([]);
    const [selectedLease, setSelectedLease] = useState('');
    const [utilityType, setUtilityType] = useState('Water');
    const [previousReading, setPreviousReading] = useState(0.00);
    const [currentReading, setCurrentReading] = useState('');
    const [ratePerUnit, setRatePerUnit] = useState('150.00');
    const [readingDate, setReadingDate] = useState(new Date().toISOString().split('T')[0]);

    const [loadingUnits, setLoadingUnits] = useState(false);
    const [fetchingPrevious, setFetchingPrevious] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoadingUnits(true);
            axios.get(`${API_BASE}/active-leases`, { withCredentials: true })
                .then(res => { if (res.data.status === 'Success') setUnits(res.data.data); })
                .catch(err => console.error(err))
                .finally(() => setLoadingUnits(false));
        }
    }, [isOpen]);

    useEffect(() => {
        if (!selectedLease || !isOpen) return;
        setFetchingPrevious(true);
        axios.get(`${API_BASE}/latest-reading?lease_id=${selectedLease}&utility_type=${utilityType}`, { withCredentials: true })
            .then(res => { if (res.data.status === 'Success') setPreviousReading(parseFloat(res.data.previous_reading) || 0.00); })
            .catch(() => setPreviousReading(0.00))
            .finally(() => setFetchingPrevious(false));
    }, [selectedLease, utilityType, isOpen]);

    const unitsConsumed = currentReading !== '' ? parseFloat(currentReading) - previousReading : 0;
    const totalCostEstimated = unitsConsumed > 0 ? unitsConsumed * parseFloat(ratePerUnit) : 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (parseFloat(currentReading) < previousReading) {
            toast.error("Metrics Validation Error: Value cannot drop below previous logged indices.");
            return;
        }

        setSubmitting(true);
        const actionToast = toast.loading('Saving operational log entry...');
        try {
            const payload = {
                lease_id: selectedLease,
                utility_type: utilityType,
                previous_reading: previousReading,
                current_reading: parseFloat(currentReading),
                rate_per_unit: parseFloat(ratePerUnit),
                reading_date: readingDate
            };
            const res = await axios.post(`${API_BASE}/utilities`, payload, { withCredentials: true });
            if (res.data.status === 'Success') {
                toast.success(res.data.message, { id: actionToast });
                setCurrentReading('');
                onClose();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Metrics update transaction rejected.', { id: actionToast });
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#111] border border-slate-900 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-5 border-b border-slate-900 flex justify-between items-center bg-[#141416]">
                    <div>
                        <h3 className="text-sm font-bold text-slate-200 font-mono uppercase">Log Utility Metric Entry</h3>
                        <p className="text-[10px] text-slate-500">Record updated physical meter logs for actively occupied spaces.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-300 font-mono text-xs p-1">✕ CLOSE</button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider mb-1">Select Active Unit</label>
                        <select
                            value={selectedLease}
                            onChange={(e) => setSelectedLease(e.target.value)}
                            required
                            className="w-full bg-[#161618] border border-slate-800 text-slate-200 text-xs font-mono rounded-lg p-2.5 focus:outline-none"
                        >
                            <option value="">-- Choose Unit --</option>
                            {units.map(unit => (
                                <option key={unit.lease_id} value={unit.lease_id}>Room {unit.room_number}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider mb-1">Utility</label>
                            <select
                                value={utilityType}
                                onChange={(e) => {
                                    setUtilityType(e.target.value);
                                    setRatePerUnit(e.target.value === 'Water' ? '150.00' : '25.00');
                                }}
                                className="w-full bg-[#161618] border border-slate-800 text-slate-200 text-xs font-mono rounded-lg p-2.5 focus:outline-none"
                            >
                                <option value="Water">💧 Water</option>
                                <option value="Electricity">⚡ Electricity</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider mb-1">Rate (KES)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={ratePerUnit}
                                onChange={(e) => setRatePerUnit(e.target.value)}
                                required
                                className="w-full bg-[#161618] border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 font-mono focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-[#0a0a0b] p-3 rounded-lg border border-slate-900">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider mb-1">Prev Reading</label>
                            <div className="text-xs font-mono font-bold text-slate-400 p-2.5 bg-[#121214] border border-slate-900 rounded">
                                {fetchingPrevious ? '...' : previousReading.toFixed(2)}
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider mb-1">Current Log</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={currentReading}
                                onChange={(e) => setCurrentReading(e.target.value)}
                                required
                                disabled={!selectedLease}
                                className="w-full bg-[#161618] border border-slate-800 text-slate-100 text-xs font-mono rounded p-2.5 focus:outline-none disabled:opacity-30"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider mb-1">Statement Date</label>
                        <input
                            type="date"
                            value={readingDate}
                            onChange={(e) => setReadingDate(e.target.value)}
                            required
                            className="w-full bg-[#161618] border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 font-mono focus:outline-none"
                        />
                    </div>

                    {unitsConsumed > 0 && (
                        <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-lg p-3 flex justify-between items-center text-[11px] font-mono">
                            <span className="text-slate-400">Usage: <strong className="text-indigo-400">{unitsConsumed.toFixed(2)} units</strong></span>
                            <span className="text-emerald-400 font-bold">Ksh {totalCostEstimated.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting || !selectedLease || currentReading === ''}
                        className="w-full bg-indigo-700 hover:bg-indigo-600 disabled:bg-slate-900 disabled:text-slate-600 text-white text-xs font-bold font-mono uppercase tracking-wider py-2.5 rounded-lg transition-all"
                    >
                        {submitting ? 'COMMITTING CORE...' : 'SAVE ENTRY'}
                    </button>
                </form>
            </div>
        </div>
    );
}