import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function CaretakerExpenses() {
    const { user } = useAuth();

    const [properties, setProperties] = useState([]);
    const [selectedProperty, setSelectedProperty] = useState('');
    const [expenses, setExpenses] = useState([]);

    // Form state
    const [category, setCategory] = useState('Repairs & Maintenance');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

    const [loading, setLoading] = useState(false);
    const [feedLoading, setFeedLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const categories = [
        'Repairs & Maintenance',
        'Cleaning & Janitorial',
        'Plumbing Emergency',
        'Electrical Spares',
        'Garbage / Sewage Ops',
        'Casual Labor wages',
        'Other Petty Expenses'
    ];

    // Fetch properties
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

    // Fetch expenses when property changes
    useEffect(() => {
        if (!selectedProperty) {
            setExpenses([]);
            return;
        }

        const fetchExpenses = async () => {
            try {
                setFeedLoading(true);
                const res = await api.get('/caretaker/expenses', {
                    params: { property_id: selectedProperty }
                });

                if (res.data.status === 'Success') {
                    setExpenses(res.data.data || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setFeedLoading(false);
            }
        };

        fetchExpenses();
    }, [selectedProperty]);

    // Calculate total
    const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

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

            const res = await api.post('/caretaker/expenses', {
                property_id: selectedProperty,
                category,
                description,
                amount: parseFloat(amount),
                expense_date: expenseDate,
                recorded_by: user?.id
            });

            if (res.data.status === 'Success') {
                setSuccess('Expense recorded successfully.');

                // Reset form
                setDescription('');
                setAmount('');

                // Refresh list
                const refreshRes = await api.get('/caretaker/expenses', {
                    params: { property_id: selectedProperty }
                });
                if (refreshRes.data.status === 'Success') {
                    setExpenses(refreshRes.data.data || []);
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to record expense.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#050505] min-h-screen p-6 text-slate-100">
            <div className="max-w-6xl mx-auto mb-8 border-b border-slate-900 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Property Expenses</h1>
                        <p className="text-slate-500 text-sm mt-1">Log and track operational expenses</p>
                    </div>

                    <select
                        value={selectedProperty}
                        onChange={(e) => setSelectedProperty(e.target.value)}
                        className="bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none w-full sm:w-auto"
                    >
                        <option value="">Select Property</option>
                        {properties.map((prop) => (
                            <option key={prop.id} value={prop.id}>
                                {prop.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-6">
                {/* Add Expense Form */}
                <div className="lg:col-span-2 bg-[#0a0a0a] border border-slate-900 rounded-2xl p-6">
                    <h2 className="uppercase text-xs tracking-widest text-slate-400 font-semibold mb-5">
                        Record New Expense
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
                                Category
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-[#111] border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
                            >
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2 font-medium">
                                Amount (KES)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-[#111] border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm outline-none font-mono"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2 font-medium">
                                Date
                            </label>
                            <input
                                type="date"
                                value={expenseDate}
                                onChange={(e) => setExpenseDate(e.target.value)}
                                className="w-full bg-[#111] border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2 font-medium">
                                Description
                            </label>
                            <textarea
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the expense..."
                                className="w-full bg-[#111] border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm outline-none resize-none"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !selectedProperty || !amount}
                            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 py-3.5 rounded-xl font-semibold text-sm uppercase tracking-wider transition-colors"
                        >
                            {loading ? 'SAVING...' : 'Record Expense'}
                        </button>
                    </form>
                </div>

                {/* Expenses List */}
                <div className="lg:col-span-3">
                    <div className="bg-[#0a0a0a] border border-slate-900 rounded-2xl p-5 mb-5 flex justify-between items-center">
                        <span className="text-xs uppercase tracking-widest text-slate-500 font-medium">
                            Total Spent
                        </span>
                        <span className="text-2xl font-bold text-rose-400 font-mono">
                            KES {totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    <h2 className="uppercase text-xs tracking-widest text-slate-400 font-semibold mb-4">
                        Expense History
                    </h2>

                    {!selectedProperty ? (
                        <div className="bg-[#0a0a0a] border border-dashed border-slate-900 rounded-2xl py-20 text-center text-slate-500">
                            Select a property to view expenses
                        </div>
                    ) : feedLoading ? (
                        <div className="text-center py-20 text-slate-500">Loading expenses...</div>
                    ) : expenses.length === 0 ? (
                        <div className="bg-[#0a0a0a] border border-dashed border-slate-900 rounded-2xl py-20 text-center text-slate-500">
                            No expenses recorded yet.
                        </div>
                    ) : (
                        <div className="bg-[#0a0a0a] border border-slate-900 rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-900 text-xs uppercase tracking-widest text-slate-500 bg-slate-950/30">
                                            <th className="text-left p-4">Date</th>
                                            <th className="text-left p-4">Category</th>
                                            <th className="text-left p-4">Description</th>
                                            <th className="text-right p-4">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-900">
                                        {expenses.map((exp) => (
                                            <tr key={exp.id} className="hover:bg-slate-950/50 transition-colors">
                                                <td className="p-4 text-slate-500 font-mono whitespace-nowrap">
                                                    {new Date(exp.expense_date).toLocaleDateString()}
                                                </td>
                                                <td className="p-4 font-medium">{exp.category}</td>
                                                <td className="p-4 text-slate-400 text-sm">
                                                    {exp.description}
                                                </td>
                                                <td className="p-4 text-right font-mono font-semibold text-rose-400">
                                                    -{parseFloat(exp.amount).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CaretakerExpenses;