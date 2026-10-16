import { Note, NoteApp, NoteGroup, UserNoteReminder } from '@/types';

export interface PublicNoteProps {
    note: Note;
    app?: NoteApp | null;
    groups?: NoteGroup[];
    user_reminder?: UserNoteReminder | null;
    is_saved?: boolean;
    can_edit?: boolean;
    is_owner?: boolean;
    share_public_token?: string;
}
