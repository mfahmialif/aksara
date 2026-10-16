import { Note, NoteApp, NoteGroup, UserNoteReminder } from '@/types';

export interface PublicAppProps {
    app: NoteApp;
    groups: NoteGroup[];
    selected_note?: Note | null;
    user_reminder?: UserNoteReminder | null;
}

