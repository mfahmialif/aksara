import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: React.ReactNode;
    subtitle?: React.ReactNode;
    icon: LucideIcon;
    iconBg?: string;
}

export default function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    iconBg = 'bg-[#FFDC58]',
}: StatCardProps) {
    return (
        <div className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-neutral-600 font-heading">
                    {title}
                </span>
                <div className={`p-2 ${iconBg} border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]`}>
                    <Icon className="w-4 h-4 text-black" />
                </div>
            </div>
            <p className="text-3xl font-black font-heading text-black">
                {value}{' '}
                {subtitle && <span className="text-xs font-normal text-neutral-500">{subtitle}</span>}
            </p>
        </div>
    );
}
