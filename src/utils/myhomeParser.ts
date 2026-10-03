import { Apartment, TbilisiDistrict, PetPolicy } from '../types';
import { stripPhoneAndContactMentions, DEFAULT_AGENT_PHONE } from './phoneSanitizer';
import { detectDistrictFromText, getAccurateApartmentDistrict, getAccurateApartmentCoordinates } from './districtUtils';

export { DEFAULT_AGENT_PHONE };

export function matchDistrict(rawText: string = ''): { district: TbilisiDistrict; lat: number; lng: number } {
  return detectDistrictFromText(rawText);
}

/**
 * Extracts numeric MyHome statement ID from an apartment ID (e.g. "myhome-26173068" -> "26173068")
 */
export function getMyHomeStatementId(idOrUrl?: string): string | null {
  if (!idOrUrl) return null;
  const match = String(idOrUrl).match(/(?:^myhome-|statements?\/|-)(\d{6,10})(?:\/|\?|$)/i) || String(idOrUrl).match(/^(\d{6,10})$/);
  return match ? match[1] : null;
}

/**
 * Transliterates a Russian or Georgian apartment title into MyHome's Russian URL slug format
 */
function slugifyMyHomeTitle(title?: string): string {
  if (!title) return 'sdaetsia-kvartira-v-tbilisi';
  const cyrToLat: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'iu', я: 'ia',
  };
  const lower = title.toLowerCase();
  let out = '';
  for (const ch of lower) {
    if (cyrToLat[ch] !== undefined) {
      out += cyrToLat[ch];
    } else if (/[a-z0-9]/.test(ch)) {
      out += ch;
    } else {
      out += '-';
    }
  }
  const cleaned = out.replace(/-+/g, '-').replace(/^-|-$/g, '');
  return cleaned || 'sdaetsia-kvartira-v-tbilisi';
}

/**
 * Resolves the direct link to the original publication on MyHome.ge
 */
export function getMyHomeOriginalUrl(
  apt?: { id?: string; title?: string; sourceUrl?: string } | null
): string | null {
  if (!apt) return null;
  if (apt.sourceUrl && /^https?:\/\//i.test(apt.sourceUrl)) {
    return apt.sourceUrl;
  }
  const statementId = getMyHomeStatementId(apt.id);
  if (!statementId) return null;
  const slug = slugifyMyHomeTitle(apt.title);
  const fullSlug = slug.endsWith(`-${statementId}`) ? slug : `${slug}-${statementId}`;
  return `https://www.myhome.ge/ru/nedvizhimost/${fullSlug}/`;
}

/**
 * Checks if a candidate object has the characteristics of a MyHome statement
 */
function isStatementObject(item: any): boolean {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
  return Boolean(
    (item.id || item.statement_id || item.product_id) &&
    (item.price || item.total_price || item.price_total || item.price_usd || item.area || item.images || item.photos || item.dynamic_title)
  );
}

/**
 * Finds a single statement object inside an object or query tree
 */
function findStatementObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return null;

  if (obj.statement && isStatementObject(obj.statement)) {
    return obj.statement;
  }
  if (isStatementObject(obj)) {
    return obj;
  }

  // React Query queries array
  const queries = obj.props?.pageProps?.dehydratedState?.queries 
    || obj.pageProps?.dehydratedState?.queries 
    || obj.dehydratedState?.queries;

  if (Array.isArray(queries)) {
    for (const q of queries) {
      const stmt = q?.state?.data?.data?.statement 
        || q?.state?.data?.statement 
        || q?.state?.data?.result?.data?.statement;
      if (isStatementObject(stmt)) {
        return stmt;
      }
    }
  }

  // Check nested common locations
  if (isStatementObject(obj.props?.pageProps?.statement)) return obj.props.pageProps.statement;
  if (isStatementObject(obj.props?.pageProps?.data?.statement)) return obj.props.pageProps.data.statement;
  if (isStatementObject(obj.pageProps?.statement)) return obj.pageProps.statement;
  if (isStatementObject(obj.data?.statement)) return obj.data.statement;
  if (isStatementObject(obj.result?.data?.statement)) return obj.result.data.statement;

  // Recursively check first 2 levels
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val && typeof val === 'object') {
      if (isStatementObject(val.statement)) return val.statement;
      if (isStatementObject(val)) return val;
    }
  }

  return null;
}

/**
 * Recursively discovers all statements from a MyHome search page (__NEXT_DATA__ or API response)
 */
export function findAllStatements(obj: any): any[] {
  if (!obj) return [];
  const results: any[] = [];
  const seenIds = new Set<string>();

  const addIfUnique = (item: any) => {
    if (!item) return;
    const stmt = item.statement || item;
    if (isStatementObject(stmt)) {
      const id = String(stmt.id || stmt.statement_id || stmt.product_id);
      if (id && !seenIds.has(id)) {
        seenIds.add(id);
        results.push(stmt);
      }
    }
  };

  // If already an array
  if (Array.isArray(obj)) {
    for (const item of obj) {
      addIfUnique(item);
    }
    if (results.length > 0) return results;
  }

  // React Query queries (standard in MyHome search catalog)
  const queries = obj.props?.pageProps?.dehydratedState?.queries 
    || obj.pageProps?.dehydratedState?.queries 
    || obj.dehydratedState?.queries;

  if (Array.isArray(queries)) {
    for (const q of queries) {
      const data = q?.state?.data;
      if (!data) continue;

      const arraysToCheck = [
        data?.data?.pr_statement_list,
        data?.data?.statements,
        data?.data?.items,
        data?.data?.result?.data,
        data?.result?.data,
        data?.pr_statement_list,
        data?.statements,
        data?.items,
        Array.isArray(data?.data) ? data.data : null,
        Array.isArray(data) ? data : null,
      ];

      for (const arr of arraysToCheck) {
        if (Array.isArray(arr) && arr.length > 0) {
          for (const item of arr) {
            addIfUnique(item);
          }
        }
      }

      // Check single statement inside query
      const single = data?.data?.statement || data?.statement || data?.result?.data?.statement;
      addIfUnique(single);
    }
    if (results.length > 0) return results;
  }

  // Check pageProps locations
  const pageProps = obj.props?.pageProps || obj.pageProps || obj;
  const pageArrays = [
    pageProps.data?.pr_statement_list,
    pageProps.data?.statements,
    pageProps.data?.items,
    pageProps.statements,
    pageProps.pr_statement_list,
    Array.isArray(pageProps.data) ? pageProps.data : null,
  ];

  for (const arr of pageArrays) {
    if (Array.isArray(arr) && arr.length > 0) {
      for (const item of arr) {
        addIfUnique(item);
      }
    }
  }

  if (results.length > 0) return results;

  // Fallback to single statement
  const single = findStatementObject(obj);
  if (single) {
    results.push(single);
  }

  return results;
}

/**
 * Transforms a raw MyHome statement object into a Rentch Apartment model,
 * enforcing the agent phone number and cleaning third-party contacts.
 */
export function convertRawStatementToApartment(
  stmt: any,
  agentPhone: string = DEFAULT_AGENT_PHONE
): Apartment {
  // Collect images
  const rawImages: any[] = stmt.images || stmt.photos || stmt.gallery || [];
  const images: string[] = [];

  for (const item of rawImages) {
    let url: string | undefined;
    if (typeof item === 'string') {
      url = item;
    } else if (item && typeof item === 'object') {
      url = item.large || item.url || item.thumb || item.path || item.src;
    }
    if (url && typeof url === 'string') {
      let cleanUrl = url.startsWith('//') ? `https:${url}` : url;
      cleanUrl = cleanUrl.replace(/static-statements\.tnet\.ge/g, 'static-api-statements.tnet.ge');
      images.push(cleanUrl);
    }
  }

  if (images.length === 0 && stmt.photo) {
    const photoUrl = String(stmt.photo).replace(/static-statements\.tnet\.ge/g, 'static-api-statements.tnet.ge');
    images.push(photoUrl);
  }

  const statementId = String(stmt.id || stmt.statement_id || stmt.product_id || Date.now());
  const urbanName = stmt.urban_name || stmt.urban || '';
  const rawDistrictName = stmt.district_name || stmt.district || stmt.region || stmt.city_district || '';
  const districtName = urbanName || rawDistrictName.replace(/ვაკე-საბურთალო|დიდუბე-ჩუღურეთი|გლდანი-ნაძალადევი|ისანი-სამგორი/g, '') || stmt.city_name || '';
  const streetName = stmt.address || stmt.street_name || stmt.street || '';

  // Extract prices (USD & GEL) from MyHome price matrix or flat fields
  let priceUsd = 0;
  let priceGel = 0;

  if (stmt.price && typeof stmt.price === 'object') {
    // 2 is USD on MyHome, 1 is GEL, 3 is EUR
    if (stmt.price['2']?.price_total) {
      priceUsd = Number(stmt.price['2'].price_total);
    }
    if (stmt.price['1']?.price_total) {
      priceGel = Number(stmt.price['1'].price_total);
    }
  }

  if (!priceUsd) {
    if (stmt.currency_id === 2 || stmt.currency === 'USD') {
      priceUsd = Number(stmt.total_price || stmt.price_total || stmt.price_usd || stmt.price) || 0;
    } else {
      priceUsd = Number(stmt.price_usd || stmt.price_total_usd || stmt.total_price) || 800;
    }
  }

  if (!priceGel) {
    priceGel = Number(stmt.price_gel || stmt.price_total_gel) || Math.round(priceUsd * 2.72);
  }

  // Rooms and bedrooms
  const rooms = Number(stmt.room || stmt.room_type_id || stmt.rooms || stmt.room_count) || 2;
  const bedrooms = Number(stmt.bedroom || stmt.bedroom_type_id || stmt.bedrooms || stmt.bedroom_count) || Math.max(rooms - 1, 1);
  const areaSqm = Number(stmt.area || stmt.total_area || stmt.areaSqm) || 55;
  const floor = Number(stmt.floor) || 3;
  const totalFloors = Number(stmt.total_floors || stmt.floors || stmt.totalFloors) || 8;

  // Amenities extraction
  const amenities: string[] = ['Кондиционер', 'Стиральная машина', 'Wi-Fi', 'Центральное отопление'];
  if (stmt.balconies || stmt.balcony || stmt.has_balcony || stmt.hasBalcony) amenities.push('Балкон');
  if (stmt.dishwasher || stmt.has_dishwasher) amenities.push('Посудомоечная машина');
  if (stmt.elevator || stmt.has_elevator) amenities.push('Лифт');
  if (stmt.parking_type_id || stmt.parking || stmt.has_parking) amenities.push('Паркинг');
  if (stmt.swimming_pool_type) amenities.push('Бассейн');
  if (stmt.pets_allowed || stmt.petsAllowed) amenities.push('Можно с питомцами');

  // Title: use MyHome's dynamic_title, user_title, seo.h1 or fallback
  const dynamicTitle = stmt.dynamic_title || stmt.user_title || stmt.seo?.h1 || stmt.title 
    || `Сдается ${rooms}-комнатная квартира, ${streetName || districtName || 'Тбилиси'}`;

  const address = streetName ? streetName : (districtName ? `Тбилиси, ${districtName}` : 'Тбилиси');

  // District geo matching with accurate detection
  const detectedGeo = detectDistrictFromText(`${urbanName} ${dynamicTitle} ${address} ${districtName}`);
  let district: TbilisiDistrict = detectedGeo.district;

  // Extra check for district accuracy
  district = getAccurateApartmentDistrict({ district, address, title: dynamicTitle }) as TbilisiDistrict;

  const rawLat = stmt.lat ? Number(stmt.lat) : (Array.isArray(stmt.point?.coordinates) ? Number(stmt.point.coordinates[1]) : undefined);
  const rawLng = stmt.lng ? Number(stmt.lng) : (Array.isArray(stmt.point?.coordinates) ? Number(stmt.point.coordinates[0]) : undefined);

  const resolvedCoords = getAccurateApartmentCoordinates({
    id: `myhome-${statementId}`,
    district,
    address,
    title: dynamicTitle,
    lat: rawLat,
    lng: rawLng,
  });

  const hasPets = Boolean(stmt.pets_allowed ?? stmt.petsAllowed ?? false);
  const petPolicy: PetPolicy = hasPets ? 'allowed' : 'no_pets';

  const description = stmt.comment || stmt.description || stmt.seo?.meta_description || 'Квартира импортирована с портала MyHome.ge.';

  const rawRuSlug = stmt.href_lang?.ru || stmt.dynamic_slug || '';
  const cleanSlug = rawRuSlug
    ? (rawRuSlug.endsWith(`-${statementId}`) ? rawRuSlug : `${rawRuSlug}-${statementId}`)
    : `${slugifyMyHomeTitle(dynamicTitle)}-${statementId}`;
  const sourceUrl =
    stmt.sourceUrl && /^https?:\/\//i.test(stmt.sourceUrl)
      ? stmt.sourceUrl
      : `https://www.myhome.ge/ru/nedvizhimost/${cleanSlug}/`;

  const apartment: Apartment = {
    id: `myhome-${statementId}`,
    title: stripPhoneAndContactMentions(dynamicTitle.trim()),
    address: address.trim(),
    district: resolvedCoords.district,
    priceUsd: priceUsd,
    priceGel: priceGel,
    rooms: rooms,
    bedrooms: bedrooms,
    areaSqm: areaSqm,
    floor: floor,
    totalFloors: totalFloors,
    furniture: 'full',
    petPolicy: petPolicy,
    minPeriod: 'year_plus',
    maxResidents: Math.max(rooms * 2, 2),
    images: images.length > 0 ? images : [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'
    ],
    description: stripPhoneAndContactMentions(description.trim()),
    amenities: Array.from(new Set(amenities)),
    lat: resolvedCoords.lat,
    lng: resolvedCoords.lng,
    landlord: {
      id: `landlord-${statementId}`,
      name: stmt.owner_name || stmt.client_name || stmt.author || 'Собственник (Rentch)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      phone: agentPhone || DEFAULT_AGENT_PHONE,
      verified: true,
      responseTime: 'до 15 минут',
      rating: 4.9,
    },
    metro: stmt.metro_station_id ? `Метро (ID ${stmt.metro_station_id})` : undefined,
    isNew: true,
    sourceUrl,
  };

  return apartment;
}

/**
 * Parses raw text from MyHome (single listing or entire search catalog page)
 * and returns an array of Apartment objects with user's agent phone.
 */
export function parseMyHomeBatch(rawText: string, agentPhone: string = DEFAULT_AGENT_PHONE): Apartment[] {
  let cleaned = (rawText || '').trim();

  // If user pasted script tag: <script id="__NEXT_DATA__"...>{...}</script>
  const scriptMatch = cleaned.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (scriptMatch && scriptMatch[1]) {
    cleaned = scriptMatch[1].trim();
  }

  // If copied with JS prefix like copy(...) or console.log
  if (cleaned.startsWith('copy(') && cleaned.endsWith(')')) {
    cleaned = cleaned.slice(5, -1).trim();
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err: any) {
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      try {
        parsed = JSON.parse(cleaned.slice(startIdx, endIdx + 1));
      } catch (nestedErr) {
        throw new Error('Не удалось прочитать JSON. Убедитесь, что скопировали текст целиком со всеми фигурными скобками { ... }');
      }
    } else {
      throw new Error('В тексте не найден JSON объект. Пожалуйста, скопируйте текст со страницы или из документа.');
    }
  }

  const statements = findAllStatements(parsed);
  if (!statements || statements.length === 0) {
    throw new Error('В переданных данных не найдены объекты объявлений MyHome. Убедитесь, что скопировали данные страницы объявления или каталога.');
  }

  return statements.map((stmt) => convertRawStatementToApartment(stmt, agentPhone));
}

/**
 * Parses raw text copied from Word, browser, or bookmarklet form
 * into a valid Rentch Apartment object.
 */
export function parseMyHomeJson(rawText: string, agentPhone: string = DEFAULT_AGENT_PHONE): Apartment {
  const batch = parseMyHomeBatch(rawText, agentPhone);
  if (!batch || batch.length === 0) {
    throw new Error('В переданных данных не найден объект объявления MyHome');
  }
  return batch[0];
}
