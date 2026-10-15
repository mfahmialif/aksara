# Product Requirements Document (PRD): Sistem Aplikasi Catatan Kolaboratif (Neobrutalism Edition)

Dokumen ini mendefinisikan spesifikasi fungsional, desain antarmuka, dan arsitektur teknis untuk platform manajemen catatan dan tugas berbasis web dengan pendekatan hierarki multi-aplikasi, kolaborasi granular, serta estetika desain **Neobrutalism**.

---

## 1. Ringkasan Produk & Tujuan

Platform ini adalah aplikasi pencatatan serbaguna (*general-purpose note-taking & task management*) yang memungkinkan pengguna mengorganisir catatan ke dalam ruang kerja terpisah yang disebut **Aplikasi Catatan**, mengelompokkannya ke dalam **Grup**, serta membuat catatan dengan dukungan *Rich Text*, *Checklist*, *Drawing Canvas*, dan lampiran multi-file.

| Atribut Dokumen | Detail Spesifikasi |
| :--- | :--- |
| **Arsitektur Utama** | Monolitik Modern (Laravel + Inertia.js + React) |
| **Design System** | Neobrutalism (mengacu pada standar komponen `neobrutalism.dev`) |
| **Target Platform** | Web (Full Responsive: Desktop, Tablet, & Mobile) |
| **Tipe Pengguna** | Public (Visitor), Member (Pengguna Reguler), Admin (Internal) |

---

## 2. Peran Pengguna & Sistem Autentikasi

Sistem memisahkan jalur autentikasi secara tegas antara pengguna reguler (Member) dan pengelola sistem (Admin Internal).

| Peran (Role) | Metode Autentikasi | Akses & Hak Istimewa Utama |
| :--- | :--- | :--- |
| **Public (Visitor)** | Tanpa Login | Mengakses *Landing Page*, melihat halaman **Aplikasi Catatan Public** atau **Catatan Public** melalui tautan berbagi (*shareable link*) dalam mode *read-only*. |
| **Member** | **Hanya Google OAuth** (Laravel Socialite) | Membuat dan mengelola Aplikasi Catatan, Grup, dan Catatan; mengatur *default* pengingat global; mengundang kolaborator; mempublikasikan aplikasi/catatan. Tidak ada form registrasi/login password untuk member. |
| **Admin (Internal)** | **Username/Email & Password** (`/admin/login`) | Akses ke Dashboard Admin, pengaturan batas ukuran dan tipe file *upload* secara dinamis, pemantauan *log* pengingat email, serta manajemen pengguna. |

---

## 3. Spesifikasi Fungsional & Hierarki Fitur

### 3.1. Area Publik (Landing Page & Public View)
* **Landing Page (`/`):** Menampilkan nilai jual utama aplikasi (Hero section bergaya Neobrutalism, pratinjau fitur *Drawing* & *Checklist*, cara kerja kolaborasi, dan tombol CTA tunggal **"Masuk dengan Google"**).
* **Halaman Public Aplikasi (`/s/app/{slug_token}`):** Menampilkan struktur Grup dan daftar Catatan di dalam satu Aplikasi yang telah disetel *Public* oleh pemiliknya (mode *read-only*).
* **Halaman Public Per-Catatan (`/s/note/{slug_token}`):** Menampilkan isi dari satu catatan spesifik (beserta gambar, PDF, *checklist*, dan *drawing*) tanpa memberikan akses ke catatan lain di dalam grup/aplikasi yang sama.

### 3.2. Hierarki Ruang Kerja Member
Setelah berhasil login melalui Google, Member langsung diarahkan ke halaman **Daftar Aplikasi Catatanku (`/app`)**.

1. **Level 1: Aplikasi Catatan (Workspace)**
   * Member dapat membuat banyak Aplikasi Catatan (contoh: *"Catatan Tugas Kuliah"*, *"Proyek Freelance"*, *"Jurnal Pribadi"*).
   * Setiap Aplikasi memiliki pengaturan warna aksen Neobrutalism, ikon, status visibilitas (*Private* / *Public*), dan daftar Kolaborator tingkat aplikasi.
2. **Level 2: Grup (Folder Mata Kuliah / Topik)**
   * Di dalam satu Aplikasi Catatan, Member dapat membuat banyak Grup (contoh di dalam *Catatan Tugas Kuliah*: *"Bahasa Indonesia"*, *"Bahasa Inggris"*, *"Bahasa Arab"*).
   * Mendukung pengurutan grup, penggantian nama, dan penghapusan grup.
3. **Level 3: Catatan (Item Catatan)**
   * Berada di dalam Grup. Setiap catatan wajib memiliki salah satu dari dua **Kategori Catatan**:
     * **Catatan Biasa:** Catatan standar tanpa tenggat waktu (*deadline*).
     * **Tugas (Task):** Memiliki atribut tambahan berupa **Tanggal & Jam Deadline** serta konfigurasi **Pengingat Email**.

### 3.3. Editor Catatan Multi-Komponen (Berlaku untuk Semua Kategori)
Baik **Catatan Biasa** maupun **Tugas** memiliki kapabilitas konten yang identik di dalam editornya:
* **Rich Text Editor:** Pemformatan teks lengkap (Heading H1–H3, Bold, Italic, Highlight warna kontras, Code Block, Blockquote, Tabel, dan Hyperlink) menggunakan *TipTap Editor*.
* **Interactive Checklist:** Daftar centang (*to-do list*) yang dapat dicentang langsung di dalam catatan beserta indikator persentase penyelesaian.
* **Drawing Canvas (Sketsa/Coretan):** Blok kanvas interaktif terintegrasi (menggunakan *Excalidraw* atau *react-sketch-canvas*) yang memungkinkan pengguna menggambar diagram, tulisan tangan, atau *mindmap* menggunakan *mouse*, *stylus*, atau sentuhan jari di layar *mobile*, lalu menyimpannya sebagai elemen visual yang dapat diedit kembali.
* **Manajemen Lampiran & Multi-Upload File:**
  * **Upload Gambar:** Pratinjau langsung (*inline preview*) dengan *lightbox*.
  * **Upload PDF:** Dilengkapi fitur pratinjau dokumen (*embedded PDF viewer*) atau tombol unduh cepat.
  * **Multi-Upload File Bebas:** Pengguna dapat memilih atau melakukan *drag-and-drop* banyak file sekaligus (`.zip`, `.docx`, `.xlsx`, `.pptx`, `.mp4`, dll.).
  * **Validasi Dinamis:** Jenis ekstensi yang diizinkan, ukuran maksimal per file, dan kuota jumlah file per catatan divalidasi secara *real-time* mengikuti konfigurasi yang diatur oleh Admin di database.

### 3.4. Sistem Pengaturan Global & Pengingat Email (Deadline Reminder)
* **Pengaturan Global Member (`/settings/preferences`):**
  * Member memiliki kolom pengaturan **Default Pengingat Deadline** (dalam satuan hari sebelum tenggat waktu, misalnya disetel ke angka `1` hari sebelum *deadline*).
* **Perilaku Otomatis & Fleksibilitas saat Membuat Catatan Tugas:**
  * Saat Member memilih kategori **Tugas**, sistem secara otomatis mengisi kolom *"Ingatkan saya X hari sebelum deadline"* dengan nilai dari Pengaturan Global (contoh: langsung terisi angka `1`).
  * Nilai `1` tersebut **dapat diedit langsung** pada form catatan tugas tersebut (misalnya diubah menjadi `3` hari atau `0` / tanpa pengingat) tanpa mengubah nilai *default* global milik pengguna.
* **Eksekusi Pengingat:**
  * *Laravel Scheduler* dan *Queue Worker* memeriksa catatan kategori Tugas yang jatuh tempo sesuai waktu pengingat (`deadline_at` dikurangi `reminder_days_before`) dan mengirimkan notifikasi email terformat ke pemilik catatan (serta kolaborator terkait).

### 3.5. Sistem Kolaborasi & Berbagi (Granular Sharing)
Sistem mendukung pembagian akses pada **dua level berbeda** secara independen:

| Fitur Akses | Level Aplikasi Catatan | Level Per-Catatan |
| :--- | :--- | :--- |
| **Invite User (Kolaborasi Edit)** | Mengundang Member lain via alamat email Google mereka. Kolaborator dapat melihat, menambah, dan mengedit **semua Grup dan Catatan** di dalam Aplikasi tersebut. | Mengundang Member lain via email hanya pada **satu Catatan spesifik**. Kolaborator hanya dapat melihat dan mengedit catatan tersebut tanpa bisa melihat grup atau catatan lain di aplikasi induknya. |
| **Public Share (Read-Only Link)** | Menghasilkan tautan publik unik untuk seluruh Aplikasi. Siapa pun dengan tautan dapat menelusuri semua grup dan membaca catatan di dalamnya tanpa login. | Menghasilkan tautan publik unik hanya untuk satu Catatan tertentu. Pengunjung hanya dapat membaca catatan tersebut. |

### 3.6. Panel Admin Internal (`/admin`)
Halaman khusus staf internal dengan rute terproteksi (`auth:admin`):
* **Dashboard Statistik:** Menampilkan metrik jumlah Member aktif, total Aplikasi & Catatan yang dibuat, total penggunaan kapasitas penyimpanan (*storage*), dan status antrean (*queue*) pengiriman email pengingat.
* **Manajemen Batasan Upload (Dynamic File Restrictions):**
  * Pengaturan ukuran maksimal per file (dalam MB).
  * Pengaturan jumlah maksimal file dalam sekali *multi-upload*.
  * Daftar ekstensi/MIME types yang diizinkan atau diblokir (contoh: memblokir `.exe`, `.sh`, `.bat` demi keamanan).
* **Manajemen Pengguna:** Melihat daftar Member (login Google), menonaktifkan akun yang melanggar ketentuan, dan mengelola akun Admin internal.

---

## 4. Alur Pengguna Utama (User Flows)

### 4.1. Alur Member: Login hingga Membuat Catatan Tugas
1. Pengguna membuka *Landing Page* dan menekan tombol **"Masuk dengan Google"**.
2. Setelah otorisasi Google berhasil, pengguna diarahkan langsung ke halaman **Aplikasi Catatanku**.
3. Pengguna menekan tombol **"+ Tambah Aplikasi"**, memberi nama *"Catatan Tugas Kuliah"*, lalu membuka aplikasi tersebut.
4. Di dalam aplikasi, pengguna membuat Grup baru: *"Bahasa Indonesia"*, *"Bahasa Inggris"*, dan *"Bahasa Arab"*.
5. Pengguna memilih grup *"Bahasa Indonesia"* dan menekan **"+ Buat Catatan"**.
6. Pengguna memilih kategori **Tugas**. Kolom pengingat otomatis terisi angka `1` (hari sebelum *deadline*) sesuai pengaturan global. Pengguna dapat membiarkannya atau mengubahnya menjadi `2`.
7. Pengguna mengisi catatan dengan *Rich Text*, menambahkan *Checklist* referensi buku, membuat coretan skema di blok *Drawing*, dan mengunggah 3 file sekaligus (PDF materi, gambar papan tulis, dan dokumen Word).
8. Sistem menyimpan catatan dan menjadwalkan *job* pengingat email secara otomatis.

---

## 5. Spesifikasi Desain UI/UX (Neobrutalism Design System)

Mengacu pada standar visual [neobrutalism.dev](https://www.neobrutalism.dev/), antarmuka dirancang agar berani, jelas, kontras tinggi, namun tetap nyaman digunakan dalam durasi lama.

### 5.1. Karakteristik Visual
* **Border Tegas:** Semua kartu, tombol, *input field*, modal, dan *sidebar* menggunakan garis tepi hitam solid berukuran tebal (`border-2 border-black` atau `#000000`).
* **Hard Box Shadow (Tanpa Blur):** Menggunakan bayangan tajam tanpa gradasi blur:
  * Ukuran komponen standar: `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`
  * Ukuran kartu besar/modal: `shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`
* **Palet Warna:**
  * **Background Utama:** *Warm Off-White* (`#FFFDF8` atau `#F4F0EA`) agar mata tidak cepat lelah dibanding putih murni.
  * **Warna Aksen Kartu/Badge:** Kuning Elektrik (`#FFDC58`), Ungu Pastel Kontras (`#A388EE`), Hijau Mint Tajam (`#7FBC8C`), Oranye Coral (`#FF6B6B`), dan Biru Langit (`#69D2E7`).
* **Tipografi:** Menggunakan *font* **Plus Jakarta Sans** atau **Space Grotesk** untuk *Heading* (`font-bold` / `font-black`), serta **Inter** atau **DM Sans** untuk teks isi catatan agar keterbacaan tetap optimal.

### 5.2. Animasi Ringan & Micro-Interactions
Agar performa tetap kencang di perangkat *mobile* tetapi tidak terasa kaku (*flat*):
* **Efek Tekan Fisik (Tactile Button Press):** Saat tombol atau kartu di-*hover* atau ditekan, elemen bergeser mengikuti arah bayangan menggunakan transisi CSS murni (`transition-all duration-150 ease-out hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none`).
* **Transisi Halaman & Modal:** Menggunakan animasi *fade-and-scale* singkat (150ms–200ms) tanpa efek *spring* berat yang membebani GPU.

### 5.3. Responsivitas Mobile (Mobile-First Adaptation)
* **Desktop:** Layout 3 kolom (Sidebar Grup di kiri, Daftar Catatan di tengah, Area Editor Catatan di kanan).
* **Mobile:** Navigasi berubah menjadi *Bottom Navigation Bar* bergaya Neobrutalism dan *Slide-over Drawer* untuk berpindah Grup. Kanvas *Drawing* otomatis mendukung *touch gesture* penuh dan mengunci *scroll* layar saat pengguna sedang menggambar.

---

## 6. Arsitektur Teknis & Strategi Optimasi

### 6.1. Tech Stack
* **Backend:** Laravel 11/12 (PHP 8.3+)
* **Frontend Adapter:** Inertia.js v2.0
* **Frontend Library:** React 18/19 + TypeScript + Tailwind CSS + Komponen berbasis Shadcn/Radix yang dikustomisasi dengan tema `neobrutalism.dev`
* **Database & Queue:** PostgreSQL / MySQL + Redis (untuk manajemen *Queue* pengiriman email pengingat & *caching* pengaturan global admin)

### 6.2. Skema Database Inti (ERD Ringkas)

| Nama Tabel | Kolom Kunci & Fungsi |
| :--- | :--- |
| `users` | `id`, `name`, `email`, `google_id`, `avatar`, `default_reminder_days` (default: `1`), `is_active` |
| `admins` | `id`, `username`, `email`, `password`, `role` (Tabel terpisah untuk keamanan autentikasi internal) |
| `system_settings` | `key`, `value` (Menyimpan `max_file_size_mb`, `max_files_per_upload`, `allowed_extensions`) |
| `note_apps` | `id`, `owner_id`, `name`, `color_theme`, `is_public`, `public_token` |
| `note_groups` | `id`, `note_app_id`, `name`, `sort_order` |
| `notes` | `id`, `note_group_id`, `title`, `category` (`regular` / `task`), `content_json` (Rich text & checklist), `drawing_data` (JSON/SVG canvas), `deadline_at`, `reminder_days_before`, `reminder_sent_at`, `is_public`, `public_token` |
| `note_attachments` | `id`, `note_id`, `file_name`, `file_path`, `mime_type`, `file_size` |
| `collaborators` | `id`, `collaboratable_type` (`NoteApp` atau `Note`), `collaboratable_id`, `user_id`, `invited_email`, `permission` (`edit`) |

### 6.3. Implementasi Debounced Prefetching pada Inertia React
Untuk memastikan perpindahan antar Aplikasi, Grup, dan Catatan terasa instan tanpa membebani server ketika pengguna hanya menggerakkan kursor melewati banyak menu dengan cepat, sistem menggunakan komponen tautan kustom dengan **Debounce (200ms)** sebelum memicu *prefetching* bawaan Inertia.

```tsx
// resources/js/Components/DebouncedPrefetchLink.tsx
import React, { useRef, useCallback } from 'react';
import { Link, router, InertiaLinkProps } from '@inertiajs/react';

interface Props extends InertiaLinkProps {
  debounceMs?: number;
  cacheFor?: string | number;
}

export default function DebouncedPrefetchLink({
  href,
  debounceMs = 200,
  cacheFor = '30s',
  onMouseEnter,
  onMouseLeave,
  children,
  ...props
}: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (onMouseEnter) onMouseEnter(e);

      timerRef.current = setTimeout(() => {
        router.prefetch(
          href.toString(),
          { method: 'get' },
          { cacheFor }
        );
      }, debounceMs);
    },
    [href, debounceMs, cacheFor, onMouseEnter]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (onMouseLeave) onMouseLeave(e);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    },
    [onMouseLeave]
  );

  return (
    <Link
      href={href}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </Link>
  );
}
```

---

## 7. Kriteria Penerimaan (Acceptance Criteria)

1. **Autentikasi Terpisah:** Member hanya dapat masuk melalui tombol Google OAuth; percobaan akses langsung ke rute member tanpa sesi akan diarahkan ke halaman login Google. Admin memiliki halaman `/admin/login` tersendiri dengan *guard* terpisah.
2. **Default & Override Pengingat:** Mengubah nilai *default* pengingat di pengaturan profil dari `1` menjadi `3` akan membuat form catatan Tugas berikutnya otomatis berisi angka `3`, namun pengguna tetap dapat mengubah angka tersebut menjadi `5` pada catatan spesifik tanpa mengubah angka `3` di pengaturan profil.
3. **Isolasi Kolaborasi & Publikasi:** Pengguna yang diundang ke **satu catatan spesifik** tidak dapat melihat daftar grup atau catatan lain di dalam Aplikasi induk. Tautan publik per-catatan hanya merender catatan tersebut dalam mode *read-only*.
4. **Kepatuhan Batas File Admin:** Jika Admin mengubah batas ukuran file menjadi `5 MB` dan memblokir ekstensi `.zip`, maka proses *multi-upload* di sisi Member langsung menolak file di atas `5 MB` atau berformat `.zip` baik di validasi *frontend* maupun *backend* Laravel.
5. **Efisiensi Jaringan (Debounce Prefetch):** Menggerakkan kursor melintasi 5 item catatan secara cepat (kurang dari 200ms per item) tidak memicu *request* jaringan di tab *Network*, dan *prefetch* hanya dieksekusi ketika kursor berhenti di atas item selama minimal 200ms.