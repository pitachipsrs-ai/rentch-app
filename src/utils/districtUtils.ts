import { TbilisiDistrict, YerevanDistrict, BelgradeDistrict, CityDistrict, RentchCity } from '../types';

export interface CityConfigItem {
  id: RentchCity;
  nameRu: string;
  nameInRu: string;
  nameGenRu: string;
  flag: string;
  countryRu: string;
  centerLat: number;
  centerLng: number;
  zoom: number;
  popularDistrictsLabel: string;
}

export const CITIES_CONFIG: Record<RentchCity, CityConfigItem> = {
  tbilisi: {
    id: 'tbilisi',
    nameRu: 'Тбилиси',
    nameInRu: 'в Тбилиси',
    nameGenRu: 'Тбилиси',
    flag: '🇬🇪',
    countryRu: 'Грузия',
    centerLat: 41.7166,
    centerLng: 44.7833,
    zoom: 13,
    popularDistrictsLabel: 'Ваке, Сабуртало, Сололаки, Вера, Чугурети',
  },
  yerevan: {
    id: 'yerevan',
    nameRu: 'Ереван',
    nameInRu: 'в Ереване',
    nameGenRu: 'Еревана',
    flag: '🇦🇲',
    countryRu: 'Армения',
    centerLat: 40.1792,
    centerLng: 44.5152,
    zoom: 13,
    popularDistrictsLabel: 'Кентрон, Арабкир, Давташен, Ачапняк, Зейтун',
  },
  belgrade: {
    id: 'belgrade',
    nameRu: 'Белград',
    nameInRu: 'в Белграде',
    nameGenRu: 'Белграда',
    flag: '🇷🇸',
    countryRu: 'Сербия',
    centerLat: 44.8125,
    centerLng: 20.4612,
    zoom: 13,
    popularDistrictsLabel: 'Врачар, Дорчол, Нови Београд, Земун, Belgrade Waterfront',
  },
};

export const RENTCH_CITIES: CityConfigItem[] = [
  CITIES_CONFIG.tbilisi,
  CITIES_CONFIG.yerevan,
  CITIES_CONFIG.belgrade,
];

export interface DistrictInfo {
  name: CityDistrict;
  shortRu: string;
  aliases: string[];
  lat: number;
  lng: number;
  isCentral: boolean;
  city?: RentchCity;
}

export const YEREVAN_DISTRICT_LIST: DistrictInfo[] = [
  {
    name: 'Кентрон / Центр (Kentron)',
    shortRu: 'Кентрон (Центр)',
    aliases: ['кентрон', 'kentron', 'центр ереван', 'каскад', 'северный проспект', 'малый центр', 'туманяна', 'абовяна', 'маштоца', 'саряна'],
    lat: 40.1811,
    lng: 44.5136,
    isCentral: true,
    city: 'yerevan',
  },
  {
    name: 'Арабкир (Arabkir)',
    shortRu: 'Арабкир',
    aliases: ['арабкир', 'arabkir', 'комитас', 'komitas', 'баграмяна', 'киевская ереван'],
    lat: 40.2051,
    lng: 44.5042,
    isCentral: true,
    city: 'yerevan',
  },
  {
    name: 'Давташен (Davtashen)',
    shortRu: 'Давташен',
    aliases: ['давташен', 'davtashen'],
    lat: 40.2194,
    lng: 44.4828,
    isCentral: false,
    city: 'yerevan',
  },
  {
    name: 'Ачапняк (Ajapnyak)',
    shortRu: 'Ачапняк',
    aliases: ['ачапняк', 'ajapnyak', 'алабяна', 'галабяна'],
    lat: 40.1972,
    lng: 44.4694,
    isCentral: false,
    city: 'yerevan',
  },
  {
    name: 'Зейтун / Канакер (Kanaker-Zeytun)',
    shortRu: 'Зейтун',
    aliases: ['зейтун', 'канакер', 'zeytun', 'kanaker'],
    lat: 40.2078,
    lng: 44.5369,
    isCentral: false,
    city: 'yerevan',
  },
  {
    name: 'Нор-Норк (Nor Nork)',
    shortRu: 'Нор-Норк',
    aliases: ['нор-норк', 'нор норк', 'nor nork'],
    lat: 40.1967,
    lng: 44.5681,
    isCentral: false,
    city: 'yerevan',
  },
  {
    name: 'Эребуни (Erebuni)',
    shortRu: 'Эребуни',
    aliases: ['эребуни', 'erebuni'],
    lat: 40.1464,
    lng: 44.5269,
    isCentral: false,
    city: 'yerevan',
  },
  {
    name: 'Шенгавит (Shengavit)',
    shortRu: 'Шенгавит',
    aliases: ['шенгавит', 'shengavit', 'гарегин нжде'],
    lat: 40.1453,
    lng: 44.4847,
    isCentral: false,
    city: 'yerevan',
  },
  {
    name: 'Малатия-Себастия (Malatia-Sebastia)',
    shortRu: 'Малатия-Себастия',
    aliases: ['малатия', 'себастия', 'malatia', 'sebastia'],
    lat: 40.1731,
    lng: 44.4489,
    isCentral: false,
    city: 'yerevan',
  },
  {
    name: 'Аван (Avan)',
    shortRu: 'Аван',
    aliases: ['аван', 'avan'],
    lat: 40.2186,
    lng: 44.5675,
    isCentral: false,
    city: 'yerevan',
  },
];

export const BELGRADE_DISTRICT_LIST: DistrictInfo[] = [
  {
    name: 'Стари Град / Дорчол (Stari Grad / Dorćol)',
    shortRu: 'Стари Град / Дорчол',
    aliases: [
      'стари град', 'дорчол', 'stari grad', 'opština stari grad', 'opstina stari grad',
      'dorcol', 'dorćol', 'кнез михаилова', 'knez mihailova', 'скадарлия', 'skadarlija',
      'trg republike', 'трг републике', 'zeleni venac', 'зелени венац', 'kosančićev', 'terazije', 'теразие',
      'studentski trg', 'студентски трг', 'gundulićev', 'francuska', 'cara dušana'
    ],
    lat: 44.8206,
    lng: 20.4622,
    isCentral: true,
    city: 'belgrade',
  },
  {
    name: 'Врачар (Vračar)',
    shortRu: 'Врачар',
    aliases: [
      'врачар', 'vracar', 'vračar', 'opština vračar', 'opstina vracar',
      'храм святого саввы', 'hram svetog save', 'славия', 'slavija', 'каленич', 'kalenić', 'kalenic',
      'crveni krst', 'црвени крст', 'čubura', 'cubura', 'чубура', 'neimar', 'неимар',
      'cvetni trg', 'цветни трг', 'južni bulevar', 'juzni bulevar', 'makenzijeva', 'krunska', 'крунска'
    ],
    lat: 44.7989,
    lng: 20.4764,
    isCentral: true,
    city: 'belgrade',
  },
  {
    name: 'Нови Београд (Novi Beograd)',
    shortRu: 'Нови Београд',
    aliases: [
      'нови београд', 'новый белград', 'novi beograd', 'opština novi beograd', 'opstina novi beograd',
      'блок', 'blok', 'airport city', 'west 65', 'a blok', 'belville', 'белвил',
      'bežanijska kosa', 'bezanijska kosa', 'бежанийска коса', 'bežanija', 'bezanija',
      'fontana', 'фонтана', 'arena', 'арена', 'uSće', 'usce', 'ушче', 'savada', 'савада',
      'ledine', 'ледине', 'paviljoni', 'павильони', 'tošin bunar', 'tosin bunar', 'jurija gagarina'
    ],
    lat: 44.8128,
    lng: 20.4119,
    isCentral: true,
    city: 'belgrade',
  },
  {
    name: 'Савски Венац / Belgrade Waterfront',
    shortRu: 'Belgrade Waterfront',
    aliases: [
      'савски венац', 'savski venac', 'opština savski venac', 'opstina savski venac',
      'belgrade waterfront', 'београд на води', 'beograd na vodi', 'дединье', 'dedinje',
      'сеняк', 'senjak', 'sarajevska', 'сараевска', 'nemanjina', 'неманьина', 'kneza miloša', 'kneza milosa',
      'klinički centar', 'klinicki centar', 'prokop', 'прокоп', 'mostar'
    ],
    lat: 44.8056,
    lng: 20.4519,
    isCentral: true,
    city: 'belgrade',
  },
  {
    name: 'Земун (Zemun)',
    shortRu: 'Земун',
    aliases: [
      'земун', 'zemun', 'opština zemun', 'opstina zemun', 'гардош', 'gardoš', 'gardos',
      'altina', 'алтина', 'batajnica', 'батаница', 'zemun polje', 'galenika', 'галеника',
      'cara dušana zemun', 'prgrenica', 'retrostil', 'kej', 'земунски кей', 'novi grad zemun'
    ],
    lat: 44.8431,
    lng: 20.4014,
    isCentral: false,
    city: 'belgrade',
  },
  {
    name: 'Палилула (Palilula)',
    shortRu: 'Палилула',
    aliases: [
      'палилула', 'palilula', 'opština palilula', 'opstina palilula', 'ташмайдан', 'tašmajdan', 'tasmajdan',
      'карабурма', 'karaburma', 'borča', 'borca', 'борча', 'krnjača', 'krnjaca', 'крняча',
      'bogoslovija', 'богословия', 'višnjička banja', 'visnjicka banja', 'вишничка баня',
      'kotež', 'kotez', 'котеж', 'ovča', 'ovca', 'овча', 'sebeš', 'sebes', 'себеш', 'cvijićeva', 'cvijiceva'
    ],
    lat: 44.8142,
    lng: 20.4875,
    isCentral: false,
    city: 'belgrade',
  },
  {
    name: 'Звездара (Zvezdara)',
    shortRu: 'Звездара',
    aliases: [
      'звездара', 'zvezdara', 'opština zvezdara', 'opstina zvezdara',
      'вуков споменик', 'vukov spomenik', 'бульвар короля александра', 'bulevar kralja aleksandra',
      'mirijevo', 'мириево', 'lion', 'лион', 'đeram', 'djeram', 'джерам', 'konjarnik', 'конярник',
      'cvetkova pijaca', 'цветкова пияца', 'učiteljsko naselje', 'uciteljsko naselje',
      'olimp', 'олимп', 'mali mokri lug', 'veliki mokri lug', 'dimitrija tucovića', 'dimitrija tucovica'
    ],
    lat: 44.7964,
    lng: 20.5061,
    isCentral: false,
    city: 'belgrade',
  },
  {
    name: 'Вождовац (Voždovac)',
    shortRu: 'Вождовац',
    aliases: [
      'вождовац', 'vozdovac', 'voždovac', 'opština voždovac', 'opstina vozdovac',
      'аутокоманда', 'autokomanda', 'баньица', 'banjica', 'medaković', 'medakovic', 'медакович',
      'braće jerković', 'brace jerkovic', 'браче еркович', 'stepa stepanović', 'stepa stepanovic',
      'dušanovac', 'dusanovac', 'душановац', 'šumice', 'sumice', 'шумице', 'ustanička', 'ustanicka',
      'vojvode stepe', 'войводе степе', 'kumodraž', 'kumodraz', 'jajinci'
    ],
    lat: 44.7753,
    lng: 20.4792,
    isCentral: false,
    city: 'belgrade',
  },
  {
    name: 'Чукарица / Баново Брдо (Čukarica)',
    shortRu: 'Баново Брдо',
    aliases: [
      'чукарица', 'баново брдо', 'cukarica', 'čukarica', 'opština čukarica', 'opstina cukarica',
      'banovo brdo', 'ада циганлия', 'ada ciganlija', 'žarkovo', 'zarkovo', 'жарково',
      'cerak', 'церак', 'vidikovac', 'видиковац', 'bele vode', 'беле воде', 'košutnjak', 'kosutnjak',
      'požeška', 'pozeska', 'пожешка', 'rakovica', 'opština rakovica', 'раковица', 'miljakovac', 'миляковац',
      'kanarevo brdo', 'petlovo brdo', 'labudovo brdo', 'kneževac', 'knezevac'
    ],
    lat: 44.7778,
    lng: 20.4158,
    isCentral: false,
    city: 'belgrade',
  },
];

export const YEREVAN_DISTRICTS: YerevanDistrict[] = YEREVAN_DISTRICT_LIST.map((d) => d.name as YerevanDistrict);
export const BELGRADE_DISTRICTS: BelgradeDistrict[] = BELGRADE_DISTRICT_LIST.map((d) => d.name as BelgradeDistrict);

export function getDistrictsForCity(city: RentchCity = 'tbilisi'): string[] {
  if (city === 'yerevan') return YEREVAN_DISTRICTS;
  if (city === 'belgrade') return BELGRADE_DISTRICTS;
  return TBILISI_DISTRICT_LIST.map((d) => d.name);
}

export function getDistrictInfoListForCity(city: RentchCity = 'tbilisi'): DistrictInfo[] {
  if (city === 'yerevan') return YEREVAN_DISTRICT_LIST;
  if (city === 'belgrade') return BELGRADE_DISTRICT_LIST;
  return TBILISI_DISTRICT_LIST;
}

export function getApartmentCity(apartment: {
  city?: RentchCity;
  district?: string;
  address?: string;
  title?: string;
}): RentchCity {
  if (apartment.city === 'yerevan' || apartment.city === 'belgrade' || apartment.city === 'tbilisi') {
    return apartment.city;
  }
  const combined = `${apartment.district || ''} ${apartment.address || ''} ${apartment.title || ''}`.toLowerCase();
  if (
    YEREVAN_DISTRICT_LIST.some(
      (d) => d.name.toLowerCase() === (apartment.district || '').toLowerCase() || d.aliases.some((a) => combined.includes(a))
    ) ||
    combined.includes('ереван') ||
    combined.includes('yerevan')
  ) {
    return 'yerevan';
  }
  if (
    BELGRADE_DISTRICT_LIST.some(
      (d) => d.name.toLowerCase() === (apartment.district || '').toLowerCase() || d.aliases.some((a) => combined.includes(a))
    ) ||
    combined.includes('белград') ||
    combined.includes('belgrade') ||
    combined.includes('београд')
  ) {
    return 'belgrade';
  }
  return 'tbilisi';
}

export const TBILISI_DISTRICT_LIST: DistrictInfo[] = [
  {
    name: 'Диди Дигоми (Didi Dighomi)',
    shortRu: 'Диди Дигоми',
    aliases: [
      'диди дигоми', 'дид дигом', 'didi dighomi', 'დიდი დიღომი', 'დიდ დიღომში',
      'мириана', 'царя мириана', 'мириан мепе', 'mirian mepe', 'მირიან მეფის',
      'дигоми', 'digomi', 'дигом', 'დიღომი', 'დიღმის', 'петрици', 'petritsi', 'პეტრიწის',
      'фарнаваз', 'farnavaz', 'ფარნავაზ', 'деметре тавдадебули', 'тавдадебули', 'თავდადებულის',
      'боб уолш', 'уолш', 'უოლშის', 'теимураз', 'თეიმურაზ', 'абашидзе-орбелиани', 'орбелиани н.',
      'агмашенебели аллея', 'აღმაშენებლის ხეივ'
    ],
    lat: 41.7856,
    lng: 44.7612,
    isCentral: false,
  },
  {
    name: 'Багеби (Bagebi)',
    shortRu: 'Багеби',
    aliases: [
      'багеби', 'багебши', 'багеб', 'bagebi', 'ბაგები', 'ბაგებში', 'учхоз', 'сакривело', 'багебис',
      'цхнетис', 'цхнетское', 'წყნეთის გზატკეცილი'
    ],
    lat: 41.7089,
    lng: 44.7321,
    isCentral: false,
  },
  {
    name: 'Ортачала (Ortachala)',
    shortRu: 'Ортачала',
    aliases: [
      'ортачала', 'ортачал', 'ortachala', 'ორთაჭალა', 'ორთაჭალაში', 'ортачаль', 'гулия', 'gulia', 'гулуа', 'gulua', 'გულუას',
      'горгасали', 'горгасал', 'gorgasali', 'გორგასლის', 'бочорма', 'бочормис', 'бочорми',
      'гргасали', 'ортачалы', 'ортачале', 'крцанисис'
    ],
    lat: 41.6789,
    lng: 44.8214,
    isCentral: false,
  },
  {
    name: 'Крцаниси (Krtsanisi)',
    shortRu: 'Крцаниси',
    aliases: [
      'крцаниси', 'крцанисши', 'крцанис', 'krtsanisi', 'კრწანისი', 'კრწანისში',
      'резиденция крцаниси', 'волски', 'вольского', 'ვოლსკის'
    ],
    lat: 41.6712,
    lng: 44.8190,
    isCentral: false,
  },
  {
    name: 'Сабуртало (Saburtalo)',
    shortRu: 'Сабуртало',
    aliases: [
      'сабуртало', 'сабуртал', 'saburtalo', 'საბურთალო', 'საბურთალოზე', 'казбеги', 'kazbegi', 'ყაზბეგის',
      'пекин', 'пекини', 'პეკინის', 'важи', 'важа', 'пшавела', 'vazha', 'ვაჟა-ფშაველას',
      'делиси', 'delisi', 'დელისი', 'бахтриони', 'бахтрионис', 'bakhtrioni', 'ბახტრიონის',
      'нуцубидзе', 'nutsubidze', 'ნუცუბიძის', 'политковская', 'политковской', 'politkovskaya', 'პოლიტკოვსკაიას',
      'гамрекели', 'gamrekeli', 'გამრეკელის', 'джикия', 'jikia', 'ჯიქიას',
      'университетская', 'университетис', 'university', 'უნივერსიტეტის',
      'кавтарадзе', 'kavtaradze', 'ქავთარაძის', 'саирме', 'sairme', 'საირმის', 'миндали', 'миндадзе',
      'шартава', 'shartava', 'შარტავას', 'иосебидзе', 'iosebidze', 'იოსებიძის', 'сабурталин',
      'цинцадзе', 'tsintsadze', 'ცინცაძის', 'шавишвили', 'shavishvili', 'შავიშვილის',
      'алексидзе', 'aleksidze', 'ალექსიძის', 'датуашвили', 'datuashvili', 'დათუაშვილის',
      'тавхелидзе', 'tavkhelidze', 'თავხელიძის', 'чиладзе', 'чиладзие', 'chiladze', 'ჭილაძის',
      'костава', 'kostava', 'კოსტავას', 'гагарина', 'gagarin', 'გაგარინის',
      'мицкевича', 'мицкевичис', 'mitskevich', 'მიცკევიჩის', 'тамарашвили', 'tamarashvili', 'თამარაშვილის',
      'асатиани м.', 'фанджикидзе', 'будапешт', 'львовская', 'ониашвили', 'камаानि', 'каманис'
    ],
    lat: 41.7254,
    lng: 44.7568,
    isCentral: false,
  },
  {
    name: 'Вера (Vera)',
    shortRu: 'Вера',
    aliases: [
      'вера', 'веразе', 'vera', 'ვერა', 'ვერაზე', 'барнов', 'барнова', 'barnov', 'barnovi', 'ბარნოვის',
      'кучукидзе', 'петриашвили', 'филармония', 'меликишвили', 'melikishvili', 'მელიქიშვილის',
      'шанидзе', 'гогебашвили', 'хорава', 'николадзе', 'джанашия', 'круг веры', 'тархнишвили'
    ],
    lat: 41.7082,
    lng: 44.7834,
    isCentral: true,
  },
  {
    name: 'Мтацминда (Mtatsminda)',
    shortRu: 'Мтацминда',
    aliases: [
      'мтацминда', 'мтацминд', 'mtatsminda', 'მთაწმინდა', 'მთაწმინდაზე', 'руставели', 'rustaveli', 'რუსთაველის',
      'фуникулер', 'свобод', 'бесики', 'грибоедов', 'табидзе', 'золотая миля', 'ингороква',
      'братьев зубалашвили', 'мамадавти', 'чонкадзе'
    ],
    lat: 41.6961,
    lng: 44.7938,
    isCentral: true,
  },
  {
    name: 'Старый Тбилиси / Сололаки',
    shortRu: 'Старый Тбилиси',
    aliases: [
      'сололаки', 'сололак', 'sololaki', 'სოლოლაკი', 'სოლოლაკში', 'старый тбилиси', 'старого тбилиси', 'old tbilisi',
      'дадиани ш.', 'кикодзе', 'леселидзе', 'котэ абхази', 'шиндиси', 'кала',
      'амаглеба', 'лермонтов', 'бетлеми', 'серные бани', 'абанотубани', 'майдани'
    ],
    lat: 41.6899,
    lng: 44.7981,
    isCentral: true,
  },
  {
    name: 'Авлабари (Avlabari)',
    shortRu: 'Авлабари',
    aliases: [
      'авлабари', 'авлабар', 'avlabari', 'ავლაბარი', 'ავლაბარში', 'троиц', 'самеба', 'метро авлабари',
      'армази', 'душети', 'винный подъем', 'европейская площадь', 'рикэ', 'кетеван дедофали', 'кетеван цхамебули'
    ],
    lat: 41.6934,
    lng: 44.8142,
    isCentral: false,
  },
  {
    name: 'Чугурети / Марджанишвили',
    shortRu: 'Чугурети',
    aliases: [
      'чугурети', 'чугурет', 'chugureti', 'ჩუღურეთი', 'ჩუღურეთში', 'марджанишвили', 'marjanishvili', 'მარჯანიშვილის',
      'фабрика', 'fabrika', 'агмашенебели д.', 'киевская', 'клара цеткин', 'воронцов',
      'сухой мост', 'цинамдзгвришвили', 'узнадзе', 'плиев', 'чиковани'
    ],
    lat: 41.7126,
    lng: 44.8015,
    isCentral: true,
  },
  {
    name: 'Дидубе (Didube)',
    shortRu: 'Дидубе',
    aliases: [
      'дидубе', 'дидубеши', 'дидуб', 'didube', 'დიდუბე', 'დიდუბეში', 'церетели', 'tsereteli', 'წერეთლის',
      'проспект церетели', 'экспо', 'expo', 'геловани', 'маршала геловани', 'gelovani', 'გელოვანის',
      'багратиони', 'кипшидзе', 'выставочный центр', 'агладзе', 'меканизациис', 'механизации', 'кедиас', 'кедия', 'კედიას'
    ],
    lat: 41.7368,
    lng: 44.7825,
    isCentral: false,
  },
  {
    name: 'Варкетили (Varketili)',
    shortRu: 'Варкетили',
    aliases: [
      'варкетили', 'варкетилши', 'варкетил', 'varketili', 'ვარკეთილი', 'ვარკეთილში',
      'джавахети', 'сухишвили', 'хумалашвили', 'метро варкетили', 'купрадзе', 'kupradze', 'კუპრაძის'
    ],
    lat: 41.6998,
    lng: 44.8765,
    isCentral: false,
  },
  {
    name: 'Самгори (Samgori)',
    shortRu: 'Самгори',
    aliases: [
      'самгори', 'самгорши', 'самгор', 'samgori', 'სამგორი', 'სამგორში',
      'московский проспект', 'московском', 'метро самгори', 'каховка', 'лило', 'африка'
    ],
    lat: 41.6865,
    lng: 44.8582,
    isCentral: false,
  },
  {
    name: 'Исани (Isani)',
    shortRu: 'Исани',
    aliases: [
      'исани', 'исанши', 'isani', 'ისანი', 'ისანში', 'навтлуги', 'габриел', 'абусеридзе', 'тбель',
      'метро исани', 'леха качиньского', 'ацкури', 'долабаури', 'кварели', 'бери габриэл', 'салос', 'чолокашвили'
    ],
    lat: 41.6892,
    lng: 44.8398,
    isCentral: false,
  },
  {
    name: 'Глдани (Gldani)',
    shortRu: 'Глдани',
    aliases: [
      'глдани', 'глданши', 'глдан', 'глодани', 'gldani', 'გლდანი', 'გლდანში',
      'ахметели', 'хизанишвили', 'микрорайон глдани', 'векуа', 'vekua', 'ვეკუას', 'мухиани', 'mukhiani', 'მუხიანი'
    ],
    lat: 41.7923,
    lng: 44.8167,
    isCentral: false,
  },
  {
    name: 'Надзаладеви (Nadzaladevi)',
    shortRu: 'Надзаладеви',
    aliases: [
      'надзаладеви', 'надзаладевши', 'надзаладев', 'nadzaladevi', 'ნაძალადევი', 'ნაძალადევში',
      'цотне дадиани', 'киквидзе', 'метро надзаладеви', 'чкондидели', 'чкондиделис', 'ჭყონდიდელის',
      'зедазени', 'зедазенис', 'ზედაზენის', 'гоциридзе'
    ],
    lat: 41.7345,
    lng: 44.7985,
    isCentral: false,
  },
  {
    name: 'Санзона (Sanzona)',
    shortRu: 'Санзона',
    aliases: [
      'санзона', 'санзон', 'sanzona', 'სანზონა', 'гурамишвили', 'гурмишвили', 'guramishvili', 'გურამიშვილის',
      'грмагеле', 'сараджишвили'
    ],
    lat: 41.7589,
    lng: 44.7995,
    isCentral: false,
  },
  {
    name: 'Ваке (Vake)',
    shortRu: 'Ваке',
    aliases: [
      'ваке', 'вакеши', 'vake', 'ვაკე', 'ვაკეში', 'чавчавадзе', 'chavchavadze', 'ჭავჭავაძის',
      'аракишвили', 'абашидзе и.', 'палиашвили', 'paliashvili', 'ფალიაშვილის',
      'мзиури', 'атени', 'атенис', 'ateni', 'ატენის', 'мосашвили', 'mosashvili', 'მოსაშვილის',
      'ковалевской', 'тараса шевченко', 'маргелани', 'жваниа', 'жвания', 'zhvania', 'ჟვანიას',
      'кипшидзе н.', 'шатро', 'радиани', 'тактикишвили', 'мцхета', 'мцхетис'
    ],
    lat: 41.7118,
    lng: 44.7571,
    isCentral: true,
  },
];

export const TBILISI_DISTRICTS: TbilisiDistrict[] = TBILISI_DISTRICT_LIST.map((d) => d.name as TbilisiDistrict);

export const DISTRICT_COORDS: Record<TbilisiDistrict, { lat: number; lng: number }> = 
  TBILISI_DISTRICT_LIST.reduce((acc, curr) => {
    acc[curr.name as TbilisiDistrict] = { lat: curr.lat, lng: curr.lng };
    return acc;
  }, {} as Record<TbilisiDistrict, { lat: number; lng: number }>);

/**
 * Street-level geolocation database for Tbilisi streets (Russian, Georgian, English keywords -> accurate lat/lng).
 */
export const TBILISI_STREET_COORDS: Array<{
  keywords: string[];
  lat: number;
  lng: number;
  district: TbilisiDistrict;
}> = [
  // Saburtalo streets
  { keywords: ['кавтарадзе', 'ქავთარაძ', 'kavtaradze'], lat: 41.7217, lng: 44.7358, district: 'Сабуртало (Saburtalo)' },
  { keywords: ['шавишвили', 'შავიშვილ', 'shavishvili'], lat: 41.7224, lng: 44.7379, district: 'Сабуртало (Saburtalo)' },
  { keywords: ['университет', 'უნივერსიტეტ', 'university'], lat: 41.7201, lng: 44.7265, district: 'Сабуртало (Saburtalo)' },
  { keywords: ['политковск', 'джикия', 'პოლიტკოვსკ', 'ჯიქია', 'politkovsk', 'jikia'], lat: 41.7192, lng: 44.7168, district: 'Сабуртало (Saburtalo)' },
  { keywords: ['цинцадзе', 'ცინცაძ', 'tsintsadze'], lat: 41.7248, lng: 44.7654, district: 'Сабуртало (Saburtalo)' },
  { keywords: ['шартава', 'შარტავა', 'shartava'], lat: 41.7315, lng: 44.7689, district: 'Сабуртало (Saburtalo)' },
  { keywords: ['пекин', 'პეკინ', 'pekini'], lat: 41.7258, lng: 44.7698, district: 'Сабуртало (Saburtalo)' },
  { keywords: ['казбеги', 'ყაზბეგ', 'kazbegi'], lat: 41.7242, lng: 44.7535, district: 'Сабуртало (Saburtalo)' },
  { keywords: ['важа', 'пшавела', 'ვაჟა', 'ფშაველა', 'vazha'], lat: 41.7235, lng: 44.7445, district: 'Сабуртало (Saburtalo)' },
  { keywords: ['нуцубидзе', 'ნუცუბიძ', 'nutsubidze', 'датуашвили', 'დათუაშვილ'], lat: 41.7285, lng: 44.7362, district: 'Сабуртало (Saburtalo)' },
  { keywords: ['бахтриони', 'ბახტრიონ', 'bakhtrioni'], lat: 41.7219, lng: 44.7641, district: 'Сабуртало (Saburtalo)' },
  { keywords: ['алексидзе', 'ალექსიძ', 'aleksidze', 'king david'], lat: 41.7186, lng: 44.7805, district: 'Сабуртало (Saburtalo)' },
  { keywords: ['тавхелидзе', 'თავხელიძ', 'tavkhelidze'], lat: 41.7239, lng: 44.7485, district: 'Сабуртало (Saburtalo)' },
  { keywords: ['чиладзе', 'чиладзие', 'ჭილაძ', 'chiladze'], lat: 41.7269, lng: 44.7562, district: 'Сабуртало (Saburtalo)' },
  { keywords: ['костава', 'კოსტავა', 'kostava'], lat: 41.7172, lng: 44.7775, district: 'Сабуртало (Saburtalo)' },
  { keywords: ['мицкевич', 'მიცკევიჩ', 'mitskevich'], lat: 41.7262, lng: 44.7634, district: 'Сабуртало (Saburtalo)' },
  { keywords: ['саирме', 'საირმ', 'sairme'], lat: 41.7222, lng: 44.7575, district: 'Сабуртало (Saburtalo)' },
  { keywords: ['тамарашвили', 'თამარაშვილ', 'tamarashvili'], lat: 41.7168, lng: 44.7492, district: 'Сабуртало (Saburtalo)' },
  { keywords: ['иосебидзе', 'იოსებიძ', 'iosebidze'], lat: 41.7288, lng: 44.7721, district: 'Сабуртало (Saburtalo)' },
  { keywords: ['гагарин', 'გაგარინ', 'gagarin'], lat: 41.7351, lng: 44.7695, district: 'Сабуртало (Saburtalo)' },
  { keywords: ['фанджикидзе', 'будапешт', 'ფანჯიკიძ', 'ბუდაპეშტ'], lat: 41.7295, lng: 44.7582, district: 'Сабуртало (Saburtalo)' },
  { keywords: ['гамрекели', 'გამრეკელ', 'gamrekeli'], lat: 41.7271, lng: 44.7618, district: 'Сабуртало (Saburtalo)' },
  { keywords: ['асатиани м.', 'михаила асатиани', 'ასათიანი'], lat: 41.7215, lng: 44.7498, district: 'Сабуртало (Saburtalo)' },
  { keywords: ['бочоришвили', 'ბოჭორიშვილ'], lat: 41.7204, lng: 44.7792, district: 'Сабуртало (Saburtalo)' },
  { keywords: ['камани', 'კამან'], lat: 41.7282, lng: 44.7495, district: 'Сабуртало (Saburtalo)' },

  // Vake & Bagebi streets
  { keywords: ['чавчавадзе', 'ჭავჭავაძ', 'chavchavadze'], lat: 41.7098, lng: 44.7615, district: 'Ваке (Vake)' },
  { keywords: ['палиашвили', 'ფალიაშვილ', 'paliashvili'], lat: 41.7089, lng: 44.7652, district: 'Ваке (Vake)' },
  { keywords: ['абашидзе и.', 'ираклия абашидзе', 'აბაშიძის'], lat: 41.7079, lng: 44.7661, district: 'Ваке (Vake)' },
  { keywords: ['жваниа', 'жвания', 'ჟვანია', 'zhvania'], lat: 41.7048, lng: 44.7575, district: 'Ваке (Vake)' },
  { keywords: ['атени', 'атенис', 'ატენის', 'ateni'], lat: 41.7105, lng: 44.7712, district: 'Ваке (Vake)' },
  { keywords: ['мосашвили', 'მოსაშვილ', 'mosashvili'], lat: 41.7104, lng: 44.7628, district: 'Ваке (Vake)' },
  { keywords: ['аракишвили', 'არაყიშვილ', 'arakishvili'], lat: 41.7085, lng: 44.7685, district: 'Ваке (Vake)' },
  { keywords: ['кипшидзе', 'ყიფშიძ', 'kipshidze'], lat: 41.7119, lng: 44.7524, district: 'Ваке (Vake)' },
  { keywords: ['мцхета', 'мцхетис', 'მცხეთის'], lat: 41.7072, lng: 44.7695, district: 'Ваке (Vake)' },
  { keywords: ['багеби', 'багебши', 'ბაგებ', 'цхнетис', 'წყნეთის'], lat: 41.7085, lng: 44.7325, district: 'Багеби (Bagebi)' },

  // Vera & Mtatsminda & Sololaki streets
  { keywords: ['меликишвили', 'მელიქიშვილ', 'melikishvili'], lat: 41.7094, lng: 44.7805, district: 'Вера (Vera)' },
  { keywords: ['барнов', 'ბარნოვ', 'barnov'], lat: 41.7058, lng: 44.7818, district: 'Вера (Vera)' },
  { keywords: ['гогебашвили', 'გოგებაშვილ', 'gogebashvili'], lat: 41.7049, lng: 44.7845, district: 'Вера (Vera)' },
  { keywords: ['петриашвили', 'პეტრიაშვილ', 'petriashvili'], lat: 41.7069, lng: 44.7792, district: 'Вера (Vera)' },
  { keywords: ['руставели', 'რუსთაველ', 'rustaveli'], lat: 41.6995, lng: 44.7945, district: 'Мтацминда (Mtatsminda)' },
  { keywords: ['ингороква', 'ინგოროყვა', 'ingorokva'], lat: 41.6968, lng: 44.7948, district: 'Мтацминда (Mtatsminda)' },
  { keywords: ['чонкадзе', 'ჭონქაძ', 'chonkadze'], lat: 41.6938, lng: 44.7925, district: 'Мтацминда (Mtatsminda)' },
  { keywords: ['амаглеба', 'ამაღლებ', 'amagleba'], lat: 41.6895, lng: 44.7965, district: 'Старый Тбилиси / Сололаки' },
  { keywords: ['лермонтов', 'ლერმონტოვ', 'lermontov'], lat: 41.6912, lng: 44.7992, district: 'Старый Тбилиси / Сололаки' },

  // Didi Dighomi streets
  { keywords: ['мириана', 'мириан', 'მირიან', 'mirian'], lat: 41.7875, lng: 44.7568, district: 'Диди Дигоми (Didi Dighomi)' },
  { keywords: ['петрици', 'პეტრიწ', 'petritsi'], lat: 41.7842, lng: 44.7595, district: 'Диди Дигоми (Didi Dighomi)' },
  { keywords: ['фарнаваз', 'ფარნავაზ', 'farnavaz'], lat: 41.7825, lng: 44.7645, district: 'Диди Дигоми (Didi Dighomi)' },
  { keywords: ['тавдадебули', 'деметре', 'თავდადებულ', 'demetre'], lat: 41.7912, lng: 44.7532, district: 'Диди Дигоми (Didi Dighomi)' },
  { keywords: ['боб уолш', 'уолшис', 'უოლშ', 'bob walsh'], lat: 41.7745, lng: 44.7712, district: 'Диди Дигоми (Didi Dighomi)' },
  { keywords: ['теимураз', 'თეიმურაზ', 'teimuraz'], lat: 41.7889, lng: 44.7545, district: 'Диди Дигоми (Didi Dighomi)' },
  { keywords: ['абашидзе-орбелиани', 'орбелиани н.'], lat: 41.7852, lng: 44.7581, district: 'Диди Дигоми (Didi Dighomi)' },
  { keywords: ['агмашенебели хейв', 'аллея агмашенебели', 'აღმაშენებლის ხეივ'], lat: 41.7785, lng: 44.7695, district: 'Диди Дигоми (Didi Dighomi)' },

  // Didube & Chugureti & Nadzaladevi & Gldani streets
  { keywords: ['церетели', 'წერეთლ', 'tsereteli'], lat: 41.7355, lng: 44.7842, district: 'Дидубе (Didube)' },
  { keywords: ['геловани', 'გელოვან', 'gelovani'], lat: 41.7495, lng: 44.7715, district: 'Дидубе (Didube)' },
  { keywords: ['кедиа', 'кедиас', 'კედია', 'kedia'], lat: 41.7392, lng: 44.7815, district: 'Дидубе (Didube)' },
  { keywords: ['меканизациис', 'механизац', 'მექანიზაციის'], lat: 41.7425, lng: 44.7828, district: 'Дидубе (Didube)' },
  { keywords: ['агладзе', 'აგლაძ', 'agladze'], lat: 41.7342, lng: 44.7798, district: 'Дидубе (Didube)' },
  { keywords: ['марджанишвили', 'მარჯანიშვილ', 'marjanishvili'], lat: 41.7095, lng: 44.7975, district: 'Чугурети / Марджанишвили' },
  { keywords: ['агмашенебели', 'აღმაშენებლ', 'agmashenebeli'], lat: 41.7115, lng: 44.7962, district: 'Чугурети / Марджанишвили' },
  { keywords: ['цинамдзгвришвили', 'წინამძღვრიშვილ'], lat: 41.7138, lng: 44.7995, district: 'Чугурети / Марджанишвили' },
  { keywords: ['узнадзе', 'უზნაძ', 'uznadze'], lat: 41.7105, lng: 44.7942, district: 'Чугурети / Марджанишвили' },
  { keywords: ['чкондидели', 'ჭყონდიდელ', 'chkondideli'], lat: 41.7365, lng: 44.7948, district: 'Надзаладеви (Nadzaladevi)' },
  { keywords: ['цотне дадиани', 'дадиани ц.', 'ცოტნე დადიან'], lat: 41.7325, lng: 44.7995, district: 'Надзаладеви (Nadzaladevi)' },
  { keywords: ['зедазени', 'ზედაზენ', 'zedazeni'], lat: 41.7385, lng: 44.8012, district: 'Надзаладеви (Nadzaladevi)' },
  { keywords: ['гурамишвили', 'гурмишвили', 'გურამიშვილ', 'guramishvili'], lat: 41.7615, lng: 44.7985, district: 'Санзона (Sanzona)' },
  { keywords: ['векуа', 'ვეკუა', 'vekua'], lat: 41.7938, lng: 44.8195, district: 'Глдани (Gldani)' },
  { keywords: ['хизанишвили', 'ხიზანიშვილ', 'khizanishvili'], lat: 41.7955, lng: 44.8152, district: 'Глдани (Gldani)' },

  // Ortachala, Krtsanisi, Isani, Avlabari, Samgori, Varketili streets
  { keywords: ['горгасали', 'გორგასლ', 'gorgasali'], lat: 41.6815, lng: 44.8195, district: 'Ортачала (Ortachala)' },
  { keywords: ['гулуа', 'гулия', 'გულუა', 'gulua'], lat: 41.6768, lng: 44.8245, district: 'Ортачала (Ortachala)' },
  { keywords: ['бочорма', 'бочорми', 'ბოჭორმ', 'bochorma'], lat: 41.6882, lng: 44.8285, district: 'Ортачала (Ortachala)' },
  { keywords: ['волски', 'вольск', 'ვოლსკ', 'volski'], lat: 41.6705, lng: 44.8165, district: 'Крцаниси (Krtsanisi)' },
  { keywords: ['крцаниси', 'კრწანის', 'krtsanisi'], lat: 41.6725, lng: 44.8185, district: 'Крцаниси (Krtsanisi)' },
  { keywords: ['кетеван', 'ქეთევან', 'ketevan'], lat: 41.6915, lng: 44.8215, district: 'Авлабари (Avlabari)' },
  { keywords: ['леха качиньск', 'качинск', 'კაჩინსკ'], lat: 41.6888, lng: 44.8325, district: 'Исани (Isani)' },
  { keywords: ['габриэл', 'габриел', 'салос', 'ბერი გაბრიელ', 'salosi'], lat: 41.6795, lng: 44.8512, district: 'Исани (Isani)' },
  { keywords: ['навтлуг', 'ნავთლუღ', 'navtlugi'], lat: 41.6855, lng: 44.8425, district: 'Исани (Isani)' },
  { keywords: ['чолокашвили', 'ჩოლოყაშვილ', 'cholokashvili'], lat: 41.6845, lng: 44.8365, district: 'Исани (Isani)' },
  { keywords: ['московск', 'მოსკოვის', 'moscow'], lat: 41.6785, lng: 44.8685, district: 'Самгори (Samgori)' },
  { keywords: ['купрадзе', 'კუპრაძ', 'kupradze'], lat: 41.6985, lng: 44.8785, district: 'Варкетили (Varketili)' },
  { keywords: ['джавахети', 'ჯავახეთ', 'javakheti'], lat: 41.6965, lng: 44.8725, district: 'Варкетили (Varketili)' },
];

// Set of generic fallback centers that were previously assigned to apartments without real pins
const GENERIC_FALLBACK_CENTERS = new Set([
  '41.7118,44.7571',
  '41.7289,44.7645',
  '41.7254,44.7568',
  '41.7345,44.8021',
  '41.7345,44.7985',
  '41.7126,44.8015',
  '41.7082,44.7834',
  '41.6892,44.8398',
  '41.6961,44.7938',
  '41.6789,44.8214',
  '41.6712,44.819',
  '41.6712,44.8190',
  '41.7856,44.7612',
  '41.7089,44.7321',
  '41.6899,44.7981',
  '41.6934,44.8142',
  '41.7456,44.7789',
  '41.7368,44.7825',
  '41.6865,44.8682',
  '41.6865,44.8582',
  '41.7923,44.8167',
  '41.6998,44.8765',
  '41.7589,44.7995',
]);

/**
 * Deterministic hash from string to spread apartments along a street/neighborhood
 * so markers on the same street or without house numbers never overlap on a single pixel.
 */
function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function getDeterministicOffset(seed: string, radiusLat = 0.0022, radiusLng = 0.0028): { dLat: number; dLng: number } {
  const h1 = hashString(seed + '_lat');
  const h2 = hashString(seed + '_lng');
  const n1 = ((h1 % 10000) / 5000) - 1; // -1 .. +1
  const n2 = ((h2 % 10000) / 5000) - 1; // -1 .. +1
  return {
    dLat: Number((n1 * radiusLat).toFixed(6)),
    dLng: Number((n2 * radiusLng).toFixed(6)),
  };
}

/**
 * Accurately detects Tbilisi district and street-level coordinates from address, title, or combined text.
 */
export function detectDistrictFromText(text: string): { district: TbilisiDistrict; lat: number; lng: number } {
  // Remove hyphenated macro-district names from MyHome that cause false matches (e.g. "ვაკე-საბურთალო")
  const cleanedText = (text || '')
    .replace(/ვაკე-საბურთალო|ваке-сабуртало|vake-saburtalo/gi, '')
    .replace(/დიდუბე-ჩუღურეთი|дидубе-чугурети|didube-chugureti/gi, '')
    .replace(/გლდანი-ნაძალადევი|глдани-надзаладеви|gldani-nadzaladevi/gi, '')
    .replace(/ისანი-სამგორი|исани-самгори|isani-samgori/gi, '')
    .replace(/ძველი თბილისი/gi, '')
    .toLowerCase();

  // 1. Check street-level matches first for highest precision
  for (const street of TBILISI_STREET_COORDS) {
    if (street.keywords.some((kw) => cleanedText.includes(kw))) {
      const offset = getDeterministicOffset(cleanedText, 0.0014, 0.0018);
      return {
        district: street.district,
        lat: Number((street.lat + offset.dLat).toFixed(6)),
        lng: Number((street.lng + offset.dLng).toFixed(6)),
      };
    }
  }

  // 2. Check district aliases
  for (const item of TBILISI_DISTRICT_LIST) {
    if (item.aliases.some((alias) => cleanedText.includes(alias))) {
      const offset = getDeterministicOffset(cleanedText, 0.0035, 0.0045);
      return {
        district: item.name as TbilisiDistrict,
        lat: Number((item.lat + offset.dLat).toFixed(6)),
        lng: Number((item.lng + offset.dLng).toFixed(6)),
      };
    }
  }

  // Safe fallback
  const fallbackOffset = getDeterministicOffset(cleanedText || 'tbilisi', 0.0035, 0.0045);
  return {
    district: 'Сабуртало (Saburtalo)',
    lat: Number((41.7254 + fallbackOffset.dLat).toFixed(6)),
    lng: Number((44.7568 + fallbackOffset.dLng).toFixed(6)),
  };
}

/**
 * Returns accurate district for an apartment, verifying against its address and title.
 */
export function getAccurateApartmentDistrict(apartment: {
  city?: RentchCity;
  district?: string;
  address?: string;
  title?: string;
}): CityDistrict {
  const city = getApartmentCity(apartment);

  if (city === 'yerevan') {
    const combined = `${apartment.district || ''} ${apartment.title || ''} ${apartment.address || ''}`.toLowerCase();
    for (const item of YEREVAN_DISTRICT_LIST) {
      if (
        item.name === apartment.district ||
        item.shortRu === apartment.district ||
        item.aliases.some((alias) => combined.includes(alias))
      ) {
        return item.name;
      }
    }
    return apartment.district || 'Кентрон / Центр (Kentron)';
  }

  if (city === 'belgrade') {
    const combined = `${apartment.district || ''} ${apartment.title || ''} ${apartment.address || ''}`.toLowerCase();
    for (const item of BELGRADE_DISTRICT_LIST) {
      if (
        item.name === apartment.district ||
        item.shortRu === apartment.district ||
        item.aliases.some((alias) => combined.includes(alias))
      ) {
        return item.name;
      }
    }
    return apartment.district || 'Стари Град / Дорчол (Stari Grad / Dorćol)';
  }

  const titleAndAddress = `${apartment.title || ''} ${apartment.address || ''}`
    .replace(/ვაკე-საბურთალო|ваке-сабуртало|vake-saburtalo/gi, '')
    .toLowerCase();

  // 1. Check explicit neighborhood mentions in title first (e.g. "дид дигомши", "багебши", "варкетилши", "глданши")
  for (const item of TBILISI_DISTRICT_LIST) {
    if (item.aliases.some((alias) => titleAndAddress.includes(alias))) {
      return item.name;
    }
  }

  // 2. Check street-level table
  for (const street of TBILISI_STREET_COORDS) {
    if (street.keywords.some((kw) => titleAndAddress.includes(kw))) {
      return street.district;
    }
  }

  // 3. If existing district is valid, return it
  if (apartment.district) {
    const matched = TBILISI_DISTRICT_LIST.find(
      (d) => d.name === apartment.district || d.shortRu === apartment.district || apartment.district?.includes(d.shortRu)
    );
    if (matched) return matched.name;
  }

  return 'Сабуртало (Saburtalo)';
}

/**
 * Resolves accurate [lat, lng] coordinates for an apartment.
 * - Preserves real GPS coordinates from MyHome if present and not a generic district fallback center.
 * - Otherwise resolves via street-level database (`TBILISI_STREET_COORDS`) or accurate district center + deterministic house offset.
 */
export function getAccurateApartmentCoordinates(apartment: {
  id?: string;
  city?: RentchCity;
  district?: string;
  address?: string;
  title?: string;
  lat?: number;
  lng?: number;
}): { lat: number; lng: number; district: CityDistrict } {
  const city = getApartmentCity(apartment);
  const accurateDistrict = getAccurateApartmentDistrict(apartment);
  const lat = Number(apartment.lat);
  const lng = Number(apartment.lng);
  const key = `${lat},${lng}`;
  const seed = `${apartment.id || ''}_${apartment.address || ''}_${apartment.title || ''}`;

  if (city === 'yerevan') {
    const hasYerevanGps = !isNaN(lat) && !isNaN(lng) && lat > 40.05 && lat < 40.30 && lng > 44.35 && lng < 44.65;
    if (hasYerevanGps) return { lat, lng, district: accurateDistrict };
    const found = YEREVAN_DISTRICT_LIST.find((d) => d.name === accurateDistrict) || YEREVAN_DISTRICT_LIST[0];
    const offset = getDeterministicOffset(seed, 0.0035, 0.0045);
    return {
      lat: Number((found.lat + offset.dLat).toFixed(6)),
      lng: Number((found.lng + offset.dLng).toFixed(6)),
      district: accurateDistrict,
    };
  }

  if (city === 'belgrade') {
    const hasBelgradeGps = !isNaN(lat) && !isNaN(lng) && lat > 44.65 && lat < 44.95 && lng > 20.25 && lng < 20.65;
    if (hasBelgradeGps) return { lat, lng, district: accurateDistrict };
    const found = BELGRADE_DISTRICT_LIST.find((d) => d.name === accurateDistrict) || BELGRADE_DISTRICT_LIST[0];
    const offset = getDeterministicOffset(seed, 0.0035, 0.0045);
    return {
      lat: Number((found.lat + offset.dLat).toFixed(6)),
      lng: Number((found.lng + offset.dLng).toFixed(6)),
      district: accurateDistrict,
    };
  }

  // Check if apartment already has genuine building-level GPS coordinates within Tbilisi bounds
  const hasRealGps =
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat > 41.60 &&
    lat < 41.88 &&
    lng > 44.65 &&
    lng < 44.98 &&
    !GENERIC_FALLBACK_CENTERS.has(key);

  if (hasRealGps) {
    return { lat, lng, district: accurateDistrict };
  }

  const combined = `${apartment.address || ''} ${apartment.title || ''}`.toLowerCase();

  // 1. Match street in Tbilisi street coordinates database
  for (const street of TBILISI_STREET_COORDS) {
    if (street.keywords.some((kw) => combined.includes(kw))) {
      const offset = getDeterministicOffset(seed, 0.0014, 0.0018);
      return {
        lat: Number((street.lat + offset.dLat).toFixed(6)),
        lng: Number((street.lng + offset.dLng).toFixed(6)),
        district: accurateDistrict,
      };
    }
  }

  // 2. Match accurate district center + deterministic street/house offset
  const distCoords = DISTRICT_COORDS[accurateDistrict as TbilisiDistrict] || { lat: 41.7254, lng: 44.7568 };
  const offset = getDeterministicOffset(seed, 0.0042, 0.0052);
  return {
    lat: Number((distCoords.lat + offset.dLat).toFixed(6)),
    lng: Number((distCoords.lng + offset.dLng).toFixed(6)),
    district: accurateDistrict,
  };
}

/**
 * Formats district name nicely for badges and card footers.
 */
export function formatDistrictDisplay(district: string = ''): string {
  if (!district) return 'Тбилиси';

  const allDistricts = [...TBILISI_DISTRICT_LIST, ...YEREVAN_DISTRICT_LIST, ...BELGRADE_DISTRICT_LIST];
  const matched = allDistricts.find(
    (d) => d.name === district || d.shortRu === district || district.includes(d.shortRu)
  );

  if (matched) {
    return matched.shortRu;
  }

  const cleaned = district.replace(/\s*\([^)]*\)/g, '').trim();
  return cleaned || district;
}
