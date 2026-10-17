@extends('errors.layout')

@section('title', '401 - Butuh Autentikasi')
@section('code', '401')
@section('category', 'Unauthorized')
@section('badge', 'ERROR 401 • BUTUH TIKET MASUK')
@section('badge-bg', '#69D2E7')
@section('badge-color', '#000000')
@section('accent', '#69D2E7')

@section('message-title', 'Sesi Belum Terautentikasi')
@section('message', 'Catatan atau ruang kerja ini bersifat pribadi. Silakan masuk dengan akun terdaftarmu terlebih dahulu.')

@section('illustration')
<div class="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center select-none">
    <div class="w-32 h-44 bg-[#69D2E7] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-3 flex flex-col justify-between rotate-[-4deg] animate-blade-float">
        <div class="w-8 h-2 bg-black rounded-full mx-auto"></div>
        <div class="w-16 h-16 bg-white border-2 border-black mx-auto flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black text-xl">
            🔑
        </div>
        <div class="bg-white border-2 border-black text-center py-1 font-mono text-[10px] font-black uppercase">
            LOGIN DULU
        </div>
    </div>
</div>
@endsection

@section('extra-actions')
<a href="{{ route('login') }}" class="neo-btn-main bg-black hover:bg-neutral-800 text-white px-4 py-2.5 text-sm uppercase">
    <span>Masuk Sekarang</span>
</a>
@endsection
