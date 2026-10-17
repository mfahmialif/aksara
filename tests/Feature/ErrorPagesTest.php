<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ErrorPagesTest extends TestCase
{
    /**
     * Test 404 error response on Inertia XHR request returns Error component and JSON.
     */
    public function test_non_existent_page_returns_404_inertia_xhr_response(): void
    {
        $response = $this->get('/halaman-yang-pasti-tidak-ada-404-test', [
            'X-Inertia' => 'true',
        ]);

        $response->assertStatus(404);
        $response->assertHeader('X-Inertia', 'true');
        $response->assertJsonPath('component', 'Error');
        $response->assertJsonPath('props.status', 404);
    }

    /**
     * Test direct full page request to non existent page renders Inertia Error page.
     */
    public function test_direct_request_to_non_existent_page_renders_inertia_error(): void
    {
        $response = $this->get('/halaman-yang-pasti-tidak-ada-404-test');

        $response->assertStatus(404);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Error')
            ->where('status', 404)
        );
    }

    /**
     * Test all Blade fallback error views render properly with expected content.
     */
    public function test_blade_error_views_can_be_rendered(): void
    {
        $view404 = view('errors.404')->render();
        $this->assertStringContainsString('404', $view404);
        $this->assertStringContainsString('Catatan Tidak Ditemukan!', $view404);

        $view403 = view('errors.403')->render();
        $this->assertStringContainsString('403', $view403);
        $this->assertStringContainsString('Area Terkunci Rapat!', $view403);

        $view401 = view('errors.401')->render();
        $this->assertStringContainsString('401', $view401);
        $this->assertStringContainsString('Sesi Belum Terautentikasi', $view401);

        $view419 = view('errors.419')->render();
        $this->assertStringContainsString('419', $view419);
        $this->assertStringContainsString('Sesi Halaman Kadaluwarsa', $view419);

        $view429 = view('errors.429')->render();
        $this->assertStringContainsString('429', $view429);
        $this->assertStringContainsString('Pelan-pelan, Kawan!', $view429);

        $view500 = view('errors.500')->render();
        $this->assertStringContainsString('500', $view500);
        $this->assertStringContainsString('Terjadi Kendala di Dapur Server', $view500);

        $view503 = view('errors.503')->render();
        $this->assertStringContainsString('503', $view503);
        $this->assertStringContainsString('Aksara Sedang Maintenance', $view503);
    }
}
