// Edge Function: transfer-to-logo
// Runtime: Deno (Supabase)
// Görev: Fiş verisini Logo Tiger REST API'ye aktar → Masraf fişi oluştur

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOGO_API_URL   = Deno.env.get('LOGO_API_URL')   ?? '';
const LOGO_USERNAME  = Deno.env.get('LOGO_USERNAME')  ?? '';
const LOGO_PASSWORD  = Deno.env.get('LOGO_PASSWORD')  ?? '';
const LOGO_FIRM_NO   = Deno.env.get('LOGO_FIRM_NO')   ?? '1';
const LOGO_PERIOD_NO = Deno.env.get('LOGO_PERIOD_NO') ?? '1';

const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

async function getLogoToken(): Promise<string> {
    const res = await fetch(`${LOGO_API_URL}/api/v1/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            UserName: LOGO_USERNAME,
            Password: LOGO_PASSWORD,
            FirmNo:   Number(LOGO_FIRM_NO),
            PeriodNo: Number(LOGO_PERIOD_NO),
        }),
    });
    if (!res.ok) throw new Error(`Logo token hatası: ${res.status}`);
    const data = await res.json();
    return data.Token ?? data.token;
}

async function createLogoExpenseDoc(token: string, payload: {
    receiptId: string; expenseCode: string; cashAccountCode: string;
    amount: number; kdvAmount: number; currency: string;
    date: string; merchantName: string; description?: string;
}) {
    const docDate = payload.date.replace(/-/g, '.');
    const body = {
        DOC_TYPE: 52, DATE: docDate,
        FICHENO:      `GF-${payload.receiptId.slice(-8).toUpperCase()}`,
        AUXIL_CODE:   payload.expenseCode,
        DESCRIPTION:  payload.description ?? payload.merchantName,
        TRANSACTIONS: {
            items: [{
                TYPE: 4, MASTER_CODE: payload.expenseCode, QUANTITY: 1,
                PRICE:      payload.amount - (payload.kdvAmount ?? 0),
                VAT_RATE:   18, VAT_AMOUNT: payload.kdvAmount ?? 0,
                TOTAL:      payload.amount, UNIT_CODE: 'ADET',
                AUXIL_CODE: payload.expenseCode,
                DESCRIPTION: payload.description ?? payload.merchantName,
            }],
        },
        PAYMENT_LIST: {
            items: [{
                PAYMENT_TYPE: 1, ACCOUNT_CODE: payload.cashAccountCode,
                AMOUNT: payload.amount, CURRENCY_CODE: payload.currency, DATE: docDate,
            }],
        },
    };
    const res = await fetch(
        `${LOGO_API_URL}/api/v1/purchaseInvoices?firmNo=${LOGO_FIRM_NO}&periodNo=${LOGO_PERIOD_NO}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(body) }
    );
    if (!res.ok) throw new Error(`Logo fiş oluşturma hatası: ${res.status} — ${await res.text()}`);
    return await res.json();
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

    let requestBody: { receiptId?: string; expenseCode?: string; cashAccountCode?: string; description?: string } = {};
    try {
        requestBody = await req.json();
        const { receiptId, expenseCode, cashAccountCode, description } = requestBody;

        if (!receiptId || !expenseCode || !cashAccountCode) {
            return new Response(
                JSON.stringify({ error: 'receiptId, expenseCode ve cashAccountCode zorunludur' }),
                { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
            );
        }

        const { data: receipt, error: dbErr } = await supabase
            .from('receipts').select('*').eq('id', receiptId).single();
        if (dbErr || !receipt) throw new Error(`Fiş bulunamadı: ${receiptId}`);

        await supabase.from('receipts').update({ logo_status: 'processing' }).eq('id', receiptId);

        const token     = await getLogoToken();
        const logoResult = await createLogoExpenseDoc(token, {
            receiptId, expenseCode, cashAccountCode,
            amount:       receipt.amount,
            kdvAmount:    receipt.kdv_amount ?? 0,
            currency:     receipt.currency ?? 'TRY',
            date:         receipt.date,
            merchantName: receipt.merchant_name,
            description:  description ?? receipt.description,
        });

        const logoRefNo = logoResult?.INTERNAL_REFERENCE?.toString() ?? `REF-${Date.now()}`;

        await supabase.from('receipts').update({
            logo_status:            'success',
            logo_ref_no:             logoRefNo,
            logo_expense_code:       expenseCode,
            logo_cash_account_code:  cashAccountCode,
            logo_transferred_at:     new Date().toISOString(),
            logo_error_message:      null,
        }).eq('id', receiptId);

        return new Response(JSON.stringify({ success: true, logoRefNo }), {
            headers: { ...cors, 'Content-Type': 'application/json' },
        });

    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('transfer-to-logo error:', msg);
        if (requestBody.receiptId) {
            await supabase.from('receipts')
                .update({ logo_status: 'failed', logo_error_message: msg })
                .eq('id', requestBody.receiptId);
        }
        return new Response(JSON.stringify({ success: false, errorMessage: msg }), {
            status: 200, headers: { ...cors, 'Content-Type': 'application/json' },
        });
    }
});
