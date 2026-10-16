<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SavedSharedLink extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'item_type',
        'item_id',
        'note_app_id',
        'title',
        'share_url',
        'public_token',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function noteApp(): BelongsTo
    {
        return $this->belongsTo(NoteApp::class, 'note_app_id');
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(NoteGroup::class, 'item_id');
    }

    public function note(): BelongsTo
    {
        return $this->belongsTo(Note::class, 'item_id');
    }
}
