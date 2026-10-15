<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NoteGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'note_app_id',
        'name',
        'sort_order',
    ];

    public function app(): BelongsTo
    {
        return $this->belongsTo(NoteApp::class, 'note_app_id');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(Note::class)->orderBy('id', 'desc');
    }
}
