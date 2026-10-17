<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Str;

class NoteApp extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'owner_id',
        'name',
        'icon',
        'color_theme',
        'description',
        'is_public',
        'public_token',
        'public_permission',
        'topic_label',
    ];

    protected $casts = [
        'is_public' => 'boolean',
    ];

    public function getTopicLabelAttribute($value): string
    {
        return ! empty($value) ? $value : 'Topik';
    }

    protected static function booted()
    {
        static::creating(function ($app) {
            if (empty($app->public_token)) {
                $app->public_token = Str::random(32);
            }
            if (empty($app->public_permission)) {
                $app->public_permission = 'read';
            }
        });
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function groups(): HasMany
    {
        return $this->hasMany(NoteGroup::class)->orderBy('sort_order', 'asc')->orderBy('created_at', 'asc');
    }

    public function collaborators(): MorphMany
    {
        return $this->morphMany(Collaborator::class, 'collaboratable');
    }

    public function savedSharedLinks(): HasMany
    {
        return $this->hasMany(SavedSharedLink::class, 'note_app_id');
    }

    public function savedByUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'saved_shared_links', 'note_app_id', 'user_id')
            ->wherePivot('item_type', 'app');
    }

    public function isOwner(?User $user): bool
    {
        return $user && $this->owner_id === $user->id;
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

    public function isOwnerOrCollaborator(?User $user): bool
    {
        return $this->isOwner($user) || $this->isCollaborator($user);
    }

    public function canUserEdit(?User $user): bool
    {
        if ($this->is_public && $this->public_permission === 'edit') {
            return true;
        }

        return $this->isOwnerOrCollaborator($user);
    }

    public function canUserView(?User $user): bool
    {
        if ($this->is_public) {
            return true;
        }
        if (! $user) {
            return false;
        }

        return $this->canUserEdit($user);
    }
}
