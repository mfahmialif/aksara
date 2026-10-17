<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Undangan Pemindahan Kepemilikan Ruang Kerja</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F0EA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111111;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F0EA; padding: 30px 15px;">
        <tr>
            <td align="center">
                <!-- Main Container -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border: 3px solid #000000; box-shadow: 6px 6px 0px #000000;">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #FFDC58; border-bottom: 3px solid #000000; padding: 20px 24px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td>
                                        <span style="display: inline-block; background-color: #000000; color: #FFDC58; font-weight: 900; font-size: 14px; padding: 4px 10px; text-transform: uppercase; letter-spacing: 1px;">
                                            Aksara Notes
                                        </span>
                                    </td>
                                    <td align="right">
                                        <span style="font-size: 12px; font-weight: 700; color: #000000; text-transform: uppercase;">
                                            Pemindahan Kepemilikan
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 32px 28px;">
                            <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 900; color: #000000; text-transform: uppercase; line-height: 1.3;">
                                Undangan Pindah Kepemilikan Ruang Kerja
                            </h1>

                            <p style="margin: 0 0 18px 0; font-size: 14px; line-height: 1.6; color: #222222;">
                                Halo,
                            </p>

                            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #222222;">
                                <strong>{{ $sender->name }}</strong> ({{ $sender->email }}) ingin menyerahkan kepemilikan penuh atas ruang kerja <strong>&ldquo;{{ $app->name }}&rdquo;</strong> kepada akun Anda (<strong>{{ $targetEmail }}</strong>).
                            </p>

                            <!-- Workspace Box -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8F8F8; border: 2px solid #000000; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #555555; padding-bottom: 4px;">Nama Ruang Kerja:</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 16px; font-weight: 900; color: #000000; padding-bottom: 12px;">{{ $app->name }}</td>
                                            </tr>
                                            @if($app->description)
                                            <tr>
                                                <td style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #555555; padding-bottom: 4px;">Deskripsi:</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 13px; color: #333333; line-height: 1.5; padding-bottom: 12px;">{{ $app->description }}</td>
                                            </tr>
                                            @endif
                                            <tr>
                                                <td style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #555555; padding-bottom: 4px;">Pemilik Saat Ini:</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 13px; font-weight: 700; color: #000000;">{{ $sender->name }} &lt;{{ $sender->email }}&gt;</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <div style="background-color: #E8F5E9; border-left: 4px solid #2E7D32; padding: 12px 14px; margin-bottom: 28px;">
                                <p style="margin: 0; font-size: 13px; color: #1B5E20; line-height: 1.5; font-weight: 600;">
                                    📌 Dengan menerima pemindahan ini, Anda akan memiliki hak kendali penuh atas ruang kerja ini. Pemilik sebelumnya otomatis akan tetap memiliki akses sebagai kolaborator editor.
                                </p>
                            </div>

                            <!-- CTA Button -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $acceptUrl }}" style="display: inline-block; background-color: #7FBC8C; color: #000000; font-weight: 900; font-size: 14px; text-transform: uppercase; text-decoration: none; padding: 14px 28px; border: 2px solid #000000; box-shadow: 4px 4px 0px #000000; letter-spacing: 0.5px;">
                                            Terima &amp; Ambil Alih Kepemilikan &rarr;
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Important Note about Login -->
                            <p style="margin: 0 0 12px 0; font-size: 12px; color: #555555; line-height: 1.5;">
                                💡 <em>Jika Anda belum login ke Aksara Notes, Anda akan otomatis diarahkan untuk masuk terlebih dahulu, kemudian langsung dibawa ke halaman konfirmasi pemindahan kepemilikan.</em>
                            </p>

                            <p style="margin: 0 0 20px 0; font-size: 12px; color: #777777; line-height: 1.5;">
                                Tautan ini aman dan hanya berlaku selama <strong>3 hari</strong>. Jika Anda tidak merasa meminta atau mengharapkan pemindahan ini, Anda dapat mengabaikan email ini.
                            </p>

                            <hr style="border: none; border-top: 1px dashed #CCCCCC; margin: 24px 0;">

                            <p style="margin: 0; font-size: 11px; color: #888888; word-break: break-all; line-height: 1.4;">
                                Tautan cadangan (jika tombol tidak berfungsi):<br>
                                <a href="{{ $acceptUrl }}" style="color: #000000; font-weight: 700;">{{ $acceptUrl }}</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #F4F0EA; border-top: 2px solid #000000; padding: 16px 24px; text-align: center;">
                            <p style="margin: 0; font-size: 11px; font-weight: 700; color: #666666; text-transform: uppercase;">
                                &copy; {{ date('Y') }} Aksara Notes &bull; Neo-Brutalism Personal &amp; Team Workspace
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
