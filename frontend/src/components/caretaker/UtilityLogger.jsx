import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UtilityLogger = ({ activeLeases, onLogSuccess }) => {
    const [selectedLease, setSelectedLease] = useState('');
    const [utilityType, setUtilityType] = useState('Water');
    const [currentReading, setCurrentReading] = useState('');
    const [readingDate, setReadingDate] = useState(new Date().toISOString().split('T')[0]);

    const [previousReading, setPreviousReading] = useState(0);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const activeLeaseDetails = activeLeases.find(l => l.id === selectedLease);

    useEffect(() => {
        if (!selectedLease || !activeLeaseDetails) return;

        const fetchLatest = async () => {
            try {
                // Pointing to your new utility route
                const res = await axios.get(`/api/v1/utilities/latest-reading/${activeLeaseDetails.unit_id}/${utilityType}`);
                if (res.data.status === 'Success' && res.data.reading) {
                    setPreviousReading(parseFloat(res.data.reading.current_reading));
                } else {
                    setPreviousReading(0);
                }
            } catch (err) {
                console.error("Fetch error:", err);
            }
        };

        fetchLatest();
    }, [selectedLease, utilityType, activeLeaseDetails]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Pointing to your new utility route
            await axios.post('/api/v1/utilities/log', {
                lease_id: selectedLease,
                unit_id: activeLeaseDetails.unit_id,
                utility_type: utilityType,
                current_reading: parseFloat(currentReading),
                reading_date: readingDate
            });

            setMessage({ type: 'success', text: 'Reading saved!' });
            setCurrentReading('');
            if (onLogSuccess) onLogSuccess();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Error saving reading' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-lg font-bold mb-4">Log Utility Reading</h2>

            {message.text && (
                <div className={`p-2 mb-4 rounded ${message.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <select
                    className="w-full border p-2 rounded"
                    value={selectedLease}
                    onChange={(e) => setSelectedLease(e.target.value)}
                >
                    <option value="">Select Occupied Unit</option>
                    {activeLeases.map(l => (
                        <option key={l.id} value={l.id}>{l.unit_name} - {l.tenant_name}</option>
                    ))}
                </select>

                <div className="flex gap-2">
                    <button type="button" onClick={() => setUtilityType('Water')} className={`p-2 border rounded ${utilityType === 'Water' ? 'bg-blue-500 text-white' : ''}`}>Water</button>
                    <button type="button" onClick={() => setUtilityType('Electricity')} className={`p-2 border rounded ${utilityType === 'Electricity' ? 'bg-blue-500 text-white' : ''}`}>Electricity</button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-xs">Prev Reading</label>
                        <input className="w-full p-2 bg-gray-100 border rounded" value={previousReading} disabled />
                    </div>
                    <div>
                        <label className="text-xs">Current Reading</label>
                        <input
                            type="number"
                            className="w-full p-2 border rounded"
                            value={currentReading}
                            onChange={(e) => setCurrentReading(e.target.value)}
                        />
                    </div>
                </div>

                <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded" disabled={loading}>
                    {loading ? 'Saving...' : 'Submit'}
                </button>
            </form>
        </div>
    );
};

export default UtilityLogger;