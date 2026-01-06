'use client';

import React from 'react';
import { Fuel } from 'lucide-react';

interface GasTrackerProps {
    gasPrice?: string;
    isRefetching?: boolean;
}

export function GasTracker({ gasPrice, isRefetching }: GasTrackerProps) {
    if (!gasPrice) return null;

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted border border-border text-foreground hover:border-primary/50 transition-colors shadow-sm" title="Current Gas Price">
            <Fuel size={14} className={isRefetching ? 'animate-pulse text-primary' : 'text-muted-foreground'} />
            <span className="text-xs font-bold font-mono tracking-tighter">
                {gasPrice} <span className="opacity-50 font-normal">GWEI</span>
            </span>
        </div>
    );
}
