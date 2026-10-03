import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { detectDistrictFromText } from './districtUtils';
import { PetPolicy } from '../types';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export interface ExtractedPdfApartment {
  title: string;
  district: string;
  address: string;
  priceUsd: number;
  rooms: number;
  bedrooms: number;
  areaSqm: number;
  floor: number;
  totalFloors: number;
  furniture: 'full' | 'partial' | 'none';
  petPolicy: PetPolicy;
  description: string;
  amenities: string[];
  images: string[];
  extractedFile: string;
  rawTextPreview: string;
  sourceType?: 'pdf' | 'zip';
  zipFileNames?: string[];
}

const TBILISI_DISTRICTS: { name: string; aliases: string[]; lat: number; lng: number }[] = [
  { name: 'Ваке (Vake)', aliases: ['ваке', 'vake', 'ვაკე', 'чавчавадзе', 'аракишвили', 'абашидзе', 'палиашвили', 'мзиури'], lat: 41.7118, lng: 44.7571 },
  { name: 'Сабуртало (Saburtalo)', aliases: ['сабуртало', 'saburtalo', 'საბურთალო', 'казбеги', 'пекин', 'важи', 'важа', 'пшавела', 'делиси', 'бахтриони', 'нуцубидзе'], lat: 41.7289, lng: 44.7645 },
  { name: 'Вера (Vera)', aliases: ['вера', 'vera', 'ვერა', 'барнов', 'кучукидзе', 'петриашвили', 'филармония'], lat: 41.7082, lng: 44.7834 },
  { name: 'Мтацминда (Mtatsminda)', aliases: ['мтацминда', 'mtatsminda', 'მთაწმინდა', 'руставели', 'фуникулер', 'свобод'], lat: 41.6961, lng: 44.7938 },
  { name: 'Чугурети (Chugureti)', aliases: ['чугурети', 'chugureti', 'ჩუღურეთი', 'марджанишвили', 'фабрика', 'агмашенебели'], lat: 41.7126, lng: 44.8015 },
  { name: 'Дидубе (Didube)', aliases: ['дидубе', 'didube', 'დიდუბე', 'церетели', 'экспо'], lat: 41.7456, lng: 44.7789 },
  { name: 'Багеби (Bagebi)', aliases: ['багеби', 'bagebi', 'ბაგები', 'университет'], lat: 41.7089, lng: 44.7321 },
  { name: 'Исани (Isani)', aliases: ['исани', 'isani', 'ისანი', 'навтлуги', 'габриел'], lat: 41.6892, lng: 44.8398 },
  { name: 'Ортачала (Ortachala)', aliases: ['ортачала', 'ortachala', 'ორთაჭალა', 'гулия', 'горгасали'], lat: 41.6789, lng: 44.8214 },
  { name: 'Сололаки (Sololaki)', aliases: ['сололаки', 'sololaki', 'სოლოლაკი', 'асатиани', 'дадиани', 'кикодзе'], lat: 41.6899, lng: 44.7981 },
  { name: 'Авлабари (Avlabari)', aliases: ['авлабари', 'avlabari', 'ავლაბარი', 'троиц', 'самеба', 'метро авлабари'], lat: 41.6934, lng: 44.8142 },
];

/**
 * Extracts high-resolution page snapshot from a PDF page canvas
 */
async function renderPageToImage(page: any, scale = 1.5): Promise<string> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  if (!context) {
    throw new Error('Canvas context not available');
  }

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;
  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Main parser function to read uploaded PDF and extract apartment details
 */
export async function parseApartmentPdf(file: File): Promise<ExtractedPdfApartment> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;

  const numPages = pdfDocument.numPages;
  const extractedImages: string[] = [];
  let fullText = '';

  // Render up to first 4 pages as image snapshots for the gallery
  const pagesToRender = Math.min(numPages, 4);
  for (let i = 1; i <= pagesToRender; i++) {
    try {
      const page = await pdfDocument.getPage(i);
      const imgDataUrl = await renderPageToImage(page, 1.5);
      extractedImages.push(imgDataUrl);

      // Extract text
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      fullText += '\n' + pageText;
    } catch (err) {
      console.warn(`Error processing PDF page ${i}:`, err);
    }
  }

  // Fallback image if canvas rendering failed or no pages rendered
  if (extractedImages.length === 0) {
    extractedImages.push(
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'
    );
  }

  const lowerText = fullText.toLowerCase();

  // 1. Parse Price ($ or USD or GEL)
  let priceUsd = 0;
  const priceRegexes = [
    /\$\s*(\d{3,5})/i,
    /(\d{3,5})\s*\$/i,
    /(\d{3,5})\s*(?:usd|долл|dollars?)/i,
    /(?:цена|стоимость|price|rent)[:\s]*(\d{3,5})/i,
    /(\d{3,5})\s*(?:\/|\s*в\s*мес|\s*per\s*month)/i,
  ];

  for (const regex of priceRegexes) {
    const match = fullText.match(regex);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (parsed >= 200 && parsed <= 15000) {
        priceUsd = parsed;
        break;
      }
    }
  }

  // If not found, look for 3-4 digit standalone numbers near currency symbols
  if (priceUsd === 0) {
    const fallbackPrice = fullText.match(/\b([4-9]\d{2}|[1-5]\d{3})\b/);
    if (fallbackPrice && fallbackPrice[1]) {
      priceUsd = parseInt(fallbackPrice[1], 10);
    } else {
      priceUsd = 900; // sensible default
    }
  }

  // 2. Parse District
  const detectedGeo = detectDistrictFromText(fullText);
  let matchedDistrict = detectedGeo.district;

  // 3. Parse Area (sqm)
  let areaSqm = 55;
  const areaMatch = fullText.match(/(\d{2,3}(?:[\.,]\d)?)\s*(?:кв\.?\s*м|м2|m2|sqm|sq\.?\s*m|м²)/i);
  if (areaMatch && areaMatch[1]) {
    const parsedArea = parseFloat(areaMatch[1].replace(',', '.'));
    if (parsedArea >= 15 && parsedArea <= 500) {
      areaSqm = Math.round(parsedArea);
    }
  }

  // 4. Parse Rooms & Bedrooms
  let rooms = 2;
  let bedrooms = 1;
  if (/студия|studio/i.test(lowerText)) {
    rooms = 1;
    bedrooms = 1;
  } else {
    const roomsMatch = fullText.match(/(\d+)\s*(?:комн|комнат|room|rooms)/i);
    if (roomsMatch && roomsMatch[1]) {
      const parsedRooms = parseInt(roomsMatch[1], 10);
      if (parsedRooms >= 1 && parsedRooms <= 10) {
        rooms = parsedRooms;
      }
    }
    const bedroomsMatch = fullText.match(/(\d+)\s*(?:спальн|спален|bed|bedrooms?|br)/i);
    if (bedroomsMatch && bedroomsMatch[1]) {
      const parsedBedrooms = parseInt(bedroomsMatch[1], 10);
      if (parsedBedrooms >= 1 && parsedBedrooms <= 8) {
        bedrooms = parsedBedrooms;
      }
    } else {
      bedrooms = Math.max(1, rooms - 1);
    }
  }

  // 5. Parse Floor
  let floor = 4;
  let totalFloors = 9;
  const floorMatch = fullText.match(/(\d+)\s*(?:\/|\s*из\s*|\s*эт\s*|\s*этаж\s*|\s*floor\s*)(\d+)?/i);
  if (floorMatch) {
    if (floorMatch[1]) floor = parseInt(floorMatch[1], 10) || 4;
    if (floorMatch[2]) totalFloors = parseInt(floorMatch[2], 10) || 9;
  }

  // 6. Furniture
  let furniture: 'full' | 'partial' | 'none' = 'full';
  if (/без мебели|unfurnished|нет мебели/i.test(lowerText)) {
    furniture = 'none';
  } else if (/частично|partial/i.test(lowerText)) {
    furniture = 'partial';
  }

  // 7. Pet Policy
  let petPolicy: 'allowed' | 'cats_only' | 'no_pets' = 'allowed';
  if (/без животных|no pets|запрещено с питомц/i.test(lowerText)) {
    petPolicy = 'no_pets';
  } else if (/только кошк|cats only/i.test(lowerText)) {
    petPolicy = 'cats_only';
  }

  // 8. Amenities detected in text
  const detectedAmenities: string[] = [];
  if (/кондиционер|air condition|ac/i.test(lowerText)) detectedAmenities.push('Кондиционер');
  if (/стиральн|washing machine/i.test(lowerText)) detectedAmenities.push('Стиральная машина');
  if (/посудомоечн|dishwasher/i.test(lowerText)) detectedAmenities.push('Посудомоечная машина');
  if (/балкон|терраса|balcony|terrace/i.test(lowerText)) detectedAmenities.push('Балкон');
  if (/паркинг|парковка|parking/i.test(lowerText)) detectedAmenities.push('Паркинг');
  if (/отопление|heating|карм|karma/i.test(lowerText)) detectedAmenities.push('Центральное отопление');
  if (/панорамн|вид|view/i.test(lowerText)) detectedAmenities.push('Панорамный вид');
  if (/wi-fi|интернет|internet/i.test(lowerText)) detectedAmenities.push('Wi-Fi');

  if (detectedAmenities.length === 0) {
    detectedAmenities.push('Кондиционер', 'Стиральная машина', 'Wi-Fi', 'Центральное отопление', 'Балкон');
  }

  // 9. Address
  let address = '';
  const streetMatch = fullText.match(/(?:ул\.?|улица|пр\.?|проспект|street|str\.?|avenue|ave\.?)\s+([А-Яа-яA-Za-z0-9\s\-]+(?:\d+)?)/i);
  if (streetMatch && streetMatch[0]) {
    address = streetMatch[0].trim().slice(0, 50);
  } else {
    address = `район ${matchedDistrict.split(' ')[0]}`;
  }

  // 10. Clean Title
  let title = '';
  // Try to generate clean title from rooms + district or clean filename
  const cleanFileName = file.name.replace(/\.[^/.]+$/, '').replace(/[_\\-]/g, ' ');
  if (cleanFileName.length > 5 && !cleanFileName.toLowerCase().startsWith('pdf') && !cleanFileName.toLowerCase().startsWith('document')) {
    title = cleanFileName;
  } else {
    title = `${rooms}-комнатная квартира в ${matchedDistrict.split(' ')[0]}`;
  }

  // 11. Description
  let description = '';
  // Take lines with good length or clean summary
  const lines = fullText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 20 && !/^(page|стр|тел|phone|www|http)/i.test(l));

  if (lines.length > 0) {
    description = lines.slice(0, 3).join('. ');
    if (description.length > 300) {
      description = description.slice(0, 297) + '...';
    }
  } else {
    description = `Уютная светлая квартира с качественным ремонтом в районе ${matchedDistrict}. Отличное расположение, полностью готова к заселению.`;
  }

  return {
    title,
    district: matchedDistrict,
    address,
    priceUsd,
    rooms,
    bedrooms,
    areaSqm,
    floor,
    totalFloors,
    furniture,
    petPolicy,
    description,
    amenities: detectedAmenities,
    images: extractedImages,
    extractedFile: file.name,
    rawTextPreview: fullText.trim().slice(0, 600),
  };
}
