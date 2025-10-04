import React from 'react';

import { Contact } from '../../types';

interface LeadScoreBadgeProps {
    score: Contact['lead_score'];
    category: Contact['lead_category'];
    reasoning: Contact['lead_score_reasoning'];
}

export const LeadScoreBadge: React.FC<LeadScoreBadgeProps> = ({ score, category, reasoning }) => {
    if (score === null || score === undefined) {
        return <span className="text-xs text-gray-400">N/A</span>;
    }

    const getCategoryStyles = () => {
        switch (category) {
            case 'Hot':
                return 'bg-red-100 text-red-800 border border-red-300';
            case 'Warm':
                return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
            case 'Cold':
                return 'bg-blue-100 text-blue-800 border border-blue-300';
            default:
                return 'bg-gray-100 text-gray-800 border border-gray-300';
        }
    };

    return (
        <div className="relative group">
            <div className={`px-2.5 py-1 text-xs font-semibold rounded-full inline-block ${getCategoryStyles()}`}>
                {score}
            </div>
            {reasoning && (
                <div className="absolute bottom-full mb-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
                    <p className="font-bold mb-1">Motivazione AI:</p>
                    <p>{reasoning}</p>
                     <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-gray-800" />
                </div>
            )}
        </div>
    );
};
