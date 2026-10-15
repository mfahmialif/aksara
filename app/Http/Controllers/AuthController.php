<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    /**
     * Redirect to Google OAuth provider.
     */
    public function redirectToGoogle()
    {
        // Check if Google credentials are configured
        if (empty(config('services.google.client_id')) || empty(config('services.google.client_secret'))) {
            return redirect()->route('login')->with('error', 'Google OAuth belum dikonfigurasi di .env. Anda dapat menggunakan tombol Demo Login untuk masuk.');
        }

        return Socialite::driver('google')->redirect();
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
