import React, { useEffect, useState } from 'react';
import NeoModal from '@/Components/UI/NeoModal';
import NeoButton from '@/Components/UI/NeoButton';
import { NeoBadge } from '@/Components/UI/NeoInput';
import { MemberUser, UserDetailData } from '../types';
import {
    Mail,
    Calendar,
    Bell,
    Layers,
    Clock,
    FolderKanban,
    Activity,
    Edit3,
    ExternalLink,
    ShieldCheck,
    Bookmark,
    Users,
} from 'lucide-react';

interface MemberDetailModalProps {
    member: MemberUser | null;
    onClose: () => void;
    onEdit: (member: MemberUser) => void;
}

export default function MemberDetailModal({ member, onClose, onEdit }: MemberDetailModalProps) {
    const [detailData, setDetailData] = useState<UserDetailData | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        if (!member) {
            setDetailData(null);
            return;
        }

        let isMounted = true;
        setLoadingDetails(true);

        fetch(`/admin/users/${member.id}/details`, {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error('Gagal memuat detail pengguna');
                return res.json();
            })
            .then((data: UserDetailData) => {
                if (isMounted) {
                    setDetailData(data);
                    setLoadingDetails(false);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setLoadingDetails(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [member]);

    if (!member) return null;

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <NeoModal
            isOpen={true}
            onClose={onClose}
            title="Detail Informasi Member"
            maxWidth="xl"
        >
            <div className="space-y-5">
                {/* Header Profile Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-3">
                        {member.avatar ? (
                            <img
                                src={member.avatar}
                                alt={member.name}
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                                className="w-14 h-14 border-2 border-black bg-amber-100 object-cover shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            />
                        ) : (
                            <div className="w-14 h-14 bg-[#A388EE] border-2 border-black flex items-center justify-center font-black text-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                {member.name.charAt(0)}
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-lg font-black font-heading text-black">{member.name}</h4>
                                <NeoBadge variant={member.is_active ? 'mint' : 'coral'} className="text-[10px]">
                                    {member.is_active ? 'Status: Aktif' : 'Status: Nonaktif'}
                                </NeoBadge>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-medium mt-0.5">
                                <Mail className="w-3.5 h-3.5 text-neutral-500" />
                                <span>{member.email}</span>
                            </div>
                            {member.google_id && (
                                <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                                    Google ID: {member.google_id}
                                </p>
                            )}
                        </div>
                    </div>

                    <NeoButton
                        variant="yellow"
                        size="sm"
                        onClick={() => {
                            onClose();
                            onEdit(member);
                        }}
                        className="shrink-0"
                    >
                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                        Edit Member
                    </NeoButton>
                </div>

                {/* Key Metrics / Attributes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-[#FFFDF8] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <span className="text-[10px] font-black uppercase text-neutral-500 flex items-center gap-1 mb-1 font-heading">
                            <Layers className="w-3 h-3" /> Ruang Kerja
                        </span>
                        <p className="text-xl font-black font-mono text-black">
                            {detailData?.user?.note_apps_count ?? member.note_apps_count ?? 0}
                        </p>
                    </div>

                    <div className="p-3 bg-[#FFFDF8] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <span className="text-[10px] font-black uppercase text-neutral-500 flex items-center gap-1 mb-1 font-heading">
                            <Bell className="w-3 h-3" /> Default Pengingat
                        </span>
                        <p className="text-xl font-black font-mono text-black">
                            {member.default_reminder_days} <span className="text-xs font-normal">Hari</span>
                        </p>
                    </div>

                    <div className="p-3 bg-[#FFFDF8] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <span className="text-[10px] font-black uppercase text-neutral-500 flex items-center gap-1 mb-1 font-heading">
                            <Users className="w-3 h-3" /> Kolaborasi
                        </span>
                        <p className="text-xl font-black font-mono text-black">
                            {detailData?.user?.collaborations_count ?? 0}
                        </p>
                    </div>

                    <div className="p-3 bg-[#FFFDF8] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <span className="text-[10px] font-black uppercase text-neutral-500 flex items-center gap-1 mb-1 font-heading">
                            <Bookmark className="w-3 h-3" /> Link Tersimpan
                        </span>
                        <p className="text-xl font-black font-mono text-black">
                            {detailData?.user?.saved_shared_links_count ?? 0}
                        </p>
                    </div>
                </div>

                {/* Account Metadata Timestamps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-neutral-50 border-2 border-black text-xs font-medium">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-neutral-500 shrink-0" />
                        <div>
                            <span className="text-[10px] font-black uppercase text-neutral-500 block">Bergabung Sejak</span>
                            <span className="font-bold text-neutral-800">{formatDate(member.created_at)}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-neutral-500 shrink-0" />
                        <div>
                            <span className="text-[10px] font-black uppercase text-neutral-500 block">Terakhir Diperbarui</span>
                            <span className="font-bold text-neutral-800">{formatDate(member.updated_at)}</span>
                        </div>
                    </div>
                </div>

                {/* User's Workspaces List */}
                <div className="space-y-2">
                    <h5 className="text-xs font-black uppercase font-heading text-black flex items-center gap-1.5">
                        <FolderKanban className="w-4 h-4" /> Daftar Ruang Kerja (Aplikasi Catatan)
                    </h5>

                    {loadingDetails ? (
                        <div className="p-4 border-2 border-black bg-white animate-pulse space-y-2">
                            <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
                            <div className="h-4 bg-neutral-100 rounded w-1/2"></div>
                        </div>
                    ) : detailData?.user?.note_apps && detailData.user.note_apps.length > 0 ? (
                        <div className="border-2 border-black bg-white divide-y-2 divide-neutral-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] max-h-48 overflow-y-auto">
                            {detailData.user.note_apps.map((app) => (
                                <div key={app.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-neutral-50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 border border-black" style={{ backgroundColor: app.color_theme === 'yellow' ? '#FFDC58' : app.color_theme === 'purple' ? '#A388EE' : app.color_theme === 'mint' ? '#7FBC8C' : '#FF6B6B' }} />
                                        <span className="font-black text-black">{app.name}</span>
                                        <span className="text-neutral-500">({app.groups_count || 0} topik grup)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <NeoBadge variant={app.is_public ? 'sky' : 'neutral'} className="text-[9px]">
                                            {app.is_public ? 'Publik' : 'Privat'}
                                        </NeoBadge>
                                        <span className="text-[10px] text-neutral-500 font-mono">
                                            {new Date(app.created_at).toLocaleDateString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-3 bg-neutral-50 border-2 border-black text-xs text-neutral-500 font-bold text-center">
                            Pengguna belum membuat ruang kerja aplikasi catatan.
                        </div>
                    )}
                </div>

                {/* Recent Activities */}
                <div className="space-y-2">
                    <h5 className="text-xs font-black uppercase font-heading text-black flex items-center gap-1.5">
                        <Activity className="w-4 h-4" /> Riwayat Aktivitas Terakhir
                    </h5>

                    {loadingDetails ? (
                        <div className="p-4 border-2 border-black bg-white animate-pulse space-y-2">
                            <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
                            <div className="h-4 bg-neutral-100 rounded w-1/2"></div>
                        </div>
                    ) : detailData?.recent_logs && detailData.recent_logs.length > 0 ? (
                        <div className="border-2 border-black bg-white divide-y divide-neutral-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] max-h-40 overflow-y-auto">
                            {detailData.recent_logs.map((log) => (
                                <div key={log.id} className="p-2.5 text-xs">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="font-mono font-black text-[10px] px-1.5 py-0.5 border border-black bg-neutral-100">
                                            {log.action}
                                        </span>
                                        <span className="text-[10px] text-neutral-500 font-mono">
                                            {new Date(log.created_at).toLocaleString('id-ID', {
                                                day: '2-digit',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-neutral-800 font-medium text-[11px] line-clamp-1">{log.description}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-3 bg-neutral-50 border-2 border-black text-xs text-neutral-500 font-bold text-center">
                            Belum ada riwayat aktivitas yang tercatat untuk member ini.
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end pt-3 border-t-2 border-black">
                    <NeoButton variant="white" size="sm" onClick={onClose}>
                        Tutup
                    </NeoButton>
                </div>
            </div>
        </NeoModal>
    );
}
