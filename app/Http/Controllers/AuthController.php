<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    /**
     * Redirect to Google OAuth provider or simulated Google consent screen if keys not set.
     */
    public function redirectToGoogle()
    {
        // Check if Google credentials are configured in .env
        $clientId = config('services.google.client_id');
        $clientSecret = config('services.google.client_secret');

        if (empty($clientId) || empty($clientSecret) || str_contains($clientId, 'your-google-client-id')) {
            return redirect()->route('auth.google.consent');
        }

        return Socialite::driver('google')->redirect();
    }

    /**
     * Show Google Account Picker / Consent screen for local dev or when keys not configured.
     */
    public function googleConsent()
    {
        if (Auth::guard('web')->check()) {
            return redirect()->route('apps.index');
        }

        $accounts = User::where('is_active', true)
            ->select('id', 'name', 'email', 'avatar')
            ->orderBy('id', 'asc')
            ->get();

        return Inertia::render('Auth/GoogleConsent', [
            'accounts' => $accounts,
        ]);
    }

    /**
     * Process Google Consent selection / new Google email sign in.
     */
    public function processGoogleConsent(Request $request)
    {
        if ($request->filled('user_id')) {
            $user = User::where('id', $request->user_id)->where('is_active', true)->firstOrFail();
        } else {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255',
            ]);

            $user = User::firstOrCreate(
                ['email' => $validated['email']],
                [
                    'name' => $validated['name'],
                    'avatar' => 'https://api.dicebear.com/7.x/bottts/svg?seed='.urlencode($validated['name']),
                    'google_id' => 'sim_'.md5($validated['email']),
                    'default_reminder_days' => 1,
                    'is_active' => true,
                ]
            );
        }

        if (! $user->is_active) {
            return redirect()->route('auth.google.consent')->with('error', 'Akun ini dinonaktifkan oleh Administrator.');
        }

        Auth::guard('web')->login($user, true);

        return redirect()->intended(route('apps.index'))->with('success', 'Selamat datang, '.$user->name.'!');
    }

    /**
     * Handle callback from Google OAuth.
     */
    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            $user = User::where('google_id', $googleUser->getId())
                ->orWhere('email', $googleUser->getEmail())
                ->first();

            if ($user) {
                // If user is deactivated by admin
                if (! $user->is_active) {
                    return redirect()->route('welcome')->with('error', 'Akun Anda dinonaktifkan oleh Administrator.');
                }

                $user->update([
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar() ?? $user->avatar,
                ]);
            } else {
                $user = User::create([
                    'name' => $googleUser->getName() ?? 'Pengguna',
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                    'default_reminder_days' => 1,
                    'is_active' => true,
                ]);
            }

            Auth::login($user, true);

            return redirect()->intended(route('apps.index'))->with('success', 'Selamat datang, '.$user->name.'!');
        } catch (\Throwable $e) {
            return redirect()->route('welcome')->with('error', 'Gagal login via Google: '.$e->getMessage());
        }
    }

    /**
     * Quick Demo/Dev Login for development without live Google keys.
     */
    public function devLogin(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $user = User::findOrFail($request->user_id);

        if (! $user->is_active) {
            return back()->with('error', 'Akun pengguna ini sedang dinonaktifkan.');
        }

        Auth::login($user, true);

        return redirect()->route('apps.index')->with('success', 'Berhasil masuk sebagai demo: '.$user->name);
    }

    /**
     * Log out current member.
     */
    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('welcome')->with('success', 'Anda telah berhasil keluar.');
    }
}
