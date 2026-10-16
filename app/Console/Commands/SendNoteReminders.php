<?php

namespace App\Console\Commands;

use App\Models\AppNotification;
use App\Models\Note;
use App\Models\ReminderLog;
use App\Models\User;
use App\Models\UserNoteReminder;
use App\Services\ActivityLogger;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendNoteReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notes:send-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Periksa dan kirimkan pengingat email untuk catatan tugas yang mendekati deadline';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Memulai pengecekan catatan tugas yang membutuhkan pengingat...');

        $now = Carbon::now();

        $dueNotes = Note::where('category', 'task')
            ->whereNotNull('deadline_at')
            ->whereNotNull('reminder_days_before')
            ->whereNull('reminder_sent_at')
            ->with(['group.app.owner', 'collaborators'])
            ->get();

        $sentCount = 0;

        foreach ($dueNotes as $note) {
            $deadline = Carbon::parse($note->deadline_at);
            $reminderThreshold = $deadline->copy()->subDays($note->reminder_days_before);

            if ($now->greaterThanOrEqualTo($reminderThreshold)) {
                $owner = $note->group?->app?->owner;
                $recipients = [];

                if ($owner && $owner->email) {
                    $recipients[] = $owner->email;
                }

                foreach ($note->collaborators as $collab) {
                    if ($collab->invited_email && ! in_array($collab->invited_email, $recipients)) {
                        $recipients[] = $collab->invited_email;
                    }
                }

                foreach ($recipients as $email) {
                    try {
                        // Log simulated or real mail
                        Log::info("Mengirim pengingat deadline untuk catatan #{$note->id} '{$note->title}' ke {$email}");

                        ReminderLog::create([
                            'note_id' => $note->id,
                            'recipient_email' => $email,
                            'status' => 'sent',
                            'scheduled_for' => $reminderThreshold,
                            'sent_at' => $now,
                            'error_message' => null,
                        ]);

                        // In-app Notification Pro for the recipient member
                        $recipientUser = User::where('email', $email)->first();
                        if ($recipientUser) {
                            AppNotification::create([
                                'user_id' => $recipientUser->id,
                                'title' => '⏰ Pengingat Deadline: '.$note->title,
                                'message' => 'Catatan tugas "'.$note->title.'" mendekati batas waktu penyelesaian pada '.Carbon::parse($note->deadline_at)->translatedFormat('d M Y H:i').'. Silakan periksa kemajuan tugas Anda.',
                                'type' => 'reminder',
                                'action_url' => route('notes.show', $note->id),
                                'read_at' => null,
                                'is_archived' => false,
                            ]);
                        }

                        ActivityLogger::log('SEND_REMINDER', "Pengingat deadline tugas '{$note->title}' dikirimkan ke {$email}", $note);

                        $this->line("Pengingat terkirim ke: {$email} untuk tugas: {$note->title}");
                        $sentCount++;
                    } catch (\Throwable $e) {
                        ReminderLog::create([
                            'note_id' => $note->id,
                            'recipient_email' => $email,
                            'status' => 'failed',
                            'scheduled_for' => $reminderThreshold,
                            'sent_at' => $now,
                            'error_message' => $e->getMessage(),
                        ]);
                        $this->error("Gagal mengirim ke {$email}: {$e->getMessage()}");
                    }
                }

                $note->update(['reminder_sent_at' => $now]);
            }
        }

        // 2. Process Personal Reminders (User Note Reminders)
        $personalReminders = UserNoteReminder::whereNull('reminder_sent_at')
            ->with(['note.group.app', 'user'])
            ->get();

        foreach ($personalReminders as $reminder) {
            $note = $reminder->note;
            $user = $reminder->user;

            if (! $note || ! $user || ! $user->is_active) {
                continue;
            }

            $reminderThreshold = null;

            if ($reminder->custom_remind_at) {
                $reminderThreshold = Carbon::parse($reminder->custom_remind_at);
            } elseif ($note->deadline_at && $reminder->reminder_days_before !== null) {
                $reminderThreshold = Carbon::parse($note->deadline_at)->subDays($reminder->reminder_days_before);
            }

            if ($reminderThreshold && $now->greaterThanOrEqualTo($reminderThreshold)) {
                try {
                    Log::info("Mengirim pengingat pribadi catatan #{$note->id} '{$note->title}' ke {$user->email}");

                    ReminderLog::create([
                        'note_id' => $note->id,
                        'recipient_email' => $user->email,
                        'status' => 'sent',
                        'scheduled_for' => $reminderThreshold,
                        'sent_at' => $now,
                        'error_message' => null,
                    ]);

                    $actionUrl = $note->is_public
                        ? route('public.shortlink', $note->public_token)
                        : route('notes.show', $note->id);

                    AppNotification::create([
                        'user_id' => $user->id,
                        'title' => '⏰ Pengingat Pribadi: '.$note->title,
                        'message' => 'Pengingat untuk catatan "'.$note->title.'"'.($note->deadline_at ? ' dengan tenggat waktu '.Carbon::parse($note->deadline_at)->translatedFormat('d M Y H:i') : '').'. Silakan periksa catatan Anda.',
                        'type' => 'reminder',
                        'action_url' => $actionUrl,
                        'read_at' => null,
                        'is_archived' => false,
                    ]);

                    ActivityLogger::log('SEND_PERSONAL_REMINDER', "Pengingat pribadi '{$note->title}' dikirimkan ke {$user->email}", $note);

                    $reminder->update(['reminder_sent_at' => $now]);
                    $this->line("Pengingat pribadi terkirim ke: {$user->email} untuk tugas: {$note->title}");
                    $sentCount++;
                } catch (\Throwable $e) {
                    ReminderLog::create([
                        'note_id' => $note->id,
                        'recipient_email' => $user->email,
                        'status' => 'failed',
                        'scheduled_for' => $reminderThreshold,
                        'sent_at' => $now,
                        'error_message' => $e->getMessage(),
                    ]);
                    $this->error("Gagal mengirim pengingat pribadi ke {$user->email}: {$e->getMessage()}");
                }
            }
        }

        $this->info("Pengecekan selesai. {$sentCount} pengingat telah diproses.");

        return Command::SUCCESS;
    }
}
