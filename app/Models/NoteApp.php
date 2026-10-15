<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Str;

class NoteApp extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_id',
        'name',
        'icon',
        'color_theme',
        'description',
        'is_public',
        'public_token',
    ];

    protected $casts = [
        'is_public' => 'boolean',
    ];

    protected static function booted()
    {
        static::creating(function ($app) {
            if (empty($app->public_token)) {
                $app->public_token = Str::random(32);
            }
        });
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function groups(): HasMany
    {
        return $this->hasMany(NoteGroup::class)->orderBy('sort_order', 'asc')->orderBy('id', 'asc');
    }

    public function collaborators(): MorphMany
    {
        return $this->morphMany(Collaborator::class, 'collaboratable');
    }

    public function canUserEdit(?User $user): bool
    {
        if (! $user) {
            return false;
        }
        if ($this->owner_id === $user->id) {
            return true;
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
        if (! $user) {
            return false;
        }

        return $this->canUserEdit($user);
    }
}
