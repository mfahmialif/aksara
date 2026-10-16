import React, { useState, useRef } from 'react';
import { ChecklistItem } from '@/types';
import { Check, CheckSquare, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChecklistEditorProps {
    items: ChecklistItem[];
    onChange: (items: ChecklistItem[]) => void;
    editable?: boolean;
    className?: string;
}

export default function ChecklistEditor({
    items = [],
    onChange,
    editable = true,
    className = '',
}: ChecklistEditorProps) {
    const [newItemText, setNewItemText] = useState('');
    const [showCompleted, setShowCompleted] = useState(true);
    const itemInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    const uncompletedItems = items.filter((i) => !i.completed);
    const completedItems = items.filter((i) => i.completed);
    const completedCount = completedItems.length;
    const totalCount = items.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const toggleItem = (id: string) => {
        const next = items.map((item) => {
            if (item.id === id) {
                const nextState = !item.completed;
                if (nextState && completedCount + 1 === totalCount) {
                    try {
                        confetti({
                            particleCount: 80,
                            spread: 60,
                            origin: { y: 0.7 },
                        });
                    } catch {
                        // ignore
                    }
                }
                return { ...item, completed: nextState };
            }
            return item;
        });
        onChange(next);
    };

    const addItem = (text: string) => {
        if (!text.trim() || !editable) return;
        const newItem: ChecklistItem = {
            id: 'chk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            text: text.trim(),
            completed: false,
        };
        onChange([...items, newItem]);
        setNewItemText('');
    };

    const handleKeyDownOnNew = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addItem(newItemText);
        }
    };

    const handleKeyDownOnItem = (e: React.KeyboardEvent<HTMLInputElement>, index: number, isCompleted: boolean) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const targetList = isCompleted ? completedItems : uncompletedItems;
            const currentItem = targetList[index];
            const currentIndexInAll = items.findIndex((i) => i.id === currentItem.id);

            const newItem: ChecklistItem = {
                id: 'chk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                text: '',
                completed: false,
            };

            const updated = [...items];
            updated.splice(currentIndexInAll + 1, 0, newItem);
            onChange(updated);

            setTimeout(() => {
                itemInputRefs.current[newItem.id]?.focus();
            }, 30);
        } else if (e.key === 'Backspace' && (e.currentTarget.value === '')) {
            e.preventDefault();
            const targetList = isCompleted ? completedItems : uncompletedItems;
            const currentItem = targetList[index];
            deleteItem(currentItem.id);

            if (index > 0) {
                const prevItem = targetList[index - 1];
                itemInputRefs.current[prevItem.id]?.focus();
            }
        }
    };

    const updateText = (id: string, newText: string) => {
        if (!editable) return;
        onChange(items.map((i) => (i.id === id ? { ...i, text: newText } : i)));
    };

    const deleteItem = (id: string) => {
        if (!editable) return;
        onChange(items.filter((i) => i.id !== id));
    };

    return (
        <div className={`w-full bg-white border-2 border-black p-4 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col ${className}`}>
            {/* Header / Summary Bar */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-3">
                <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-black" />
                    <span className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider text-black">
                        Daftar Checklist ({completedCount}/{totalCount})
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-24 sm:w-32 bg-[#F4F0EA] h-2.5 border border-black overflow-hidden relative">
                        <div
                            className={`h-full transition-all duration-300 ${
                                progressPercent === 100 ? 'bg-[#7FBC8C]' : 'bg-[#FFDC58]'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <span className="text-xs font-heading font-black text-black">
                        {progressPercent}%
                    </span>
                </div>
            </div>

            {/* Main Checklist Area (Seamless Google Keep Rows - No Box Clutter) */}
            <div className="space-y-1 flex-1 overflow-y-auto">
                {/* Uncompleted Items */}
                {uncompletedItems.map((item, idx) => (
                    <div
                        key={item.id}
                        className="group flex items-center gap-3 py-1.5 px-2 hover:bg-neutral-50 transition-colors"
                    >
                        <button
                            type="button"
                            onClick={() => toggleItem(item.id)}
                            className="w-4 h-4 rounded-none border-2 border-black bg-white flex items-center justify-center shrink-0 cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFDC58] transition-colors"
                            title="Tandai selesai"
                        >
                            {item.completed && <Check className="w-3.5 h-3.5 stroke-[3] text-black" />}
                        </button>

                        <input
                            ref={(el) => (itemInputRefs.current[item.id] = el)}
                            type="text"
                            value={item.text}
                            onChange={(e) => updateText(item.id, e.target.value)}
                            onKeyDown={(e) => handleKeyDownOnItem(e, idx, false)}
                            disabled={!editable}
                            placeholder="Tulis checklist..."
                            className="flex-1 text-sm font-medium bg-transparent border-none outline-none text-black placeholder-neutral-400"
                        />

                        {editable && (
                            <button
                                type="button"
                                onClick={() => deleteItem(item.id)}
                                className="opacity-60 sm:opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-600 transition-opacity cursor-pointer shrink-0"
                                title="Hapus baris"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                ))}

                {/* Add New Item Input Row */}
                {editable && (
                    <div className="flex items-center gap-3 py-1.5 px-2 text-neutral-500 hover:text-black">
                        <Plus className="w-4 h-4 shrink-0 text-black" />
                        <input
                            type="text"
                            value={newItemText}
                            onChange={(e) => setNewItemText(e.target.value)}
                            onKeyDown={handleKeyDownOnNew}
                            placeholder="Item baru (Ketik lalu tekan Enter)..."
                            className="flex-1 text-sm font-medium bg-transparent border-none outline-none text-black placeholder-neutral-400"
                        />
                    </div>
                )}

                {/* Completed Items Section */}
                {completedItems.length > 0 && (
                    <div className="pt-3 mt-2 border-t border-neutral-300">
                        <button
                            type="button"
                            onClick={() => setShowCompleted(!showCompleted)}
                            className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 uppercase tracking-wide hover:text-black mb-1 cursor-pointer"
                        >
                            {showCompleted ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                            )}
                            <span>{completedCount} Item Selesai</span>
                        </button>

                        {showCompleted &&
                            completedItems.map((item, idx) => (
                                <div
                                    key={item.id}
                                    className="group flex items-center gap-3 py-1.5 px-2 hover:bg-neutral-50 transition-colors opacity-75"
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleItem(item.id)}
                                        className="w-4 h-4 rounded-none border-2 border-black bg-[#7FBC8C] text-black flex items-center justify-center shrink-0 cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                                        title="Tandai belum selesai"
                                    >
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    </button>

                                    <input
                                        ref={(el) => (itemInputRefs.current[item.id] = el)}
                                        type="text"
                                        value={item.text}
                                        onChange={(e) => updateText(item.id, e.target.value)}
                                        onKeyDown={(e) => handleKeyDownOnItem(e, idx, true)}
                                        disabled={!editable}
                                        className="flex-1 text-sm font-medium bg-transparent border-none outline-none line-through text-neutral-400"
                                    />

                                    {editable && (
                                        <button
                                            type="button"
                                            onClick={() => deleteItem(item.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-600 transition-opacity cursor-pointer shrink-0"
                                            title="Hapus baris"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}
