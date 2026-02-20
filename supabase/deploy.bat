@echo off
echo == GemasFis Edge Functions Deploy ==

REM Supabase projesine bağlan
supabase link --project-ref zroxzbuuavrhfaikvsym

REM Secrets ayarla (Gemini API Key gerekli — aistudio.google.com/apikey adresinden alın)
echo Lutfen Gemini API Key girin:
set /p GEMINI_KEY="> "
supabase secrets set GEMINI_API_KEY=%GEMINI_KEY%

REM Logo ERP ayarları (isteğe bağlı — şimdi boş bırakılabilir)
REM supabase secrets set LOGO_API_URL=http://192.168.1.100:8090
REM supabase secrets set LOGO_USERNAME=admin
REM supabase secrets set LOGO_PASSWORD=sifre
REM supabase secrets set LOGO_FIRM_NO=1
REM supabase secrets set LOGO_PERIOD_NO=1

REM Edge Functions'ları deploy et
echo.
echo == analyze-receipt deploy ediliyor...
supabase functions deploy analyze-receipt --no-verify-jwt

echo.
echo == get-logo-data deploy ediliyor...
supabase functions deploy get-logo-data --no-verify-jwt

echo.
echo == transfer-to-logo deploy ediliyor...
supabase functions deploy transfer-to-logo --no-verify-jwt

echo.
echo ✅ Tum Edge Functions deploy edildi!
pause
