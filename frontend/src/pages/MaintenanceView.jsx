import React, { useState, useEffect } from 'react';
import FeedbackMessage from './FeedbackMessage';

const MaintenanceView = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');

    // State for professional feedback messages
    const [feedback, setFeedback] = useState(null);

    const fetchTickets = async () => {
        try {
            const response = await fetch('/api/v1/maintenance', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const result = await response.json();
            if (result.status === 'Success') setTickets(result.data);
        } catch (err) {
            console.error('Error fetching tickets:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTickets(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/v1/maintenance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ title, category, description })
            });

            console.log("Response Status:", response.status);
            const result = await response.json();

            if (response.ok) {
                setFeedback({ type: 'success', message: 'Ticket submitted to queue!' });
                setTitle(''); setCategory(''); setDescription('');
                fetchTickets();
            } else {
                console.error("Server Error Details:", result);
                setFeedback({ type: 'error', message: result.message || 'Failed to submit.' });
            }
        } catch (err) {
            console.error("Fetch Catch Error:", err);
            setFeedback({ type: 'error', message: 'Network error. Check server logs.' });
        }
    };

    return (
        <div className="space-y-8 animate-fade-in text-slate-100">
            {/* Feedback display banner */}
            {feedback && (
                <FeedbackMessage
                    type={feedback.type}
                    message={feedback.message}
                    onClose={() => setFeedback(null)}
                />
            )}

            {/* Header Module */}
            <div>
                <h3 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 uppercase font-mono">
                    Maintenance & Repair Portal
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                    File hardware, structural, or utility repair logs directly to the management dashboard.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ─── TICKET GENERATION FORM ─── */}
                <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-slate-900 lg:col-span-1 h-fit shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
                    <h4 className="text-xs uppercase tracking-wider font-mono font-bold text-slate-400 mb-5 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                        Log New Issue
                    </h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Issue Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Bedroom socket short circuit"
                                required
                                className="w-full bg-[#121212] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Issue Category</label>
                            <div className="relative">
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    required
                                    className="w-full bg-[#121212] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" className="bg-[#0a0a0a]">Select domain...</option>
                                    <option value="Plumbing" className="bg-[#0a0a0a]">Plumbing</option>
                                    <option value="Electrical" className="bg-[#0a0a0a]">Electrical</option>
                                    <option value="Carpentry" className="bg-[#0a0a0a]">Carpentry</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 text-[10px]">▼</div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Detailed Description</label>
                            <textarea
                                rows="4"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Provide specific room details or structural behavior..."
                                required
                                className="w-full bg-[#121212] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all resize-none"
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold py-3 rounded-xl transition-all duration-200 shadow-md font-mono uppercase tracking-wider"
                        >
                            Submit Maintenance File
                        </button>
                    </form>
                </div>

                {/* ─── OPERATIONS MONITOR TABLE ─── */}
                <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-slate-900 lg:col-span-2 shadow-[0_4px_30px_rgba(0,0,0,0.4)] overflow-hidden">
                    <h4 className="text-xs uppercase tracking-wider font-mono font-bold text-slate-400 mb-5 flex items-center gap-2">
                        💾 Active Operations Monitor
                    </h4>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-400">
                            <thead className="bg-[#121212] text-[10px] text-slate-500 uppercase tracking-widest font-bold border border-slate-900">
                                <tr>
                                    <th className="p-4 rounded-l-xl">Title</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4 rounded-r-xl">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900">
                                {loading ? (
                                    <tr>
                                        <td colSpan="3" className="p-8 text-center text-slate-600 font-mono animate-pulse">
                                            Retrieving backend data streams...
                                        </td>
                                    </tr>
                                ) : tickets.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="p-8 text-center text-slate-600 font-mono">
                                            Zero active maintenance logs filed.
                                        </td>
                                    </tr>
                                ) : (
                                    tickets.map((ticket) => (
                                        <tr key={ticket.id || ticket._id} className="hover:bg-slate-900/20 transition-colors">
                                            <td className="p-4 font-bold text-slate-200 max-w-[200px] truncate">{ticket.title}</td>
                                            <td className="p-4 font-mono text-slate-400">{ticket.category}</td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border uppercase tracking-wider ${ticket.status === 'Resolved'
                                                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40'
                                                    : ticket.status === 'In Progress'
                                                        ? 'bg-amber-950/40 text-amber-400 border-amber-900/40'
                                                        : 'bg-cyan-950/40 text-cyan-400 border-cyan-900/40'
                                                    }`}>
                                                    {ticket.status || 'Pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceView;