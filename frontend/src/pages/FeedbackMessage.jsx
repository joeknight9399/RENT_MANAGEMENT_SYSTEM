import React, { useEffect } from 'react';

const FeedbackMessage = ({ type, message, onClose }) => {
    // Auto-dismiss the notification after 5 seconds
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    // Tailwind styles for success vs error
    const baseStyle = "fixed top-20 right-4 p-4 rounded-xl border shadow-lg flex items-center justify-between w-80 z-50 animate-in fade-in slide-in-from-right-5";
    const statusStyle = type === 'success'
        ? 'bg-green-50 border-green-200 text-green-700'
        : 'bg-red-50 border-red-200 text-red-700';

    return (
        <div className={`${baseStyle} ${statusStyle}`}>
            <p className="text-sm font-semibold">{message}</p>
            <button onClick={onClose} className="ml-4 hover:opacity-75 font-bold">×</button>
        </div>
    );
};

export default FeedbackMessage;