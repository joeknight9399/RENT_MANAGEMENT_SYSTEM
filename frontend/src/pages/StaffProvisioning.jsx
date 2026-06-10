import React, { useState } from 'react';
import api from '../api';

export default function StaffProvisioning() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [feedback, setFeedback] = useState({ text: '', type: '' });

    const showFeedback = (text, type) => {
        setFeedback({ text, type });

        setTimeout(() => {
            setFeedback({ text: '', type: '' });
        }, 5000);
    };

    // Safe hybrid clipboard utility handling mobile HTTP testing
    const copyToClipboard = async (text) => {
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                showFeedback('Registration link copied successfully.', 'success');
                return;
            } catch (err) {
                console.error('Modern clipboard error, using legacy fallback handler:', err);
            }
        }

        // Fallback for non-secure HTTP local network environments
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            textArea.remove();
            if (!successful) throw new Error('execCommand copy returned false');
            showFeedback('Registration link copied successfully.', 'success');
        } catch (err) {
            console.error('Fallback clipboard copy failed execution:', err);
            textArea.remove();
            showFeedback('Failed to copy registration link automatically.', 'error');
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            const response = await api.post('/users/generate-invite', {});

            if (response.data.status === 'Success' || response.data.status === 'success') {
                setResult(response.data.data);
                showFeedback('Staff invitation created successfully.', 'success');
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to generate invitation.';
            showFeedback(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">

            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                    Staff Invitations
                </h1>
                <p className="text-sm text-slate-400 mt-2">
                    Generate invitation links for new caretakers and staff members.
                </p>
            </div>

            {/* Feedback Banners */}
            {feedback.text && (
                <div className={`rounded-2xl border p-4 text-sm transition-all duration-200 ${feedback.type === 'success'
                    ? 'bg-emerald-950/20 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-800 text-rose-300'
                    }`}>
                    {feedback.text}
                </div>
            )}

            {/* Generator Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
                <div className="space-y-4">
                    <p className="text-slate-300 leading-relaxed">
                        Create a secure invitation for a caretaker or staff member.
                        The generated link can be shared with the recipient to complete registration.
                    </p>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                        <p className="text-sm text-amber-300">
                            Invitations expire automatically after 24 hours.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleGenerate} className="mt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition"
                    >
                        {loading ? 'Generating Invitation...' : 'Generate Invitation'}
                    </button>
                </form>
            </div>

            {/* Results Output */}
            {result && (
                <div className="bg-slate-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl animate-in fade-in">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-white">
                            Invitation Created
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            Share this invitation code or registration link with the staff member.
                        </p>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">
                                Invitation Code
                            </label>
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                                <p className="text-2xl font-bold tracking-wide text-indigo-400 font-mono">
                                    {result.invite_code}
                                </p>
                            </div>
                        </div>

                        {/* Dynamic URL creation using window.location.origin */}
                        <button
                            type="button"
                            onClick={() => copyToClipboard(`${window.location.origin}/register?code=${result.invite_code}`)}
                            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 py-3 rounded-xl transition font-medium flex items-center justify-center gap-2"
                        >
                            📋 Copy Registration Link
                        </button>

                        <div className="text-xs text-slate-500 font-mono">
                            Expires on: {new Date(result.expires_at).toLocaleString()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}