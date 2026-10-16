<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ActivityLogger
{
    /**
     * Record an activity log entry.
     */
    public static function log(
        string $action,
        string $description,
        ?Model $entity = null,
        array $properties = []
    ): ?ActivityLog {
        try {
            $causer = null;
            $causerName = 'System';
            $causerRole = 'system';

            if (Auth::guard('admin')->check()) {
                $causer = Auth::guard('admin')->user();
                $causerName = $causer->name ?? $causer->username ?? 'Administrator';
                $causerRole = 'admin';
            } elseif (Auth::guard('web')->check()) {
                $causer = Auth::guard('web')->user();
                $causerName = $causer->name ?? 'Member';
                $causerRole = 'member';
            }

            $request = request();
            $ipAddress = $request ? $request->ip() : null;
            $userAgent = $request ? substr($request->userAgent() ?? '', 0, 255) : null;

            return ActivityLog::create([
                'causer_type' => $causer ? get_class($causer) : null,
                'causer_id' => $causer?->id,
                'causer_name' => $causerName,
                'causer_role' => $causerRole,
                'action' => strtoupper($action),
                'entity_type' => $entity ? class_basename($entity) : null,
                'entity_id' => $entity?->id,
                'description' => $description,
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
                'properties' => ! empty($properties) ? $properties : null,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Gagal mencatat log aktivitas: '.$e->getMessage());

            return null;
        }
    }
}
