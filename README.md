# Atama Takip · Vercel'de iPhone bildirimleri

Ana alan adı P94 mobil panelini açar. Eski panel /panel adresindedir. Yeni doğrulanmış ilanlar public/p94/feed.json üzerinden okunur. Kullanıcının puanı cihazda kalır.

1. Bu Next.js deposunu Vercel'e bağla ve kullanacağın HTTPS alan adını projeye ekle.
2. Supabase SQL Editor'da yeni bir veritabanı için önce [ana şemayı](supabase/schema.sql), sonra [Web Push tablolarını](supabase/webpush.sql) çalıştır. Ana şema zaten kuruluysa yalnızca webpush.sql gerekir.
3. Vercel Production ortamına NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY ve en az 32 rastgele karakterli CRON_SECRET ekle, ardından yeniden deploy et. Gizli değerleri repoya koyma. İlk bildirim isteğinde sunucu kalıcı VAPID anahtarlarını Supabase'de üretir. Mevcut VAPID_PUBLIC_KEY ve VAPID_PRIVATE_KEY kullanılıyorsa bu çifti koru.
4. GitHub → Settings → Secrets and variables → Actions içinde Variables bölümüne P94_SITE_URL (ör. https://siten.com), Secrets bölümüne Vercel'dekiyle aynı CRON_SECRET değerini ekle. Actions açık olmalı. İlan dosyası main dalında değiştiğinde gönderim denenir. Saatlik tekrar ve Vercel'deki günlük cron kaçırılan gönderimleri yeniden kontrol eder. Zamanlanmış çalıştırmalar gecikebilir. Actions → Deliver P94 alerts → Run workflow ile gönderim yolunu sınayabilirsin.
5. iPhone’da asıl alan adını Safari’de aç → Paylaş → Ana Ekrana Ekle. Simgeyi aç → Bildirimler → Bildirimleri aç → İzin Ver. İlk onayda gerçek Web Push test bildirimi gönderilir. Alan adı değişirse yeni simgeden yeniden abone ol. Yeni abonelik esnasında açık olan ilanlar başlangıç listesine alınır; sonradan eklenen açık ilanlar bildirilir.

İlanların kaynağı mevcut saatlik resmî kaynak taramasıdır. Bildirim sunucusunun çalışması için uygulamanın veya ChatGPT'nin telefonda açık olması gerekmez. Sağlayıcının bildirimi kabul etmesi cihazın ekranda gösterdiğini doğrulamaz.
