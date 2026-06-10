import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = '/api/caretaker';

export default function UtilityLogger({ refreshTrigger }) {
    const [units, setUnits] = useState([]);
    const [selectedLease, setSelectedLease] = useState('');
    const [utilityType, setUtilityType] = useState('Water');
    const [previousReading, setPreviousReading] = useState(0.00);
    const [currentReading, setCurrentReading] = useState('');
    const [ratePerUnit, setRatePerUnit] = useState('150.00'); // Set local defaults (Ksh)
    const [readingDate, setReadingDate] = useState(new Date().toISOString().split('T')[0]);

    const [loadingUnits, setLoadingUnits] = useState(false);
    const [fetchingPrevious, setFetchingPrevious] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // 1. Load active occupied rooms for dropdown list
    const fetchActiveUnits = async () => {
        try {
            setLoadingUnits(true);
            const response = await axios.get(`${API_BASE}/active-leases`);
            if (response.data.status === 'Success') {
                setUnits(response.data.data);
            }
        } catch (err) {
            console.error("Error loading operational units:", err);
        } finally {
            setLoadingUnits(false);
        }
    };

    useEffect(() => {
        fetchActiveUnits();
    }, [refreshTrigger]); // Reload items whenever someone moves in/out

    // 2. Fetch the most recent history reading when space selection or utility type switches
    useEffect(() => {
        if (!selectedLease || !utilityType) {
            setPreviousReading(0.00);
            return;
        }

        const fetchPreviousValue = async () => {
            try {
                setFetchingPrevious(true);
                const response = await axios.get(
                    `${API_BASE}/latest-reading?lease_id=${selectedLease}&utility_type=${utilityType}`
                );
                if (response.data.status === 'Success') {
                    setPreviousReading(parseFloat(response.data.previous_reading));
                }
            } catch (err) {
                console.error("Failed to load previous metric logs:", err);
                setPreviousReading(0.00);
            } finally {
                setFetchingPrevious(false);
            }
        };

        fetchPreviousValue();
    }, [selectedLease, utilityType]);

    // Calculate dynamic insight calculations real-time
    const unitsConsumed = currentReading !== '' ? parseFloat(currentReading) - previousReading : 0;
    const totalCostEstimated = unitsConsumed > 0 ? unitsConsumed * parseFloat(ratePerUnit) : 0;

    // 3. Post completely new log entry
    const handleSubmitReading = async (e) => {
        e.preventDefault();

        if (parseFloat(currentReading) < previousReading) {
            alert("Error: Current meter metrics cannot fall below previous logged records.");
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                lease_id: selectedLease,
                utility_type: utilityType,
                previous_reading: previousReading,
                current_reading: parseFloat(currentReading),
                rate_per_unit: parseFloat(ratePerUnit),
                reading_date: readingDate,
                recorded_by: "00000000-0000-0000-0000-000000000000" // Session middleware overrides this if active
            };

            const response = await axios.post(`${API_BASE}/utilities`, payload);
            if (response.data.status === 'Success') {
                alert(response.data.message);
                setCurrentReading(''); // Flush input metric box on success
                setPreviousReading(payload.current_reading); // Instantly roll metrics forward
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to log utility metric.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-[#111] border border-slate-900 rounded-xl p-5 shadow-2xl">
            <div>
                <h2 className="text-sm font-bold text-slate-100 tracking-wide">Utility Metrics Entry</h2>
                <p className="text-[11px] text-slate-500 mb-4">Log monthly digital water/electricity records for billed spaces.</p>
            </div>

            <form onSubmit={handleSubmitReading} className="space-y-4">
                {/* Space Selection */}
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Occupied Unit</label>
                    <select
                        value={selectedLease}
                        onChange={(e) => setSelectedLease(e.target.value)}
                        required
                        className="w-full bg-[#161616] border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none"
                    >
                        <option value="">-- Choose Occupied Room --</option>
                        {units.map(unit => (
                            <option key={unit.lease_id} value={unit.lease_id}>
                                Room {unit.room_number} (Active Lease)
                            </option>
                        ))}
                    </select>
                    {loadingUnits && <p className="text-[9px] text-slate-500 mt-1 animate-pulse">Scanning unit records...</p>}
                </div>

                {/* Utility Type & Rate */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Utility</label>
                        <select
                            value={utilityType}
                            onChange={(e) => {
                                setUtilityType(e.target.value);
                                setRatePerUnit(e.target.value === 'Water' ? '150.00' : '25.00'); // Auto-update defaults
                            }}
                            className="w-full bg-[#161616] border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none"
                        >
                            <option value="Water">💧 Water</option>
                            <option value="Electricity">⚡ Electricity</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rate per Unit (KES)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={ratePerUnit}
                            onChange={(e) => setRatePerUnit(e.target.value)}
                            required
                            className="w-full bg-[#161616] border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 font-mono focus:border-indigo-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Readings Grid */}
                <div className="grid grid-cols-2 gap-3 bg-[#0a0a0a] p-3 rounded-lg border border-slate-900/80">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Previous Reading</label>
                        <div className="text-xs font-mono font-bold text-slate-400 p-2 bg-[#121212] border border-slate-900 rounded">
                            {fetchingPrevious ? '...' : previousReading.toFixed(2)}
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Reading</label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={currentReading}
                            onChange={(e) => setCurrentReading(e.target.value)}
                            required
                            disabled={!selectedLease}
                            className="w-full bg-[#161616] border border-slate-800 text-slate-100 text-xs font-mono rounded p-2 focus:border-indigo-500 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>

                {/* Date Selection */}
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reading Date</label>
                    <input
                        type="date"
                        value={readingDate}
                        onChange={(e) => setReadingDate(e.target.value)}
                        required
                        className="w-full bg-[#161616] border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 font-mono focus:border-indigo-500 focus:outline-none"
                    />
                </div>

                {/* Live Cost Invoice Estimator */}
                {unitsConsumed > 0 && (
                    <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-lg p-3 flex justify-between items-center text-[11px] font-mono">
                        <span className="text-slate-400">Consumed: <strong className="text-indigo-400">{unitsConsumed.toFixed(2)} units</strong></span>
                        <span className="text-slate-300 font-bold">Est. Cost: <strong className="text-emerald-400">Ksh {totalCostEstimated.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
                    </div>
                )}

                {/* Form Submit Action */}
                <button
                    type="submit"
                    disabled={submitting || !selectedLease || currentReading === ''}
                    className="w-full bg-indigo-700 hover:bg-indigo-600 disabled:bg-slate-900 disabled:text-slate-600 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg transition-all shadow-lg"
                >
                    {submitting ? 'Saving Metrics Entry...' : 'Save Utility Record'}
                </button>
            </form>
        </div>
    );
}