import fs from 'fs';
import path from 'path';

const DEFAULT_AGENT_PHONE = '+995 558 54-23-65';
const TARGET_COUNT = 500;

function stripPhones(text = '') {
  if (!text) return '';
  return text
    .replace(/(?:\+?995\s*|\b0)?(?:5\d{2}|7\d{2})\s*\d{2}[\s-]*\d{2}[\s-]*\d{2}\b/g, '')
    .replace(/(?:\+?7|8)[\s(-]*\d{3}[)\s-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}\b/g, '')
    .replace(/\b\d{3}[\s-]\d{2}[\s-]\d{2}[\s-]\d{2}\b/g, '')
    .replace(/\b5\d{8}\b/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const DISTRICT_KEYWORDS = [
  { match: ['ваке', 'vake', 'ჭავჭავაძ', 'აბაშიძ', 'მრგვალ', 'round garden', 'აფაქიძ'], name: 'Ваке (Vake)', lat: 41.7101, lng: 44.7573 },
  { match: ['сабуртало', 'saburtalo', 'ვაჟა', 'ყაზბეგ', 'პეკინ', 'пекин', 'батумск', 'гагарин', 'delisi'], name: 'Сабуртало (Saburtalo)', lat: 41.7275, lng: 44.7681 },
  { match: ['мтацминда', 'mtatsminda', 'руставели', 'rustaveli', 'свобод', 'freedom', 'парламент', 'грибоедов', 'табидзе'], name: 'Мтацминда (Mtatsminda)', lat: 41.6961, lng: 44.7915 },
  { match: ['сололаки', 'sololaki', 'ლადო ასათიან', 'ასათიან', 'დადიან', 'кикодзе'], name: 'Сололаки (Sololaki)', lat: 41.6892, lng: 44.7981 },
  { match: ['чугурети', 'chughureti', 'марджанишвили', 'marjanishvili', 'агмашенебели', 'vorontsov', 'воронцов', 'фабрика', 'fabrika'], name: 'Чугурети (Chughureti)', lat: 41.7118, lng: 44.8015 },
  { match: ['дидубе', 'didube', 'церетели', 'tsereteli', 'აკაკი წერეთლ'], name: 'Дидубе (Didube)', lat: 41.7451, lng: 44.7865 },
  { match: ['вера', 'vera', 'филармония', 'барнов', 'барнова', 'гудаури'], name: 'Вера (Vera)', lat: 41.7061, lng: 44.7825 },
  { match: ['ортачала', 'ortachala', 'горгасал', 'багдад'], name: 'Ортачала (Ortachala)', lat: 41.6775, lng: 44.8315 },
  { match: ['авлабари', 'avlabari', 'метро авлабар', 'рике', 'тринити', 'самеба'], name: 'Авлабари (Avlabari)', lat: 41.6931, lng: 44.8165 },
  { match: ['исни', 'isani', 'навтлуги', 'навтлуг', 'навтлугис'], name: 'Исани (Isani)', lat: 41.6851, lng: 44.8451 },
  { match: ['самгори', 'samgori', 'варкетили', 'varketili', 'московский'], name: 'Самгори (Samgori)', lat: 41.6915, lng: 44.8785 },
  { match: ['багеби', 'bagebi', 'წყნეთის', 'цкнет'], name: 'Багеби (Bagebi)', lat: 41.7035, lng: 44.7315 },
  { match: ['дигоми', 'dighomi', 'дигомский', 'бежанишвили', 'любляна'], name: 'Дигоми (Dighomi)', lat: 41.7751, lng: 44.7715 },
  { match: ['глдани', 'gldani', 'мухиани', 'mukhiani'], name: 'Глдани (Gldani)', lat: 41.7951, lng: 44.8215 },
  { match: ['надзаладеви', 'nadzaladevi', 'лотко', 'лотк'], name: 'Надзаладеви (Nadzaladevi)', lat: 41.7351, lng: 44.8115 }
];

function detectDistrict(text = '') {
  const lower = text.toLowerCase();
  for (const item of DISTRICT_KEYWORDS) {
    if (item.match.some((m) => lower.includes(m))) {
      return { district: item.name, lat: item.lat, lng: item.lng };
    }
  }
  return { district: 'Сабуртало (Saburtalo)', lat: 41.7275, lng: 44.7681 };
}

async function fetchPage(page) {
  const url = `https://api-statements.tnet.ge/v1/statements?deal_types=7&real_estate_types=1&cities=1&currency_id=1&owner_type=physical&page=${page}`;
  const res = await fetch(url, {
    headers: {
      'X-Website-Key': 'myhome',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'locale': 'ru',
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} on page ${page}`);
  }
  const json = await res.json();
  return json.data?.data || [];
}

async function main() {
  console.log(`Starting parsing 500 daily rental objects from MyHome.ge...`);
  const uniqueItems = new Map();
  let page = 1;
  const maxPages = 40;

  while (uniqueItems.size < TARGET_COUNT && page <= maxPages) {
    try {
      console.log(`Fetching page ${page}... (Current unique count: ${uniqueItems.size})`);
      const items = await fetchPage(page);
      if (!items || items.length === 0) {
        console.log(`Page ${page} returned 0 items, stopping.`);
        break;
      }

      for (const stmt of items) {
        if (!stmt || !stmt.id) continue;
        const idStr = String(stmt.id);
        if (uniqueItems.has(idStr)) continue;

        // Collect images
        const rawImages = stmt.images || [];
        const images = [];
        for (const img of rawImages) {
          let u = img.large || img.url || img.thumb || img.path;
          if (typeof img === 'string') u = img;
          if (u && typeof u === 'string') {
            let clean = u.startsWith('//') ? `https:${u}` : u;
            clean = clean.replace(/static-statements\.tnet\.ge/g, 'static-api-statements.tnet.ge');
            images.push(clean);
          }
        }

        // Must have at least 1 image
        if (images.length === 0) continue;

        // Price parsing
        let pricePerNight = 45;
        let priceGel = 120;

        if (stmt.price && typeof stmt.price === 'object') {
          if (stmt.price['2']?.price_total) {
            pricePerNight = Number(stmt.price['2'].price_total);
          }
          if (stmt.price['1']?.price_total) {
            priceGel = Number(stmt.price['1'].price_total);
          }
        }

        if (!pricePerNight || pricePerNight < 10) {
          if (priceGel && priceGel >= 30) {
            pricePerNight = Math.round(priceGel / 2.72);
          } else {
            pricePerNight = 45;
          }
        }

        if (!priceGel) {
          priceGel = Math.round(pricePerNight * 2.72);
        }

        // Original link to the listing on MyHome.ge
        const ruSlug = stmt.href_lang?.ru || stmt.dynamic_slug || '';
        const cleanSlug = ruSlug
          ? (ruSlug.endsWith(`-${idStr}`) ? ruSlug : `${ruSlug}-${idStr}`)
          : `arenda-posutochno-kvartira-tbilisi-${idStr}`;
        const sourceUrl = `https://www.myhome.ge/ru/nedvizhimost/${cleanSlug}/`;

        // District detection
        const rawLocationText = `${stmt.urban_name || ''} ${stmt.district_name || ''} ${stmt.address || ''} ${stmt.dynamic_title || ''}`;
        const geo = detectDistrict(rawLocationText);

        const titleRaw = stmt.dynamic_title || stmt.user_title || `Посуточная аренда: ${stmt.room || 2}-комн. квартира, ${stmt.urban_name || 'Тбилиси'}`;
        const cleanTitle = stripPhones(titleRaw);
        const cleanAddress = stripPhones(stmt.address || `Тбилиси, ${stmt.urban_name || geo.district}`);

        const rooms = Number(stmt.room) || 2;
        const bedrooms = Number(stmt.bedroom) || Math.max(rooms - 1, 1);
        const areaSqm = Number(stmt.area) || 55;
        const floor = Number(stmt.floor) || 3;
        const totalFloors = Number(stmt.total_floors) || 8;

        const maxGuests = Number(stmt.quantity_of_day) || Math.min(Math.max(rooms * 2, 2), 6);

        const amenities = ['Кондиционер', 'Wi-Fi', 'Чистое бельё и полотенца', 'Стиральная машина', 'Фен'];
        if (stmt.parameters?.has_balcony || stmt.has_balcony) amenities.push('Балкон');
        if (stmt.parameters?.has_elevator || stmt.has_elevator) amenities.push('Лифт');
        if (stmt.parameters?.has_parking || stmt.has_parking) amenities.push('Парковка');
        if (stmt.parameters?.pets_allowed || stmt.pets_allowed) amenities.push('Можно с питомцами');

        const apt = {
          id: `myhome-daily-${idStr}`,
          originalStatementId: idStr,
          title: cleanTitle,
          address: cleanAddress,
          district: geo.district,
          city: 'tbilisi',
          rentalType: 'daily',
          pricePerNight: pricePerNight,
          priceUsd: pricePerNight * 30,
          priceGel: priceGel,
          currency: 'USD',
          rooms: rooms,
          bedrooms: bedrooms,
          areaSqm: areaSqm,
          floor: floor,
          totalFloors: totalFloors,
          maxGuests: maxGuests,
          furniture: 'full',
          petPolicy: stmt.pets_allowed ? 'allowed' : 'no_pets',
          minPeriod: 'month',
          images: images,
          description: stripPhones(stmt.comment || 'Уютная и чистая квартира для посуточной аренды в Тбилиси. Оснащена всей необходимой техникой и мебелью для комфортного проживания.'),
          amenities: amenities,
          lat: stmt.lat ? Number(stmt.lat) : geo.lat,
          lng: stmt.lng ? Number(stmt.lng) : geo.lng,
          sourceUrl: sourceUrl,
          myhomeUrl: sourceUrl,
          landlord: {
            id: `landlord-myhome-${idStr}`,
            name: 'Собственник (Rentch)',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
            phone: DEFAULT_AGENT_PHONE,
            verified: true,
            responseTime: 'до 15 минут',
            rating: 4.9,
          },
          verified: true,
          bookedRanges: [],
          metro: stmt.metro_station_id ? 'Рядом с метро' : undefined,
          views: Math.floor(Math.random() * 40) + 10,
          likes: Math.floor(Math.random() * 20) + 5,
        };

        uniqueItems.set(idStr, apt);
        if (uniqueItems.size >= TARGET_COUNT) break;
      }

      page++;
      // Polite delay between pages
      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      console.error(`Error on page ${page}:`, err.message);
      page++;
    }
  }

  const dailyApartments = Array.from(uniqueItems.values());
  console.log(`Successfully collected ${dailyApartments.length} daily rental apartments!`);

  // 1. Merge into data/apartments.json
  const dataPath = path.resolve('data/apartments.json');
  let currentApartments = [];
  try {
    if (fs.existsSync(dataPath)) {
      currentApartments = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    }
  } catch (e) {
    console.warn('Error reading data/apartments.json:', e.message);
  }

  // Keep existing long-term apartments, and replace or add daily apartments
  const longTermOnly = currentApartments.filter((a) => a.rentalType !== 'daily');
  const mergedAll = [...dailyApartments, ...longTermOnly];

  fs.writeFileSync(dataPath, JSON.stringify(mergedAll, null, 2), 'utf-8');
  console.log(`Written ${mergedAll.length} total apartments to data/apartments.json (including ${dailyApartments.length} daily apartments)!`);

  // 2. Also write to src/data/seedDailyApartments.ts so Vite bundles them
  const seedPath = path.resolve('src/data/seedDailyApartments.ts');
  const fileContent = `import { Apartment } from '../types';

export const SEED_DAILY_APARTMENTS: Apartment[] = ${JSON.stringify(dailyApartments, null, 2)};
`;
  fs.writeFileSync(seedPath, fileContent, 'utf-8');
  console.log(`Updated src/data/seedDailyApartments.ts successfully!`);
}

main().catch(console.error);
