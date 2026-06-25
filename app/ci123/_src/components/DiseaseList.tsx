'use client';

import React, { useId, useState } from 'react';

interface DiseaseListProps {
    title: string;
    diseases: string[];
    /** Coverage percentage shown as a pill, e.g. "100%" */
    badge?: string;
    /** Optional note shown next to the badge, e.g. "จ่ายสูงสุดไม่เกิน 100,000 บาท" */
    badgeNote?: string;
    defaultOpen?: boolean;
}

export default function DiseaseList({
    title,
    diseases,
    badge,
    badgeNote,
    defaultOpen = false,
}: DiseaseListProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const panelId = useId();

    return (
        <div className="bg-gray-50/50 rounded-lg sm:rounded-xl overflow-hidden border border-gray-100">
            {/* Header - clickable to toggle */}
            <button
                type="button"
                onClick={() => setIsOpen((v) => !v)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="w-full bg-[#eef2f6] px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between gap-3 text-left transition-colors hover:bg-[#e4ebf2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-inset"
            >
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
                    <h3 className="text-base sm:text-xl font-bold text-[#1e3a8a] break-words min-w-0">{title}</h3>
                    {badge && (
                        <span className="inline-flex items-center rounded-full bg-[#dbeafe] px-2.5 py-0.5 text-xs sm:text-sm font-semibold text-[#1e3a8a]">
                            {badge}
                        </span>
                    )}
                    {badgeNote && (
                        <span className="text-xs sm:text-sm font-normal text-gray-500">
                            ({badgeNote})
                        </span>
                    )}
                </span>
                <span className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs sm:text-sm text-[#1d4ed8] font-medium whitespace-nowrap">
                        {diseases.length} โรค
                    </span>
                    <svg
                        className={`w-5 h-5 text-[#1e3a8a] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </button>

            {/* Collapsible body — grid-rows trick handles any content height smoothly */}
            <div
                id={panelId}
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="overflow-hidden">
                    <ol className="disease-list text-[#1f2937]">
                        {diseases.map((disease, index) => (
                            <li key={index}>{disease}</li>
                        ))}
                    </ol>
                </div>
            </div>
        </div>
    );
}
