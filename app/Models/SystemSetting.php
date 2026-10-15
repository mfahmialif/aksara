<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SystemSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'description',
    ];

    public static function get(string $key, $default = null)
    {
        return Cache::remember("sys_setting_{$key}", 3600, function () use ($key, $default) {
            $setting = static::where('key', $key)->first();

            return $setting ? $setting->value : $default;
        });
    }

    public static function set(string $key, $value, ?string $description = null): self
    {
        Cache::forget("sys_setting_{$key}");
        Cache::forget('all_sys_settings');

        return static::updateOrCreate(
            ['key' => $key],
            ['value' => (string) $value, 'description' => $description]
        );
    }

    public static function getAll(): array
    {
        return Cache::remember('all_sys_settings', 3600, function () {
            $settings = static::pluck('value', 'key')->toArray();

            return [
                'max_file_size_mb' => isset($settings['max_file_size_mb']) ? (int) $settings['max_file_size_mb'] : 10,
                'max_files_per_upload' => isset($settings['max_files_per_upload']) ? (int) $settings['max_files_per_upload'] : 5,
                'allowed_extensions' => $settings['allowed_extensions'] ?? 'jpg,jpeg,png,gif,webp,svg,pdf,doc,docx,xls,xlsx,ppt,pptx,zip,txt,mp4',
                'blocked_extensions' => $settings['blocked_extensions'] ?? 'exe,sh,bat,cmd,bin,dll,com,vbs',
            ];
        });
    }
}
