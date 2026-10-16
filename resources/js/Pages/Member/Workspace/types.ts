import { Note, NoteApp } from '@/types';

export interface WorkspacePageProps {
    my_apps: NoteApp[];
    shared_apps: NoteApp[];
    standalone_notes: Note[];
}
