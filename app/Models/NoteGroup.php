<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    public function canUserEdit(?User $user): bool
    {
        // 1. Direct group public edit permission
        if ($this->is_public && $this->public_permission === 'edit') {
            return true;
        }

        // 2. Parent app permissions
        $app = $this->app;
        if ($app && $app->canUserEdit($user)) {
            return true;
        }

        return false;
    }

    public function canUserView(?User $user): bool
    {
        if ($this->is_public) {
            return true;
        }

        if ($this->app?->is_public) {
            return true;
        }

        return $this->canUserEdit($user);
    }
}
