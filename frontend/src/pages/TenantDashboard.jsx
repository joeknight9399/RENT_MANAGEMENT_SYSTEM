import React, { useState, useEffect } from 'react';
import api from '../api';

export default function TenantDashboard() {
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [errorMsg, setErrorMsg] = useState('');

    // Maintenance Form State
    const [ticketTitle, setTicketTitle] = useState('');
    const [ticketDescription, setTicketDescription] = useState('');
    const [ticketCategory, setTicketCategory] = useState('Plumbing');
    const [submittingTicket, setSubmittingTicket] = useState(false);
    const [tickets, setTickets] = useState([]);

    // Fetch account overview and maintenance history
    const fetchDashboardData = async () => {
        try {
            setErrorMsg('');
            const [overviewRes, ticketsRes] = await Promise.all([
                api.get('/users/tenant-overview'),
                api.get('/users/maintenance-tickets')
            ]);

            if (overviewRes.data.status === 'Success') {
                setOverview(overviewRes.data.data);
            }
            if (ticketsRes.data.status === 'Success') {
                setTickets(ticketsRes.data.data);
            }
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setErrorMsg(err.response?.data?.message || 'Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleMaintenanceSubmit = async (e) => {
        e.preventDefault();
        if (!ticketTitle.trim() || !ticketDescription.trim()) return;

        try {
            setSubmittingTicket(true);
            const response = await api.post('/users/maintenance-tickets', {
                title: ticketTitle,
                description: ticketDescription,
                category: ticketCategory
            });

            if (response.data.status === 'Success') {
                setTicketTitle('');
                setTicketDescription('');
                setTicketCategory('Plumbing');
                await fetchDashboardData();
            }
        } catch (err) {
            console.error("Error submitting ticket:", err);
            alert(err.response?.data?.message || 'Failed to submit maintenance request.');
        } finally {
            setSubmittingTicket(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center font-mono text-xs tracking-widest text-cyan-500 gap-3">
                <div className="h-4 w-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                LOADING DASHBOARD...
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center font-mono text-xs text-red-500 tracking-widest p-6 text-center">
                <span className="text-xl mb-2">⚠️</span>
                {errorMsg.toUpperCase()}
                <p className="text-slate-600 mt-2 font-sans tracking-normal normal-case text-xs">
                    Please log out and log back in, or contact property management.
                </p>
            </div>
        );
    }

    const { profile, allocation, lease, balanceDue } = overview;

    return (
        <div className="min-h-screen bg-[#050505] text-slate-100 font-sans p-6 md:p-10 selection:bg-cyan-500 selection:text-black">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-900/80 pb-6 mb-8 gap-4">
                <div>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-400 font-mono">Tenant Portal</span>
                    <h1 className="text-2xl font-black text-white tracking-tight mt-0.5 uppercase">
                        Welcome, {profile.name}
                    </h1>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {allocation.property} — <span className="text-cyan-400">Room {allocation.room_number}</span>
                    </p>
                </div>

                <div className="flex gap-2 bg-[#0a0a0a] border border-slate-900 p-1.5 rounded-xl self-stretch md:self-auto justify-between">
                    {['overview', 'maintenance', 'lease'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase font-mono tracking-wider transition-all duration-200 ${activeTab === tab
                                ? 'bg-gradient-to-r from-cyan-950/40 to-indigo-950/20 text-cyan-400 border border-cyan-500/20 shadow-md shadow-cyan-950/10'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
                    <div className="md:col-span-2 bg-[#0a0a0a] border border-slate-900 rounded-2xl p-6 flex flex-col justify-between space-y-6">
                        <div>
                            <h3 className="text-[10px] font-bold text-slate-500 tracking-widest uppercase font-mono">Account Statement</h3>
                            <div className="mt-4 flex items-baseline gap-2">
                                <span className="text-4xl font-black tracking-tight text-white">
                                    KES {balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-xs text-slate-500 font-mono">Balance Due</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-900/60 pt-4 font-mono text-xs">
                            <div>
                                <p className="text-slate-500">Monthly Rent:</p>
                                <p className="text-slate-300 font-bold mt-0.5">KES {allocation.base_rent.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Account Status:</p>
                                <p className="text-emerald-400 font-bold mt-0.5 uppercase tracking-wide flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    {profile.status}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-[#0a0a0a] border border-slate-900 rounded-2xl p-5">
                            <h3 className="text-[10px] font-bold text-slate-500 tracking-widest uppercase font-mono mb-3">Unit Details</h3>
                            <div className="space-y-2 text-xs font-mono">
                                <div className="flex justify-between border-b border-slate-900 pb-2">
                                    <span className="text-slate-500">Type:</span>
                                    <span className="text-slate-300 font-bold">{allocation.category}</span>
                                </div>
                                <div className="flex justify-between pt-1">
                                    <span className="text-slate-500">Location:</span>
                                    <span className="text-slate-400 text-right">{allocation.location}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#0a0a0a] border border-slate-900 rounded-2xl p-5">
                            <h3 className="text-[10px] font-bold text-slate-500 tracking-widest uppercase font-mono mb-2">Contact Information</h3>
                            <p className="text-xs text-slate-300 font-mono truncate">{profile.email}</p>
                            <p className="text-[11px] text-slate-500 font-mono mt-1">{profile.phone}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Maintenance Tab */}
            {activeTab === 'maintenance' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                    <div className="bg-[#0a0a0a] border border-slate-900 rounded-2xl p-6 lg:col-span-1 h-fit">
                        <h2 className="text-xs font-bold uppercase font-mono tracking-wider text-cyan-400 mb-4">New Maintenance Request</h2>
                        <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Title</label>
                                <input
                                    type="text"
                                    value={ticketTitle}
                                    onChange={(e) => setTicketTitle(e.target.value)}
                                    placeholder="e.g., Leaking water pipe"
                                    maxLength="150"
                                    className="w-full bg-[#050505] border border-slate-800 text-slate-300 rounded-xl p-3 focus:border-cyan-500/60 focus:outline-none font-mono text-xs placeholder:text-slate-700 transition-colors"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                                <select
                                    value={ticketCategory}
                                    onChange={(e) => setTicketCategory(e.target.value)}
                                    className="w-full bg-[#050505] border border-slate-800 text-slate-300 rounded-xl p-3 focus:border-cyan-500/60 focus:outline-none font-mono text-xs transition-colors"
                                >
                                    <option value="Plumbing">Plumbing</option>
                                    <option value="Electrical">Electrical</option>
                                    <option value="Structural">Structural / Carpentry</option>
                                    <option value="Appliance">Appliance Defect</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
                                <textarea
                                    rows="4"
                                    value={ticketDescription}
                                    onChange={(e) => setTicketDescription(e.target.value)}
                                    placeholder="Please describe the issue in detail..."
                                    className="w-full bg-[#050505] border border-slate-800 text-slate-300 rounded-xl p-3 focus:border-cyan-500/60 focus:outline-none font-mono text-xs resize-none placeholder:text-slate-700 transition-colors"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submittingTicket}
                                className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold py-2.5 rounded-xl transition-all text-xs font-mono tracking-widest uppercase disabled:opacity-50"
                            >
                                {submittingTicket ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </form>
                    </div>

                    <div className="bg-[#0a0a0a] border border-slate-900 rounded-2xl p-6 lg:col-span-2">
                        <h3 className="text-[10px] font-bold text-slate-500 tracking-widest uppercase font-mono mb-4">Maintenance History</h3>

                        {tickets.length === 0 ? (
                            <div className="border border-dashed border-slate-900 p-8 rounded-xl text-center font-mono text-xs text-slate-600">
                                No maintenance requests submitted yet.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {tickets.map(ticket => (
                                    <div key={ticket.id} className="flex justify-between items-center border border-slate-900/60 p-4 rounded-xl bg-[#050505] hover:border-slate-800/80 transition-colors">
                                        <div className="max-w-[70%]">
                                            <p className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wide">{ticket.title}</p>
                                            <p className="text-xs text-slate-400 mt-1">{ticket.description}</p>
                                            <p className="text-[9px] text-slate-600 font-mono mt-2 uppercase tracking-wider">
                                                Ticket ID: {ticket.id} • Category: {ticket.category || 'General'} • Date: {new Date(ticket.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border ${ticket.status === 'Resolved'
                                            ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30'
                                            : ticket.status === 'In_Progress'
                                                ? 'bg-cyan-950/20 text-cyan-400 border-cyan-900/30'
                                                : 'bg-amber-950/20 text-amber-400 border-amber-900/30'
                                            }`}>
                                            {ticket.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Lease Tab */}
            {activeTab === 'lease' && (
                <div className="bg-[#0a0a0a] border border-slate-900 rounded-2xl p-6 max-w-3xl animate-in fade-in duration-300">
                    <h3 className="text-[10px] font-bold text-slate-500 tracking-widest uppercase font-mono mb-4">Lease Agreement</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs text-slate-300">
                        <div className="p-4 rounded-xl border border-slate-900/60 bg-[#050505]">
                            <p className="text-slate-500">Unit</p>
                            <p className="text-white font-bold text-sm mt-1">Room {allocation.room_number}</p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-900/60 bg-[#050505]">
                            <p className="text-slate-500">Rent</p>
                            <p className="text-cyan-400 font-bold text-sm mt-1">KES {allocation.base_rent.toLocaleString()} / Month</p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-900/60 bg-[#050505]">
                            <p className="text-slate-500">Start Date</p>
                            <p className="text-white font-bold mt-1">
                                {lease.start_date ? new Date(lease.start_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified'}
                            </p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-900/60 bg-[#050505]">
                            <p className="text-slate-500">End Date</p>
                            <p className="text-slate-400 font-bold mt-1">
                                {lease.end_date ? new Date(lease.end_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Month-to-Month'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 border-t border-slate-900/80 pt-4 flex items-center gap-3 text-slate-500 font-mono text-[11px]">
                        <span className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"></span>
                        Your lease agreement is active.
                    </div>
                </div>
            )}

        </div>
    );
}