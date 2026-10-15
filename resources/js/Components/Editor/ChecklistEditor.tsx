import React, { useState } from 'react';
import { ChecklistItem } from '@/types';
import { Check, CheckSquare, Plus, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChecklistEditorProps {
    items: ChecklistItem[];
    onChange: (items: ChecklistItem[]) => void;
    editable?: boolean;
}

export default function ChecklistEditor({
    items = [],
    onChange,
    editable = true,
}: ChecklistEditorProps) {
    const [newItemText, setNewItemText] = useState('');

    const completedCount = items.filter((i) => i.completed).length;
    const totalCount = items.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const toggleItem = (id: string) => {
        const next = items.map((item) => {
            if (item.id === id) {
                const nextState = !item.completed;
                // If this check makes it 100%, fire celebration confetti!
                if (nextState && completedCount + 1 === totalCount) {
                    try {
                        confetti({
                            particleCount: 80,
                            spread: 60,
                            origin: { y: 0.7 },
                        });
                    } catch {
                        // ignore if confetti fails
                    }
                }
                return { ...item, completed: nextState };
            }
            return item;
        });
        onChange(next);
    };

    const addItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemText.trim() || !editable) return;

        const newItem: ChecklistItem = {
            id: 'chk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            text: newItemText.trim(),
            completed: false,
        };

        onChange([...items, newItem]);
        setNewItemText('');
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
        <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-black">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#FFDC58] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <CheckSquare className="w-4 h-4 text-black" />
                    </div>
                    <span className="font-heading font-black text-sm uppercase tracking-wide">
                        Checklist ({completedCount}/{totalCount})
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="font-heading font-black text-sm bg-[#FFFDF8] px-2 py-0.5 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        {progressPercent}%
                    </span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#F4F0EA] h-3 border-2 border-black mb-4 overflow-hidden relative">
                <div
                    className={`h-full border-r-2 border-black transition-all duration-300 ${
                        progressPercent === 100 ? 'bg-[#7FBC8C]' : 'bg-[#FFDC58]'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {/* List items */}
            <div className="space-y-2 mb-4">
                {items.length === 0 ? (
                    <p className="text-xs text-neutral-500 italic py-2">Belum ada item checklist.</p>
                ) : (
                    items.map((item) => (
                        <div
                            key={item.id}
                            className={`flex items-center gap-2.5 p-2 border-2 border-black transition-all ${
                                item.completed
                                    ? 'bg-neutral-100/80 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                                    : 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                            }`}
                        >
                            <button
                                type="button"
                                onClick={() => toggleItem(item.id)}
                                className={`w-5 h-5 flex items-center justify-center border-2 border-black transition-all cursor-pointer ${
                                    item.completed ? 'bg-[#7FBC8C] text-black' : 'bg-white hover:bg-neutral-100'
                                }`}
                            >
                                {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>

                            {editable ? (
                                <input
                                    type="text"
                                    value={item.text}
                                    onChange={(e) => updateText(item.id, e.target.value)}
                                    className={`flex-1 text-sm bg-transparent outline-none font-medium ${
                                        item.completed ? 'line-through text-neutral-400' : 'text-neutral-900'
                                    }`}
                                />
                            ) : (
                                <span
                                    className={`flex-1 text-sm font-medium ${
                                        item.completed ? 'line-through text-neutral-400' : 'text-neutral-900'
                                    }`}
                                >
                                    {item.text}
                                </span>
                            )}

                            {editable && (
                                <button
                                    type="button"
                                    onClick={() => deleteItem(item.id)}
                                    className="p-1 text-neutral-400 hover:text-rose-600 transition-colors"
                                    title="Hapus Item"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Add new item */}
            {editable && (
                <form onSubmit={addItem} className="flex gap-2">
                    <input
                        type="text"
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        placeholder="Ketik tugas baru lalu tekan Enter..."
                        className="flex-1 px-3 py-1.5 text-sm bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-medium"
                    />
                    <button
                        type="submit"
                        className="px-3 py-1.5 bg-[#FFDC58] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-xs uppercase flex items-center gap-1 hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah
                    </button>
                </form>
            )}
        </div>
    );
}
