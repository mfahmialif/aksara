@extends('errors.layout')

@section('title', '404 - Halaman Tidak Ditemukan')
@section('code', '404')
@section('category', 'Not Found')
@section('badge', 'ERROR 404 • HILANG DARI RADAR')
@section('badge-bg', '#FFDC58')
@section('badge-color', '#000000')
@section('accent', '#FFDC58')

@section('message-title', 'Catatan Tidak Ditemukan!')
@section('message', 'Ups! Halaman atau catatan yang kamu tuju sepertinya sudah dipindahkan, dihapus, atau tersesat di luar angkasa catatan.')

@section('illustration')
<div class="relative w-56 h-56 sm:w-60 sm:h-60 flex items-center justify-center select-none">
    <!-- Pulse Ring -->
    <div class="absolute inset-0 rounded-full border-2 border-dashed border-neutral-300"></div>
    <div class="absolute w-44 h-44 rounded-full bg-[#FFDC58]/20 border-2 border-black/10"></div>

    <!-- Paper Airplane Floating -->
    <div class="absolute -top-2 -right-1 z-20 animate-blade-airplane">
        <div class="bg-[#69D2E7] p-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rotate-[15deg]">
            <svg class="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
        </div>
    </div>

    <!-- Floating Lost Notebook Character -->
    <div class="relative z-10 animate-blade-float">
        <!-- Tape on Top -->
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-[#A388EE] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rotate-[-4deg] z-20 flex items-center justify-center">
            <span class="text-[9px] font-mono font-black text-black">HILANG</span>
        </div>

        <!-- Notebook Body -->
        <div class="w-36 h-44 bg-[#FFDC58] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-sm p-2 flex flex-col justify-between relative overflow-hidden">
            <!-- Spiral Binding -->
            <div class="absolute left-1.5 top-0 bottom-0 w-2 flex flex-col justify-around py-2 border-r-2 border-black/20">
                <div class="w-1.5 h-1.5 bg-black rounded-full"></div>
                <div class="w-1.5 h-1.5 bg-black rounded-full"></div>
                <div class="w-1.5 h-1.5 bg-black rounded-full"></div>
                <div class="w-1.5 h-1.5 bg-black rounded-full"></div>
                <div class="w-1.5 h-1.5 bg-black rounded-full"></div>
                <div class="w-1.5 h-1.5 bg-black rounded-full"></div>
            </div>

            <!-- Inner White Page -->
            <div class="ml-3 h-full bg-white border-2 border-black p-2 flex flex-col justify-between">
                <div class="border-b border-neutral-300 pb-1 flex items-center justify-between">
                    <span class="text-[8px] font-mono font-bold text-neutral-400">NOTE #404</span>
                    <span class="text-[10px]">❓</span>
                </div>

                <!-- Googly Eyes Face -->
                <div class="flex flex-col items-center justify-center my-auto">
                    <div class="flex items-center gap-2 mb-1.5">
                        <div class="w-6 h-6 rounded-full bg-white border-2 border-black relative flex items-center justify-center overflow-hidden shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            <div class="w-2.5 h-2.5 rounded-full bg-black translate-x-[2px] translate-y-[-1px]"></div>
                        </div>
                        <div class="w-6 h-6 rounded-full bg-white border-2 border-black relative flex items-center justify-center overflow-hidden shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            <div class="w-2.5 h-2.5 rounded-full bg-black translate-x-[-1px] translate-y-[2px]"></div>
                        </div>
                    </div>
                    <div class="w-5 h-1.5 border-b-2 border-black rounded-full"></div>
                </div>

                <div class="space-y-1">
                    <div class="h-0.5 bg-neutral-200 w-full"></div>
                    <div class="h-0.5 bg-neutral-200 w-3/4"></div>
                </div>
            </div>
        </div>

        <!-- Dangling Little Legs -->
        <div class="flex justify-around px-8 -mt-1 relative z-0">
            <div class="w-3 h-4 bg-black border-2 border-black rounded-b-md shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"></div>
            <div class="w-3 h-4 bg-black border-2 border-black rounded-b-md shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"></div>
        </div>
    </div>

    <!-- Floating Sticker -->
    <div class="absolute -bottom-2 -left-2 bg-[#FF6B6B] text-white text-[10px] font-mono font-black px-2 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rotate-[-10deg]">
        404: MISSING!
    </div>
</div>
@endsection
