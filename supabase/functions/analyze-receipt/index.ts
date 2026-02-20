// Edge Function: analyze-receipt
// Runtime: Deno (Supabase)
// Görev: Fiş görseli → Gemini Vision → OCR + kategori önerileri

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

    try {
        const { imageBase64, imageUrl } = await req.json();

        if (!imageBase64 && !imageUrl) {
            return new Response(
                JSON.stringify({ error: 'imageBase64 veya imageUrl gerekli' }),
                { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
            );
        }

        const imagePart = imageBase64
            ? { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }
            : { fileData: { mimeType: 'image/jpeg', fileUri: imageUrl } };

        const prompt = `Sen bir Türk muhasebe uzmanısın. Bu fiş/fatura görüntüsünü analiz et ve YALNIZCA aşağıdaki JSON formatında yanıt ver (başka hiçbir şey ekleme):

{
  "merchantName": "Satıcı adı",
  "taxNumber": "Vergi numarası veya null",
  "totalAmount": 0.00,
  "kdvAmount": 0.00,
  "kdvRate": 18,
  "currency": "TRY",
  "date": "YYYY-MM-DD",
  "rawText": "Fişin tüm metni",
  "lineItems": [{"description": "Ürün", "quantity": 1, "unitPrice": 0.00, "totalPrice": 0.00, "kdvRate": 18}],
  "aiSuggestions": [
    {"serviceCode": "GID.OFIS", "serviceName": "Ofis & Kırtasiye Giderleri", "confidence": 0.90, "reason": "Açıklama"},
    {"serviceCode": "GID.GEN",  "serviceName": "Genel Giderler",             "confidence": 0.50, "reason": "Açıklama"}
  ],
  "confidence": 0.95
}

Kategori kodları (en uygun 2-3 tanesini öner):
GID.OFIS=Ofis&Kırtasiye, GID.ARAC=Araç&Ulaşım, GID.YMK=Yemek&Temsil,
GID.OTL=Otel&Konaklama, GID.TLS=Telefon&İletişim, GID.BLG=Bilgisayar&Teknoloji,
GID.RKL=Reklam&Pazarlama, GID.SAG=Sağlık, GID.EGT=Eğitim, GID.GEN=Genel`;

        const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }, imagePart] }],
                generationConfig: { temperature: 0.1, topP: 0.95, maxOutputTokens: 2048 },
            }),
        });

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            throw new Error(`Gemini API hatası: ${geminiRes.status} — ${errText}`);
        }

        const geminiData = await geminiRes.json();
        const rawContent: string = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

        // JSON bloğunu çıkar
        const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)\s*```/) ?? rawContent.match(/({\s*"[\s\S]*})/);
        const jsonStr = jsonMatch ? jsonMatch[1] : rawContent.trim();
        const parsed = JSON.parse(jsonStr);

        return new Response(
            JSON.stringify({
                ocrData: {
                    rawText:      parsed.rawText      ?? '',
                    confidence:   parsed.confidence   ?? 0.5,
                    merchantName: parsed.merchantName ?? '',
                    taxNumber:    parsed.taxNumber    ?? undefined,
                    totalAmount:  parsed.totalAmount  ?? 0,
                    kdvAmount:    parsed.kdvAmount    ?? undefined,
                    currency:     parsed.currency     ?? 'TRY',
                    date:         parsed.date         ?? new Date().toISOString().slice(0, 10),
                    lineItems:    parsed.lineItems    ?? [],
                },
                aiSuggestions: parsed.aiSuggestions ?? [],
                confidence:    parsed.confidence    ?? 0.5,
            }),
            { headers: { ...cors, 'Content-Type': 'application/json' } }
        );

    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('analyze-receipt error:', msg);
        return new Response(
            JSON.stringify({ error: msg }),
            { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
    }
});
