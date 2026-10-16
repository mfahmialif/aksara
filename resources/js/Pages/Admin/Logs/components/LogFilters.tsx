import React from 'react';
import NeoCard from '@/Components/UI/NeoCard';
import NeoButton from '@/Components/UI/NeoButton';
import { NeoInput, NeoSelect } from '@/Components/UI/NeoInput';
import { Search, RotateCcw } from 'lucide-react';

interface LogFiltersProps {
    search: string;
    setSearch: (val: string) => void;
    role: string;
    setRole: (val: string) => void;
    action: string;
    setAction: (val: string) => void;
    onFilter: (e: React.FormEvent) => void;
    onReset: () => void;
}

export default function LogFilters({
    search,
    setSearch,
    role,
    setRole,
    action,
    setAction,
    onFilter,
    onReset,
}: LogFiltersProps) {
    return (
        <NeoCard color="bg-white" className="p-4 sm:p-5 mb-8">
            <form onSubmit={onFilter} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-5">
                    <NeoInput
                        label="Pencarian Detail"
                        placeholder="Cari deskripsi, entitas, IP, atau user..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="sm:col-span-3">
                    <NeoSelect
                        label="Pelaku (Role)"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        options={[
                            { value: 'all', label: 'Semua Pelaku' },
                            { value: 'user', label: 'Member' },
                            { value: 'admin', label: 'Administrator' },
                            { value: 'system', label: 'Sistem / Cron' },
                        ]}
                    />
                </div>

                <div className="sm:col-span-2">
                    <NeoSelect
                        label="Kategori Aksi"
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                        options={[
                            { value: 'all', label: 'Semua Aksi' },
                            { value: 'NOTE', label: 'Catatan' },
                            { value: 'APP', label: 'Workspace' },
                            { value: 'GROUP', label: 'Grup' },
                            { value: 'AUTH', label: 'Autentikasi' },
                            { value: 'ADMIN', label: 'Staf Admin' },
                            { value: 'SYSTEM', label: 'Sistem' },
                        ]}
                    />
                </div>

                <div className="sm:col-span-2 flex gap-2">
                    <NeoButton type="submit" variant="yellow" size="md" className="flex-1 justify-center">
                        <Search className="w-4 h-4 mr-1" />
                        Cari
                    </NeoButton>
                    <NeoButton type="button" variant="white" size="md" onClick={onReset} title="Reset Filter">
                        <RotateCcw className="w-4 h-4" />
                    </NeoButton>
                </div>
            </form>
        </NeoCard>
    );
}
