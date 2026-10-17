@extends('errors.layout')

@section('title', '429 - Terlalu Banyak Permintaan')
@section('code', '429')
@section('category', 'Rate Limited')
@section('badge', 'ERROR 429 • TERLALU NGEBUT')
@section('badge-bg', '#FFA94D')
@section('badge-color', '#000000')
@section('accent', '#FFA94D')

@section('message-title', 'Pelan-pelan, Kawan!')
@section('message', 'Sistem mendeteksi terlalu banyak permintaan dalam waktu singkat. Ambil nafas sejenak, santai, lalu coba kembali sesaat lagi.')

@section('illustration')
<div class="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center select-none">
    <div class="w-40 h-32 bg-[#FFA94D] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-t-full flex flex-col items-center justify-center p-3 animate-blade-float">
        <span class="text-4xl mb-1">⚡</span>
        <div class="bg-black text-white font-mono text-[9px] font-black px-2 py-0.5 uppercase">
            SPEED LIMIT
        </div>
    </div>
</div>
@endsection
