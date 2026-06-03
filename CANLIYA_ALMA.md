# InsightQuotes Canliya Alma Plani

Bu proje TanStack Start kullaniyor.
Yani sadece statik HTML degil; server function taraflari da var.

Bu yuzden hosting secimi onemli.

## En Basit Onerilen Yol

```txt
GitHub + Netlify
```

Burada:

- GitHub kod deposu olur.
- Netlify siteyi internete yayinlar.
- Supabase veritabani/auth olarak kalir.
- Resend email gonderimi olarak kalir.

## Neden GitHub?

GitHub hosting degil, kod deposudur.

Faydasi:

- Kod yedeklenir.
- Netlify GitHub reposunu takip eder.
- Her degisiklikte otomatik deploy yapabilir.
- Geri alma ve versiyon takibi kolay olur.

## Neden Netlify?

TanStack Start icin resmi destekli hosting seceneklerinden biridir.

Avantajlari:

- GitHub ile kolay baglanir.
- Otomatik deploy yapar.
- HTTPS otomatik gelir.
- Custom domain baglamak kolaydir.
- Environment variables panelden eklenebilir.

## Alternatifler

### 1. Cloudflare

Guclu ve hizli bir secenek.
Ama ilk kurulum Netlify'a gore biraz daha teknik olabilir.

### 2. Railway

Node app gibi deploy etmek icin rahat olabilir.
Ama newsletter/landing gibi bir proje icin Netlify daha alisik ve pratik.

### 3. Vercel

Kullanilabilir ama bu proje TanStack Start oldugu icin Netlify/Cloudflare/Railway daha risksiz.

## Bizim Secimimiz

Bu proje icin onerilen yol:

```txt
GitHub repo olustur -> Netlify'a bagla -> env degerlerini ekle -> domain bagla
```

## Canliya Alma Sirasi

### 1. GitHub Repo Olustur

1. GitHub'a gir.
2. Yeni repository olustur.
3. Isim ornegi:

```txt
insightquotes-main
```

4. Private repo yapabilirsin.
5. Kodlar bu repoya push edilir.

Onemli:

`.env` GitHub'a yuklenmemeli.
Bu dosya artik `.gitignore` icinde.

### 2. Netlify Projesi Olustur

1. Netlify'a gir.
2. `Add new site` sec.
3. `Import an existing project` sec.
4. GitHub hesabini bagla.
5. `insightquotes-main` reposunu sec.

### 3. Netlify Build Ayarlari

Build command:

```txt
npm run build
```

Publish directory:

```txt
dist/client
```

Not:

TanStack Start icin Netlify tarafinda resmi entegrasyon gerekebilir.
Deploy asamasinda hata alirsak Netlify plugin/config ayarini ekleyecegiz.

### 4. Netlify Environment Variables

Netlify panelinde `Site configuration > Environment variables` bolumune gir.

Su degerleri ekle:

```txt
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
VITE_SUPABASE_PROJECT_ID
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
RESEND_API_KEY
RESEND_FROM
```

Local `.env` icindeki degerlerle ayni olacak.

### 5. Resend Domain Ayari

Domain Resend'de verified olduysa:

`RESEND_FROM` artik test adresi olmamali.

Ornek:

```txt
RESEND_FROM=InsightQuotes <hello@senindomainin.com>
```

Resend'de hangi email/domain verified ise onu kullan.

### 6. Domain Baglama

Netlify'da:

1. `Domain management` bolumune gir.
2. Custom domain ekle.
3. Domain panelinde Netlify'in verdigi DNS kayitlarini gir.
4. HTTPS otomatik aktif olur.

### 7. Canli Test

Canli domain acildiktan sonra bastan sona test et:

1. Ana sayfadan abone ol.
2. Confirmation email gelsin.
3. Confirm linkine tikla.
4. Admin panelde abone `active` olsun.
5. Admin panelde bulten olustur.
6. Bulteni `published` yap.
7. Archive sayfasinda gor.
8. Send newsletter ile aktif abonelere gonder.
9. Unsubscribe linkini test et.

## Canliya Cikmadan Once Son Kontrol

- `.env` GitHub'a yuklenmedi.
- Netlify env degerleri eklendi.
- Resend domain verified.
- `RESEND_FROM` kendi domain emaili oldu.
- Supabase tablolar hazir.
- Admin kullanici var.
- Admin role var.
- Build basarili.
- Canli domain HTTPS aciliyor.

## Kisa Cevap

Evet, GitHub kullanacagiz.

Ama GitHub sadece kodu tutacak.
Hosting icin en pratik yol Netlify.

Final mimari:

```txt
GitHub = kod deposu
Netlify = hosting
Supabase = database/auth
Resend = email
```
