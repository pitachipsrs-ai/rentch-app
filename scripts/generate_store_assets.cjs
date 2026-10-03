const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const publicDir = path.join(__dirname, '..', 'public');

  // 1. Icon 512x512
  const iconSvg = fs.readFileSync(path.join(publicDir, 'icon.svg'));
  await sharp(iconSvg)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'play_icon_512x512.png'));
  console.log('play_icon_512x512.png created');

  // 2. Feature Graphic 1024x500
  const featureSvg = `
  <svg width="1024" height="500" viewBox="0 0 1024 500" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#142834" />
        <stop offset="50%" stop-color="#1C3746" />
        <stop offset="100%" stop-color="#0E1D26" />
      </linearGradient>
      <linearGradient id="roofRed" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FF5C52" />
        <stop offset="100%" stop-color="#EA4335" />
      </linearGradient>
      <linearGradient id="heartRed" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#FF5E54" />
        <stop offset="100%" stop-color="#E6392D" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000" flood-opacity="0.45" />
      </filter>
    </defs>

    <!-- Background -->
    <rect width="1024" height="500" fill="url(#bgGrad)" />

    <!-- Decorative background geometric circles -->
    <circle cx="900" cy="100" r="300" fill="#244456" opacity="0.25" />
    <circle cx="150" cy="450" r="220" fill="#E6392D" opacity="0.08" />
    <circle cx="850" cy="380" r="180" fill="#2A5065" opacity="0.3" />

    <!-- Left Brand Card with Logo -->
    <g transform="translate(80, 85)" filter="url(#shadow)">
      <rect width="240" height="240" rx="48" fill="#1C3746" stroke="#2D5369" stroke-width="3" />
      
      <!-- Logo inside card scaled -->
      <g transform="translate(40, 40) scale(1)">
        <!-- Chimney -->
        <path d="M106 50V33H119V58L106 50Z" fill="#FF5C52" />
        <rect x="104" y="30" width="17" height="4" rx="2" fill="#FF5C52" />
        <!-- Window -->
        <g fill="#FFFFFF">
          <path d="M73 48H78V54H73C73 51.5 73.5 49 73 48Z" />
          <path d="M82 48H87C86.5 49 87 51.5 87 54H82V48Z" />
          <rect x="73" y="56" width="5" height="5" />
          <rect x="82" y="56" width="5" height="5" />
        </g>
        <!-- Gable -->
        <path d="M26 62L80 18L134 62L128 69L80 29L32 69L26 62Z" fill="url(#roofRed)" />
        <!-- Heart -->
        <path d="M80 126C78 124 50 106 42 88C35 72 44 58 59 58C68 58 75 63 80 69C85 63 92 58 101 58C116 58 125 72 118 88C110 106 82 124 80 126Z" fill="#D9382B" />
        <path d="M80 122C78.2 120.2 52 103 45 86C38.5 71 47 61 60 61C68 61 75 66 80 72C85 66 92 61 100 61C113 61 121.5 71 115 86C108 103 81.8 120.2 80 122Z" fill="url(#heartRed)" />
        <path d="M60 65C52 65 46 72 50 82C53 89 65 100 78 111C75 105 70 94 66 88C61 79 56 68 60 65Z" fill="#FFFFFF" fill-opacity="0.25" />
      </g>
    </g>

    <!-- Right Content Area -->
    <g transform="translate(360, 110)">
      <!-- App Name -->
      <text x="0" y="70" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="72" font-weight="900" fill="#FFFFFF" letter-spacing="-1">
        Rentch
      </text>

      <!-- Badge: Без комиссии -->
      <rect x="250" y="16" width="170" height="38" rx="19" fill="#E6392D" />
      <text x="335" y="41" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="16" font-weight="700" fill="#FFFFFF" text-anchor="middle">
        БЕЗ КОМИССИИ
      </text>

      <!-- Tagline -->
      <text x="0" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="28" font-weight="600" fill="#E2E8F0">
        Умный поиск и долгосрочная аренда квартир
      </text>

      <!-- Countries List with styled dots -->
      <g transform="translate(0, 190)">
        <rect x="0" y="0" width="130" height="42" rx="21" fill="#244558" stroke="#375D74" stroke-width="1.5" />
        <text x="65" y="27" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="17" font-weight="700" fill="#FFFFFF" text-anchor="middle">🇷🇸 Сербия</text>

        <rect x="145" y="0" width="130" height="42" rx="21" fill="#244558" stroke="#375D74" stroke-width="1.5" />
        <text x="210" y="27" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="17" font-weight="700" fill="#FFFFFF" text-anchor="middle">🇬🇪 Грузия</text>

        <rect x="290" y="0" width="140" height="42" rx="21" fill="#244558" stroke="#375D74" stroke-width="1.5" />
        <text x="360" y="27" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="17" font-weight="700" fill="#FFFFFF" text-anchor="middle">🇦🇲 Армения</text>

        <rect x="445" y="0" width="160" height="42" rx="21" fill="#244558" stroke="#375D74" stroke-width="1.5" />
        <text x="525" y="27" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="17" font-weight="700" fill="#FFFFFF" text-anchor="middle">🇲🇪 Черногория</text>
      </g>

      <!-- Bottom bullet features -->
      <text x="0" y="290" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="18" font-weight="500" fill="#94A3B8">
        ✓ Интерактивная карта  •  ✓ Прямой чат с собственниками  •  ✓ Pet-friendly фильтры
      </text>
    </g>
  </svg>
  `;

  await sharp(Buffer.from(featureSvg))
    .png()
    .toFile(path.join(publicDir, 'play_feature_1024x500.png'));
  console.log('play_feature_1024x500.png created');

  // Helper for generating mobile screenshots 1080x1920
  const makeScreenshotSvg = (opts) => `
  <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="screenBg${opts.id}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${opts.topColor}" />
        <stop offset="100%" stop-color="${opts.bottomColor}" />
      </linearGradient>
      <filter id="phoneShadow${opts.id}" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="24" stdDeviation="32" flood-color="#000000" flood-opacity="0.35" />
      </filter>
    </defs>

    <!-- Canvas Background -->
    <rect width="1080" height="1920" fill="url(#screenBg${opts.id})" />

    <!-- Top Headline Section -->
    <g transform="translate(80, 140)">
      <rect x="0" y="0" width="${opts.badgeWidth}" height="56" rx="28" fill="#E6392D" />
      <text x="${opts.badgeWidth / 2}" y="36" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="24" font-weight="800" fill="#FFFFFF" text-anchor="middle">
        ${opts.badgeText}
      </text>

      <text x="0" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="58" font-weight="900" fill="#FFFFFF" letter-spacing="-0.5">
        ${opts.title}
      </text>
      <text x="0" y="195" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="30" font-weight="500" fill="#CBD5E1">
        ${opts.subtitle}
      </text>
    </g>

    <!-- Phone Frame Mockup -->
    <g transform="translate(100, 480)" filter="url(#phoneShadow${opts.id})">
      <!-- Device Outer Frame -->
      <rect width="880" height="1500" rx="64" fill="#0F172A" stroke="#334155" stroke-width="8" />
      <!-- Screen Glass -->
      <rect x="20" y="20" width="840" height="1460" rx="48" fill="#F8FAFC" />
      
      <!-- Top Dynamic Island / Speaker -->
      <rect x="360" y="36" width="160" height="24" rx="12" fill="#0F172A" />

      <!-- Inner App Content Simulated -->
      <!-- App Header -->
      <rect x="20" y="80" width="840" height="100" fill="#1C3746" />
      <text x="70" y="145" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="34" font-weight="900" fill="#FFFFFF">
        Rentch
      </text>
      <text x="760" y="145" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="32" fill="#FFFFFF">
        🔍
      </text>

      <!-- App Content Graphic Area -->
      ${opts.contentXml}
    </g>
  </svg>
  `;

  // Screenshot 1: Карта и поиск
  const s1Svg = makeScreenshotSvg({
    id: '1',
    topColor: '#162C38',
    bottomColor: '#0E1D26',
    badgeText: 'ПОИСК НА КАРТЕ',
    badgeWidth: 260,
    title: 'Квартиры на карте',
    subtitle: 'Выбирайте жилье в лучших районах города',
    contentXml: `
      <!-- Simulated Map -->
      <rect x="20" y="180" width="840" height="600" fill="#E2E8F0" />
      <!-- Streets -->
      <path d="M40 300 H840 M40 500 H840 M300 180 V780 M600 180 V780" stroke="#CBD5E1" stroke-width="16" />
      <!-- River / Green park -->
      <path d="M40 650 Q 400 580 840 700 L840 780 L40 780 Z" fill="#93C5FD" opacity="0.7" />
      <circle cx="220" cy="380" r="90" fill="#86EFAC" opacity="0.6" />

      <!-- Map Pins with Prices -->
      <g transform="translate(180, 260)">
        <rect width="130" height="50" rx="25" fill="#E6392D" />
        <text x="65" y="32" font-family="sans-serif" font-size="22" font-weight="bold" fill="#FFF" text-anchor="middle">€ 450</text>
      </g>
      <g transform="translate(480, 360)">
        <rect width="130" height="50" rx="25" fill="#1C3746" />
        <text x="65" y="32" font-family="sans-serif" font-size="22" font-weight="bold" fill="#FFF" text-anchor="middle">€ 600</text>
      </g>
      <g transform="translate(320, 480)">
        <rect width="130" height="50" rx="25" fill="#E6392D" />
        <text x="65" y="32" font-family="sans-serif" font-size="22" font-weight="bold" fill="#FFF" text-anchor="middle">€ 380</text>
      </g>

      <!-- Apartment Listing Card -->
      <g transform="translate(60, 820)">
        <rect width="760" height="420" rx="32" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" />
        <rect x="20" y="20" width="720" height="240" rx="20" fill="#CBD5E1" />
        <text x="50" y="300" font-family="sans-serif" font-size="32" font-weight="bold" fill="#0F172A">
          2-комнатная, Врачар • 55 м²
        </text>
        <text x="50" y="340" font-family="sans-serif" font-size="24" fill="#64748B">
          Белград • 5 мин до парка Ташмайдан
        </text>
        <text x="50" y="390" font-family="sans-serif" font-size="34" font-weight="900" fill="#E6392D">
          € 550 / месяц
        </text>
        <rect x="520" y="350" width="200" height="50" rx="25" fill="#1C3746" />
        <text x="620" y="382" font-family="sans-serif" font-size="20" font-weight="bold" fill="#FFF" text-anchor="middle">Подробнее</text>
      </g>
    `
  });

  await sharp(Buffer.from(s1Svg)).png().toFile(path.join(publicDir, 'play_screenshot_1.png'));
  console.log('play_screenshot_1.png created');

  // Screenshot 2: Умные фильтры
  const s2Svg = makeScreenshotSvg({
    id: '2',
    topColor: '#1A3342',
    bottomColor: '#10222C',
    badgeText: 'БЕЗ КОМИССИИ',
    badgeWidth: 240,
    title: 'Прямая аренда',
    subtitle: 'Связывайтесь напрямую с собственниками жилья',
    contentXml: `
      <!-- Filters bar -->
      <g transform="translate(60, 210)">
        <rect width="210" height="60" rx="30" fill="#E6392D" />
        <text x="105" y="38" font-family="sans-serif" font-size="22" font-weight="bold" fill="#FFF" text-anchor="middle">🐶 Pet-friendly</text>
        
        <rect x="230" y="0" width="180" height="60" rx="30" fill="#F1F5F9" stroke="#CBD5E1" />
        <text x="320" y="38" font-family="sans-serif" font-size="22" font-weight="bold" fill="#334155" text-anchor="middle">до € 600</text>

        <rect x="430" y="0" width="180" height="60" rx="30" fill="#F1F5F9" stroke="#CBD5E1" />
        <text x="520" y="38" font-family="sans-serif" font-size="22" font-weight="bold" fill="#334155" text-anchor="middle">2+ комн.</text>
      </g>

      <!-- Chat / Direct contact preview -->
      <g transform="translate(60, 310)">
        <rect width="760" height="920" rx="32" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" />
        
        <!-- Contact header -->
        <circle cx="80" cy="80" r="40" fill="#1C3746" />
        <text x="80" y="92" font-family="sans-serif" font-size="28" fill="#FFF" text-anchor="middle">👤</text>
        <text x="145" y="75" font-family="sans-serif" font-size="28" font-weight="bold" fill="#0F172A">Марко (Собственник)</text>
        <text x="145" y="105" font-family="sans-serif" font-size="20" fill="#16A34A">● Онлайн • Отвечает за 5 минут</text>

        <line x1="40" y1="140" x2="720" y2="140" stroke="#F1F5F9" stroke-width="2" />

        <!-- Chat Bubble Owner -->
        <g transform="translate(40, 180)">
          <rect width="520" height="110" rx="24" fill="#F1F5F9" />
          <text x="30" y="45" font-family="sans-serif" font-size="22" fill="#1E293B">Здравствуйте! Квартира свободна,</text>
          <text x="30" y="80" font-family="sans-serif" font-size="22" fill="#1E293B">можно с кошкой или собакой 👍</text>
        </g>

        <!-- Chat Bubble User -->
        <g transform="translate(200, 320)">
          <rect width="520" height="110" rx="24" fill="#1C3746" />
          <text x="30" y="45" font-family="sans-serif" font-size="22" fill="#FFFFFF">Отлично! Когда можно прийти</text>
          <text x="30" y="80" font-family="sans-serif" font-size="22" fill="#FFFFFF">на просмотр?</text>
        </g>

        <!-- Big action CTA button -->
        <g transform="translate(60, 780)">
          <rect width="640" height="80" rx="40" fill="#E6392D" />
          <text x="320" y="50" font-family="sans-serif" font-size="26" font-weight="bold" fill="#FFF" text-anchor="middle">
            Написать собственнику
          </text>
        </g>
      </g>
    `
  });

  await sharp(Buffer.from(s2Svg)).png().toFile(path.join(publicDir, 'play_screenshot_2.png'));
  console.log('play_screenshot_2.png created');

  // Screenshot 3: 4 страны
  const s3Svg = makeScreenshotSvg({
    id: '3',
    topColor: '#122530',
    bottomColor: '#09141B',
    badgeText: '4 СТРАНЫ',
    badgeWidth: 190,
    title: 'Сербия, Грузия, Армения',
    subtitle: 'А также лучшие города Черногории в одном сервисе',
    contentXml: `
      <g transform="translate(60, 220)">
        <!-- Country Card 1 -->
        <rect x="0" y="0" width="760" height="150" rx="24" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" />
        <text x="40" y="85" font-family="sans-serif" font-size="50">🇷🇸</text>
        <text x="120" y="65" font-family="sans-serif" font-size="28" font-weight="bold" fill="#0F172A">Сербия</text>
        <text x="120" y="100" font-family="sans-serif" font-size="20" fill="#64748B">Белград • Нови-Сад • Ниш</text>
        <text x="640" y="85" font-family="sans-serif" font-size="24" font-weight="bold" fill="#E6392D">➔</text>

        <!-- Country Card 2 -->
        <rect x="0" y="180" width="760" height="150" rx="24" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" />
        <text x="40" y="265" font-family="sans-serif" font-size="50">🇬🇪</text>
        <text x="120" y="245" font-family="sans-serif" font-size="28" font-weight="bold" fill="#0F172A">Грузия</text>
        <text x="120" y="280" font-family="sans-serif" font-size="20" fill="#64748B">Тбилиси • Батуми • Кутаиси</text>
        <text x="640" y="265" font-family="sans-serif" font-size="24" font-weight="bold" fill="#E6392D">➔</text>

        <!-- Country Card 3 -->
        <rect x="0" y="360" width="760" height="150" rx="24" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" />
        <text x="40" y="445" font-family="sans-serif" font-size="50">🇦🇲</text>
        <text x="120" y="425" font-family="sans-serif" font-size="28" font-weight="bold" fill="#0F172A">Армения</text>
        <text x="120" y="460" font-family="sans-serif" font-size="20" fill="#64748B">Ереван • Гюмри • Дилижан</text>
        <text x="640" y="445" font-family="sans-serif" font-size="24" font-weight="bold" fill="#E6392D">➔</text>

        <!-- Country Card 4 -->
        <rect x="0" y="540" width="760" height="150" rx="24" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" />
        <text x="40" y="625" font-family="sans-serif" font-size="50">🇲🇪</text>
        <text x="120" y="605" font-family="sans-serif" font-size="28" font-weight="bold" fill="#0F172A">Черногория</text>
        <text x="120" y="640" font-family="sans-serif" font-size="20" fill="#64748B">Будва • Подгорица • Бар • Тиват</text>
        <text x="640" y="625" font-family="sans-serif" font-size="24" font-weight="bold" fill="#E6392D">➔</text>
      </g>
    `
  });

  await sharp(Buffer.from(s3Svg)).png().toFile(path.join(publicDir, 'play_screenshot_3.png'));
  console.log('play_screenshot_3.png created');

  console.log('All store graphics successfully generated!');
}

main().catch(console.error);
