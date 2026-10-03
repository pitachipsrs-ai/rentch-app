const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Ensure directories
const publicDir = path.join(__dirname, '..', 'public');
const assetsDir = path.join(__dirname, 'assets');

// Load assets as base64
function getBase64(filePath, mime = 'image/jpeg') {
  const buf = fs.readFileSync(filePath);
  return `data:${mime};base64,${buf.toString('base64')}`;
}

async function generateAll() {
  console.log('Starting screenshot generation...');

  const apt1Base64 = getBase64(path.join(assetsDir, 'apt1_clean.jpg'), 'image/jpeg');
  const apt2Base64 = getBase64(path.join(assetsDir, 'apt2_clean.jpg'), 'image/jpeg');
  const apt3Base64 = getBase64(path.join(assetsDir, 'apt1_clean.jpg'), 'image/jpeg');
  const apt4Base64 = getBase64(path.join(assetsDir, 'apt2_clean.jpg'), 'image/jpeg');
  const mapBase64 = getBase64(path.join(assetsDir, 'belgrade_map.png'), 'image/png');

  // Common Phone Frame template generator
  const createPhoneScreenshot = ({
    badgeText,
    badgeBg = '#E6392D',
    title,
    subtitle,
    gradientTop = '#132834',
    gradientBottom = '#0B161D',
    screenContentXml,
  }) => {
    return `
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Canvas Background Gradient -->
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${gradientTop}" />
          <stop offset="100%" stop-color="${gradientBottom}" />
        </linearGradient>

        <!-- Phone Outer Border Gradient -->
        <linearGradient id="phoneBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#475569" />
          <stop offset="50%" stop-color="#1E293B" />
          <stop offset="100%" stop-color="#334155" />
        </linearGradient>

        <!-- Drop Shadow for Phone -->
        <filter id="phoneShadow" x="-15%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="32" stdDeviation="40" flood-color="#000000" flood-opacity="0.55" />
        </filter>

        <!-- Clip path for Phone Inner Screen (840 x 1480, rx 48) -->
        <clipPath id="screenClip">
          <rect x="0" y="0" width="840" height="1480" rx="44" />
        </clipPath>

        <clipPath id="cardImgClip">
          <rect x="0" y="0" width="760" height="490" rx="24" />
        </clipPath>

        <clipPath id="miniCardImgClip">
          <rect x="0" y="0" width="220" height="170" rx="16" />
        </clipPath>

        <clipPath id="avatarClip">
          <circle cx="28" cy="28" r="28" />
        </clipPath>

        <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.16" />
        </filter>
        <filter id="pinShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.25" />
        </filter>
      </defs>

      <!-- Background Canvas -->
      <rect width="1080" height="1920" fill="url(#bgGrad)" />

      <!-- Ambient Glow Behind Device -->
      <circle cx="540" cy="900" r="460" fill="#E6392D" opacity="0.08" />
      <circle cx="850" cy="300" r="280" fill="#38BDF8" opacity="0.06" />

      <!-- Top Marketing Header -->
      <g transform="translate(80, 100)">
        <!-- Badge -->
        <g>
          <rect x="0" y="0" width="340" height="52" rx="26" fill="${badgeBg}" />
          <text x="170" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5">
            ${badgeText}
          </text>
        </g>

        <!-- Main Title -->
        <text x="0" y="125" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="60" font-weight="900" fill="#FFFFFF" letter-spacing="-0.8">
          ${title}
        </text>

        <!-- Subtitle -->
        <text x="0" y="180" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="27" font-weight="500" fill="#94A3B8">
          ${subtitle}
        </text>
      </g>

      <!-- Smartphone Device Frame (Width 880, Height 1520, centered at X=100, Y=420) -->
      <g transform="translate(100, 380)" filter="url(#phoneShadow)">
        <!-- Outer Device Body / Titanium Bezel -->
        <rect width="880" height="1520" rx="58" fill="#0B131B" stroke="url(#phoneBorder)" stroke-width="6" />

        <!-- Inner Glass Display (840 x 1480, offset 20, 20) -->
        <g transform="translate(20, 20)" clip-path="url(#screenClip)">
          <!-- App Background (White / Slate-50) -->
          <rect width="840" height="1480" fill="#F8FAFC" />

          <!-- Dynamic Island / Speaker cutout -->
          <rect x="330" y="16" width="180" height="30" rx="15" fill="#000000" />
          <circle cx="475" cy="31" r="5.5" fill="#1E293B" />

          <!-- Mobile Status Bar (9:41, WiFi, Battery) -->
          <text x="50" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="700" fill="#0F172A">
            09:41
          </text>
          <!-- Battery icon -->
          <rect x="740" y="24" width="34" height="18" rx="5" fill="none" stroke="#0F172A" stroke-width="2.5" />
          <rect x="743" y="27" width="23" height="12" rx="2" fill="#0F172A" />
          <rect x="775" y="29" width="3" height="8" rx="1.5" fill="#0F172A" />
          <!-- WiFi icon -->
          <path d="M695 38 A 12 12 0 0 1 719 38 M701 34 A 8 8 0 0 1 713 34 M706 40 A 2 2 0 0 1 708 40" stroke="#0F172A" stroke-width="2.5" fill="none" stroke-linecap="round" />

          <!-- Specific Screen Content -->
          ${screenContentXml}

          <!-- Shared Universal Bottom Navigation Bar (Height 90, docked at bottom Y=1390) -->
          <g transform="translate(0, 1380)">
            <!-- Nav Bar Glass Background -->
            <rect width="840" height="100" fill="#FFFFFF" opacity="0.98" />
            <line x1="0" y1="0" x2="840" y2="0" stroke="#E2E8F0" stroke-width="1.5" />

            <!-- Tab 1: Свайпы -->
            <g transform="translate(70, 16)">
              <circle cx="20" cy="18" r="16" fill="#FEE2E2" opacity="0.5" />
              <path d="M20 7 C21 11 25 14 25 19 C25 25 21 28 17 28 C12 28 9 24 10 19 C10 16 13 13 14 11 C15 14 17 16 18 16 C19 14 20 11 20 7 Z" fill="#E6392D" />
              <text x="20" y="44" font-family="-apple-system, sans-serif" font-size="14" font-weight="800" fill="#E6392D" text-anchor="middle">Свайпы</text>
            </g>

            <!-- Tab 2: Соседи 50/50 -->
            <g transform="translate(210, 16)">
              <circle cx="16" cy="14" r="6" fill="#64748B" />
              <path d="M8 28 C8 24 12 22 16 22 C20 22 24 24 24 28" stroke="#64748B" stroke-width="2.5" fill="none" />
              <circle cx="28" cy="12" r="5" fill="#94A3B8" />
              <path d="M24 24 C26 23 29 23 31 25" stroke="#94A3B8" stroke-width="2" fill="none" />
              <!-- Badge 50/50 -->
              <rect x="24" y="0" width="34" height="16" rx="8" fill="#10B981" />
              <text x="41" y="12" font-family="-apple-system, sans-serif" font-size="10" font-weight="900" fill="#FFFFFF" text-anchor="middle">50/50</text>
              <text x="20" y="44" font-family="-apple-system, sans-serif" font-size="14" font-weight="600" fill="#64748B" text-anchor="middle">Соседи</text>
            </g>

            <!-- Tab 3: Карта -->
            <g transform="translate(360, 16)">
              <path d="M20 8 C14 8 10 12 10 17 C10 24 20 32 20 32 C20 32 30 24 30 17 C30 12 26 8 20 8 Z" fill="none" stroke="#64748B" stroke-width="2.5" />
              <circle cx="20" cy="16" r="3.5" fill="#64748B" />
              <text x="20" y="44" font-family="-apple-system, sans-serif" font-size="14" font-weight="600" fill="#64748B" text-anchor="middle">Карта</text>
            </g>

            <!-- Tab 4: Rentch! (Favorites) -->
            <g transform="translate(500, 16)">
              <path d="M20 28 C20 28 8 20 8 13 C8 9 11 6 15 6 C17 6 19 8 20 10 C21 8 23 6 25 6 C29 6 32 9 32 13 C32 20 20 28 20 28 Z" fill="none" stroke="#64748B" stroke-width="2.5" />
              <circle cx="31" cy="7" r="8" fill="#E6392D" />
              <text x="31" y="11" font-family="-apple-system, sans-serif" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle">3</text>
              <text x="20" y="44" font-family="-apple-system, sans-serif" font-size="14" font-weight="600" fill="#64748B" text-anchor="middle">Rentch!</text>
            </g>

            <!-- Tab 5: Диалоги -->
            <g transform="translate(640, 16)">
              <path d="M9 25 L9 13 C9 9 12 6 18 6 L24 6 C30 6 33 9 33 13 L33 21 C33 25 30 28 24 28 L15 28 L9 32 L9 25 Z" fill="none" stroke="#64748B" stroke-width="2.5" />
              <circle cx="32" cy="7" r="8" fill="#0F172A" />
              <text x="32" y="11" font-family="-apple-system, sans-serif" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle">1</text>
              <text x="20" y="44" font-family="-apple-system, sans-serif" font-size="14" font-weight="600" fill="#64748B" text-anchor="middle">Диалоги</text>
            </g>

            <!-- Tab 6: Фильтры -->
            <g transform="translate(760, 16)">
              <path d="M6 12 H18 M24 12 H34 M6 26 H14 M20 26 H34" stroke="#64748B" stroke-width="2.5" stroke-linecap="round" />
              <circle cx="21" cy="12" r="3.5" fill="#64748B" />
              <circle cx="17" cy="26" r="3.5" fill="#64748B" />
              <text x="20" y="44" font-family="-apple-system, sans-serif" font-size="14" font-weight="600" fill="#64748B" text-anchor="middle">Фильтры</text>
            </g>
          </g>
        </g>
      </g>
    </svg>
    `;
  };

  // ==========================================
  // SCREENSHOT 1: Свайпы квартир (Tinder Style)
  // ==========================================
  const s1Content = `
    <!-- TopBar Component -->
    <g transform="translate(0, 60)">
      <!-- TopBar background -->
      <rect width="840" height="96" fill="#FFFFFF" />
      <line x1="0" y1="96" x2="840" y2="96" stroke="#E2E8F0" stroke-width="1.5" />

      <!-- Brand Logo Left -->
      <g transform="translate(30, 20)">
        <!-- Red Roof + Heart Icon -->
        <g transform="translate(0, 2) scale(0.35)">
          <path d="M26 62L80 18L134 62L128 69L80 29L32 69L26 62Z" fill="#EA4335" />
          <path d="M80 122C78.2 120.2 52 103 45 86C38.5 71 47 61 60 61C68 61 75 66 80 72C85 66 92 61 100 61C113 61 121.5 71 115 86C108 103 81.8 120.2 80 122Z" fill="#E6392D" />
        </g>
        <!-- Text Rentch -->
        <text x="62" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="900" fill="#0F172A" letter-spacing="-0.5">
          Rentch
        </text>
      </g>

      <!-- City Switcher Pills -->
      <g transform="translate(235, 24)">
        <rect width="470" height="48" rx="24" fill="#F1F5F9" stroke="#E2E8F0" stroke-width="1" />
        
        <!-- Belgrade (Active Selected) -->
        <rect x="4" y="4" width="140" height="40" rx="20" fill="#0F172A" />
        <text x="74" y="29" font-family="-apple-system, sans-serif" font-size="16" font-weight="700" fill="#FFFFFF" text-anchor="middle">
          🇷🇸 Белград
        </text>

        <!-- Tbilisi -->
        <text x="215" y="29" font-family="-apple-system, sans-serif" font-size="16" font-weight="600" fill="#64748B" text-anchor="middle">
          🇬🇪 Тбилиси
        </text>

        <!-- Yerevan -->
        <text x="320" y="29" font-family="-apple-system, sans-serif" font-size="16" font-weight="600" fill="#64748B" text-anchor="middle">
          🇦🇲 Ереван
        </text>

        <!-- Budva -->
        <text x="420" y="29" font-family="-apple-system, sans-serif" font-size="16" font-weight="600" fill="#64748B" text-anchor="middle">
          🇲🇪 Будва
        </text>
      </g>

      <!-- Filter Icon Right -->
      <g transform="translate(745, 24)">
        <circle cx="24" cy="24" r="24" fill="#F1F5F9" />
        <path d="M14 18 H34 M17 24 H31 M21 30 H27" stroke="#0F172A" stroke-width="2.5" stroke-linecap="round" />
      </g>
    </g>

    <!-- Quick Filter Bar -->
    <g transform="translate(30, 172)">
      <!-- Filter 1: Pet-friendly (Active) -->
      <rect x="0" y="0" width="170" height="44" rx="22" fill="#E6392D" />
      <text x="85" y="28" font-family="-apple-system, sans-serif" font-size="16" font-weight="700" fill="#FFFFFF" text-anchor="middle">
        🐾 Pet-friendly
      </text>

      <!-- Filter 2: Price -->
      <rect x="182" y="0" width="130" height="44" rx="22" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <text x="247" y="28" font-family="-apple-system, sans-serif" font-size="16" font-weight="600" fill="#334155" text-anchor="middle">
        До €500
      </text>

      <!-- Filter 3: Rooms -->
      <rect x="324" y="0" width="120" height="44" rx="22" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <text x="384" y="28" font-family="-apple-system, sans-serif" font-size="16" font-weight="600" fill="#334155" text-anchor="middle">
        2+ комн.
      </text>

      <!-- Filter 4: Furnished -->
      <rect x="456" y="0" width="150" height="44" rx="22" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <text x="531" y="28" font-family="-apple-system, sans-serif" font-size="16" font-weight="600" fill="#334155" text-anchor="middle">
        🛋 С мебелью
      </text>

      <!-- Filter 5: Balcony -->
      <rect x="618" y="0" width="130" height="44" rx="22" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <text x="683" y="28" font-family="-apple-system, sans-serif" font-size="16" font-weight="600" fill="#334155" text-anchor="middle">
        🌿 Балкон
      </text>
    </g>

    <!-- Main Swipe Card (Width 780, Height 980, centered at X=30, Y=235) -->
    <g transform="translate(30, 235)" filter="url(#cardShadow)">
      <!-- Outer Card Container -->
      <rect width="780" height="990" rx="36" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" />

      <!-- Apartment Photo Area (Height 540) -->
      <g transform="translate(10, 10)">
        <clipPath id="swipeCardImgClip">
          <rect width="760" height="560" rx="28" />
        </clipPath>
        <image href="${apt1Base64}" width="760" height="560" clip-path="url(#swipeCardImgClip)" preserveAspectRatio="xMidYMid slice" />

        <!-- Gradient Vignette at Bottom of Photo -->
        <rect width="760" height="560" rx="28" fill="url(#cardPhotoGrad)" opacity="0.6" />

        <!-- Photo Pagination Indicators (top) -->
        <g transform="translate(20, 16)">
          <rect x="0" y="0" width="115" height="4" rx="2" fill="#FFFFFF" />
          <rect x="123" y="0" width="115" height="4" rx="2" fill="#FFFFFF" opacity="0.4" />
          <rect x="246" y="0" width="115" height="4" rx="2" fill="#FFFFFF" opacity="0.4" />
          <rect x="369" y="0" width="115" height="4" rx="2" fill="#FFFFFF" opacity="0.4" />
          <rect x="492" y="0" width="115" height="4" rx="2" fill="#FFFFFF" opacity="0.4" />
          <rect x="615" y="0" width="105" height="4" rx="2" fill="#FFFFFF" opacity="0.4" />
        </g>

        <!-- Top Badges on Photo -->
        <g transform="translate(20, 32)">
          <!-- NEW Badge -->
          <rect x="0" y="0" width="70" height="30" rx="15" fill="#F59E0B" />
          <text x="35" y="21" font-family="-apple-system, sans-serif" font-size="14" font-weight="900" fill="#FFFFFF" text-anchor="middle">NEW</text>

          <!-- District Badge -->
          <rect x="80" y="0" width="170" height="30" rx="15" fill="#0F172A" opacity="0.85" />
          <text x="165" y="20" font-family="-apple-system, sans-serif" font-size="14" font-weight="600" fill="#FFFFFF" text-anchor="middle">📍 Врачар, Белград</text>

          <!-- Rentch Verified Right Badge -->
          <rect x="520" y="0" width="200" height="30" rx="15" fill="#0F172A" opacity="0.8" />
          <circle cx="538" cy="15" r="7" fill="#10B981" />
          <text x="538" y="19" font-family="-apple-system, sans-serif" font-size="10" font-weight="900" fill="#FFFFFF" text-anchor="middle">✓</text>
          <text x="630" y="20" font-family="-apple-system, sans-serif" font-size="13" font-weight="700" fill="#FFFFFF" text-anchor="middle">Rentch Verified</text>
        </g>

        <!-- Big 'RENTCH! ♥' Like Stamp (Interactive Swipe Right Simulation) -->
        <g transform="translate(470, 90) rotate(14)">
          <rect width="260" height="66" rx="20" fill="#10B981" opacity="0.9" stroke="#34D399" stroke-width="4" />
          <text x="130" y="45" font-family="-apple-system, sans-serif" font-size="34" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">
            RENTCH! ♥
          </text>
        </g>

        <!-- Floating Price Pill on Photo Bottom -->
        <g transform="translate(20, 480)">
          <rect width="250" height="60" rx="30" fill="#0F172A" opacity="0.92" />
          <text x="30" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="36" font-weight="900" fill="#FFFFFF">
            €450
          </text>
          <text x="140" y="40" font-family="-apple-system, sans-serif" font-size="18" font-weight="600" fill="#94A3B8">
            / месяц
          </text>
        </g>
      </g>

      <!-- Apartment Info Section Below Photo -->
      <g transform="translate(30, 595)">
        <!-- Title & Area -->
        <text x="0" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="32" font-weight="900" fill="#0F172A">
          2-комн. квартира • 38 м²
        </text>

        <!-- Location Subtitle -->
        <text x="0" y="66" font-family="-apple-system, sans-serif" font-size="20" font-weight="500" fill="#64748B">
          ул. Kneza od Semberije, Црвени Крст • 1/3 этаж
        </text>

        <!-- Feature Tags Pills Row -->
        <g transform="translate(0, 94)">
          <!-- Tag 1 -->
          <rect x="0" y="0" width="160" height="38" rx="19" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1.5" />
          <text x="80" y="24" font-family="-apple-system, sans-serif" font-size="15" font-weight="700" fill="#059669" text-anchor="middle">
            🐶 Pet-friendly
          </text>

          <!-- Tag 2 -->
          <rect x="172" y="0" width="140" height="38" rx="19" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5" />
          <text x="242" y="24" font-family="-apple-system, sans-serif" font-size="15" font-weight="600" fill="#334155" text-anchor="middle">
            🛋 С мебелью
          </text>

          <!-- Tag 3 -->
          <rect x="324" y="0" width="160" height="38" rx="19" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5" />
          <text x="404" y="24" font-family="-apple-system, sans-serif" font-size="15" font-weight="600" fill="#334155" text-anchor="middle">
            ❄️ Кондиционер
          </text>

          <!-- Tag 4 -->
          <rect x="496" y="0" width="120" height="38" rx="19" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5" />
          <text x="556" y="24" font-family="-apple-system, sans-serif" font-size="15" font-weight="600" fill="#334155" text-anchor="middle">
            🌿 Балкон
          </text>
        </g>

        <!-- Short Description -->
        <text x="0" y="172" font-family="-apple-system, sans-serif" font-size="17" font-weight="400" fill="#475569">
          Светлая и теплая квартира в тихом центре Врачара. Новый ремонт,
        </text>
        <text x="0" y="198" font-family="-apple-system, sans-serif" font-size="17" font-weight="400" fill="#475569">
          быстрая оптика 300 Мбит/с. Регистрация (белый картон) включена.
        </text>

        <!-- Action Control Buttons Dock -->
        <g transform="translate(60, 240)">
          <!-- Button 1: Dislike / Skip (Red ✕) -->
          <g transform="translate(0, 0)">
            <circle cx="44" cy="44" r="40" fill="#FFF1F2" stroke="#FECDD3" stroke-width="2.5" />
            <path d="M30 30 L58 58 M58 30 L30 58" stroke="#E11D48" stroke-width="4.5" stroke-linecap="round" />
          </g>

          <!-- Button 2: Rewind (Yellow ↺) -->
          <g transform="translate(160, 8)">
            <circle cx="36" cy="36" r="32" fill="#FEFCE8" stroke="#FEF08A" stroke-width="2" />
            <path d="M42 22 A 16 16 0 1 0 48 38 M42 22 L42 30 M42 22 L50 22" stroke="#CA8A04" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          </g>

          <!-- Button 3: Superlike / Star (Blue ★) -->
          <g transform="translate(320, 8)">
            <circle cx="36" cy="36" r="32" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="2" />
            <path d="M36 20 L40 30 L51 31 L43 38 L45 49 L36 43 L27 49 L29 38 L21 31 L32 30 Z" fill="#2563EB" />
          </g>

          <!-- Button 4: Rentch / Like (Green Heart ♥) -->
          <g transform="translate(480, 0)">
            <circle cx="44" cy="44" r="40" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="2.5" />
            <path d="M44 58 C44 58 26 46 26 35 C26 29 30 25 36 25 C40 25 43 28 44 31 C45 28 48 25 52 25 C58 25 62 29 62 35 C62 46 44 58 44 58 Z" fill="#10B981" />
          </g>
        </g>
      </g>
    </g>
  `;

  // ==========================================
  // SCREENSHOT 2: Интерактивная карта Белграда
  // ==========================================
  const s2Content = `
    <!-- TopBar Component -->
    <g transform="translate(0, 60)">
      <rect width="840" height="96" fill="#FFFFFF" />
      <line x1="0" y1="96" x2="840" y2="96" stroke="#E2E8F0" stroke-width="1.5" />

      <!-- Brand Logo Left -->
      <g transform="translate(30, 20)">
        <g transform="translate(0, 2) scale(0.35)">
          <path d="M26 62L80 18L134 62L128 69L80 29L32 69L26 62Z" fill="#EA4335" />
          <path d="M80 122C78.2 120.2 52 103 45 86C38.5 71 47 61 60 61C68 61 75 66 80 72C85 66 92 61 100 61C113 61 121.5 71 115 86C108 103 81.8 120.2 80 122Z" fill="#E6392D" />
        </g>
        <text x="62" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="900" fill="#0F172A">
          Rentch
        </text>
      </g>

      <!-- Search bar inside map -->
      <g transform="translate(230, 22)">
        <rect width="480" height="52" rx="26" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1" />
        <text x="24" y="33" font-family="sans-serif" font-size="20">🔍</text>
        <text x="56" y="33" font-family="-apple-system, sans-serif" font-size="16" font-weight="500" fill="#64748B">
          Врачар, Дорчол, Новый Белград...
        </text>
      </g>

      <!-- Filter button -->
      <g transform="translate(740, 22)">
        <circle cx="26" cy="26" r="26" fill="#E6392D" />
        <path d="M16 20 H36 M19 26 H33 M23 32 H29" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" />
      </g>
    </g>

    <!-- Quick filter chips floating over map -->
    <g transform="translate(30, 175)">
      <rect x="0" y="0" width="130" height="42" rx="21" fill="#0F172A" />
      <text x="65" y="27" font-family="-apple-system, sans-serif" font-size="15" font-weight="700" fill="#FFFFFF" text-anchor="middle">
        Все (520)
      </text>

      <rect x="142" y="0" width="140" height="42" rx="21" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <text x="212" y="27" font-family="-apple-system, sans-serif" font-size="15" font-weight="700" fill="#0F172A" text-anchor="middle">
        До €500
      </text>

      <rect x="294" y="0" width="150" height="42" rx="21" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <text x="369" y="27" font-family="-apple-system, sans-serif" font-size="15" font-weight="700" fill="#0F172A" text-anchor="middle">
        🐾 Pet-friendly
      </text>

      <rect x="456" y="0" width="130" height="42" rx="21" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <text x="521" y="27" font-family="-apple-system, sans-serif" font-size="15" font-weight="700" fill="#0F172A" text-anchor="middle">
        2+ комн.
      </text>

      <rect x="598" y="0" width="170" height="42" rx="21" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <text x="683" y="27" font-family="-apple-system, sans-serif" font-size="15" font-weight="700" fill="#0F172A" text-anchor="middle">
        📍 Центр города
      </text>
    </g>

    <!-- REAL BELGRADE MAP TILES COMPOSITE -->
    <g transform="translate(0, 230)">
      <clipPath id="mapAreaClip">
        <rect width="840" height="1150" />
      </clipPath>
      <image href="${mapBase64}" width="1024" height="1024" x="-90" y="0" clip-path="url(#mapAreaClip)" />

      <!-- Map Pins (Prices) Floating Across Real Belgrade Districts -->
      
      <!-- Pin 1: Selected Landmark Pin (€450 - Vračar) -->
      <g transform="translate(420, 360)" filter="url(#pinShadow)">
        <!-- Pin marker pill -->
        <rect width="140" height="54" rx="27" fill="#E6392D" />
        <text x="70" y="35" font-family="-apple-system, sans-serif" font-size="22" font-weight="900" fill="#FFFFFF" text-anchor="middle">
          €450
        </text>
        <!-- Pin pointer triangle down -->
        <polygon points="60,52 80,52 70,68" fill="#E6392D" />
        <!-- Pulse dot -->
        <circle cx="70" cy="74" r="5" fill="#E6392D" />
        <circle cx="70" cy="74" r="12" fill="#E6392D" opacity="0.35" />
      </g>

      <!-- Pin 2: Dorćol / Stari Grad (€550) -->
      <g transform="translate(280, 210)" filter="url(#pinShadow)">
        <rect width="130" height="48" rx="24" fill="#0F172A" opacity="0.95" />
        <text x="65" y="31" font-family="-apple-system, sans-serif" font-size="20" font-weight="800" fill="#FFFFFF" text-anchor="middle">
          €550
        </text>
        <polygon points="55,46 75,46 65,58" fill="#0F172A" opacity="0.95" />
      </g>

      <!-- Pin 3: Novi Beograd (€600) -->
      <g transform="translate(100, 340)" filter="url(#pinShadow)">
        <rect width="130" height="48" rx="24" fill="#0F172A" opacity="0.95" />
        <text x="65" y="31" font-family="-apple-system, sans-serif" font-size="20" font-weight="800" fill="#FFFFFF" text-anchor="middle">
          €600
        </text>
        <polygon points="55,46 75,46 65,58" fill="#0F172A" opacity="0.95" />
      </g>

      <!-- Pin 4: Tašmajdan / Palilula (€380) -->
      <g transform="translate(560, 260)" filter="url(#pinShadow)">
        <rect width="130" height="48" rx="24" fill="#0F172A" opacity="0.95" />
        <text x="65" y="31" font-family="-apple-system, sans-serif" font-size="20" font-weight="800" fill="#FFFFFF" text-anchor="middle">
          €380
        </text>
        <polygon points="55,46 75,46 65,58" fill="#0F172A" opacity="0.95" />
      </g>

      <!-- Pin 5: Zvezdara (€420) -->
      <g transform="translate(620, 480)" filter="url(#pinShadow)">
        <rect width="130" height="48" rx="24" fill="#0F172A" opacity="0.95" />
        <text x="65" y="31" font-family="-apple-system, sans-serif" font-size="20" font-weight="800" fill="#FFFFFF" text-anchor="middle">
          €420
        </text>
        <polygon points="55,46 75,46 65,58" fill="#0F172A" opacity="0.95" />
      </g>

      <!-- Pin 6: Savski Venac (€720) -->
      <g transform="translate(240, 490)" filter="url(#pinShadow)">
        <rect width="130" height="48" rx="24" fill="#0F172A" opacity="0.95" />
        <text x="65" y="31" font-family="-apple-system, sans-serif" font-size="20" font-weight="800" fill="#FFFFFF" text-anchor="middle">
          €720
        </text>
        <polygon points="55,46 75,46 65,58" fill="#0F172A" opacity="0.95" />
      </g>

      <!-- Floating Bottom Card of Selected Apartment (Docked over map at bottom) -->
      <g transform="translate(30, 680)" filter="url(#cardShadow)">
        <!-- Card Container -->
        <rect width="780" height="240" rx="30" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" />

        <!-- Left: Apartment Real Photo (220 x 200, rx 20) -->
        <g transform="translate(20, 20)">
          <clipPath id="mapCardPhotoClip">
            <rect width="220" height="200" rx="20" />
          </clipPath>
          <image href="${apt2Base64}" width="220" height="200" clip-path="url(#mapCardPhotoClip)" preserveAspectRatio="xMidYMid slice" />
          
          <!-- Badge on photo -->
          <rect x="12" y="12" width="70" height="26" rx="13" fill="#E6392D" />
          <text x="47" y="29" font-family="-apple-system, sans-serif" font-size="12" font-weight="800" fill="#FFFFFF" text-anchor="middle">NEW</text>
        </g>

        <!-- Right: Info -->
        <g transform="translate(260, 30)">
          <!-- District & Metres -->
          <text x="0" y="20" font-family="-apple-system, sans-serif" font-size="15" font-weight="700" fill="#E6392D">
            ВРАЧАР • ЦРВЕНИ КРСТ
          </text>

          <!-- Title -->
          <text x="0" y="55" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" fill="#0F172A">
            2-комн. квартира • 40 м²
          </text>

          <!-- Specs -->
          <text x="0" y="85" font-family="-apple-system, sans-serif" font-size="16" font-weight="500" fill="#64748B">
            🐾 Pet-friendly • 🛋 С мебелью • ❄️ Климат
          </text>

          <!-- Price & Action Button Row -->
          <g transform="translate(0, 115)">
            <text x="0" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="900" fill="#0F172A">
              €450
            </text>
            <text x="95" y="40" font-family="-apple-system, sans-serif" font-size="16" font-weight="600" fill="#64748B">
              / мес
            </text>

            <!-- Action Button -->
            <g transform="translate(250, 6)">
              <rect width="240" height="52" rx="26" fill="#E6392D" />
              <text x="120" y="33" font-family="-apple-system, sans-serif" font-size="17" font-weight="800" fill="#FFFFFF" text-anchor="middle">
                Смотреть фото ➔
              </text>
            </g>
          </g>
        </g>
      </g>
    </g>
  `;

  // ==========================================
  // SCREENSHOT 3: Прямой чат с собственником
  // ==========================================
  const s3Content = `
    <!-- Chat Header -->
    <g transform="translate(0, 60)">
      <rect width="840" height="110" fill="#FFFFFF" />
      <line x1="0" y1="110" x2="840" y2="110" stroke="#E2E8F0" stroke-width="1.5" />

      <!-- Back Arrow -->
      <g transform="translate(24, 38)">
        <path d="M22 6 L8 20 L22 34" stroke="#0F172A" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      </g>

      <!-- Landlord Avatar with Online Dot -->
      <g transform="translate(68, 22)">
        <circle cx="32" cy="32" r="32" fill="#1C3746" />
        <text x="32" y="42" font-family="-apple-system, sans-serif" font-size="24" font-weight="800" fill="#FFFFFF" text-anchor="middle">
          МП
        </text>
        <!-- Online Status Dot -->
        <circle cx="54" cy="52" r="8" fill="#10B981" stroke="#FFFFFF" stroke-width="2.5" />
      </g>

      <!-- Landlord Name & Subtitle -->
      <g transform="translate(148, 30)">
        <text x="0" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="23" font-weight="800" fill="#0F172A">
          Марко Попович
        </text>
        <rect x="180" y="6" width="130" height="24" rx="12" fill="#FEF2F2" />
        <text x="245" y="22" font-family="-apple-system, sans-serif" font-size="12" font-weight="800" fill="#E6392D" text-anchor="middle">Собственник</text>

        <text x="0" y="52" font-family="-apple-system, sans-serif" font-size="15" font-weight="500" fill="#10B981">
          ● В сети • Отвечает обычно за 3 минуты
        </text>
      </g>

      <!-- Call / Action button right -->
      <g transform="translate(740, 32)">
        <circle cx="26" cy="26" r="26" fill="#F1F5F9" />
        <path d="M19 14 C18 14 16 15 15 17 C14 21 18 27 23 31 C27 35 32 37 36 36 C38 35 39 33 39 32 L36 27 C35 26 34 26 33 27 L31 29 C30 29 29 29 28 28 C26 27 24 25 23 23 C22 22 22 21 22 20 L24 18 C25 17 25 16 24 15 Z" fill="#0F172A" />
      </g>
    </g>

    <!-- Pinned Apartment Context Bar inside Chat -->
    <g transform="translate(30, 185)">
      <rect width="780" height="88" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" />
      
      <!-- Mini Photo -->
      <g transform="translate(14, 14)">
        <clipPath id="chatAptThumb">
          <rect width="60" height="60" rx="14" />
        </clipPath>
        <image href="${apt1Base64}" width="60" height="60" clip-path="url(#chatAptThumb)" preserveAspectRatio="xMidYMid slice" />
      </g>

      <!-- Details -->
      <g transform="translate(90, 26)">
        <text x="0" y="18" font-family="-apple-system, sans-serif" font-size="18" font-weight="800" fill="#0F172A">
          2-комн. квартира • 38 м² (Врачар, Црвени Крст)
        </text>
        <text x="0" y="42" font-family="-apple-system, sans-serif" font-size="15" font-weight="600" fill="#E6392D">
          €450 / мес  •  Без комиссии риелтору (0%)
        </text>
      </g>

      <!-- View button right -->
      <g transform="translate(640, 24)">
        <rect width="116" height="40" rx="20" fill="#F1F5F9" />
        <text x="58" y="25" font-family="-apple-system, sans-serif" font-size="14" font-weight="700" fill="#0F172A" text-anchor="middle">
          Объект ➔
        </text>
      </g>
    </g>

    <!-- Date separator -->
    <g transform="translate(360, 298)">
      <rect width="120" height="28" rx="14" fill="#E2E8F0" />
      <text x="60" y="19" font-family="-apple-system, sans-serif" font-size="13" font-weight="600" fill="#64748B" text-anchor="middle">
        Сегодня
      </text>
    </g>

    <!-- CHAT MESSAGES AREA -->

    <!-- Message 1: Landlord (Gray Left Bubble) -->
    <g transform="translate(30, 345)">
      <rect width="600" height="135" rx="26" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" />
      <text x="26" y="38" font-family="-apple-system, sans-serif" font-size="19" font-weight="500" fill="#0F172A">
        Здравствуйте! Да, квартира полностью свободна.
      </text>
      <text x="26" y="68" font-family="-apple-system, sans-serif" font-size="19" font-weight="500" fill="#0F172A">
        Свежий ремонт, вся техника работает.
      </text>
      <text x="26" y="98" font-family="-apple-system, sans-serif" font-size="19" font-weight="500" fill="#0F172A">
        Договор заверяем, белый картон оформим 👍
      </text>
      <text x="540" y="118" font-family="-apple-system, sans-serif" font-size="13" font-weight="600" fill="#94A3B8">
        14:18
      </text>
    </g>

    <!-- Message 2: User (Red/Dark Right Bubble) -->
    <g transform="translate(230, 500)">
      <rect width="580" height="110" rx="26" fill="#1C3746" />
      <text x="26" y="38" font-family="-apple-system, sans-serif" font-size="19" font-weight="500" fill="#FFFFFF">
        Добрый день, Марко! Отлично. У нас кот,
      </text>
      <text x="26" y="68" font-family="-apple-system, sans-serif" font-size="19" font-weight="500" fill="#FFFFFF">
        приучен к порядку, можно ли с питомцем?
      </text>
      <g transform="translate(505, 78)">
        <text x="0" y="16" font-family="-apple-system, sans-serif" font-size="13" font-weight="600" fill="#94A3B8">14:20</text>
        <text x="42" y="16" font-family="sans-serif" font-size="14" fill="#38BDF8">✓✓</text>
      </g>
    </g>

    <!-- Message 3: Landlord (Gray Left Bubble) -->
    <g transform="translate(30, 630)">
      <rect width="640" height="135" rx="26" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" />
      <text x="26" y="38" font-family="-apple-system, sans-serif" font-size="19" font-weight="500" fill="#0F172A">
        Да, мы pet-friendly, животные приветствуются 🐱!
      </text>
      <text x="26" y="68" font-family="-apple-system, sans-serif" font-size="19" font-weight="500" fill="#0F172A">
        Когда вам удобно подойти посмотреть?
      </text>
      <text x="26" y="98" font-family="-apple-system, sans-serif" font-size="19" font-weight="500" fill="#0F172A">
        Могу показать сегодня в 18:30 или завтра утром.
      </text>
      <text x="580" y="118" font-family="-apple-system, sans-serif" font-size="13" font-weight="600" fill="#94A3B8">
        14:21
      </text>
    </g>

    <!-- Message 4: User (Dark Right Bubble) -->
    <g transform="translate(260, 785)">
      <rect width="550" height="110" rx="26" fill="#1C3746" />
      <text x="26" y="38" font-family="-apple-system, sans-serif" font-size="19" font-weight="500" fill="#FFFFFF">
        Супер! В 18:30 идеально подходит.
      </text>
      <text x="26" y="68" font-family="-apple-system, sans-serif" font-size="19" font-weight="500" fill="#FFFFFF">
        Адрес в объявлении точный?
      </text>
      <g transform="translate(475, 78)">
        <text x="0" y="16" font-family="-apple-system, sans-serif" font-size="13" font-weight="600" fill="#94A3B8">14:22</text>
        <text x="42" y="16" font-family="sans-serif" font-size="14" fill="#38BDF8">✓✓</text>
      </g>
    </g>

    <!-- Message 5: Landlord (Gray Left Bubble) -->
    <g transform="translate(30, 915)">
      <rect width="600" height="105" rx="26" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" />
      <text x="26" y="38" font-family="-apple-system, sans-serif" font-size="19" font-weight="500" fill="#0F172A">
        Да, Kneza od Semberije, подъезд 2, кв. 8.
      </text>
      <text x="26" y="68" font-family="-apple-system, sans-serif" font-size="19" font-weight="500" fill="#0F172A">
        Буду ждать вас на месте!
      </text>
      <text x="540" y="88" font-family="-apple-system, sans-serif" font-size="13" font-weight="600" fill="#94A3B8">
        14:23
      </text>
    </g>

    <!-- Quick suggestion buttons above input -->
    <g transform="translate(30, 1220)">
      <rect x="0" y="0" width="220" height="42" rx="21" fill="#FEF2F2" stroke="#FECDD3" stroke-width="1.5" />
      <text x="110" y="27" font-family="-apple-system, sans-serif" font-size="15" font-weight="700" fill="#E6392D" text-anchor="middle">
        Договорились! 👍
      </text>

      <rect x="235" y="0" width="260" height="42" rx="21" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" />
      <text x="365" y="27" font-family="-apple-system, sans-serif" font-size="15" font-weight="600" fill="#334155" text-anchor="middle">
        Где припарковать авто?
      </text>

      <rect x="510" y="0" width="200" height="42" rx="21" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" />
      <text x="610" y="27" font-family="-apple-system, sans-serif" font-size="15" font-weight="600" fill="#334155" text-anchor="middle">
        Отправьте геолокацию
      </text>
    </g>

    <!-- Input bar at bottom (Above Nav bar) -->
    <g transform="translate(20, 1280)">
      <rect width="800" height="74" rx="37" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <!-- Attach icon -->
      <text x="24" y="47" font-family="sans-serif" font-size="26">📎</text>
      <!-- Placeholder text -->
      <text x="64" y="46" font-family="-apple-system, sans-serif" font-size="18" font-weight="500" fill="#94A3B8">
        Напишите сообщение собственнику...
      </text>
      <!-- Mic icon -->
      <text x="660" y="47" font-family="sans-serif" font-size="24">🎙</text>
      <!-- Send Button Circle -->
      <g transform="translate(720, 7)">
        <circle cx="30" cy="30" r="30" fill="#E6392D" />
        <path d="M22 30 L38 30 M30 22 L38 30 L30 38" stroke="#FFFFFF" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      </g>
    </g>
  `;

  // ==========================================
  // SCREENSHOT 4: 4 Страны и поиск соседа 50/50
  // ==========================================
  const s4Content = `
    <!-- TopBar Component -->
    <g transform="translate(0, 60)">
      <rect width="840" height="96" fill="#FFFFFF" />
      <line x1="0" y1="96" x2="840" y2="96" stroke="#E2E8F0" stroke-width="1.5" />

      <!-- Brand Logo Left -->
      <g transform="translate(30, 20)">
        <g transform="translate(0, 2) scale(0.35)">
          <path d="M26 62L80 18L134 62L128 69L80 29L32 69L26 62Z" fill="#EA4335" />
          <path d="M80 122C78.2 120.2 52 103 45 86C38.5 71 47 61 60 61C68 61 75 66 80 72C85 66 92 61 100 61C113 61 121.5 71 115 86C108 103 81.8 120.2 80 122Z" fill="#E6392D" />
        </g>
        <text x="62" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="900" fill="#0F172A">
          Rentch
        </text>
      </g>

      <!-- Badge Double Rentch -->
      <g transform="translate(560, 24)">
        <rect width="250" height="48" rx="24" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1.5" />
        <circle cx="28" cy="24" r="14" fill="#10B981" />
        <text x="28" y="31" font-family="-apple-system, sans-serif" font-size="15" font-weight="900" fill="#FFFFFF" text-anchor="middle">50</text>
        <text x="140" y="31" font-family="-apple-system, sans-serif" font-size="16" font-weight="800" fill="#065F46" text-anchor="middle">
          Double Rentch
        </text>
      </g>
    </g>

    <!-- Section 1: Countries Selector -->
    <g transform="translate(30, 180)">
      <text x="0" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" fill="#0F172A">
        Выберите страну для аренды:
      </text>

      <!-- 4 Countries 2x2 Grid -->
      <g transform="translate(0, 45)">
        <!-- Country 1: Serbia -->
        <g transform="translate(0, 0)">
          <rect width="375" height="100" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" />
          <text x="24" y="62" font-family="sans-serif" font-size="44">🇷🇸</text>
          <text x="85" y="44" font-family="-apple-system, sans-serif" font-size="20" font-weight="800" fill="#0F172A">Сербия</text>
          <text x="85" y="72" font-family="-apple-system, sans-serif" font-size="14" font-weight="500" fill="#64748B">Белград, Нови-Сад</text>
          <rect x="255" y="35" width="105" height="30" rx="15" fill="#FEF2F2" />
          <text x="307" y="55" font-family="-apple-system, sans-serif" font-size="13" font-weight="800" fill="#E6392D" text-anchor="middle">520+ жилья</text>
        </g>

        <!-- Country 2: Georgia -->
        <g transform="translate(405, 0)">
          <rect width="375" height="100" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" />
          <text x="24" y="62" font-family="sans-serif" font-size="44">🇬🇪</text>
          <text x="85" y="44" font-family="-apple-system, sans-serif" font-size="20" font-weight="800" fill="#0F172A">Грузия</text>
          <text x="85" y="72" font-family="-apple-system, sans-serif" font-size="14" font-weight="500" fill="#64748B">Тбилиси, Батуми</text>
          <rect x="255" y="35" width="105" height="30" rx="15" fill="#FEF2F2" />
          <text x="307" y="55" font-family="-apple-system, sans-serif" font-size="13" font-weight="800" fill="#E6392D" text-anchor="middle">380+ жилья</text>
        </g>

        <!-- Country 3: Armenia -->
        <g transform="translate(0, 118)">
          <rect width="375" height="100" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" />
          <text x="24" y="62" font-family="sans-serif" font-size="44">🇦🇲</text>
          <text x="85" y="44" font-family="-apple-system, sans-serif" font-size="20" font-weight="800" fill="#0F172A">Армения</text>
          <text x="85" y="72" font-family="-apple-system, sans-serif" font-size="14" font-weight="500" fill="#64748B">Ереван, Гюмри</text>
          <rect x="255" y="35" width="105" height="30" rx="15" fill="#FEF2F2" />
          <text x="307" y="55" font-family="-apple-system, sans-serif" font-size="13" font-weight="800" fill="#E6392D" text-anchor="middle">240+ жилья</text>
        </g>

        <!-- Country 4: Montenegro -->
        <g transform="translate(405, 118)">
          <rect width="375" height="100" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" />
          <text x="24" y="62" font-family="sans-serif" font-size="44">🇲🇪</text>
          <text x="85" y="44" font-family="-apple-system, sans-serif" font-size="20" font-weight="800" fill="#0F172A">Черногория</text>
          <text x="85" y="72" font-family="-apple-system, sans-serif" font-size="14" font-weight="500" fill="#64748B">Будва, Подгорица, Бар</text>
          <rect x="255" y="35" width="105" height="30" rx="15" fill="#FEF2F2" />
          <text x="307" y="55" font-family="-apple-system, sans-serif" font-size="13" font-weight="800" fill="#E6392D" text-anchor="middle">190+ жилья</text>
        </g>
      </g>
    </g>

    <!-- Section 2: Roommate Finder (Double Rentch) -->
    <g transform="translate(30, 485)">
      <text x="0" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" fill="#0F172A">
        Совместная аренда 50/50:
      </text>

      <!-- Roommate Card 1 -->
      <g transform="translate(0, 48)" filter="url(#cardShadow)">
        <rect width="780" height="230" rx="24" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" />

        <!-- User Avatar -->
        <circle cx="56" cy="56" r="36" fill="#1C3746" />
        <text x="56" y="66" font-family="-apple-system, sans-serif" font-size="26" font-weight="900" fill="#FFFFFF" text-anchor="middle">ИМ</text>

        <!-- Name & Bio -->
        <g transform="translate(110, 26)">
          <text x="0" y="24" font-family="-apple-system, sans-serif" font-size="22" font-weight="800" fill="#0F172A">
            Иван, 27 лет • Senior Frontend Developer
          </text>
          <text x="0" y="52" font-family="-apple-system, sans-serif" font-size="16" font-weight="500" fill="#64748B">
            🇷🇸 Белград (Врачар / Дорчол)  •  Бюджет: до €350 / мес с человека
          </text>
        </g>

        <!-- Tags -->
        <g transform="translate(30, 105)">
          <rect x="0" y="0" width="130" height="34" rx="17" fill="#F1F5F9" />
          <text x="65" y="22" font-family="-apple-system, sans-serif" font-size="14" font-weight="600" fill="#334155" text-anchor="middle">💻 Удаленка</text>

          <rect x="142" y="0" width="170" height="34" rx="17" fill="#ECFDF5" />
          <text x="227" y="22" font-family="-apple-system, sans-serif" font-size="14" font-weight="700" fill="#059669" text-anchor="middle">🐶 Люблю питомцев</text>

          <rect x="324" y="0" width="160" height="34" rx="17" fill="#F1F5F9" />
          <text x="404" y="22" font-family="-apple-system, sans-serif" font-size="14" font-weight="600" fill="#334155" text-anchor="middle">🧹 Чистота и тишина</text>
        </g>

        <!-- Action CTA -->
        <g transform="translate(30, 155)">
          <rect width="720" height="52" rx="26" fill="#1C3746" />
          <text x="360" y="33" font-family="-apple-system, sans-serif" font-size="17" font-weight="800" fill="#FFFFFF" text-anchor="middle">
            Предложить совместную аренду 50/50 ➔
          </text>
        </g>
      </g>

      <!-- Roommate Card 2 -->
      <g transform="translate(0, 310)" filter="url(#cardShadow)">
        <rect width="780" height="230" rx="24" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" />

        <circle cx="56" cy="56" r="36" fill="#E6392D" />
        <text x="56" y="66" font-family="-apple-system, sans-serif" font-size="26" font-weight="900" fill="#FFFFFF" text-anchor="middle">АК</text>

        <g transform="translate(110, 26)">
          <text x="0" y="24" font-family="-apple-system, sans-serif" font-size="22" font-weight="800" fill="#0F172A">
            Анна, 25 лет • UI/UX Дизайнер
          </text>
          <text x="0" y="52" font-family="-apple-system, sans-serif" font-size="16" font-weight="500" fill="#64748B">
            🇬🇪 Тбилиси (Ваке / Сабуртало)  •  Бюджет: до $300 / мес
          </text>
        </g>

        <g transform="translate(30, 105)">
          <rect x="0" y="0" width="160" height="34" rx="17" fill="#F1F5F9" />
          <text x="80" y="22" font-family="-apple-system, sans-serif" font-size="14" font-weight="600" fill="#334155" text-anchor="middle">☕️ Люблю кофе</text>

          <rect x="172" y="0" width="170" height="34" rx="17" fill="#ECFDF5" />
          <text x="257" y="22" font-family="-apple-system, sans-serif" font-size="14" font-weight="700" fill="#059669" text-anchor="middle">🪴 Много растений</text>

          <rect x="354" y="0" width="160" height="34" rx="17" fill="#F1F5F9" />
          <text x="434" y="22" font-family="-apple-system, sans-serif" font-size="14" font-weight="600" fill="#334155" text-anchor="middle">🧘‍♀️ Йога и спорт</text>
        </g>

        <g transform="translate(30, 155)">
          <rect width="720" height="52" rx="26" fill="#1C3746" />
          <text x="360" y="33" font-family="-apple-system, sans-serif" font-size="17" font-weight="800" fill="#FFFFFF" text-anchor="middle">
            Предложить совместную аренду 50/50 ➔
          </text>
        </g>
      </g>
    </g>
  `;

  // Render Screenshot 1
  const s1Svg = createPhoneScreenshot({
    badgeText: '🔥 СВАЙПЫ ЖИЛЬЯ',
    badgeBg: '#E6392D',
    title: 'Свайпай и находи дом',
    subtitle: 'Умный подбор квартир без риелторов и наценок',
    gradientTop: '#142834',
    gradientBottom: '#0D1A22',
    screenContentXml: s1Content,
  });
  await sharp(Buffer.from(s1Svg)).png().toFile(path.join(publicDir, 'play_screenshot_1.png'));
  console.log('play_screenshot_1.png generated (1080x1920)');

  // Render Screenshot 2
  const s2Svg = createPhoneScreenshot({
    badgeText: '📍 ПОИСК НА КАРТЕ',
    badgeBg: '#F59E0B',
    title: 'Цены прямо на карте',
    subtitle: 'Находи жилье рядом с парками, набережной и метро',
    gradientTop: '#1B3848',
    gradientBottom: '#10222D',
    screenContentXml: s2Content,
  });
  await sharp(Buffer.from(s2Svg)).png().toFile(path.join(publicDir, 'play_screenshot_2.png'));
  console.log('play_screenshot_2.png generated (1080x1920)');

  // Render Screenshot 3
  const s3Svg = createPhoneScreenshot({
    badgeText: '💬 0% КОМИССИИ',
    badgeBg: '#10B981',
    title: 'Прямой чат с хозяином',
    subtitle: 'Договаривайтесь о просмотре и заезде напрямую',
    gradientTop: '#122530',
    gradientBottom: '#09141B',
    screenContentXml: s3Content,
  });
  await sharp(Buffer.from(s3Svg)).png().toFile(path.join(publicDir, 'play_screenshot_3.png'));
  console.log('play_screenshot_3.png generated (1080x1920)');

  // Render Screenshot 4
  const s4Svg = createPhoneScreenshot({
    badgeText: '🇷🇸 🇬🇪 🇦🇲 🇲🇪 4 СТРАНЫ',
    badgeBg: '#0284C7',
    title: '4 страны и руммейты',
    subtitle: 'Снимайте квартиру целиком или делите 50/50',
    gradientTop: '#162C38',
    gradientBottom: '#0C1820',
    screenContentXml: s4Content,
  });
  await sharp(Buffer.from(s4Svg)).png().toFile(path.join(publicDir, 'play_screenshot_4.png'));
  console.log('play_screenshot_4.png generated (1080x1920)');

  // Pack all into google_play_assets.zip
  const { execSync } = require('child_process');
  execSync(`python3 -c "
import zipfile, glob, os
with zipfile.ZipFile('public/google_play_assets.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for f in sorted(glob.glob('public/play_*.png')):
        z.write(f, os.path.basename(f))
print('Successfully created public/google_play_assets.zip')
"`, { stdio: 'inherit' });

  console.log('google_play_assets.zip successfully updated!');
}

generateAll().catch(console.error);
