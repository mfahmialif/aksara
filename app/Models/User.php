<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, HasUuids, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'google_id',
        'avatar',
        'password',
        'default_reminder_days',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'default_reminder_days' => 'integer',
        ];
    }

    public function noteApps(): HasMany
    {
        return $this->hasMany(NoteApp::class, 'owner_id');
    }

    public function collaborations(): HasMany
    {
        return $this->hasMany(Collaborator::class);
    }

    public function noteReminders(): HasMany
    {
        return $this->hasMany(UserNoteReminder::class);
    }

    public function savedSharedLinks(): HasMany
    {
        return $this->hasMany(SavedSharedLink::class);
    }

    public function savedApps(): BelongsToMany
    {
        return $this->belongsToMany(NoteApp::class, 'saved_shared_links', 'user_id', 'note_app_id')
            ->wherePivot('item_type', 'app');
    }
}
