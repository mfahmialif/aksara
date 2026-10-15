<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Str;

class Note extends Model
{
    use HasFactory;

    protected $fillable = [
        'note_group_id',
        'title',
        'category',
        'content_json',
        'drawing_data',
        'deadline_at',
        'reminder_days_before',
        'reminder_sent_at',
        'is_public',
        'public_token',
    ];

    protected $casts = [
        'deadline_at' => 'datetime',
        'reminder_sent_at' => 'datetime',
        'reminder_days_before' => 'integer',
        'is_public' => 'boolean',
    ];

    protected static function booted()
    {
        static::creating(function ($note) {
            if (empty($note->public_token)) {
                $note->public_token = Str::random(32);
            }
        });
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(NoteGroup::class, 'note_group_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(NoteAttachment::class);
    }

    public function collaborators(): MorphMany
    {
        return $this->morphMany(Collaborator::class, 'collaboratable');
    }

    public function reminderLogs(): HasMany
    {
        return $this->hasMany(ReminderLog::class);
    }

    public function canUserEdit(?User $user): bool
    {
        if (!$user) return false;

        $app = $this->group?->app;
        if ($app && $app->owner_id === $user->id) {
            return true;
        }

        // Check app level collaboration
        if ($app && $app->canUserEdit($user)) {
            return true;
        }

        // Check direct note level collaboration
        return $this->collaborators()
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhere('invited_email', $user->email);
            })
            ->exists();
    }

    public function canUserView(?User $user): bool
    {
        if ($this->is_public) return true;
        if ($this->group?->app?->is_public) return true;
        return $this->canUserEdit($user);
    }
}
