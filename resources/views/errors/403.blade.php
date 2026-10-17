@extends('errors.layout')

@section('title', '403 - Akses Ditolak')
@section('code', '403')
@section('category', 'Forbidden')
@section('badge', 'ERROR 403 • AKSES DILARANG')
@section('badge-bg', '#FF6B6B')
@section('badge-color', '#ffffff')
@section('accent', '#FF6B6B')

@section('message-title', 'Area Terkunci Rapat!')
@section('message', 'Kamu tidak memiliki izin untuk membuka catatan atau workspace ini. Hubungi pemilik atau masuk dengan akun yang memiliki hak akses.')

@section('illustration')
<div class="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center select-none">
    <div class="absolute inset-0 bg-[#FF6B6B]/20 rounded-full"></div>
    <div class="relative z-10 flex flex-col items-center animate-blade-float">
        <!-- Padlock Shackle -->
        <div class="w-20 h-16 border-4 border-black rounded-t-full bg-neutral-200 mb-[-12px]"></div>
        <!-- Padlock Body -->
        <div class="w-36 h-32 bg-[#FF6B6B] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center p-3 relative">
            <div class="absolute top-1 left-2 flex gap-1">
                <div class="w-2 h-2 rounded-full bg-black"></div>
                <div class="w-2 h-2 rounded-full bg-black"></div>
            </div>
            <!-- Keyhole -->
            <div class="w-6 h-6 rounded-full bg-black mb-1 flex items-center justify-center">
                <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
            </div>
            <div class="w-3 h-5 bg-black rounded-b-sm"></div>
            <div class="mt-2 bg-black text-white text-[9px] font-mono font-black px-2 py-0.5 uppercase">
                DIKUNCI
            </div>
        </div>
    </div>
</div>
@endsection
