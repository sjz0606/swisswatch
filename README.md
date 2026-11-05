# SwissWatch premium boutique — 3D sayt

Statik sayt: `index.html`, `assets/`. Build kerak emas, lekin ES modullar sababli HTTP server orqali ochiladi (`file://` da 3D ishlamaydi):

```
python -m http.server 8198 --directory .
```

`_raw/` — xom manbalar (Telegram, YouTube), serverga yuklanmaydi.

## Tuzilishi

- `assets/watch.js` — kodda qurilgan 3D soat (three.js). Haqiqiy Toshkent vaqtini ko'rsatadi.
- `assets/app.js` — til (UZ/RU), scroll hikoyasi, konfigurator, vitrina, videolar.
- `assets/catalog.js` — 28 model. Yangilash shu faylda: `id` = Telegram post raqami, rasm `assets/p/<id>.jpg`, video `assets/v/<id>.mp4`.
- Videolar faqat kerak bo'lganda yuklanadi: sahifa ochilganda 0 ta.

## Manbalar

- Narx, o'lcham va video: t.me/s/swisswatch_premium, 2026-yil postlari.
- Ko'k va qora terish videolari: YouTube @Swisswatch.premiumboutique.
- Instagram anonim kirishni to'sdi (429), shuning uchun undan media olinmagan. Butik tashqi ko'rinishi rasmi yo'q.
- AI bilan yaratilgan rasm yoki video yo'q (Gemini krediti tugagan).

## Saytdan olib tashlangan da'volar

Do'kon egasi tasdiqlamaguncha saytning o'z matnida quyidagilar yo'q:

- "asl", "original", "подлинный", "настоящие часы". Do'konning o'zi 92 ta Telegram postida "Original" deb yozadi, lekin bu mustaqil tasdiqlanmagan.
- "20 dan ortiq brend" (bizning sanog'imiz edi).
- "Quti, hujjat va sertifikat bilan" va "Filtrsiz" (postlarda umumiy tasdig'i yo'q).
- Philip Watch brendi (postlarda uchramadi).
- Eski YouTube sarlavhasida Patek Philippe "1/1 kopiya" deb yozilgan. Bu material saytda ishlatilmagan.
- Ko'k terish videosi aslida sumka reklamasi edi ("Original H&T, Barsetka 60$"). Faqat qo'ldagi soat ko'ringan qismi qirqib olingan.

Ba'zi rasmlarda do'konning o'z kartochkasi va qutisi ko'rinadi, ularda "Original Swiss" yozuvi bor. Bu haqiqiy kadrning bir qismi, o'zgartirilmagan.

## Egasi tasdiqlashi kerak

1. **Haqiqiylik.** Rolex, Hublot, Breitling, Rado saytda narxi bilan turibdi. Ular asl va rasmiymi? Eski "1/1 kopiya" sarlavhasi hozir ham amaldami? Tasdiqlanmasa, ularni katalogdan olib tashlash kerak.
2. **"West End Watch Co. rasmiy distribyutori".** Instagram profilidan olingan, hujjat ko'rilmagan.
3. **"Rasmiy kafolat", "Swiss Made", kafolat muddatlari.** Postlardan olingan.
4. **Narxlar va mavjudlik.** Postlar yozilgan paytdagi narx, ayrim modellar sotilgan bo'lishi mumkin.
5. **Reels izohlari.** Masalan "Rolex Datejust, 2026 yangi" va "Omega × Swatch" post matnidan olingan.
6. **Ish vaqti** noma'lum, saytda yo'q.
7. **Namangan xaritasi** manzil qidiruvi bilan ochiladi, aniq koordinata yo'q.
8. **Do'kon va brend nomlari.** Sayt do'kon nomidan yozilgan, egasi ruxsatisiz e'lon qilinmasin.

## 3D model haqida

Soat fotosuratlarga qarab kodda yasalgan, skaner emas. Orqa mexanizm tasviriy. Saytda "3D model tasviriy" deb yozilgan.

## Joylashda

- `og:image` nisbiy yo'l. Domen aniq bo'lgach to'liq URL yozing: `https://domen/assets/p/og.jpg`.
- Shriftlar Google Fonts'dan yuklanadi.
- Joylanmagan.

## Sinov (2026-11-03)

Playwright + Edge, dasturiy WebGL (swiftshader): 390 va 1440 px, UZ va RU, toza profil bilan parametrsiz ochilish.

**Tekshirildi:** 3D sahnalar, konfigurator (rang, braslet, o'lcham, video, Telegram havolasi), vitrina, filtr, oyna, hover video, videolar, butiklar, footer, desktop menyu, telefonda qo'ng'iroq tugmasi. Gorizontal toshish yo'q, konsol xatosi yo'q, buzilgan rasm yoki video yo'q, UZ rejimda kirill yo'q (matn, atribut, oyna), "demo" yo'q, matn 12 px dan kichik emas, CSS qavslari to'g'ri. Barcha 41 video 720p dan oshmaydi.

**Tekshirilmadi:** haqiqiy telefon va haqiqiy GPU (FPS o'lchanmagan), Safari/iOS, sekin internet, tashqi havolalarning oxirgi manzili (Telegram, xarita, Instagram, YouTube).
