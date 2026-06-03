# InsightQuotes Yapilacaklar

Bu dosya projenin su anki durumunu ve siradaki isleri sade sekilde takip etmek icin hazirlandi.

## Su Anki Durum

Projede bulten abonelik sistemi baslatilmis durumda.

Var olan kisimlar:

- Landing page uzerinde email abonelik formu var.
- Kullanici email girince `subscribers` tablosuna kayit yapiliyor.
- Abone ilk basta `pending` durumunda tutuluyor.
- Onay emaili Resend ile gonderilmeye calisiliyor.
- Kullanici emaildeki onay linkine tiklayinca abonelik `active` oluyor.
- Kullanici unsubscribe linkine tiklayinca abonelik `unsubscribed` oluyor.
- Email gonderim denemeleri `email_events` tablosuna yaziliyor.

Eksik olan ana kisimlar:

- Admin panel yok.
- Bulten olusturma ve duzenleme ekrani yok.
- Aktif abonelere toplu bulten gonderme sistemi yok.
- Bulten arsiv sayfasi yok.
- Resend domain/API ayari tamamlanmamis.

## 1. Once Duzeltilmesi Gereken Kritik Isler

### 1.1 Veritabani admin yetki hatasini duzelt

Son migration dosyasinda `public.has_role` fonksiyonu siliniyor gibi gorunuyor.
Ama onceki veritabani kurallari hala `public.has_role` kullaniyor.

Bu durum admin yetki kontrollerini bozabilir.

Durum: Tamamlandi.

Yapilacak:

- Migration dosyalari kontrol edildi.
- `private.has_role` kullanilmasina karar verildi.
- `private` schema ve `private.has_role` fonksiyonu son migration icinde olusturuldu.
- Admin RLS policy'leri `private.has_role` kullanacak sekilde guncellendi.
- `public.has_role` policy bagimliliklari kaldirildiktan sonra siliniyor.

Oncelik: Cok yuksek.

### 1.2 Yeniden abonelikte token yenileme

Kodda unsubscribe olmus biri tekrar abone olursa `pending` durumuna donuyor.
Ama yorumda "fresh tokens" yazmasina ragmen yeni token uretilmiyor.

Durum: Tamamlandi.

Yapilacak:

- Tekrar abone olan kullanici icin yeni `confirmation_token` uretiliyor.
- Tekrar abone olan kullanici icin yeni `unsubscribe_token` uretiliyor.
- Eski onay linkleri yeni token geldikten sonra gecersiz kaliyor.

Oncelik: Yuksek.

### 1.3 Lokal ortam ayarlarini tamamla

Su an `.env` dosyasinda `RESEND_API_KEY` ve `SUPABASE_SERVICE_ROLE_KEY` yok.
Bu nedenle local ortamda abonelik sistemi tam test edilemez.

Yapilacak:

- `RESEND_API_KEY` local veya Lovable Secrets icine eklenecek.
- `SUPABASE_SERVICE_ROLE_KEY` local veya Lovable Secrets icine eklenecek.
- Secret degerleri repo icine commit edilmeyecek.

Oncelik: Yuksek.

### 1.4 Paketleri kurup build testi yap

Build komutu calistirildiginda `vite: command not found` hatasi geldi.
Bu paketlerin kurulmadigini gosteriyor.

Durum: Tamamlandi.

Yapilacak:

- `npm install` calistirildi.
- `npm run build` calistirildi ve basarili oldu.
- `npm run lint` calistirildi. Hata yok, sadece mevcut UI kit Fast Refresh uyarilari var.

Oncelik: Yuksek.

## 2. Mail Sistemi Ayarlari

### 2.1 Resend domain dogrulama

Su an mail gonderici adresi Resend test adresi:

```txt
InsightQuotes <onboarding@resend.dev>
```

Canli kullanim icin kendi domaininden gondermek daha dogru.

Yapilacak:

- Resend hesabinda domain eklenecek.
- DNS kayitlari domain paneline girilecek.
- Domain Resend tarafinda verify edilecek.
- Yeni API key alinacak.
- `RESEND_API_KEY` guncellenecek.
- Kodda `from` adresi kendi domainine gore degistirilecek.

Ornek:

```txt
InsightQuotes <hello@insightquotes.com>
```

Oncelik: Yuksek.

### 2.2 Mail icerigini markaya gore duzenle

Onay maili su an calisir durumda ama temel bir tasarima sahip.

Yapilacak:

- Onay maili metni daha profesyonel hale getirilecek.
- Unsubscribe linki korunacak.
- Mailde marka adi, gonderim sikligi ve beklenti net anlatilacak.

Oncelik: Orta.

## 2.3 Server function CSRF korumasi

Durum: Tamamlandi.

TanStack Start server function endpointleri icin CSRF middleware eklendi.

## 3. Admin Panel

Admin panel bu projenin bir sonraki buyuk parcasi.

### 3.1 Admin giris sistemi

Durum: Ilk surum tamamlandi.

Yapilacak:

- Supabase Auth ile giris ekrani hazirlandi.
- Sadece `user_roles` tablosunda `admin` rolu olan kullanicilar admin dashboard verisine erisebiliyor.
- Admin olmayan kullanicilar dashboard tarafinda engelleniyor.

Oncelik: Yuksek.

### 3.2 Admin dashboard ana sayfasi

Durum: Ilk surum tamamlandi.

Yapilacak:

- Toplam abone sayisi gosteriliyor.
- Aktif abone sayisi gosteriliyor.
- Pending abone sayisi gosteriliyor.
- Unsubscribed abone sayisi gosteriliyor.
- Son email gonderim loglari gosteriliyor.
- Son olusturulan bultenler listeleniyor.

Oncelik: Yuksek.

### 3.3 Bulten olusturma ekrani

`issues` tablosu var ama onu yonetecek ekran yok.

Durum: Ilk surum tamamlandi.

Yapilacak:

- Yeni bulten olusturma formu yapildi.
- Alanlar:
  - Issue number
  - Slug
  - Title
  - Insight
  - Insight author
  - Quote
  - Quote author
  - Action text
  - Body
  - Status
- Bulten `draft` olarak kaydedilebiliyor.
- Bulten `published` olarak yayinlanabiliyor.

Oncelik: Yuksek.

### 3.4 Bulten listesi

Durum: Ilk surum tamamlandi.

Yapilacak:

- Admin panelde tum bultenler listeleniyor.
- Draft ve published durumlari gorulebiliyor.
- Bulten duzenleme sayfasi eklendi.

Oncelik: Orta.

### 3.5 Abone listesi

Durum: Ilk surum tamamlandi.

Yapilacak:

- Aboneler listeleniyor.
- Email, durum, kaynak, kayit tarihi, onay tarihi ve unsubscribe tarihi gosteriliyor.
- Status filtreleri eklendi:
  - pending
  - active
  - unsubscribed
  - bounced
  - complained

Oncelik: Orta.

## 4. Bulten Gonderim Sistemi

### 4.1 Aktif abonelere bulten gonder

Su an sadece onay emaili gonderiliyor.
Aktif abonelere asil bultenleri gonderecek sistem yok.

Durum: Ilk surum tamamlandi.

Yapilacak:

- Admin panelden bir published issue secilebiliyor.
- Sadece `active` abonelere gonderiliyor.
- Her email icinde unsubscribe linki var.
- Gonderim sonucu `email_events` tablosuna yaziliyor.

Oncelik: Yuksek.

### 4.2 Gonderim onay ekrani

Toplu email gonderimi riskli oldugu icin tek tikla hemen gondermek yerine onay ekrani olmali.

Durum: Ilk surum tamamlandi.

Yapilacak:

- Gonderilecek bulten gosteriliyor.
- Kac aktif aboneye gidecegi gosteriliyor.
- Admin onay kutusunu isaretlerse gonderim basliyor.

Oncelik: Orta.

### 4.3 Gonderim loglari

Durum: Ilk surum tamamlandi.

Yapilacak:

- Bulten gonderiminde kime gonderildigi `email_events` ile kaydediliyor.
- Basarili/basarisiz durumlari `sent` ve `failed` olarak kaydediliyor.
- Resend provider id saklaniyor.

Oncelik: Orta.

## 5. Public Sayfalar

### 5.1 Bulten arsiv sayfasi

Landing page'de `Archive` linki var ama arsiv sayfasi yok.

Durum: Tamamlandi.

Yapilacak:

- `/archive` sayfasi olusturuldu.
- Published bultenler listeleniyor.
- Her bulten detay sayfasina gidiyor.

Oncelik: Orta.

### 5.2 Bulten detay sayfasi

Durum: Tamamlandi.

Yapilacak:

- `/issues/$slug` route'u olusturuldu.
- Published bulten detaylari gosteriliyor.
- Draft bultenler public tarafta gorunmuyor.

Oncelik: Orta.

### 5.3 Landing page linklerini temizle

Landing page'deki bazi linkler su an placeholder.

Durum: Kismen tamamlandi.

Yapilacak:

- `#archive` yerine gercek `/archive` linki verildi.
- `#login` yerine admin login route'u verilecek.
- Olmayan section linkleri ya yapilacak ya kaldirilacak.

Oncelik: Dusuk/Orta.

## 6. SEO ve Marka Temizligi

### 6.1 Root meta bilgilerini duzelt

Root route icinde hala Lovable bilgileri var.

Yapilacak:

- Site title InsightQuotes olarak degistirilecek.
- Description markaya uygun yazilacak.
- OG/Twitter image bilgileri duzenlenecek.
- Author Lovable yerine dogru bilgi olacak.

Oncelik: Orta.

### 6.2 Dil ve metin kontrolu

Yapilacak:

- Site tamamen Ingilizce mi Turkce mi olacak karar verilecek.
- Landing page metinleri buna gore tutarli hale getirilecek.
- Confirm/unsubscribe sayfalari da ayni dilde olacak.

Oncelik: Orta.

## 7. Test ve Kontrol

### 7.1 Teknik testler

Yapilacak:

- `npm install`
- `npm run build`
- `npm run lint`

Oncelik: Yuksek.

### 7.2 Abonelik akisi testi

Yapilacak:

- Yeni email ile abone olma test edilecek.
- Pending kayit kontrol edilecek.
- Onay maili gidiyor mu kontrol edilecek.
- Confirm link calisiyor mu kontrol edilecek.
- Active durumuna geciyor mu kontrol edilecek.
- Unsubscribe link calisiyor mu kontrol edilecek.
- Yeniden abonelik calisiyor mu kontrol edilecek.

Oncelik: Yuksek.

### 7.3 Admin panel testi

Yapilacak:

- Admin olmayan kullanici panele girememeli.
- Admin kullanici panele girebilmeli.
- Bulten olusturma calismali.
- Bulten yayinlama calismali.
- Aktif abonelere gonderim calismali.

Oncelik: Yuksek.

## Onerilen Is Sirasi

1. Veritabani `has_role` sorununu duzelt.
2. Yeniden abonelikte token yenilemeyi duzelt.
3. Env/secrets ayarlarini tamamla.
4. `npm install` ve build testi yap.
5. Resend domain ve gonderici adresini duzelt.
6. Admin login sistemi kur.
7. Admin dashboard yap.
8. Bulten olusturma/duzenleme ekranlarini yap.
9. Aktif abonelere bulten gonderme sistemini kur.
10. Arsiv ve bulten detay sayfalarini yap.
11. SEO ve marka metinlerini temizle.

## En Acil Sonraki Adim

Ilk olarak veritabani migration sorunu duzeltilmeli.

Sebep:

- Admin panel yapmadan once admin yetki sistemi saglam olmali.
- Bulten gonderim sistemi admin yetkisine bagli olacak.
- Bu temel bozuk kalirsa sonraki isler de sorun cikarabilir.
