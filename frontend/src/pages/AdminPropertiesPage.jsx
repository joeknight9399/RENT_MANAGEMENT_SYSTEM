import React, { useState, useEffect } from 'react';
import api from '../api';

export default function AdminPropertiesPage() {
    const [properties, setProperties] = useState([]);
    const [selectedProp, setSelectedProp] = useState('');
    const [refresh, setRefresh] = useState(false);

    const [feedback, setFeedback] = useState({ text: '', type: '' });

    const [propForm, setPropForm] = useState({
        name: '',
        location: ''
    });

    // STEP 3.1: Initialize category as an empty string instead of 'Bedsitter'
    const [unitForm, setUnitForm] = useState({
        room_number: '',
        category: '',
        base_rent: '',
        deposit_amount: ''
    });

    const showFeedback = (text, type) => {
        setFeedback({ text, type });

        setTimeout(() => {
            setFeedback({ text: '', type: '' });
        }, 5000);
    };

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const response = await api.get('/properties');

                if (response.data.status === 'Success') {
                    setProperties(response.data.data.properties);
                }
            } catch (err) {
                console.error('Fetch error:', err);
            }
        };

        fetchProperties();
    }, [refresh]);

    const handleCreateProperty = async (e) => {
        e.preventDefault();

        try {
            const response = await api.post('/admin/properties', propForm);

            showFeedback(
                response.data.message || 'Property created successfully.',
                'success'
            );

            setPropForm({
                name: '',
                location: ''
            });

            setRefresh(!refresh);
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                'Failed to create property.';

            showFeedback(msg, 'error');
        }
    };

    const handleAddUnit = async (e) => {
        e.preventDefault();

        if (!selectedProp) {
            return showFeedback(
                'Please select a property first.',
                'error'
            );
        }

        try {
            const response = await api.post('/admin/units', {
                ...unitForm,
                property_id: selectedProp
            });

            showFeedback(
                response.data.message || 'Unit added successfully.',
                'success'
            );

            // STEP 3.2: Reset the category state to an empty string on success
            setUnitForm({
                room_number: '',
                category: '',
                base_rent: '',
                deposit_amount: ''
            });

            setRefresh(!refresh);
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                'Failed to add unit.';

            showFeedback(msg, 'error');
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">

            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                    Properties & Units
                </h1>

                <p className="text-sm text-slate-400 mt-2">
                    Create properties and manage available rental units.
                </p>
            </div>

            {/* Feedback */}
            {feedback.text && (
                <div
                    className={`rounded-2xl border p-4 flex items-center justify-between gap-4 ${feedback.type === 'success'
                        ? 'bg-emerald-950/20 border-emerald-800 text-emerald-300'
                        : 'bg-rose-950/20 border-rose-800 text-rose-300'
                        }`}
                >
                    <span className="text-sm font-medium">
                        {feedback.text}
                    </span>

                    <button
                        onClick={() =>
                            setFeedback({
                                text: '',
                                type: ''
                            })
                        }
                        className="text-slate-400 hover:text-white transition"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Forms Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Property Form */}
                <section className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-6">
                        Create Property
                    </h2>

                    <form
                        onSubmit={handleCreateProperty}
                        className="space-y-5"
                    >
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">
                                Property Name
                            </label>

                            <input
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-indigo-500"
                                placeholder="Alpha Heights"
                                value={propForm.name}
                                onChange={(e) =>
                                    setPropForm({
                                        ...propForm,
                                        name: e.target.value
                                    })
                                }
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-2">
                                Location
                            </label>

                            <input
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-indigo-500"
                                placeholder="Meru Town"
                                value={propForm.location}
                                onChange={(e) =>
                                    setPropForm({
                                        ...propForm,
                                        location: e.target.value
                                    })
                                }
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition"
                        >
                            Create Property
                        </button>
                    </form>
                </section>

                {/* Unit Form */}
                <section className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-6">
                        Add Unit
                    </h2>

                    <form
                        onSubmit={handleAddUnit}
                        className="space-y-5"
                    >
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">
                                Property
                            </label>

                            <select
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-sky-500"
                                value={selectedProp}
                                onChange={(e) =>
                                    setSelectedProp(e.target.value)
                                }
                                required
                            >
                                <option value="">
                                    Select Property
                                </option>

                                {properties.map((p) => (
                                    <option
                                        key={p.id}
                                        value={p.id}
                                    >
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-2">
                                Unit Number
                            </label>

                            <input
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-sky-500"
                                placeholder="A10"
                                value={unitForm.room_number}
                                onChange={(e) =>
                                    setUnitForm({
                                        ...unitForm,
                                        room_number: e.target.value
                                    })
                                }
                                required
                            />
                        </div>

                        {/* STEP 3.3: Replaced the old <select> element with a free text input field */}
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">
                                Unit Type / Category
                            </label>

                            <input
                                type="text"
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-sky-500"
                                placeholder="e.g., Bedsitter, Single, Executive Studio, 3-Bedroom"
                                value={unitForm.category}
                                onChange={(e) =>
                                    setUnitForm({
                                        ...unitForm,
                                        category: e.target.value
                                    })
                                }
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">
                                    Monthly Rent (KES)
                                </label>

                                <input
                                    type="number"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-sky-500"
                                    placeholder="Rent Amount"
                                    value={unitForm.base_rent}
                                    onChange={(e) =>
                                        setUnitForm({
                                            ...unitForm,
                                            base_rent: e.target.value
                                        })
                                    }
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">
                                    Deposit Amount (KES)
                                </label>

                                <input
                                    type="number"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-sky-500"
                                    placeholder="Deposit Amount"
                                    value={unitForm.deposit_amount}
                                    onChange={(e) =>
                                        setUnitForm({
                                            ...unitForm,
                                            deposit_amount: e.target.value
                                        })
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-3 rounded-xl transition"
                        >
                            Add Unit
                        </button>
                    </form>
                </section>

            </div>
        </div>
    );
}