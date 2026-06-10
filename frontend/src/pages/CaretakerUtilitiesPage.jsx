import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function CaretakerUtilities() {
    const { user } = useAuth();

    const [leases, setLeases] = useState([]);
    const [logs, setLogs] = useState([]);

    // Form state
    const [selectedLease, setSelectedLease] = useState('');
    const [utilityType, setUtilityType] = useState('Water');
    const [previousReading, setPreviousReading] = useState(0);
    const [currentReading, setCurrentReading] = useState('');
    const [ratePerUnit, setRatePerUnit] = useState('');
    const [readingDate, setReadingDate] = useState(new Date().toISOString().split('T')[0]);

    const [isMetered, setIsMetered] = useState(true);
    const [message, setMessage] = useState('');

    const [loading, setLoading] = useState(false);
    const [feedLoading, setFeedLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                setFeedLoading(true);
                const [leasesRes, logsRes] = await Promise.all([
                    api.get('/caretaker/active-leases'),
                    api.get('/caretaker/utility-history')
                ]);

                setLeases(leasesRes.data.data || []);
                setLogs(logsRes.data.data || []);
            } catch (err) {
                console.error(err);
                setError('Failed to load data. Please refresh the page.');
            } finally {
                setFeedLoading(false);
            }
        };

        loadData();
    }, []);

    // Fetch latest reading when lease or utility type changes
    useEffect(() => {
        if (!selectedLease) {
            setPreviousReading(0);
            setIsMetered(true);
            setMessage('');
            return;
        }

        const fetchLatestReading = async () => {
            try {
                const res = await api.get('/caretaker/latest-reading', {
                    params: {
                        lease_id: selectedLease,
                        utility_type: utilityType
                    }
                });

                if (res.data.status === 'Success') {
                    setIsMetered(res.data.is_metered);
                    setPreviousReading(res.data.previous_reading || 0);

                    if (!res.data.is_metered) {
                        setMessage(res.data.message || 'This unit is not metered.');
                    } else {
                        setMessage('');
                    }
                }
            } catch (err) {
                console.error(err);
                setError('Could not fetch previous reading.');
            }
        };

        fetchLatestReading();
    }, [selectedLease, utilityType]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (parseFloat(currentReading) < parseFloat(previousReading)) {
            setError(`Current reading cannot be lower than previous reading (${previousReading}).`);
            return;
        }

        try {
            setLoading(true);

            const payload = {
                lease_id: selectedLease,
                utility_type: utilityType,
                previous_reading: parseFloat(previousReading),
                current_reading: parseFloat(currentReading),
                rate_per_unit: parseFloat(ratePerUnit),
                reading_date: readingDate,
                recorded_by: user?.id
            };

            const res = await api.post('/caretaker/utilities', payload);

            if (res.data.status === 'Success') {
                setSuccess(`${utilityType} reading saved successfully.`);

                // Reset form fields
                setCurrentReading('');
                setRatePerUnit('');

                // Refresh history
                const refreshRes = await api.get('/caretaker/utility-history');
                setLogs(refreshRes.data.data || []);

                // Update previous reading for next entry
                setPreviousReading(parseFloat(currentReading));
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save reading.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#050505] min-h-screen p-6 text-slate-100">
            <div className="max-w-6xl mx-auto mb-8 border-b border-slate-900 pb-5">
                <h1 className="text-2xl font-bold tracking-tight">Utility Readings</h1>
                <p className="text-slate-500 text-sm mt-1">Record meter readings for water and electricity</p>
            </div>

            <div className="max-w-6xl mx-auto grid md:grid-cols-5 gap-6">
                {/* Form Section */}
                <div className="md:col-span-2 bg-[#0a0a0a] border border-slate-900 rounded-2xl p-6">
                    <h2 className="uppercase text-xs tracking-widest text-slate-400 font-semibold mb-5">
                        New Meter Reading
                    </h2>

                    {error && (
                        <div className="mb-4 p-4 bg-rose-950/30 border border-rose-900 text-rose-400 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 bg-emerald-950/30 border border-emerald-900 text-emerald-400 rounded-xl text-sm">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2 font-medium">
                                Select Unit
                            </label>
                            <select
                                value={selectedLease}
                                onChange={(e) => setSelectedLease(e.target.value)}
                                className="w-full bg-[#111] border border-slate-800 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none"
                                required
                            >
                                <option value="">Choose a unit...</option>
                                {leases.map((lease) => (
                                    <option key={lease.lease_id} value={lease.lease_id}>
                                        {lease.room_number}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2 font-medium">
                                Utility Type
                            </label>
                            <div className="flex gap-3">
                                {['Water', 'Electricity'].map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setUtilityType(type)}
                                        className={`flex-1 py-3 text-sm font-medium rounded-xl border transition-all ${utilityType === type
                                            ? 'bg-indigo-600 text-white border-indigo-500'
                                            : 'bg-[#111] border-slate-800 text-slate-400 hover:border-slate-700'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {!isMetered ? (
                            <div className="p-4 bg-amber-950/30 border border-amber-900 rounded-xl text-amber-400 text-sm">
                                {message}
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2 font-medium">
                                        Previous Reading
                                    </label>
                                    <input
                                        type="number"
                                        value={previousReading}
                                        disabled
                                        className="w-full bg-[#161616] border border-slate-800 rounded-xl p-3 text-slate-400 cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2 font-medium">
                                        Current Reading
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={currentReading}
                                        onChange={(e) => setCurrentReading(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-[#111] border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-sm outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2 font-medium">
                                        Rate per Unit (KES)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={ratePerUnit}
                                        onChange={(e) => setRatePerUnit(e.target.value)}
                                        placeholder="e.g. 12.50"
                                        className="w-full bg-[#111] border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-sm outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2 font-medium">
                                        Reading Date
                                    </label>
                                    <input
                                        type="date"
                                        value={readingDate}
                                        onChange={(e) => setReadingDate(e.target.value)}
                                        className="w-full bg-[#111] border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-sm outline-none"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !selectedLease || !currentReading || !ratePerUnit}
                                    className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 transition-colors py-3.5 rounded-xl font-semibold text-sm uppercase tracking-wider"
                                >
                                    {loading ? 'SAVING...' : 'Save Reading'}
                                </button>
                            </>
                        )}
                    </form>
                </div>

                {/* History Section */}
                <div className="md:col-span-3">
                    <h2 className="uppercase text-xs tracking-widest text-slate-400 font-semibold mb-4">
                        Recent Readings
                    </h2>

                    {feedLoading ? (
                        <p className="text-slate-500 text-sm py-10 text-center">Loading history...</p>
                    ) : logs.length === 0 ? (
                        <p className="text-slate-500 text-sm py-10 text-center">No readings recorded yet.</p>
                    ) : (
                        <div className="space-y-3 max-h-[620px] overflow-y-auto pr-2">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="bg-[#0a0a0a] border border-slate-900 hover:border-slate-700 rounded-2xl p-5 transition-colors flex justify-between items-center"
                                >
                                    <div>
                                        <p className="font-semibold text-slate-200">{log.unit_name}</p>
                                        <p className="text-sm text-slate-400 mt-1">
                                            {log.utility_type} • {log.reading_value} (Prev: {log.previous_reading})
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-indigo-400 font-mono text-sm">
                                            {log.rate_per_unit} /unit
                                        </p>
                                        <p className="text-[10px] text-slate-500 mt-1">
                                            {new Date(log.reading_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CaretakerUtilities;