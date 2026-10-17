<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;

class SystemSetting extends Model
{
    use HasUuids;

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
                'mail_mailer' => $settings['mail_mailer'] ?? config('mail.default', 'log'),
                'mail_host' => $settings['mail_host'] ?? config('mail.mailers.smtp.host', 'smtp.gmail.com'),
                'mail_port' => isset($settings['mail_port']) ? (int) $settings['mail_port'] : (int) config('mail.mailers.smtp.port', 587),
                'mail_encryption' => $settings['mail_encryption'] ?? (config('mail.mailers.smtp.encryption') ?? 'tls'),
                'mail_username' => $settings['mail_username'] ?? (config('mail.mailers.smtp.username') ?? ''),
                'mail_password' => $settings['mail_password'] ?? (config('mail.mailers.smtp.password') ?? ''),
                'mail_from_address' => $settings['mail_from_address'] ?? config('mail.from.address', 'no-reply@aksara.local'),
                'mail_from_name' => $settings['mail_from_name'] ?? config('mail.from.name', 'Aksara Notes'),
            ];
        });
    }

    public static function applyMailConfig(): void
    {
        try {
            if (! Schema::hasTable('system_settings')) {
                return;
            }

            $settings = static::getAll();
            $driver = $settings['mail_mailer'] ?? 'log';

            config([
                'mail.default' => $driver,
                'mail.mailers.smtp.host' => $settings['mail_host'] ?: '127.0.0.1',
                'mail.mailers.smtp.port' => (int) ($settings['mail_port'] ?: 587),
                'mail.mailers.smtp.encryption' => ($settings['mail_encryption'] === 'none' || empty($settings['mail_encryption'])) ? null : $settings['mail_encryption'],
                'mail.mailers.smtp.username' => $settings['mail_username'] ?: null,
                'mail.mailers.smtp.password' => $settings['mail_password'] ?: null,
                'mail.from.address' => $settings['mail_from_address'] ?: 'no-reply@aksara.local',
                'mail.from.name' => $settings['mail_from_name'] ?: 'Aksara Notes',
            ]);

            if (! app()->runningUnitTests()) {
                app()->forgetInstance('mail.manager');
                Mail::clearResolvedInstances();
            }
        } catch (\Throwable $e) {
            // Silently fallback if called before database migrations
        }
    }
}
