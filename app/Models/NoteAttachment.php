<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NoteAttachment extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'note_id',
        'file_name',
        'file_path',
        'mime_type',
        'file_size',
    ];

    protected $appends = [
        'url',
        'preview_url',
        'download_url',
        'formatted_size',
        'is_image',
        'is_pdf',
    ];

    public function note(): BelongsTo
    {
        return $this->belongsTo(Note::class);
    }

    public function getUrlAttribute(): string
    {
        return route('attachments.preview', ['attachment' => $this->id], false);
    }

    public function getPreviewUrlAttribute(): string
    {
        return route('attachments.preview', ['attachment' => $this->id], false);
    }

    public function getDownloadUrlAttribute(): string
    {
        return route('attachments.download', ['attachment' => $this->id], false);
    }

    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->file_size;
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2).' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 1).' KB';
        }

        return $bytes.' B';
    }

    public function getIsImageAttribute(): bool
    {
        $ext = strtolower(pathinfo($this->file_name, PATHINFO_EXTENSION));

        return str_starts_with($this->mime_type ?? '', 'image/')
            || in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico']);
    }

    public function getIsPdfAttribute(): bool
    {
        $ext = strtolower(pathinfo($this->file_name, PATHINFO_EXTENSION));

        return $this->mime_type === 'application/pdf' || $ext === 'pdf';
    }
}
