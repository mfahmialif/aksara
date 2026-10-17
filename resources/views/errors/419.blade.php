@extends('errors.layout')

@section('title', '419 - Sesi Halaman Kadaluwarsa')
@section('code', '419')
@section('category', 'Page Expired')
@section('badge', 'ERROR 419 • WAKTU HABIS')
@section('badge-bg', '#A388EE')
@section('badge-color', '#ffffff')
@section('accent', '#A388EE')

@section('message-title', 'Sesi Halaman Kadaluwarsa')
@section('message', 'Formulir atau token keamanan telah habis masa berlakunya karena tidak ada aktivitas dalam waktu lama. Silakan muat ulang halaman ini.')

@section('illustration')
<div class="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center select-none">
    <div class="w-36 h-36 rounded-full bg-[#A388EE] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center p-4 animate-blade-float">
        <span class="text-4xl mb-1">⏳</span>
        <div class="mt-1 bg-black text-white font-mono text-[9px] font-black px-2 py-0.5 border border-black">
            TIMEOUT!
        </div>
    </div>
</div>
@endsection

@section('extra-actions')
<button onclick="window.location.reload()" class="neo-btn-main bg-[#A388EE] hover:bg-[#b59ffa] text-black px-4 py-2.5 text-sm uppercase">
    <span>Muat Ulang Halaman</span>
</button>
@endsection
