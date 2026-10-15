import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import NeoModal from '../UI/NeoModal';
import NeoButton from '../UI/NeoButton';
import { Share2, Copy, Check, ExternalLink, Globe, Lock } from 'lucide-react';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    level: 'app' | 'note';
    targetId: number;
    title: string;
    isPublic: boolean;
    publicToken: string;
}

export default function ShareModal({
    isOpen,
    onClose,
    level,
    targetId,
    title,
    isPublic,
    publicToken,
}: ShareModalProps) {
    const [copied, setCopied] = useState(false);
    const [toggling, setToggling] = useState(false);

    const shareUrl = `${window.location.origin}/s/${level === 'app' ? 'app' : 'note'}/${publicToken}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleTogglePublic = () => {
        setToggling(true);
        const route = level === 'app' ? `/app/${targetId}` : `/notes/${targetId}`;

        router.put(
            route,
            { is_public: !isPublic },
            {
                onFinish: () => setToggling(false),
            }
        );
    };

    return (
        <NeoModal
            isOpen={isOpen}
            onClose={onClose}
            title={level === 'app' ? 'Bagikan Aplikasi Publik' : 'Bagikan Catatan Publik'}
            maxWidth="md"
        >
            <div className="space-y-4">
                {/* Status Card */}
                <div
                    className={`p-4 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                        isPublic ? 'bg-[#7FBC8C]/30' : 'bg-neutral-100'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            {isPublic ? (
                                <Globe className="w-5 h-5 text-emerald-700" />
                            ) : (
                                <Lock className="w-5 h-5 text-neutral-600" />
                            )}
                            <span className="font-heading font-black text-sm uppercase">
                                Status: {isPublic ? 'Publik (Dapat Dibaca)' : 'Pribadi (Terkunci)'}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleTogglePublic}
                            disabled={toggling}
                            className={`px-3 py-1 border-2 border-black font-heading font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all ${
                                isPublic
                                    ? 'bg-[#FF6B6B] hover:bg-[#ff8585] text-black'
                                    : 'bg-[#7FBC8C] hover:bg-[#92cca0] text-black'
                            }`}
                        >
                            {toggling ? '...' : isPublic ? 'Ubah ke Privat' : 'Jadikan Publik'}
                        </button>
                    </div>

                    <p className="text-xs text-neutral-600 font-medium">
                        {isPublic ? (
                            level === 'app' ? (
                                'Siapa pun yang memiliki tautan ini dapat menelusuri seluruh grup dan membaca catatan di dalamnya tanpa login.'
                            ) : (
                                'Siapa pun dengan tautan ini hanya dapat membaca isi catatan ini saja (termasuk checklist, sketsa, dan file lampiran).'
                            )
                        ) : (
                            'Halaman saat ini hanya dapat diakses oleh Anda dan kolaborator yang diundang.'
                        )}
                    </p>
                </div>

                {/* Shareable Link Box */}
                {isPublic && (
                    <div className="space-y-2">
                        <label className="block text-xs font-black uppercase tracking-wider text-black font-heading">
                            Tautan Berbagi Read-Only
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={shareUrl}
                                className="flex-1 px-3 py-2 text-xs bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-mono text-neutral-800 outline-none"
                            />
                            <NeoButton
                                type="button"
                                variant={copied ? 'mint' : 'yellow'}
                                size="sm"
                                onClick={handleCopy}
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Tersalin!' : 'Salin'}
                            </NeoButton>
                        </div>

                        <div className="pt-2">
                            <a
                                href={shareUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-black hover:underline"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Buka pratinjau publik di tab baru
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </NeoModal>
    );
}
