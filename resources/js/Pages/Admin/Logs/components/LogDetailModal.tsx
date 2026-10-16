import React from 'react';
import { ActivityLog } from '@/types';
import NeoModal from '@/Components/UI/NeoModal';
import NeoButton from '@/Components/UI/NeoButton';
import { Clock, Monitor, Globe, Info } from 'lucide-react';

interface LogDetailModalProps {
    log: ActivityLog | null;
    onClose: () => void;
}

export default function LogDetailModal({ log, onClose }: LogDetailModalProps) {
    if (!log) return null;

    return (
        <NeoModal
            isOpen={true}
            onClose={onClose}
            title={`Inspeksi Log #${log.id}`}
        >
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 border-2 border-black text-xs">
                    <div>
                        <span className="font-bold text-neutral-500 uppercase text-[10px] block">Aksi / Event</span>
                        <span className="font-mono font-black text-black">{log.action}</span>
                    </div>
                    <div>
                        <span className="font-bold text-neutral-500 uppercase text-[10px] block">Waktu Kejadian</span>
                        <span className="font-mono text-neutral-800">{new Date(log.created_at).toLocaleString('id-ID')}</span>
                    </div>
                    <div>
                        <span className="font-bold text-neutral-500 uppercase text-[10px] block">Pelaku (Causer)</span>
                        <span className="font-bold text-black">{log.causer?.name || 'Sistem / Anonim'}</span>
                        <span className="text-[10px] text-neutral-500 block font-mono">{log.causer_type || '-'}</span>
                    </div>
                    <div>
                        <span className="font-bold text-neutral-500 uppercase text-[10px] block">Target Entitas (Subject)</span>
                        <span className="font-mono text-black font-bold">
                            {log.subject_type ? `${log.subject_type.split('\\').pop()} #${log.subject_id}` : '-'}
                        </span>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-black uppercase text-black font-heading block mb-1">
                        Deskripsi Lengkap
                    </label>
                    <p className="p-3 bg-white border-2 border-black font-medium text-xs text-neutral-900 leading-relaxed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {log.description}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <span className="font-bold text-neutral-500 uppercase text-[10px] block flex items-center gap-1">
                            <Monitor className="w-3 h-3" /> IP Address
                        </span>
                        <span className="font-mono font-bold">{log.ip_address || '-'}</span>
                    </div>
                    <div className="p-2.5 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <span className="font-bold text-neutral-500 uppercase text-[10px] block flex items-center gap-1">
                            <Globe className="w-3 h-3" /> User Agent
                        </span>
                        <span className="font-mono text-[10px] line-clamp-1" title={log.user_agent || '-'}>
                            {log.user_agent || '-'}
                        </span>
                    </div>
                </div>

                {log.properties && Object.keys(log.properties).length > 0 && (
                    <div>
                        <label className="text-xs font-black uppercase text-black font-heading block mb-1">
                            Data Metadata & Payload (JSON)
                        </label>
                        <pre className="p-3 bg-[#111111] text-[#7FBC8C] font-mono text-[11px] border-2 border-black overflow-x-auto max-h-48 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {JSON.stringify(log.properties, null, 2)}
                        </pre>
                    </div>
                )}

                <div className="flex justify-end pt-3 border-t-2 border-black">
                    <NeoButton variant="yellow" size="sm" onClick={onClose}>
                        Tutup Inspeksi
                    </NeoButton>
                </div>
            </div>
        </NeoModal>
    );
}
