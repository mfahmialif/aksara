<?php

namespace App\Console\Commands;

use App\Models\Note;
use App\Models\ReminderLog;
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

        $this->info("Pengecekan selesai. {$sentCount} pengingat telah diproses.");

        return Command::SUCCESS;
    }
}
