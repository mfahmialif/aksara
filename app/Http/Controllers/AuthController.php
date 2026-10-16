<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    /**
     * Show dedicated member login page.
     */
    public function showLogin(Request $request)
    {
        if (Auth::guard('web')->check()) {
            return redirect()->intended(route('apps.index'));
        }

        return Inertia::render('Public/Login');
    }

    /**
     * Redirect to Google OAuth provider.
     */
    public function redirectToGoogle()
    {
        // Check if Google credentials are configured in .env
        $clientId = config('services.google.client_id');
        $clientSecret = config('services.google.client_secret');

        if (empty($clientId) || empty($clientSecret) || str_contains($clientId, 'your-google-client-id')) {
            return redirect()->route('welcome')->with('error', 'Layanan login Google belum diaktifkan. Silakan hubungi Administrator untuk mengaktifkannya.');
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

            ActivityLogger::log('LOGIN', "Pengguna {$user->name} ({$user->email}) berhasil masuk ke sistem via Google OAuth", $user);

            // Clear any stale intended URL that points to old non-UUID integer IDs
            $intended = session()->get('url.intended');
            if ($intended && preg_match('#/(app|notes|groups)/\d+#', $intended)) {
                session()->forget('url.intended');
            }

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

        ActivityLogger::log('LOGIN', "Pengguna {$user->name} ({$user->email}) masuk ke sistem via Demo Login", $user);

        return redirect()->intended(route('apps.index'))->with('success', 'Berhasil masuk sebagai demo: '.$user->name);
    }

    /**
     * Log out current member.
     */
    public function logout(Request $request)
    {
        $user = Auth::guard('web')->user();
        if ($user) {
            ActivityLogger::log('LOGOUT', "Pengguna {$user->name} ({$user->email}) telah keluar dari sistem", $user);
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('welcome')->with('success', 'Anda telah berhasil keluar.');
    }
}
