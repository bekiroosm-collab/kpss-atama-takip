# Atama Takip — KPSS Ortaöğretim

Next.js + Vercel + Supabase başlangıç projesi. Arayüz mobil uyumludur; ilanlar, kaynak durumları ve bildirim akışı için temel uygulama uçları dahildir.

## Önemli üretim notu
Bu depo, **canlı resmî ilan toplayıcılarının tamamlandığını iddia etmez**. Kaynakların her biri için erişim yöntemi doğrulanıp ayrı adapter yazılmalıdır. `/api/cron/collect` şu an bilerek 503 döndürür ve sahte ilan üretmez. İŞKUR, Kariyer Kapısı, Resmî Gazete ve SBB sayfalarının erişim/robots/kullanım koşulları kontrol edilmeden agresif scraping yapılmamalıdır. Resmî başvuru için daima kaynak bağlantısı açılmalıdır.

## Yerelde çalıştırma
1. Node.js 20+ kur.
2. `npm install`
3. `.env.example` dosyasını `.env.local` olarak kopyala.
4. `npm run dev`

Supabase projesi oluşturup `supabase/schema.sql` dosyasını SQL Editor'da çalıştır. Supabase URL ve service role key değerlerini Vercel ortam değişkenlerine ekle. Service role key kesinlikle `NEXT_PUBLIC_` ile başlamamalı ve GitHub'a yüklenmemelidir.

## GitHub ve Vercel
1. Bu klasörü GitHub deposuna yükle.
2. Vercel'de **Add New → Project** ile depoyu içe aktar.
3. Framework: Next.js (otomatik algılanır).
4. Environment Variables bölümüne `.env.example` içindeki değişkenleri ekle.
5. Deploy et.

## Zamanlanmış kontrol
`vercel.json` her 30 dakikada `/api/cron/collect` çağırır. Vercel cron çağrısı `CRON_SECRET` ile korunur. Adapter'lar tamamlanmadan cron sadece güvenli bir yapılandırma uyarısı döndürür. Vercel planının cron sıklığı ve çalışma süresi limitlerini kontrol et.

## Push bildirimleri
VAPID anahtarları üret:
`npx web-push generate-vapid-keys`
`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` değişkenlerini ekle. Ayrıca istemci tarafı için `NEXT_PUBLIC_VAPID_PUBLIC_KEY` değişkenini aynı public key ile tanımla. Bildirim aboneliği Supabase'e kaydedilir. Gerçek ilan algılama ve push gönderimi, kaynak adapter'ları tamamlandıktan sonra cron işine bağlanmalıdır.

## Resmî kaynaklar
- https://esube.iskur.gov.tr/
- https://kariyerkapisi.gov.tr/isealim
- https://www.resmigazete.gov.tr/
- https://kamuilan.sbb.gov.tr/

## Güvenlik
- Supabase service role anahtarını istemciye veya GitHub'a koyma.
- `CRON_SECRET` için uzun, rastgele bir değer kullan.
- Başvuru şartları ve KPSS puan türünü ilan metninden doğrula; yalnızca başlıktan otomatik uygunluk kararı verme.
- Site resmî kurum değildir; kaynak bağlantıları üzerinden doğrulama yapılmalıdır.
