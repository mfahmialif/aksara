import { Note, NoteApp, NoteGroup } from '@/types';

export interface NoteEditorProps {
    app: NoteApp;
    groups: NoteGroup[];
    selected_note: Note | null;
    is_owner: boolean;
    can_edit: boolean;
    is_collaborator?: boolean;
    is_public_view?: boolean;
    is_group_shared_view?: boolean;
    selected_group?: NoteGroup | null;
    is_single_note_view?: boolean;
    is_saved?: boolean;
    share_item_type?: 'app' | 'group' | 'note';
    share_item_id?: string;
    share_public_token?: string;
}

export type MobileTab = 'groups' | 'notes';
