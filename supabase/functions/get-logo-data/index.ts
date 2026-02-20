// Edge Function: get-logo-data
// Runtime: Deno (Supabase)
// Görev: Logo Tiger'dan masraf kalemleri ve kasa/banka hesaplarını çek
//        Logo API yapılandırılmamışsa mock veri döndür

const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOGO_API_URL   = Deno.env.get('LOGO_API_URL')   ?? '';
const LOGO_USERNAME  = Deno.env.get('LOGO_USERNAME')  ?? '';
const LOGO_PASSWORD  = Deno.env.get('LOGO_PASSWORD')  ?? '';
const LOGO_FIRM_NO   = Deno.env.get('LOGO_FIRM_NO')   ?? '1';
const LOGO_PERIOD_NO = Deno.env.get('LOGO_PERIOD_NO') ?? '1';

async function getLogoToken(): Promise<string> {
    const res = await fetch(`${LOGO_API_URL}/api/v1/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            UserName: LOGO_USERNAME, Password: LOGO_PASSWORD,
            FirmNo: Number(LOGO_FIRM_NO), PeriodNo: Number(LOGO_PERIOD_NO),
        }),
    });
    if (!res.ok) throw new Error(`Logo token hatası: ${res.status}`);
    const data = await res.json();
    return data.Token ?? data.token;
}

const MOCK_SERVICE_CARDS = [
    { code: 'GID.OFIS', name: 'Ofis & Kırtasiye Giderleri',       type: 'expense', kdvRate: 18 },
    { code: 'GID.ARAC', name: 'Araç & Ulaşım Giderleri',          type: 'expense', kdvRate: 18 },
    { code: 'GID.YMK',  name: 'Yemek & Temsil Giderleri',         type: 'expense', kdvRate: 18 },
    { code: 'GID.OTL',  name: 'Otel & Konaklama Giderleri',        type: 'expense', kdvRate: 18 },
    { code: 'GID.TLS',  name: 'Telefon & İletişim Giderleri',      type: 'expense', kdvRate: 18 },
    { code: 'GID.BLG',  name: 'Bilgisayar & Teknoloji Giderleri',  type: 'expense', kdvRate: 18 },
    { code: 'GID.RKL',  name: 'Reklam & Pazarlama Giderleri',      type: 'expense', kdvRate: 18 },
    { code: 'GID.GEN',  name: 'Genel Giderler',                    type: 'expense', kdvRate: 18 },
];

const MOCK_CASH_ACCOUNTS = [
    { code: 'KA-001', name: 'Ana Kasa (TL)',        type: 'cash',        currency: 'TRY' },
    { code: 'KA-002', name: 'Döviz Kasa (USD)',     type: 'cash',        currency: 'USD' },
    { code: 'BK-001', name: 'İş Bankası Vadesiz',   type: 'bank',        currency: 'TRY' },
    { code: 'BK-002', name: 'Garanti BBVA Vadesiz', type: 'bank',        currency: 'TRY' },
    { code: 'KK-001', name: 'Kurumsal Kredi Kartı', type: 'credit_card', currency: 'TRY' },
];

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

    try {
        const { type } = await req.json();

        // Logo API yapılandırılmamışsa mock döndür
        if (!LOGO_API_URL || !LOGO_USERNAME) {
            const mockData = type === 'service_cards' ? MOCK_SERVICE_CARDS
                           : type === 'cash_accounts' ? MOCK_CASH_ACCOUNTS
                           : null;
            if (!mockData) {
                return new Response(
                    JSON.stringify({ error: `Bilinmeyen tip: ${type}` }),
                    { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
                );
            }
            return new Response(JSON.stringify(mockData), {
                headers: { ...cors, 'Content-Type': 'application/json' },
            });
        }

        // Gerçek Logo API
        const token = await getLogoToken();

        if (type === 'service_cards') {
            const res = await fetch(
                `${LOGO_API_URL}/api/v1/items?firmNo=${LOGO_FIRM_NO}&type=SERVICE&pageSize=200`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error(`Servis kartları getirilemedi: ${res.status}`);
            const data = await res.json();
            const items = (data.items ?? data ?? []).map((item: Record<string, unknown>) => ({
                code:    item.CODE ?? item.code,
                name:    item.NAME ?? item.name,
                type:    'expense',
                kdvRate: item.VAT_RATE ?? item.vatRate ?? 18,
            }));
            return new Response(JSON.stringify(items), { headers: { ...cors, 'Content-Type': 'application/json' } });
        }

        if (type === 'cash_accounts') {
            const results: unknown[] = [];
            for (const [endpoint, accType] of [['cashOffices', 'cash'], ['bankAccounts', 'bank']] as const) {
                const res = await fetch(
                    `${LOGO_API_URL}/api/v1/${endpoint}?firmNo=${LOGO_FIRM_NO}&pageSize=100`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (!res.ok) continue;
                const data = await res.json();
                for (const item of (data.items ?? data ?? [])) {
                    results.push({
                        code:     item.CODE ?? item.code,
                        name:     item.DESCRIPTION ?? item.description ?? item.name,
                        type:     accType,
                        currency: item.CURRENCY_CODE ?? 'TRY',
                    });
                }
            }
            return new Response(JSON.stringify(results), { headers: { ...cors, 'Content-Type': 'application/json' } });
        }

        return new Response(
            JSON.stringify({ error: `Bilinmeyen tip: ${type}` }),
            { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
        );

    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('get-logo-data error:', msg);
        return new Response(
            JSON.stringify({ error: msg }),
            { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
    }
});
