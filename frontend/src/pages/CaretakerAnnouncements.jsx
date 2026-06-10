import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function CaretakerAnnouncements() {
    const { user } = useAuth();

    const [properties, setProperties] = useState([]);
    const [selectedProperty, setSelectedProperty] = useState('');
    const [announcements, setAnnouncements] = useState([]);

    // Form fields
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    const [loading, setLoading] = useState(false);
    const [feedLoading, setFeedLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Fetch properties on mount
    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const res = await api.get('/caretaker/properties');
                if (res.data.status === 'Success') {
                    setProperties(res.data.data || []);
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load properties.');
            }
        };

        fetchProperties();
    }, []);

    // Fetch announcements when property changes
    useEffect(() => {
        if (!selectedProperty) {
            setAnnouncements([]);
            return;
        }

        const fetchAnnouncements = async () => {
            try {
                setFeedLoading(true);
                const res = await api.get('/caretaker/announcements', {
                    params: { property_id: selectedProperty }
                });

                if (res.data.status === 'Success') {
                    setAnnouncements(res.data.data || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setFeedLoading(false);
            }
        };

        fetchAnnouncements();
    }, [selectedProperty]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!selectedProperty) {
            setError('Please select a property first.');
            return;
        }

        try {
            setLoading(true);

            const payload = {
                property_id: selectedProperty,
                title,
                message,
                created_by: user?.id,
                event_date: eventDate || null,
                start_time: startTime || null,
                end_time: endTime || null
            };

            const res = await api.post('/caretaker/announcements', payload);

            if (res.data.status === 'Success') {
                setSuccess('Announcement sent successfully!');

                // Reset form
                setTitle('');
                setMessage('');
                setEventDate('');
                setStartTime('');
                setEndTime('');

                // Refresh the list
                // Trigger re-fetch by forcing useEffect
                const refreshRes = await api.get('/caretaker/announcements', {
                    params: { property_id: selectedProperty }
                });
                if (refreshRes.data.status === 'Success') {
                    setAnnouncements(refreshRes.data.data || []);
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send announcement.');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (time) => {
        if (!time) return '';
        return time.substring(0, 5); // HH:MM
    };

    return (
        <div className="bg-[#050505] min-h-screen p-6 text-slate-100">
            <div className="max-w-6xl mx-auto mb-8 border-b border-slate-900 pb-5 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
                    <p className="text-slate-500 text-sm mt-1">Send notices and schedule events for tenants</p>
                </div>

                <select
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                    className="bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 outline-none"
                >
                    <option value="">Select Property</option>
                    {properties.map((prop) => (
                        <option key={prop.id} value={prop.id}>
                            {prop.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="max-w-6xl mx-auto grid md:grid-cols-5 gap-6">
                {/* Create Announcement Form */}
                <div className="md:col-span-2 bg-[#0a0a0a] border border-slate-900 rounded-2xl p-6">
                    <h2 className="uppercase text-xs tracking-widest text-slate-400 font-semibold mb-5">
                        New Announcement
                    </h2>

                    {error && (
                        <div className="mb-5 p-4 bg-rose-950/30 border border-rose-900 text-rose-400 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-5 p-4 bg-emerald-950/30 border border-emerald-900 text-emerald-400 rounded-xl text-sm">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2 font-medium">
                                Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Water Supply Maintenance"
                                className="w-full bg-[#111] border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none text-sm"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2 font-medium">
                                Message
                            </label>
                            <textarea
                                rows={5}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Write your announcement here..."
                                className="w-full bg-[#111] border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none text-sm resize-none"
                                required
                            />
                        </div>

                        {/* Optional Scheduling */}
                        <div className="pt-4 border-t border-slate-900">
                            <p className="text-xs uppercase tracking-widest text-indigo-400 font-medium mb-3">
                                Optional — Schedule Event / Outage
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">Date</label>
                                    <input
                                        type="date"
                                        value={eventDate}
                                        onChange={(e) => setEventDate(e.target.value)}
                                        className="w-full bg-[#111] border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">Start Time</label>
                                        <input
                                            type="time"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="w-full bg-[#111] border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">End Time</label>
                                        <input
                                            type="time"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="w-full bg-[#111] border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !selectedProperty || !title || !message}
                            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 py-3.5 rounded-xl font-semibold text-sm uppercase tracking-wider transition-colors"
                        >
                            {loading ? 'SENDING...' : 'Send Announcement'}
                        </button>
                    </form>
                </div>

                {/* Announcements Feed */}
                <div className="md:col-span-3">
                    <h2 className="uppercase text-xs tracking-widest text-slate-400 font-semibold mb-4">
                        Recent Announcements
                    </h2>

                    {!selectedProperty ? (
                        <div className="bg-[#0a0a0a] border border-dashed border-slate-900 rounded-2xl py-20 text-center text-slate-500">
                            Select a property to view announcements
                        </div>
                    ) : feedLoading ? (
                        <div className="text-center py-20 text-slate-500">Loading announcements...</div>
                    ) : announcements.length === 0 ? (
                        <div className="bg-[#0a0a0a] border border-dashed border-slate-900 rounded-2xl py-20 text-center text-slate-500">
                            No announcements yet for this property.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {announcements.map((ann) => (
                                <div key={ann.id} className="bg-[#0a0a0a] border border-slate-900 rounded-2xl p-5 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-semibold text-slate-100">{ann.title}</h3>
                                        <span className="text-xs text-slate-500 font-mono">
                                            {new Date(ann.created_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {(ann.event_date || ann.eventDate) && (
                                        <div className="bg-amber-950/30 border border-amber-900/50 rounded-xl p-3 text-sm">
                                            <p className="text-amber-400 text-xs font-medium mb-1">SCHEDULED EVENT</p>
                                            <p className="text-amber-200">
                                                {new Date(ann.event_date || ann.eventDate).toLocaleDateString('en-KE', {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                                {(ann.start_time || ann.startTime) && (
                                                    <> • {formatTime(ann.start_time || ann.startTime)} — {formatTime(ann.end_time || ann.endTime)}</>
                                                )}
                                            </p>
                                        </div>
                                    )}

                                    <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                                        {ann.message}
                                    </p>

                                    <div className="text-xs text-indigo-400 pt-2 border-t border-slate-900">
                                        Issued by: {ann.author_name || 'Management'}
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

export default CaretakerAnnouncements;