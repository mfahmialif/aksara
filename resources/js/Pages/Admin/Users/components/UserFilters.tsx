import React from 'react';
import NeoCard from '@/Components/UI/NeoCard';
import NeoButton from '@/Components/UI/NeoButton';
import { NeoInput, NeoSelect } from '@/Components/UI/NeoInput';
import { Search, RotateCcw } from 'lucide-react';

interface UserFiltersProps {
    search: string;
    setSearch: (val: string) => void;
    status: string;
    setStatus: (val: string) => void;
    sort: string;
    setSort: (val: string) => void;
    onFilter: (e: React.FormEvent) => void;
    onReset: () => void;
}

export default function UserFilters({
    search,
    setSearch,
    status,
    setStatus,
    sort,
    setSort,
    onFilter,
    onReset,
}: UserFiltersProps) {
    return (
        <NeoCard color="bg-white" className="p-4 sm:p-5 mb-6">
            <form onSubmit={onFilter} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-5">
                    <NeoInput
                        label="Pencarian Member"
                        placeholder="Cari berdasarkan nama, email Google, atau ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="sm:col-span-3">
                    <NeoSelect
                        label="Status Akun"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        options={[
                            { value: 'all', label: 'Semua Status' },
                            { value: 'active', label: 'Aktif Saja' },
                            { value: 'inactive', label: 'Nonaktif Saja' },
                        ]}
                    />
                </div>

                <div className="sm:col-span-2">
                    <NeoSelect
                        label="Urutkan"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        options={[
                            { value: 'latest', label: 'Terbaru' },
                            { value: 'oldest', label: 'Terlama' },
                            { value: 'name_asc', label: 'Nama (A-Z)' },
                            { value: 'name_desc', label: 'Nama (Z-A)' },
                            { value: 'most_workspaces', label: 'Ruang Kerja Terbanyak' },
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
