<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class NoteGroup extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'note_app_id',
        'name',
        'color',
        'sort_order',
        'is_public',
        'public_permission',
        'public_token',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
        ];
    }

    public function app(): BelongsTo
    {
        return $this->belongsTo(NoteApp::class, 'note_app_id');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(Note::class)->orderBy('sort_order', 'asc')->orderBy('created_at', 'desc');
    }

    public function savedSharedLinks(): HasMany
    {
        return $this->hasMany(SavedSharedLink::class, 'item_id')->where('item_type', 'group');
    }

    public function collaborators(): MorphMany
    {
        return $this->morphMany(Collaborator::class, 'collaboratable');
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

    public function canUserEdit(?User $user): bool
    {
        // 1. Direct group public edit permission
        if ($this->is_public && $this->public_permission === 'edit') {
            return true;
        }

        if (! $user) {
            return false;
        }

        // 2. Parent app permissions (owner or app collaborator)
        $app = $this->app;
        if ($app && $app->canUserEdit($user)) {
            return true;
        }

        // 3. Direct group level collaboration
        return $this->isCollaborator($user);
    }

    public function canUserView(?User $user): bool
    {
        if ($this->is_public) {
            return true;
        }

        if ($this->app?->is_public) {
            return true;
        }

        if (! $user) {
            return false;
        }

        if ($this->app && $this->app->canUserView($user)) {
            return true;
        }

        return $this->canUserEdit($user);
    }

    public function getActiveCollaboratorsWithOrigin()
    {
        $list = collect();

        // 1. Direct group collaborators
        $directCollabs = $this->relationLoaded('collaborators') ? $this->collaborators : $this->collaborators()->with('user')->get();
        foreach ($directCollabs as $collab) {
            $collab->scope = 'group';
            $collab->origin_label = 'Akses Folder Ini';
            $collab->can_delete = true;
            $list->push($collab);
        }

        // 2. Inherited from App
        $app = $this->relationLoaded('app') ? $this->app : $this->app()->with('collaborators.user')->first();
        if ($app) {
            $appCollabs = $app->relationLoaded('collaborators') ? $app->collaborators : $app->collaborators()->with('user')->get();
            foreach ($appCollabs as $collab) {
                if (! $list->contains('invited_email', $collab->invited_email)) {
                    $c = clone $collab;
                    $c->scope = 'app';
                    $c->origin_label = 'Akses Melalui Ruang Kerja';
                    $c->can_delete = false;
                    $list->push($c);
                }
            }
        }

        return $list->values();
    }
}
