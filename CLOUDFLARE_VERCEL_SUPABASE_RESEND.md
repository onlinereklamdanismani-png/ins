# Cloudflare + Vercel + Supabase + Resend Kurulum Plani

Bu projeyi su mimariyle canliya alacagiz:

```txt
Cloudflare = domain, DNS, CDN, temel guvenlik
Vercel = uygulama hosting
Supabase = database + auth
Resend = email gonderimi
GitHub = kod deposu
```

## Neden Bu Mimari?

### Cloudflare

Cloudflare domain ve DNS tarafinda kullanilacak.

Faydalari:

- DNS yonetimi kolay.
- HTTPS ve CDN katmani guclu.
- Domain kayitlari tek yerden yonetilir.
- Vercel ve Resend icin gerekli DNS kayitlari buraya girilir.

### Vercel

Vercel uygulamayi yayinlayacak.

Bu proje TanStack Start kullaniyor.
Vercel, TanStack Start uygulamalarini Nitro ile destekliyor.

Projede Vercel icin su ayar eklendi:

```ts
nitro: { preset: "vercel" }
```

### Supabase

Supabase:

- database
- auth
- admin role tablosu
- subscribers
- issues
- email_events

icin kullaniliyor.

### Resend

Resend:

- confirmation email
- newsletter email

gonderimi icin kullaniliyor.

## Yapilacak Siralama

## 1. GitHub Repository

Kod once GitHub'a yuklenecek.

Onemli:

- `.env` GitHub'a yuklenmemeli.
- `.gitignore` icine `.env` eklendi.
- Secret degerleri sadece Vercel panelinde tutulacak.

## 2. Vercel Deploy

Vercel'de:

1. `Add New Project`
2. GitHub reposunu sec
3. Framework otomatik algilanabilir
4. Build command:

```txt
npm run build
```

5. Environment variables ekle

## 3. Vercel Environment Variables

Vercel panelinde su degerleri ekle:

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

Onemli:

- `SUPABASE_SERVICE_ROLE_KEY` gizlidir.
- `RESEND_API_KEY` gizlidir.
- Bu degerler GitHub'a yazilmaz.

## 4. Resend Domain

Domain Resend'de verify edildi.

Siradaki adim:

`RESEND_FROM` test adresinden kendi domain adresine cevrilecek.

Ornek:

```txt
RESEND_FROM=InsightQuotes <hello@senindomainin.com>
```

Hangi email adresi Resend'de verified domain altindaysa onu kullan.

## 5. Cloudflare DNS

Cloudflare'da iki tip kayit olacak:

### Vercel icin

Vercel custom domain eklediginde DNS kayitlarini verecek.

Genelde:

```txt
A veya CNAME kaydi
```

Cloudflare DNS'e Vercel'in verdigi kayitlar girilecek.

### Resend icin

Resend domain verify icin DNS kayitlari verir.

Genelde:

```txt
SPF
DKIM
DMARC
```

Bu kayitlar Cloudflare DNS'e girilecek.

## 6. Canli Domain Testi

Canli domain baglandiktan sonra test sirasi:

1. Ana sayfadan abone ol
2. Confirmation email gelsin
3. Confirm linkine tikla
4. Admin panelde abone active gorunsun
5. Admin panelde bulten olustur
6. Bulteni published yap
7. Archive sayfasinda gor
8. Send newsletter ile gonder
9. Unsubscribe test et

## Bu Asamada Dikkat

Localdeki `.env` degerleri Vercel'e elle girilecek.

Canli domain kullanildiginda email linkleri artik:

```txt
https://senindomainin.com/confirm/...
https://senindomainin.com/unsubscribe/...
```

seklinde uretilmeli.

Kod bunu host header uzerinden otomatik uretir.

## Sonraki Teknik Is

Canli deploy oncesi bir koruma daha eklemek iyi olur:

```txt
Ayni bulteni iki kez gonderme korumasi
```

Bu, adminin yanlislikla ayni issue'yu tekrar gondermesini engeller.

## Kaynaklar

- Vercel TanStack Start docs: https://vercel.com/docs/frameworks/full-stack/tanstack-start
- Cloudflare TanStack Start docs: https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack/
- TanStack Start hosting docs: https://tanstack.com/start/latest/docs/framework/react/guide/hosting
