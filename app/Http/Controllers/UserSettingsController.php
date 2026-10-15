<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserSettingsController extends Controller
{
    public function edit()
    {
        $user = Auth::user();

        return Inertia::render('Settings/Preferences', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'default_reminder_days' => $user->default_reminder_days,
            ],
        ]);
    }

    public function update(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'default_reminder_days' => 'required|integer|min:0|max:30',
        ]);

        $user->update([
            'name' => $validated['name'],
            'default_reminder_days' => $validated['default_reminder_days'],
        ]);

        return back()->with('success', 'Preferensi default pengingat berhasil disimpan.');
    }
}
