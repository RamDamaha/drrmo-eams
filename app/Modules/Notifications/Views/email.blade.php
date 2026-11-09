{{--
    Shared layout for every email. Built with tables and inline styles so it holds up in
    Gmail, Outlook and phone mail apps. Colors are the design system tokens (DESIGN_SYSTEM.md).
    Blocks come from App\Modules\Notifications\Contracts\EmailMessage.
--}}
@php
    $font = "'Public Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
@endphp
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>{{ $subject }}</title>
<style>
    body { margin: 0; padding: 0; width: 100%; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a { color: #7d1d23; }
    @media (max-width: 620px) {
        .container { width: 100% !important; }
        .px { padding-left: 24px !important; padding-right: 24px !important; }
        .outer { padding: 0 !important; }
        .card { border-radius: 0 !important; border-left: 0 !important; border-right: 0 !important; }
        .header { border-radius: 0 !important; }
        .h1 { font-size: 22px !important; line-height: 30px !important; }
        .code { font-size: 30px !important; letter-spacing: 6px !important; }
        .btn { width: 100% !important; }
        .btn td { text-align: center !important; }
        .btn a { display: block !important; }
        .dl { width: 96px !important; }
    }
    @media (prefers-color-scheme: dark) {
        .page { background-color: #1c1917 !important; }
        .card { background-color: #292524 !important; border-color: #44403c !important; }
        .box { background-color: #1c1917 !important; border-color: #44403c !important; }
        .rule { border-color: #44403c !important; }
        .t-main { color: #fafaf9 !important; }
        .t-body { color: #e7e5e4 !important; }
        .t-muted { color: #a8a29e !important; }
        .t-link { color: #fbe08e !important; }
    }
    [data-ogsc] .t-main { color: #fafaf9 !important; }
    [data-ogsc] .t-body { color: #e7e5e4 !important; }
    [data-ogsc] .t-muted { color: #a8a29e !important; }
    [data-ogsc] .t-link { color: #fbe08e !important; }
</style>
</head>
<body class="page" style="margin:0;padding:0;background-color:#f5f5f4;">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:#f5f5f4;">{{ $preheader }}{!! str_repeat('&#847;&zwnj;&nbsp;', 60) !!}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="page" style="background-color:#f5f5f4;">
<tr>
<td align="center" class="outer" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="container" style="width:600px;max-width:600px;">

    {{-- Brand header: maroon surface with both logos, ZPPSU first. --}}
    <tr>
        <td class="header px" bgcolor="#520f14" style="background-color:#520f14;background-image:linear-gradient(135deg,#661419 0%,#520f14 55%,#33080b 100%);border-radius:12px 12px 0 0;padding:24px 40px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                    <td width="104" valign="middle" style="width:104px;">
                        <img src="cid:zppsu-logo" width="48" height="48" alt="Zamboanga Peninsula Polytechnic State University logo" style="display:inline-block;vertical-align:middle;width:48px;height:48px;">
                        <img src="cid:drrmo-logo" width="43" height="48" alt="ZPPSU Disaster Risk Reduction and Management Office logo" style="display:inline-block;vertical-align:middle;width:43px;height:48px;margin-left:8px;">
                    </td>
                    <td valign="middle" style="padding-left:16px;border-left:1px solid #7d1d23;">
                        <div style="font-family:{!! $font !!};font-size:11px;line-height:16px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#f7cb4f;">DRRMO EAMS</div>
                        <div style="font-family:{!! $font !!};font-size:14px;line-height:20px;font-weight:600;color:#ffffff;">ZPPSU Disaster Risk Reduction and Management Office</div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    {{-- Card --}}
    <tr>
        <td class="card px" bgcolor="#ffffff" style="background-color:#ffffff;border:1px solid #e7e5e4;border-top:0;border-radius:0 0 12px 12px;padding:36px 40px 40px;">

            {{-- Brand stripe: gold to DRRMO orange, once, above the heading. --}}
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr><td width="48" height="4" bgcolor="#f2b82a" style="width:48px;height:4px;font-size:0;line-height:0;background-color:#f2b82a;background-image:linear-gradient(90deg,#f2b82a,#f04e12);border-radius:2px;">&nbsp;</td></tr>
            </table>

            <h1 class="h1 t-main" style="margin:16px 0 0;font-family:{!! $font !!};font-size:24px;line-height:32px;font-weight:700;letter-spacing:-0.01em;color:#1c1917;">{{ $heading }}</h1>

            @if ($greeting)
                <p class="t-body" style="margin:20px 0 0;font-family:{!! $font !!};font-size:16px;line-height:26px;color:#44403c;">{{ $greeting }}</p>
            @endif

            @foreach ($blocks as $b)
                @switch($b['type'])
                    @case('code')
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
                            <tr>
                                <td class="box" align="center" bgcolor="#fafaf9" style="background-color:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;padding:20px 16px 22px;">
                                    <div class="t-muted" style="font-family:{!! $font !!};font-size:12px;line-height:16px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#57534e;">{{ $b['label'] }}</div>
                                    <div class="code t-main" style="margin-top:8px;font-family:{!! $font !!};font-size:36px;line-height:44px;font-weight:700;letter-spacing:10px;font-variant-numeric:tabular-nums;color:#1c1917;padding-left:10px;">{{ $b['code'] }}</div>
                                </td>
                            </tr>
                        </table>
                        @break

                    @case('button')
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="btn" style="margin-top:28px;">
                            <tr>
                                <td bgcolor="#7d1d23" style="background-color:#7d1d23;border-radius:8px;">
                                    <a href="{{ $b['url'] }}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:{!! $font !!};font-size:16px;line-height:20px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">{{ $b['label'] }}</a>
                                </td>
                            </tr>
                        </table>
                        <p class="t-muted" style="margin:16px 0 0;font-family:{!! $font !!};font-size:13px;line-height:20px;color:#78716c;">If the button does not work, copy this link into your browser:<br><a href="{{ $b['url'] }}" target="_blank" class="t-link" style="color:#7d1d23;word-break:break-all;">{{ $b['url'] }}</a></p>
                        @break

                    @case('details')
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
                            @foreach ($b['rows'] as $label => $value)
                                <tr>
                                    <td class="dl rule t-muted" valign="top" width="120" style="width:120px;padding:12px 16px 12px 0;border-top:1px solid #e7e5e4;{{ $loop->last ? 'border-bottom:1px solid #e7e5e4;' : '' }}font-family:{!! $font !!};font-size:14px;line-height:22px;color:#78716c;">{{ $label }}</td>
                                    <td class="rule t-main" valign="top" style="padding:12px 0;border-top:1px solid #e7e5e4;{{ $loop->last ? 'border-bottom:1px solid #e7e5e4;' : '' }}font-family:{!! $font !!};font-size:15px;line-height:22px;font-weight:600;color:#1c1917;">{{ $value }}</td>
                                </tr>
                            @endforeach
                        </table>
                        @break

                    @case('notice')
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
                            <tr>
                                <td class="box" bgcolor="#fafaf9" style="background-color:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;padding:16px 20px;">
                                    <div class="t-muted" style="font-family:{!! $font !!};font-size:12px;line-height:16px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#57534e;">{{ $b['label'] }}</div>
                                    <div class="t-main" style="margin-top:6px;font-family:{!! $font !!};font-size:16px;line-height:24px;color:#1c1917;">{{ $b['text'] }}</div>
                                </td>
                            </tr>
                        </table>
                        @break

                    @default
                        <p class="t-body" style="margin:16px 0 0;font-family:{!! $font !!};font-size:16px;line-height:26px;color:#44403c;">{{ $b['text'] }}</p>
                @endswitch
            @endforeach

            <p class="t-body" style="margin:32px 0 0;font-family:{!! $font !!};font-size:16px;line-height:26px;color:#44403c;">ZPPSU DRRMO</p>
        </td>
    </tr>

    {{-- Footer --}}
    <tr>
        <td class="px" style="padding:24px 40px 0;">
            <p class="t-muted" style="margin:0;font-family:{!! $font !!};font-size:13px;line-height:20px;color:#78716c;">Disaster Risk Reduction and Management Office<br>Zamboanga Peninsula Polytechnic State University</p>
            <p class="t-muted" style="margin:12px 0 0;font-family:{!! $font !!};font-size:13px;line-height:20px;color:#78716c;">You got this email because of your DRRMO EAMS account. This is an automated email. Replies are not read.</p>
        </td>
    </tr>

</table>
</td>
</tr>
</table>
</body>
</html>
