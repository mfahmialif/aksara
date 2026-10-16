import { Note, NoteApp, NoteGroup } from '@/types';

export interface NoteEditorProps {
    app: NoteApp;
    groups: NoteGroup[];
    selected_note: Note | null;
    is_owner: boolean;
    can_edit: boolean;
}

export type ViewMode = 'explorer' | 'editor';
export type MobileTab = 'groups' | 'notes' | 'editor';
