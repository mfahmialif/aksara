<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Collaborator extends Model
{
    use HasFactory;

    protected $fillable = [
        'collaboratable_type',
        'collaboratable_id',
        'user_id',
        'invited_email',
        'permission',
    ];

    public function collaboratable(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
