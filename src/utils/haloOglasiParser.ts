import { Apartment, BelgradeDistrict, FurnitureStatus, PetPolicy } from '../types';
import { stripPhoneAndContactMentions, DEFAULT_AGENT_PHONE } from './phoneSanitizer';
import { getAccurateApartmentDistrict, getAccurateApartmentCoordinates } from './districtUtils';

export const DEFAULT_HALO_OGLASI_URL =
  'https://www.halooglasi.com/nekretnine/izdavanje-stanova/beograd?oglasivac_nekretnine_id_l=387237';

const HALO_IMAGE_ROOT = 'https://img.halooglasi.com';

const SERBIAN_AMENITIES_MAP: Record<string, string> = {
  'Klima': 'Кондиционер',
  'Lift': 'Лифт',
  'Terasa': 'Терраса',
  'Lođa': 'Лоджия',
  'Francuski balkon': 'Французский балкон',
  'Parking': 'Паркинг',
  'Garaža': 'Гараж',
  'Internet': 'Wi-Fi / Интернет',
  'KATV': 'Кабельное ТВ',
  'Interfon': 'Домофон',
  'Video nadzor': 'Видеонаблюдение',
  'Obezbeđenje': 'Охрана',
  'Recepcija': 'Ресепшн',
  'Topla voda': 'Горячая вода',
  'CG': 'Центральное отопление',
  'EG': 'Индивидуальное отопление',
  'TA': 'Отопление (ТА печь)',
  'Gas': 'Газовое отопление',
  'Podno grejanje': 'Тёплый пол',
  'Kamin': 'Камин',
  'Telefon': 'Телефонная линия',
  'Podrum': 'Кладовая / Подвал',
  'Ostava': 'Гардеробная / Кладовая',
  'Sa baštom': 'Собственный дворик',
  'Bazen': 'Бассейн',
  'Odmah useljiv': 'Готова к заезду',
  'Depozit': 'Депозит',
  'Nije poslednji sprat': 'Не последний этаж',
  'Za studente': 'Подходит студентам',
  'Za пушаче': 'Можно курить',
  'Za nepušače': 'Для некурящих',
  'Kućni ljubimci': 'Можно с животными',
  'Pet friendly': 'Можно с животными',
  'Novogradnja': 'Новостройка',
  'Lux': 'Люкс-ремонт',
  'Renovirano': 'Свежий ремонт',
};

const BELGRADE_LOC_RU_MAP: Record<string, string> = {
  'Beograd': 'Белград',
  'Opština Stari grad': 'Стари Град',
  'Opština Vračar': 'Врачар',
  'Opština Novi Beograd': 'Нови Београд',
  'Opština Savski venac': 'Савски Венац',
  'Opština Zemun': 'Земун',
  'Opština Palilula': 'Палилула',
  'Opština Zvezdara': 'Звездара',
  'Opština Voždovac': 'Вождовац',
  'Opština Čukarica': 'Чукарица',
  'Opština Rakovica': 'Раковица',
  'Dorćol': 'Дорчол',
  'Donji Dorćol': 'Нижний Дорчол',
  'Gornji Dorćol': 'Верхний Дорчол',
  'Skadarlija': 'Скадарлия',
  'Knez Mihailova': 'Кнез Михаилова',
  'Trg Republike': 'Площадь Республики',
  'Zeleni venac': 'Зелени Венац',
  'Terazije': 'Теразие',
  'Hram svetog Save': 'Храм Святого Саввы',
  'Slavija': 'Славия',
  'Kalenić pijaca': 'Каленич',
  'Crveni krst': 'Црвени Крст',
  'Čubura': 'Чубура',
  'Neimar': 'Неимар',
  'Cvetni trg': 'Цветни Трг',
  'Južni bulevar': 'Южный бульвар',
  'Beograd na vodi': 'Belgrade Waterfront',
  'Dedinje': 'Дединье',
  'Senjak': 'Сеняк',
  'Sarajevska': 'Сараевска',
  'Klinički centar': 'Клинички Центар',
  'Bežanijska kosa': 'Бежанийска Коса',
  'Fontana': 'Фонтана',
  'Arena': 'Белградская Арена',
  'Belville': 'Белвил (Belville)',
  'A Blok': 'А Блок (A Blok)',
  'West 65': 'West 65',
  'Airport City': 'Airport City',
  'Savada': 'Савада',
  'Paviljoni': 'Павильони',
  'Tošin bunar': 'Тошин Бунар',
  'Zemun kej': 'Земунский кей',
  'Gardoš': 'Гардош',
  'Altina': 'Алтина',
  'Karaburma': 'Карабурма',
  'Tašmajdan': 'Ташмайдан',
  'Bogoslovija': 'Богословия',
  'Borča': 'Борча',
  'Krnjača': 'Крняча',
  'Višnjička banja': 'Вишничка Баня',
  'Vukov spomenik': 'Вуков Споменик',
  'Bulevar kralja Aleksandra': 'Бульвар Короля Александра',
  'Mirijevo': 'Мириево',
  'Lion': 'Лион',
  'Đeram': 'Джерам',
  'Konjarnik': 'Конярник',
  'Cvetkova pijaca': 'Цветкова Пияца',
  'Olimp': 'Олимп',
  'Autokomanda': 'Аутокоманда',
  'Banjica': 'Баньица',
  'Medaković': 'Медакович',
  'Braće Jerković': 'Браче Еркович',
  'Vojvode Stepe': 'Войводе Степе',
  'Stepa Stepanović': 'Степа Степанович',
  'Dušanovac': 'Душановац',
  'Šumice': 'Шумице',
  'Banovo brdo': 'Баново Брдо',
  'Ada Ciganlija': 'Ада Циганлия',
  'Žarkovo': 'Жарково',
  'Cerak': 'Церак',
  'Vidikovac': 'Видиковац',
  'Košutnjak': 'Кошутняк',
  'Miljakovac': 'Миляковац',
};

const SERBIAN_PHRASE_DICT: Array<[RegExp, string]> = [
  [/\bizdajem\b/gi, 'Сдаётся'],
  [/\bizdaje se\b/gi, 'Сдаётся'],
  [/\bza izdavanje\b/gi, 'в аренду'],
  [/\bizdavanje\b/gi, 'аренда'],
  [/\bstan u\b/gi, 'квартира в'],
  [/\bstan na\b/gi, 'квартира в районе'],
  [/\bstan kod\b/gi, 'квартира у'],
  [/\bstan\b/gi, 'квартира'],
  [/\bgarsonjera\b/gi, 'студия (гарсоньера)'],
  [/\bjednosoban\b/gi, '1-комнатная'],
  [/\bjednoiposoban\b/gi, '1.5-комнатная'],
  [/\bdvosoban\b/gi, '2-комнатная'],
  [/\bdvoiposoban\b/gi, '2.5-комнатная'],
  [/\btrosoban\b/gi, '3-комнатная'],
  [/\btroiposoban\b/gi, '3.5-комнатная'],
  [/\bčetvorosoban\b/gi, '4-комнатная'],
  [/\bcetvorosoban\b/gi, '4-комнатная'],
  [/\bkompletno namešten\b/gi, 'полностью меблирована'],
  [/\bpotpuno namešten\b/gi, 'полностью меблирована'],
  [/\bnamešten\b/gi, 'с мебелью'],
  [/\bnameštena\b/gi, 'с мебелью'],
  [/\bnamešteno\b/gi, 'с мебелью'],
  [/\bpolunamešten\b/gi, 'частично меблирована'],
  [/\bprazan\b/gi, 'без мебели'],
  [/\bnovogradnja\b/gi, 'новостройка'],
  [/\bu novogradnji\b/gi, 'в новостройке'],
  [/\brenovirano\b/gi, 'после ремонта'],
  [/\brenoviran\b/gi, 'с ремонтом'],
  [/\bodmah useljiv\b/gi, 'готова к заселению'],
  [/\buseljiv\b/gi, 'готова к заезду'],
  [/\bdnevni boravak\b/gi, 'гостиная'],
  [/\bdnevna soba\b/gi, 'гостиная'],
  [/\bspavaća soba\b/gi, 'спальня'],
  [/\bspavaca soba\b/gi, 'спальня'],
  [/\bspavaće sobe\b/gi, 'спальни'],
  [/\bkuhinja\b/gi, 'кухня'],
  [/\btrpezarija\b/gi, 'столовая зона'],
  [/\bkupatilo\b/gi, 'ванная комната'],
  [/\bpredsoblje\b/gi, 'прихожая'],
  [/\bходник\b/gi, 'коридор'],
  [/\bhodnik\b/gi, 'коридор'],
  [/\bterasa\b/gi, 'терраса'],
  [/\bsprat\b/gi, 'этаж'],
  [/\bprizemlje\b/gi, '1-й этаж (приземлье)'],
  [/\bvisoko prizemlje\b/gi, 'высокий 1-й этаж'],
  [/\bsuteren\b/gi, 'цокольный этаж'],
  [/\bpotkrovlje\b/gi, 'мансарда'],
  [/\bcentralno grejanje\b/gi, 'центральное отопление'],
  [/\bgrejanje na\b/gi, 'отопление:'],
  [/\binverter klimu\b/gi, 'инверторный кондиционер'],
  [/\bklima uređaj\b/gi, 'кондиционер'],
  [/\bklima\b/gi, 'кондиционер'],
  [/\bgaražno mesto\b/gi, 'гаражное место'],
  [/\bparking mesto\b/gi, 'парковочное место'],
  [/\bkućni ljubimci dozvoljeni\b/gi, 'можно с домашними животными'],
  [/\bpet friendly\b/gi, 'можно с питомцами (pet-friendly)'],
  [/\bbez posrednika\b/gi, 'от собственника (без посредников)'],
  [/\bvlasnik\b/gi, 'собственник'],
  [/\bdepozit obavezan\b/gi, 'требуется депозит'],
  [/\bdepozit\b/gi, 'депозит'],
  [/\bmesečno\b/gi, 'в месяц'],
  [/\bduži vremenski period\b/gi, 'на длительный срок'],
  [/\bna duže\b/gi, 'на длительный срок'],
  [/\bu blizini\b/gi, 'рядом с'],
  [/\bstrogi centar\b/gi, 'самый центр'],
  [/\bcentar\b/gi, 'центр'],
  [/\bprostran\b/gi, 'просторная'],
  [/\bsvetao\b/gi, 'светлая'],
  [/\bmiran kraj\b/gi, 'тихий район'],
  [/\bmirnom delu\b/gi, 'в тихой части'],
  [/\bodlična lokacija\b/gi, 'отличная локация'],
];

export function stripHtmlTags(html: string = ''): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function translateSerbianToRussian(text: string = ''): string {
  if (!text) return '';
  let out = stripHtmlTags(text);

  // Replace known Belgrade locations first (longest first)
  const locEntries = Object.entries(BELGRADE_LOC_RU_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [sr, ru] of locEntries) {
    const escaped = sr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(escaped, 'gi'), ru);
  }

  for (const [regex, replacement] of SERBIAN_PHRASE_DICT) {
    out = out.replace(regex, replacement);
  }

  return stripPhoneAndContactMentions(out).trim();
}

export function getHaloOglasiId(idOrUrl?: string): string | null {
  if (!idOrUrl) return null;
  const str = String(idOrUrl).trim();
  const m =
    str.match(/^halo-(\d+)$/i) ||
    str.match(/\/(\d{10,15})(?:\?|$|\/)/) ||
    str.match(/^(\d{10,15})$/);
  return m ? m[1] : null;
}

function parseRomanOrNumericFloor(rawFloor?: string | number): number {
  if (typeof rawFloor === 'number' && !isNaN(rawFloor)) return Math.max(1, Math.round(rawFloor));
  if (!rawFloor) return 2;
  const s = String(rawFloor).trim().toUpperCase();
  if (s === 'PR' || s === 'VPR' || s === 'NPR' || s === 'SUT' || s === 'PSUT') return 1;
  const num = parseInt(s, 10);
  if (!isNaN(num)) return Math.max(1, num);
  const romanMap: Record<string, number> = {
    I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10,
    XI: 11, XII: 12, XIII: 13, XIV: 14, XV: 15, XVI: 16, XVII: 17, XVIII: 18, XIX: 19, XX: 20,
  };
  return romanMap[s] || 2;
}

function normalizeHaloImageUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let clean = rawUrl.trim().replace(/^['"]|['"]$/g, '');
  if (clean.startsWith('//')) clean = `https:${clean}`;
  else if (clean.startsWith('/')) clean = `${HALO_IMAGE_ROOT}${clean}`;
  // Upgrade thumbnail (/m/ or /s/) to large high-resolution (/l/)
  clean = clean.replace(/\/Thumbs\/(\d+)\/[ms]\//i, '/Thumbs/$1/l/');
  clean = clean.replace('https://img.halooglasi.com//', 'https://img.halooglasi.com/');
  return clean;
}

/**
 * Converts a HaloOglasi CurrentClassified JSON object (from a detail page) into a Rentch Apartment.
 */
export function convertHaloClassifiedToApartment(
  classified: any,
  agentPhone: string = DEFAULT_AGENT_PHONE
): Apartment {
  const adId = String(classified.Id || classified.id || Date.now());
  const other = classified.OtherFields || {};

  // 1. Price in EUR
  const priceEur = Math.max(
    100,
    Math.round(Number(other.cena_d || other.defaultunit_cena_d || classified.Price || 450))
  );

  // 2. Area in m2
  const areaSqm = Math.max(
    15,
    Math.round(Number(other.kvadratura_d || other.defaultunit_kvadratura_d || 48))
  );

  // 3. Rooms & Bedrooms
  const rawRoomsStr = String(other.broj_soba_s || '2.0').replace(',', '.');
  const rawRoomsFloat = parseFloat(rawRoomsStr) || 2;
  const rooms = Math.max(1, Math.round(rawRoomsFloat));
  const bedrooms = rawRoomsFloat <= 1.2 ? 1 : Math.max(1, Math.floor(rawRoomsFloat));

  // 4. Floor & Total Floors
  const floor = parseRomanOrNumericFloor(other.sprat_s);
  const totalFloors = Math.max(floor, parseRomanOrNumericFloor(other.sprat_od_s || floor + 2));

  // 5. Furniture status
  const namestenost = String(other.namestenost_s || '').toLowerCase();
  let furniture: FurnitureStatus = 'full';
  if (namestenost.includes('polu')) furniture = 'partial';
  else if (namestenost.includes('praz')) furniture = 'none';

  // 6. Location, District & Street
  const opstina = String(other.lokacija_s || '').trim();
  const mikrolokacija = String(other.mikrolokacija_s || '').trim();
  const ulica = String(other.ulica_t || '').trim();

  const opstinaRu = BELGRADE_LOC_RU_MAP[opstina] || opstina.replace(/^Opština\s+/i, '');
  const mikroRu = BELGRADE_LOC_RU_MAP[mikrolokacija] || mikrolokacija;

  const locationHint = `${opstina} ${mikrolokacija} ${ulica} ${classified.Title || ''}`;
  const district = getAccurateApartmentDistrict({
    city: 'belgrade',
    district: opstinaRu,
    address: locationHint,
    title: classified.Title || '',
  }) as BelgradeDistrict;

  const addressParts = ['г. Белград'];
  if (opstinaRu) addressParts.push(opstinaRu);
  if (mikroRu && mikroRu !== opstinaRu) addressParts.push(mikroRu);
  if (ulica) addressParts.push(`ул. ${ulica}`);
  const address = addressParts.join(', ');

  // 7. GPS Coordinates from GeoLocationRPT ("44.867000,20.468196")
  let lat = 0;
  let lng = 0;
  if (typeof classified.GeoLocationRPT === 'string' && classified.GeoLocationRPT.includes(',')) {
    const [latStr, lngStr] = classified.GeoLocationRPT.split(',');
    const parsedLat = parseFloat(latStr);
    const parsedLng = parseFloat(lngStr);
    if (!isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat > 44.5 && parsedLat < 45.1) {
      lat = parsedLat;
      lng = parsedLng;
    }
  }
  if (!lat || !lng) {
    const resolved = getAccurateApartmentCoordinates({
      id: `halo-${adId}`,
      city: 'belgrade',
      district,
      address,
      title: classified.Title || '',
    });
    lat = resolved.lat;
    lng = resolved.lng;
  }

  // 8. Images
  const rawImgs: string[] = Array.isArray(classified.ImageURLs) ? classified.ImageURLs : [];
  const images = rawImgs
    .map(normalizeHaloImageUrl)
    .filter((u) => Boolean(u) && !u.includes('no-image'));

  // 9. Amenities & Pet policy
  const rawDodatno: string[] = Array.isArray(other.dodatno_ss) ? other.dodatno_ss : [];
  const rawOstalo: string[] = Array.isArray(other.ostalo_ss) ? other.ostalo_ss : [];
  const combinedRawAmenities = [...rawDodatno, ...rawOstalo];
  const amenitiesSet = new Set<string>();

  for (const item of combinedRawAmenities) {
    const mapped = SERBIAN_AMENITIES_MAP[item] || translateSerbianToRussian(item);
    if (mapped) amenitiesSet.add(mapped);
  }
  if (other.grejanje_s || other.tip_objekta_s) {
    if (other.tip_objekta_s === 'Novogradnja') amenitiesSet.add('Новостройка');
    if (other.stanje_objekta_s === 'Lux') amenitiesSet.add('Люкс-ремонт');
    if (other.stanje_objekta_s === 'Renovirano') amenitiesSet.add('Свежий ремонт');
  }
  if (other.oglasivac_nekretnine_s === 'Vlasnik' || other.oglasivac_nekretnine_id_l === 387237) {
    amenitiesSet.add('От собственника');
  }
  if (amenitiesSet.size === 0) {
    amenitiesSet.add('Кондиционер');
    amenitiesSet.add('Wi-Fi / Интернет');
    amenitiesSet.add('От собственника');
  }

  const rawTextDesc = stripHtmlTags(classified.TextHtml || classified.Text || '');
  const isPetFriendly =
    combinedRawAmenities.some((a) => /ljubimci|pet/i.test(a)) ||
    /ljubimci|pet\s*friendly/i.test(rawTextDesc);
  const petPolicy: PetPolicy = isPetFriendly ? 'allowed' : 'cats_only';

  // 10. Clean Russian Title & Description
  const translatedRawTitle = translateSerbianToRussian(classified.Title || '');
  const roomTitlePrefix =
    rawRoomsFloat <= 1 ? 'Студия / 1-комн. квартира' : `${rooms}-комн. квартира`;
  const locTitleSuffix = mikroRu || opstinaRu || 'Белград';
  const title =
    translatedRawTitle.length >= 8
      ? `${roomTitlePrefix} (${areaSqm} м²) — ${locTitleSuffix}`
      : `${roomTitlePrefix} в Белграде (${locTitleSuffix}), ${areaSqm} м²`;

  const translatedBody = translateSerbianToRussian(rawTextDesc);
  const summaryHeader = `Квартира от собственника в Белграде (${address}). Площадь ${areaSqm} м², комнат: ${rawRoomsStr}, этаж ${floor}/${totalFloors}. Стоимость аренды: €${priceEur}/мес.`;
  const description = translatedBody
    ? `${summaryHeader}\n\n${translatedBody}`
    : `${summaryHeader}\nПолностью готова к просмотру и заселению.`;

  const relUrl = classified.RelativeUrl || `/nekretnine/izdavanje-stanova/beograd/${adId}`;
  const sourceUrl = relUrl.startsWith('http')
    ? relUrl
    : `https://www.halooglasi.com${relUrl.startsWith('/') ? '' : '/'}${relUrl}`;

  return {
    id: `halo-${adId}`,
    city: 'belgrade',
    title,
    district,
    address,
    priceUsd: priceEur,
    currency: 'EUR',
    originalPrice: priceEur,
    rooms,
    bedrooms,
    areaSqm,
    floor,
    totalFloors,
    furniture,
    petPolicy,
    minPeriod: 'month_to_year',
    maxResidents: Math.max(2, rooms * 2),
    images:
      images.length > 0
        ? images
        : ['https://img.halooglasi.com/slike/oglasi/Thumbs/260925/l/stan---borcasebes-5-minuta-od-stanice-5425647732304-71817134334.jpg'],
    description,
    amenities: Array.from(amenitiesSet),
    lat,
    lng,
    isNew: true,
    sourceUrl,
    landlord: {
      id: `landlord-halo-${adId}`,
      name: 'Собственник • Белград (Rentch)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      phone: agentPhone,
      verified: true,
      responseTime: 'до 15 минут',
      rating: 4.9,
    },
  };
}

/**
 * Parses a single HaloOglasi catalog item from `serverListData.Ads` (which contains `Id`, `Title`, `RelativeUrl`, and `ListHTML`).
 */
export function convertHaloListAdToApartment(
  adItem: any,
  agentPhone: string = DEFAULT_AGENT_PHONE
): Apartment | null {
  if (!adItem || typeof adItem !== 'object') return null;
  const adId = String(adItem.Id || adItem.id || '').trim();
  if (!adId) return null;

  // Decode HTML entities inside ListHTML
  const rawListHtml = String(adItem.ListHTML || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

  // Price in EUR: <span data-value="300">
  const priceMatch =
    rawListHtml.match(/data-value=["']([\d.,]+)["']/i) ||
    rawListHtml.match(/([\d.]+)\s*(?:&nbsp;|\s)*€/i);
  const priceEur = priceMatch
    ? Math.max(100, Math.round(parseFloat(priceMatch[1].replace(/\./g, '').replace(',', '.')) || 450))
    : 450;

  // Image from <img src='...'>
  const imgMatch = rawListHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
  const mainImg = imgMatch ? normalizeHaloImageUrl(imgMatch[1]) : '';

  // Subtitle places: <ul class="subtitle-places"><li>Beograd</li><li>Opština Palilula</li><li>Borča</li><li>Psunjska</li></ul>
  const placesBlockMatch = rawListHtml.match(/<ul[^>]*class=["'][^"']*subtitle-places[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i);
  const places: string[] = [];
  if (placesBlockMatch) {
    const liMatches = placesBlockMatch[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi);
    for (const m of liMatches) {
      const cleaned = stripHtmlTags(m[1]).trim();
      if (cleaned) places.push(cleaned);
    }
  }

  // Features: Kvadratura, Broj soba, Spratnost
  const areaMatch = rawListHtml.match(/([\d.,]+)\s*(?:&nbsp;|\s)*m<sup>2<\/sup>/i);
  const areaSqm = areaMatch ? Math.max(15, Math.round(parseFloat(areaMatch[1].replace(',', '.')) || 45)) : 48;

  const roomsMatch = rawListHtml.match(/([\d.,+]+)\s*(?:&nbsp;|\s)*<span[^>]*>Broj soba<\/span>/i);
  const rawRoomsStr = roomsMatch ? roomsMatch[1].replace(',', '.') : '2.0';
  const rawRoomsFloat = parseFloat(rawRoomsStr) || 2;
  const rooms = Math.max(1, Math.round(rawRoomsFloat));
  const bedrooms = rawRoomsFloat <= 1.2 ? 1 : Math.max(1, Math.floor(rawRoomsFloat));

  const floorMatch = rawListHtml.match(/([^<>]+?)\s*(?:&nbsp;|\s)*<span[^>]*>Spratnost<\/span>/i);
  const floorRaw = floorMatch ? stripHtmlTags(floorMatch[1]).trim() : '2/5';
  const [flPart, totPart] = floorRaw.split('/');
  const floor = parseRomanOrNumericFloor(flPart);
  const totalFloors = Math.max(floor, parseRomanOrNumericFloor(totPart || floor + 2));

  // Short description
  const descMatch = rawListHtml.match(/<p[^>]*class=["'][^"']*product-description[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
  const shortDescSr = descMatch ? stripHtmlTags(descMatch[1]) : '';

  const opstina = places[1] || '';
  const mikrolokacija = places[2] || '';
  const ulica = places[3] || '';

  return convertHaloClassifiedToApartment(
    {
      Id: adId,
      Title: adItem.Title || stripHtmlTags(rawListHtml.match(/<h3[^>]*class=["'][^"']*product-title[^"']*["'][^>]*>([\s\S]*?)<\/h3>/i)?.[1] || ''),
      RelativeUrl: adItem.RelativeUrl || rawListHtml.match(/href=["'](\/nekretnine\/izdavanje-stanova\/[^"']+)["']/i)?.[1] || '',
      TextHtml: shortDescSr,
      ImageURLs: mainImg && !mainImg.includes('no-image') ? [mainImg] : [],
      OtherFields: {
        cena_d: priceEur,
        kvadratura_d: areaSqm,
        broj_soba_s: rawRoomsStr,
        sprat_s: String(floor),
        sprat_od_s: String(totalFloors),
        grad_s: 'Beograd',
        lokacija_s: opstina,
        mikrolokacija_s: mikrolokacija,
        ulica_t: ulica,
        namestenost_s: 'namešteno',
        oglasivac_nekretnine_s: 'Vlasnik',
      },
    },
    agentPhone
  );
}

/**
 * Fast O(N) JSON object extractor after a marker string (e.g. "QuidditaEnvironment.CurrentClassified=").
 * Avoids regex catastrophic backtracking on 350KB+ HTML documents.
 */
function extractJsonObjectAfterMarker(source: string, marker: string): any | null {
  const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const assignRegex = new RegExp(`${escapedMarker}\\s*=\\s*\\{`);
  const match = assignRegex.exec(source);
  if (!match) return null;
  const startBrace = source.indexOf('{', match.index + marker.length);
  if (startBrace === -1) return null;

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let i = startBrace; i < source.length; i++) {
    const ch = source[i];
    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (ch === '\\') {
        isEscaped = true;
      } else if (ch === '"') {
        inString = false;
      }
    } else {
      if (ch === '"') {
        inString = true;
      } else if (ch === '{') {
        depth++;
      } else if (ch === '}') {
        depth--;
        if (depth === 0) {
          const jsonSlice = source.slice(startBrace, i + 1);
          try {
            return JSON.parse(jsonSlice);
          } catch {
            return null;
          }
        }
      }
    }
  }
  return null;
}

/**
 * Extracts HaloOglasi apartments from raw HTML or JSON text (works with full page HTML, CurrentClassified JSON, or serverListData JSON).
 */
export function parseHaloOglasiBatch(
  rawHtmlOrJson: string,
  agentPhone: string = DEFAULT_AGENT_PHONE
): Apartment[] {
  if (!rawHtmlOrJson || !rawHtmlOrJson.trim()) {
    throw new Error('Пустые данные для парсинга HaloOglasi');
  }

  const trimmed = rawHtmlOrJson.trim();
  const results: Apartment[] = [];
  const seenIds = new Set<string>();

  const pushUnique = (apt: Apartment | null) => {
    if (!apt || !apt.id || seenIds.has(apt.id)) return;
    seenIds.add(apt.id);
    results.push(apt);
  };

  // 1. Check if it contains QuidditaEnvironment.CurrentClassified = {...}
  const classifiedObj = extractJsonObjectAfterMarker(
    trimmed,
    'QuidditaEnvironment.CurrentClassified'
  );
  if (classifiedObj && (classifiedObj.Id || classifiedObj.OtherFields)) {
    pushUnique(convertHaloClassifiedToApartment(classifiedObj, agentPhone));
  }

  // 2. Check if it contains QuidditaEnvironment.serverListData = {...}
  const listObj = extractJsonObjectAfterMarker(
    trimmed,
    'QuidditaEnvironment.serverListData'
  );
  if (listObj && Array.isArray(listObj.Ads)) {
    for (const ad of listObj.Ads) {
      pushUnique(convertHaloListAdToApartment(ad, agentPhone));
    }
  }

  if (results.length > 0) return results;

  // 3. Try direct JSON parse if user pasted JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item.OtherFields || item.ImageURLs) {
            pushUnique(convertHaloClassifiedToApartment(item, agentPhone));
          } else if (item.ListHTML) {
            pushUnique(convertHaloListAdToApartment(item, agentPhone));
          }
        }
      } else if (parsed.Ads && Array.isArray(parsed.Ads)) {
        for (const ad of parsed.Ads) {
          pushUnique(convertHaloListAdToApartment(ad, agentPhone));
        }
      } else if (parsed.Id || parsed.OtherFields) {
        pushUnique(convertHaloClassifiedToApartment(parsed, agentPhone));
      }
    } catch {
      // Fall through to HTML regex extraction
    }
  }

  return results;
}
