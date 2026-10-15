import React, { useRef, useEffect } from 'react';
import {
    Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3,
    Quote, Code, List, ListOrdered, Link as LinkIcon, Highlighter, RemoveFormatting
} from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    editable?: boolean;
}

export default function RichTextEditor({
    value,
    onChange,
    editable = true,
}: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const isInternalUpdate = useRef(false);

    useEffect(() => {
        if (editorRef.current && !isInternalUpdate.current) {
            if (editorRef.current.innerHTML !== value) {
                editorRef.current.innerHTML = value || '<p></p>';
            }
        }
        isInternalUpdate.current = false;
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            isInternalUpdate.current = true;
            onChange(editorRef.current.innerHTML);
        }
    };

    const execCmd = (command: string, arg: string | undefined = undefined) => {
        if (!editable) return;
        document.execCommand(command, false, arg);
        handleInput();
    };

    const setHeading = (level: string) => {
        execCmd('formatBlock', `<${level}>`);
    };

    const addLink = () => {
        const url = prompt('Masukkan tautan URL:');
        if (url) {
            execCmd('createLink', url);
        }
    };

    const applyHighlight = (color: string) => {
        execCmd('hiliteColor', color);
    };

    return (
        <div className="w-full border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {/* Toolbar */}
            {editable && (
                <div className="flex flex-wrap items-center gap-1 p-2 bg-[#F4F0EA] border-b-2 border-black select-none">
                    <button
                        type="button"
                        onClick={() => execCmd('bold')}
                        className="p-1.5 border border-black bg-white hover:bg-[#FFDC58] transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
                        title="Tebal (Bold)"
                    >
                        <Bold className="w-4 h-4 text-black" />
                    </button>
                    <button
                        type="button"
                        onClick={() => execCmd('italic')}
                        className="p-1.5 border border-black bg-white hover:bg-[#FFDC58] transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
                        title="Miring (Italic)"
                    >
                        <Italic className="w-4 h-4 text-black" />
                    </button>
                    <button
                        type="button"
                        onClick={() => execCmd('underline')}
                        className="p-1.5 border border-black bg-white hover:bg-[#FFDC58] transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
                        title="Garis Bawah (Underline)"
                    >
                        <Underline className="w-4 h-4 text-black" />
                    </button>
                    <button
                        type="button"
                        onClick={() => execCmd('strikeThrough')}
                        className="p-1.5 border border-black bg-white hover:bg-[#FFDC58] transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
                        title="Coret (Strikethrough)"
                    >
                        <Strikethrough className="w-4 h-4 text-black" />
                    </button>

                    <div className="w-[1px] h-6 bg-black mx-1" />

                    <button
                        type="button"
                        onClick={() => setHeading('h1')}
                        className="p-1.5 border border-black bg-white hover:bg-[#A388EE] transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-bold text-xs"
                        title="Heading 1"
                    >
                        H1
                    </button>
                    <button
                        type="button"
                        onClick={() => setHeading('h2')}
                        className="p-1.5 border border-black bg-white hover:bg-[#A388EE] transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-bold text-xs"
                        title="Heading 2"
                    >
                        H2
                    </button>
                    <button
                        type="button"
                        onClick={() => setHeading('h3')}
                        className="p-1.5 border border-black bg-white hover:bg-[#A388EE] transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-bold text-xs"
                        title="Heading 3"
                    >
                        H3
                    </button>
                    <button
                        type="button"
                        onClick={() => setHeading('p')}
                        className="p-1.5 border border-black bg-white hover:bg-[#A388EE] transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-bold text-xs"
                        title="Paragraf Biasa"
                    >
                        P
                    </button>

                    <div className="w-[1px] h-6 bg-black mx-1" />

                    <button
                        type="button"
                        onClick={() => execCmd('insertUnorderedList')}
                        className="p-1.5 border border-black bg-white hover:bg-[#7FBC8C] transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                        title="Bullet List"
                    >
                        <List className="w-4 h-4 text-black" />
                    </button>
                    <button
                        type="button"
                        onClick={() => execCmd('insertOrderedList')}
                        className="p-1.5 border border-black bg-white hover:bg-[#7FBC8C] transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                        title="Numbered List"
                    >
                        <ListOrdered className="w-4 h-4 text-black" />
                    </button>
                    <button
                        type="button"
                        onClick={() => execCmd('formatBlock', '<blockquote>')}
                        className="p-1.5 border border-black bg-white hover:bg-[#7FBC8C] transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                        title="Kutipan (Blockquote)"
                    >
                        <Quote className="w-4 h-4 text-black" />
                    </button>
                    <button
                        type="button"
                        onClick={() => execCmd('formatBlock', '<pre>')}
                        className="p-1.5 border border-black bg-white hover:bg-[#7FBC8C] transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                        title="Code Block"
                    >
                        <Code className="w-4 h-4 text-black" />
                    </button>

                    <div className="w-[1px] h-6 bg-black mx-1" />

                    {/* Contrast Highlights */}
                    <div className="flex items-center gap-1">
                        <Highlighter className="w-3.5 h-3.5 text-neutral-600 mr-0.5" />
                        <button
                            type="button"
                            onClick={() => applyHighlight('#FFDC58')}
                            className="w-5 h-5 bg-[#FFDC58] border border-black hover:scale-110 transition-transform"
                            title="Highlight Kuning Elektrik"
                        />
                        <button
                            type="button"
                            onClick={() => applyHighlight('#FF8FAB')}
                            className="w-5 h-5 bg-[#FF8FAB] border border-black hover:scale-110 transition-transform"
                            title="Highlight Pink Pastel"
                        />
                        <button
                            type="button"
                            onClick={() => applyHighlight('#69D2E7')}
                            className="w-5 h-5 bg-[#69D2E7] border border-black hover:scale-110 transition-transform"
                            title="Highlight Sky Blue"
                        />
                        <button
                            type="button"
                            onClick={() => applyHighlight('#7FBC8C')}
                            className="w-5 h-5 bg-[#7FBC8C] border border-black hover:scale-110 transition-transform"
                            title="Highlight Mint"
                        />
                    </div>

                    <div className="w-[1px] h-6 bg-black mx-1" />

                    <button
                        type="button"
                        onClick={addLink}
                        className="p-1.5 border border-black bg-white hover:bg-[#69D2E7] transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                        title="Tambah Link"
                    >
                        <LinkIcon className="w-4 h-4 text-black" />
                    </button>
                    <button
                        type="button"
                        onClick={() => execCmd('removeFormat')}
                        className="p-1.5 border border-black bg-white hover:bg-neutral-200 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                        title="Hapus Format"
                    >
                        <RemoveFormatting className="w-4 h-4 text-black" />
                    </button>
                </div>
            )}

            {/* Editable Content Area */}
            <div
                ref={editorRef}
                contentEditable={editable}
                onInput={handleInput}
                className={`
                    p-4 min-h-[180px] focus:outline-none prose prose-slate max-w-none
                    font-sans text-base leading-relaxed
                    [&>h1]:text-2xl [&>h1]:font-black [&>h1]:mb-3 [&>h1]:font-heading
                    [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-2 [&>h2]:font-heading
                    [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mb-1 [&>h3]:font-heading
                    [&>p]:mb-3
                    [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-3
                    [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-3
                    [&>blockquote]:border-l-4 [&>blockquote]:border-black [&>blockquote]:bg-[#FFFDF8] [&>blockquote]:p-3 [&>blockquote]:italic [&>blockquote]:mb-3
                    [&>pre]:bg-neutral-900 [&>pre]:text-neutral-100 [&>pre]:p-3 [&>pre]:border-2 [&>pre]:border-black [&>pre]:overflow-x-auto [&>pre]:mb-3
                    [&>a]:text-blue-700 [&>a]:underline [&>a]:font-bold
                    ${!editable ? 'bg-[#FFFDF8]' : ''}
                `}
            />
        </div>
    );
}
