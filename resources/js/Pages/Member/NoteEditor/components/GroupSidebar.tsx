import React from 'react';
import { NoteGroup } from '@/types';
import { Check, Edit3, Trash2 } from 'lucide-react';
import { MobileTab } from '../types';

interface GroupSidebarProps {
    groups: NoteGroup[];
    activeGroupId: number | 'all';
    setActiveGroupId: (id: number | 'all') => void;
    editingGroupId: number | null;
    setEditingGroupId: (id: number | null) => void;
    editingGroupName: string;
    setEditingGroupName: (name: string) => void;
    newGroupName: string;
    setNewGroupName: (name: string) => void;
    canEdit: boolean;
    mobileTab: MobileTab;
    setMobileTab: (tab: MobileTab) => void;
    onSaveRename: (groupId: number) => void;
    onDeleteGroup: (groupId: number) => void;
    onAddGroup: (e: React.FormEvent) => void;
}

export default function GroupSidebar({
    groups,
    activeGroupId,
    setActiveGroupId,
    editingGroupId,
    setEditingGroupId,
    editingGroupName,
    setEditingGroupName,
    newGroupName,
    setNewGroupName,
    canEdit,
    mobileTab,
    setMobileTab,
    onSaveRename,
    onDeleteGroup,
    onAddGroup,
}: GroupSidebarProps) {
    return (
        <div className={`lg:col-span-3 space-y-4 ${mobileTab !== 'groups' ? 'hidden lg:block' : 'block'}`}>
            <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-black">
                    <h3 className="font-heading font-black text-xs uppercase tracking-wider text-black">
                        Folder / Grup ({groups.length})
                    </h3>
                    <button
                        type="button"
                        onClick={() => setActiveGroupId('all')}
                        className={`text-[11px] font-bold px-2 py-0.5 border border-black ${
                            activeGroupId === 'all' ? 'bg-[#FFDC58]' : 'bg-white hover:bg-neutral-100'
                        }`}
                    >
                        Semua
                    </button>
                </div>

                {/* Groups List */}
                <div className="space-y-1.5 mb-4">
                    {groups.map((group) => {
                        const isActive = activeGroupId === group.id;
                        const isEditing = editingGroupId === group.id;

                        return (
                            <div
                                key={group.id}
                                className={`p-2 border-2 border-black transition-all ${
                                    isActive
                                        ? 'bg-[#FFDC58] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold'
                                        : 'bg-white hover:bg-neutral-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                                }`}
                            >
                                {isEditing ? (
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="text"
                                            value={editingGroupName}
                                            onChange={(e) => setEditingGroupName(e.target.value)}
                                            className="w-full px-2 py-1 text-xs border border-black font-medium"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => onSaveRename(group.id)}
                                            className="p-1 bg-[#7FBC8C] border border-black text-xs cursor-pointer"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setActiveGroupId(group.id);
                                                setMobileTab('notes');
                                            }}
                                            className="flex-1 text-left text-xs font-bold truncate flex items-center justify-between pr-2 cursor-pointer"
                                        >
                                            <span>{group.name}</span>
                                            <span className="text-[10px] px-1.5 py-0.2 bg-black text-white font-mono rounded-none">
                                                {group.notes?.length || 0}
                                            </span>
                                        </button>

                                        {canEdit && (
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingGroupId(group.id);
                                                        setEditingGroupName(group.name);
                                                    }}
                                                    className="p-1 text-neutral-500 hover:text-black cursor-pointer"
                                                    title="Ubah Nama"
                                                >
                                                    <Edit3 className="w-3 h-3" />
                                                </button>
                                                {groups.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onDeleteGroup(group.id)}
                                                        className="p-1 text-neutral-400 hover:text-rose-600 cursor-pointer"
                                                        title="Hapus Grup"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Add Group Form */}
                {canEdit && (
                    <form onSubmit={onAddGroup} className="flex gap-1.5 pt-2 border-t-2 border-black">
                        <input
                            type="text"
                            placeholder="+ Nama grup baru..."
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 text-xs border-2 border-black bg-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                        />
                        <button
                            type="submit"
                            className="px-2.5 py-1.5 bg-[#A388EE] border-2 border-black font-bold text-xs uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 cursor-pointer"
                        >
                            Tambah
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
