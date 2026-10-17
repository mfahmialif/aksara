<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Str;

class Note extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'note_group_id',
        'title',
        'category',
        'content_json',
        'drawing_data',
        'deadline_at',
        'reminder_days_before',
        'reminder_sent_at',
        'is_pinned',
        'sort_order',
        'is_public',
        'public_token',
        'public_permission',
    ];

    protected $casts = [
        'deadline_at' => 'datetime',
        'reminder_sent_at' => 'datetime',
        'reminder_days_before' => 'integer',
        'is_pinned' => 'boolean',
        'sort_order' => 'integer',
        'is_public' => 'boolean',
    ];

    protected static function booted()
    {
        static::creating(function ($note) {
            if (empty($note->public_token)) {
                $note->public_token = Str::random(32);
            }
            if (empty($note->public_permission)) {
                $note->public_permission = 'read';
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

    public function userReminders(): HasMany
    {
        return $this->hasMany(UserNoteReminder::class);
    }

    public function savedSharedLinks(): HasMany
    {
        return $this->hasMany(SavedSharedLink::class, 'item_id')->where('item_type', 'note');
    }

    public function canUserEdit(?User $user): bool
    {
        // 1. Direct note public edit access
        if ($this->is_public && $this->public_permission === 'edit') {
            return true;
        }

        // 2. Parent group public edit access
        $group = $this->group;
        if ($group && $group->is_public && $group->public_permission === 'edit') {
            return true;
        }

        // 3. Parent workspace public edit access
        $app = $group?->app;
        if ($app && $app->is_public && $app->public_permission === 'edit') {
            return true;
        }

        if (! $user) {
            return false;
        }

        if ($app && $app->owner_id === $user->id) {
            return true;
        }

        if ($app && $app->canUserEdit($user)) {
            return true;
        }

        // Check direct note level collaboration
        return $this->isCollaborator($user);
    }

    public function isCollaborator(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        if ($this->relationLoaded('collaborators')) {
            return $this->collaborators->contains(function ($collab) use ($user) {
                return ($collab->user_id && $collab->user_id === $user->id)
                    || (! empty($collab->invited_email) && strtolower($collab->invited_email) === strtolower($user->email));
            });
        }

        return $this->collaborators()
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhere('invited_email', $user->email);
            })
            ->exists();
    }

    public function canUserView(?User $user): bool
    {
        if ($this->is_public) {
            return true;
        }
        if ($this->group?->is_public) {
            return true;
        }
        if ($this->group?->app?->is_public) {
            return true;
        }

        if (! $user) {
            return false;
        }

        if ($this->group?->app && $this->group->app->canUserView($user)) {
            return true;
        }

        return $this->canUserEdit($user);
    }
}
