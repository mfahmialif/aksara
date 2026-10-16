import React from 'react';
import { ClipboardList, Users, Shield, Cpu } from 'lucide-react';
import { LogStats } from '../types';

interface LogStatCardsProps {
    stats: LogStats;
}

export default function LogStatCards({ stats }: LogStatCardsProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-4 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-neutral-600 font-heading">Total Log</span>
                    <div className="p-1.5 bg-[#FF8FAB] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        <ClipboardList className="w-3.5 h-3.5 text-black" />
                    </div>
                </div>
                <p className="text-2xl font-black font-heading text-black">{stats.total_logs}</p>
            </div>

            <div className="p-4 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-neutral-600 font-heading">Log Member</span>
                    <div className="p-1.5 bg-[#FFDC58] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        <Users className="w-3.5 h-3.5 text-black" />
                    </div>
                </div>
                <p className="text-2xl font-black font-heading text-black">{stats.member_logs}</p>
            </div>

            <div className="p-4 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-neutral-600 font-heading">Log Admin</span>
                    <div className="p-1.5 bg-[#A388EE] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        <Shield className="w-3.5 h-3.5 text-black" />
                    </div>
                </div>
                <p className="text-2xl font-black font-heading text-black">{stats.admin_logs}</p>
            </div>

            <div className="p-4 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-neutral-600 font-heading">Log Sistem</span>
                    <div className="p-1.5 bg-[#7FBC8C] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        <Cpu className="w-3.5 h-3.5 text-black" />
                    </div>
                </div>
                <p className="text-2xl font-black font-heading text-black">{stats.system_logs}</p>
            </div>
        </div>
    );
}
