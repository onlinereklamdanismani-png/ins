# InsightQuotes Bitirme Adimlari

Bu dosya projeyi canli kullanima hazir hale getirmek icin en basit sirayi anlatir.

## Kisa Ozet

Kod tarafi buyuk olcude hazir.

Senin yapman gereken ana seyler:

1. Supabase'de admin kullanici olusturmak.
2. Supabase secret key'i projeye eklemek.
3. Resend API key ve gonderici email ayarini eklemek.
4. Admin panelden girip test etmek.

## 1. Supabase'de Admin Kullanici Olustur

1. Supabase paneline gir.
2. Projeni ac.
3. Sol menuden `Authentication` bolumune gir.
4. `Users` sekmesine gir.
5. `Add user` veya `Create user` butonuna tikla.
6. Bir email ve sifre belirle.

Ornek:

```txt
Email: admin@senindomainin.com
Password: guclu-bir-sifre
```

7. Kullanici olustuktan sonra kullanicinin `User ID` degerini kopyala.

## 2. Bu Kullaniciyi Admin Yap

Supabase'de sol menuden `SQL Editor` bolumune gir.

Asagidaki SQL'i ac:

```sql
insert into public.user_roles (user_id, role)
values ('BURAYA_USER_ID_GELECEK', 'admin')
on conflict (user_id, role) do nothing;
```

`BURAYA_USER_ID_GELECEK` kismina az once kopyaladigin User ID'yi yaz.

Ornek:

```sql
insert into public.user_roles (user_id, role)
values ('11111111-2222-3333-4444-555555555555', 'admin')
on conflict (user_id, role) do nothing;
```

Sonra `Run` butonuna tikla.

## 3. Supabase Service Role Key Ekle

Admin panelin veri okuyup yazmasi icin service role key gerekiyor.

1. Supabase panelinde `Project Settings` bolumune gir.
2. `API` sekmesine gir.
3. `service_role` key'i bul.
4. Bu key'i kopyala.

Sonra projedeki `.env` dosyasina sunu ekle:

```txt
SUPABASE_SERVICE_ROLE_KEY=buraya_service_role_key
```

Onemli:

- Bu key gizlidir.
- Kimseyle paylasilmaz.
- GitHub'a yuklenmez.

## 4. Resend API Key Ekle

Email gondermek icin Resend gerekiyor.

1. Resend hesabina gir.
2. `API Keys` bolumune gir.
3. Yeni API key olustur.
4. Key `re_...` ile baslar.

Sonra `.env` dosyasina ekle:

```txt
RESEND_API_KEY=re_buraya_key
```

## 5. Gonderici Email Ayarla

Ilk test icin su sekilde kalabilir:

```txt
RESEND_FROM=InsightQuotes <onboarding@resend.dev>
```

Ama canli kullanim icin kendi domainini Resend'de dogrulaman gerekir.

Canli ornek:

```txt
RESEND_FROM=InsightQuotes <hello@senindomainin.com>
```

## 6. Local Projeyi Yeniden Baslat

Terminalde calisan dev server varsa durdur.

Sonra tekrar baslat:

```bash
npm run dev
```

Sonra admin login sayfasina git:

```txt
http://localhost:8080/admin/login
```

## 7. Admin Panel Testi

1. Admin email ve sifre ile giris yap.
2. Dashboard aciliyor mu kontrol et.
3. `Manage issues` sayfasina gir.
4. Yeni bir bulten olustur.
5. Bulteni once `draft` olarak kaydet.
6. Sonra duzenleyip `published` yap.
7. `/archive` sayfasinda gorunuyor mu kontrol et.

## 8. Abonelik Testi

1. Ana sayfaya git:

```txt
http://localhost:8080/
```

2. Email adresiyle abone ol.
3. Mail kutunu kontrol et.
4. Confirm linkine tikla.
5. Admin panelde `Subscribers` sayfasindan durumun `active` oldugunu kontrol et.

## 9. Bulten Gonderim Testi

1. Admin panelde `Send newsletter` sayfasina gir.
2. Published bir bulten sec.
3. Aktif abone sayisini kontrol et.
4. Onay kutusunu isaretle.
5. Gonder.
6. `email_events` loglarini dashboard'da kontrol et.

## 10. Canliya Cikmadan Once

Mutlaka yap:

- Resend domain verify et.
- `RESEND_FROM` adresini kendi domainine cevir.
- Gercek admin kullanici disinda test kullanicilarini temizle.
- Bir kere bastan sona test yap:
  - abone ol
  - mail onayla
  - bulten olustur
  - bulten yayinla
  - bulten gonder
  - unsubscribe test et

## Su An Kalan En Kritik 3 Is

1. Supabase admin kullanici olusturmak.
2. `.env` icine `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM` eklemek.
3. Admin panelden gercek test yapmak.
