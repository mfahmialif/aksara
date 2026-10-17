@extends('errors.layout')

@section('title', '503 - Sedang Pemeliharaan')
@section('code', '503')
@section('category', 'Maintenance')
@section('badge', 'ERROR 503 • SEDANG RENOVASI')
@section('badge-bg', '#7FBC8C')
@section('badge-color', '#000000')
@section('accent', '#7FBC8C')

@section('message-title', 'Aksara Sedang Maintenance')
@section('message', 'Kami sedang melakukan pemeliharaan rutin dan pembaruan sistem agar Aksara semakin ngebut dan andal. Kembali sebentar lagi ya!')

@section('illustration')
<div class="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center select-none">
    <div class="relative z-10 flex flex-col items-center animate-blade-float">
        <div class="w-0 h-0 border-l-[36px] border-l-transparent border-r-[36px] border-r-transparent border-b-[68px] border-b-[#FFA94D] relative">
            <div class="absolute top-[28px] -left-[24px] w-[48px] h-[14px] bg-white border-y-2 border-black"></div>
        </div>
        <div class="w-28 h-4 bg-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"></div>
        <div class="mt-2 flex items-center gap-1.5 bg-[#7FBC8C] border-2 border-black px-2.5 py-1 font-mono text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span>🔧 MAINTENANCE</span>
        </div>
    </div>
</div>
@endsection

@section('extra-actions')
<button onclick="window.location.reload()" class="neo-btn-main bg-[#7FBC8C] hover:bg-[#92cca0] text-black px-4 py-2.5 text-sm uppercase">
    <span>Cek Status / Refresh</span>
</button>
@endsection
