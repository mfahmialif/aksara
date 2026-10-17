@extends('errors.layout')

@section('title', '500 - Kesalahan Server')
@section('code', '500')
@section('category', 'Server Error')
@section('badge', 'ERROR 500 • KORSLETING SERVER')
@section('badge-bg', '#EF4444')
@section('badge-color', '#ffffff')
@section('accent', '#EF4444')

@section('message-title', 'Terjadi Kendala di Dapur Server')
@section('message', 'Aduh! Terjadi kesalahan tak terduga pada sistem backend kami. Tim pengembang telah diberi tahu untuk menanganinya secepat mungkin.')

@section('illustration')
<div class="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center select-none">
    <div class="w-36 h-40 bg-neutral-100 border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-3 flex flex-col justify-between animate-blade-float">
        <div class="flex items-center justify-between border-b-2 border-black pb-1.5">
            <div class="flex gap-1">
                <div class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></div>
                <div class="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
            </div>
            <span class="text-xs font-mono font-black text-rose-600">!ERR</span>
        </div>
        <div class="text-center font-mono font-black text-rose-600 text-2xl">
            x__x
        </div>
        <div class="bg-black text-white text-center py-1 font-mono text-[10px] font-black uppercase">
            SERVER CRASH
        </div>
    </div>
</div>
@endsection

@section('extra-actions')
<button onclick="window.location.reload()" class="neo-btn-main bg-white hover:bg-neutral-100 text-black px-4 py-2.5 text-sm uppercase">
    <span>Muat Ulang Halaman</span>
</button>
@endsection
