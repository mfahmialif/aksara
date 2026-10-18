import React from 'react';
import { Users, UserCheck, UserX, Shield } from 'lucide-react';
import { UserStats } from '../types';

interface UserStatCardsProps {
    stats?: UserStats;
    adminsCount: number;
}

export default function UserStatCards({ stats, adminsCount }: UserStatCardsProps) {
    if (!stats) return null;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-neutral-600 font-heading">Total Member</span>
                    <div className="p-1.5 bg-[#FFDC58] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        <Users className="w-3.5 h-3.5 text-black" />
                    </div>
                </div>
                <p className="text-2xl font-black font-heading text-black">{stats.total_members}</p>
            </div>

            <div className="p-4 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-neutral-600 font-heading">Member Aktif</span>
                    <div className="p-1.5 bg-[#7FBC8C] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        <UserCheck className="w-3.5 h-3.5 text-black" />
                    </div>
                </div>
                <p className="text-2xl font-black font-heading text-black">{stats.active_members}</p>
            </div>

            <div className="p-4 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-neutral-600 font-heading">Member Nonaktif</span>
                    <div className="p-1.5 bg-[#FF8FAB] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        <UserX className="w-3.5 h-3.5 text-black" />
                    </div>
                </div>
                <p className="text-2xl font-black font-heading text-black">{stats.inactive_members}</p>
            </div>

            <div className="p-4 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-neutral-600 font-heading">Administrator</span>
                    <div className="p-1.5 bg-[#A388EE] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        <Shield className="w-3.5 h-3.5 text-black" />
                    </div>
                </div>
                <p className="text-2xl font-black font-heading text-black">{adminsCount}</p>
            </div>
        </div>
    );
}
