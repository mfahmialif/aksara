import { Note, NoteApp, NoteGroup } from '@/types';

export interface PublicAppProps {
    app: NoteApp;
    groups: NoteGroup[];
    selected_note?: Note | null;
}
