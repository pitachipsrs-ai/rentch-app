export type LeasePeriod = 'month' | 'month_to_year' | 'year_plus';

export type RentchCity = 'tbilisi' | 'yerevan' | 'belgrade';

export type TbilisiDistrict =
  | 'Ваке (Vake)'
  | 'Сабуртало (Saburtalo)'
  | 'Вера (Vera)'
  | 'Мтацминда (Mtatsminda)'
  | 'Старый Тбилиси / Сололаки'
  | 'Ортачала (Ortachala)'
  | 'Авлабари (Avlabari)'
  | 'Чугурети / Марджанишвили'
  | 'Дидубе (Didube)'
  | 'Исани (Isani)'
  | 'Самгори (Samgori)'
  | 'Крцаниси (Krtsanisi)'
  | 'Багеби (Bagebi)'
  | 'Диди Дигоми (Didi Dighomi)'
  | 'Надзаладеви (Nadzaladevi)'
  | 'Глдани (Gldani)'
  | 'Варкетили (Varketili)'
  | 'Санзона (Sanzona)';

export type YerevanDistrict =
  | 'Кентрон / Центр (Kentron)'
  | 'Арабкир (Arabkir)'
  | 'Давташен (Davtashen)'
  | 'Ачапняк (Ajapnyak)'
  | 'Зейтун / Канакер (Kanaker-Zeytun)'
  | 'Нор-Норк (Nor Nork)'
  | 'Эребуни (Erebuni)'
  | 'Шенгавит (Shengavit)'
  | 'Малатия-Себастия (Malatia-Sebastia)'
  | 'Аван (Avan)';

export type BelgradeDistrict =
  | 'Стари Град / Дорчол (Stari Grad / Dorćol)'
  | 'Врачар (Vračar)'
  | 'Нови Београд (Novi Beograd)'
  | 'Савски Венац / Belgrade Waterfront'
  | 'Земун (Zemun)'
  | 'Палилула (Palilula)'
  | 'Звездара (Zvezdara)'
  | 'Вождовац (Voždovac)'
  | 'Чукарица / Баново Брдо (Čukarica)';

export type CityDistrict = TbilisiDistrict | YerevanDistrict | BelgradeDistrict | string;

export type Currency = 'USD' | 'GEL' | 'EUR';

export type FurnitureStatus = 'full' | 'partial' | 'none';

export type PetPolicy = 'allowed' | 'cats_only' | 'dogs_only' | 'no_pets';

export type RentalCategory = 'daily' | 'long_term' | 'double_rentch';
export type RentalType = 'long_term' | 'daily';

export interface BookedDateRange {
  id?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  guestName?: string;
  guestPhone?: string;
}

export type PaymentMethod = 'mir_card' | 'sbp_qr' | 'stripe_card';

export interface DailyBookingRecord {
  id: string;
  apartmentId: string;
  apartmentTitle: string;
  apartmentDistrict?: string;
  apartmentAddress: string;
  apartmentImage?: string;
  checkInDate: string;
  checkOutDate: string;
  nightsCount: number;
  guestsCount: number;
  pricePerNight: number;
  subtotal: number;
  serviceFeePercent: number; // 15%
  serviceFeeAmount: number;
  totalAmount: number;
  totalAmountRub: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'pending' | 'failed';
  paymentId?: string;
  guestName: string;
  guestPhone: string;
  guestTelegram?: string;
  createdAt: string;
  accessCode?: string;
}

export interface Landlord {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  verified: boolean;
  responseTime: string;
  rating: number;
}

export interface Apartment {
  id: string;
  city?: RentchCity;
  title: string;
  district: CityDistrict;
  address: string;
  priceUsd: number;
  currency?: Currency;
  priceGel?: number;
  originalPrice?: number;
  rentalType?: RentalType;
  pricePerNight?: number;
  cleaningFee?: number;
  minNights?: number;
  maxGuests?: number;
  bookedRanges?: BookedDateRange[];
  rooms: number;
  bedrooms: number;
  areaSqm: number;
  floor: number;
  totalFloors: number;
  furniture: FurnitureStatus;
  petPolicy: PetPolicy;
  minPeriod: LeasePeriod;
  maxResidents?: number;
  images: string[];
  description: string;
  amenities: string[];
  lat: number;
  lng: number;
  landlord: Landlord;
  metro?: string;
  isNew?: boolean;
  sourceUrl?: string;
  myhomeUrl?: string;
  originalStatementId?: string;
}

export interface QuestionnaireAnswers {
  period: LeasePeriod;
  peopleCount: number;
  hasPets: 'none' | 'dog' | 'cat' | 'other';
  preferredDistrict: CityDistrict | 'all';
  petPhoto?: string;
  userPhoto?: string;
  photos?: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  telegramUsername?: string;
  isRegistered: boolean;
  questionnaireCompleted: boolean;
  questionnaire?: QuestionnaireAnswers;
  telegramNotificationsEnabled: boolean;
  telegramChatId?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'landlord' | 'user' | 'roommate';
  senderName?: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  isAction?: boolean;
  actionType?: 'confirm_viewing' | 'registered' | 'viewing_scheduled';
  viewingData?: {
    date: string;
    time: string;
    status: 'pending' | 'confirmed';
  };
}

export interface ApartmentChat {
  apartmentId: string;
  messages: ChatMessage[];
  lastActivity: string;
  viewingConfirmed: boolean;
  viewingSlot?: {
    date: string;
    time: string;
  };
  roommate?: {
    id: string;
    name: string;
    age: number;
    avatar: string;
    occupation: string;
    telegram?: string;
    phone?: string;
    telegramChatId?: string;
  };
}

export interface FilterState {
  city?: RentchCity;
  rentalCategory?: RentalCategory;
  checkInDate?: string;
  checkOutDate?: string;
  guestsCount?: number;
  minPrice: number;
  maxPrice: number;
  furniture: 'any' | FurnitureStatus;
  district: 'all' | 'center' | CityDistrict;
  period: 'any' | LeasePeriod;
  petFriendlyOnly: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  apartmentId?: string;
  read: boolean;
  type: 'match' | 'new_listing' | 'viewing_confirmed' | 'system' | 'telegram_sync';
}

export interface RoommateOffer {
  id: string;
  apartmentId: string;
  city: RentchCity;
  userName: string;
  userAge: number;
  userAvatar: string;
  secondAvatar?: string;
  partnerName?: string;
  partnerAge?: number;
  occupation: string;
  bubbleText: string;
  interests: string[];
  moveInDate: string;
  verified: boolean;
  createdAt: string;
  telegram?: string;
  telegramChatId?: string;
  phone?: string;
  isUserCreated?: boolean;
}

export type CrmStage = 'registered' | 'viewing_scheduled' | 'viewing_done_thinking' | 'paid';

export interface CrmLead {
  id: string;
  clientName: string;
  clientPhone: string;
  clientTelegram?: string;
  stage: CrmStage;
  apartmentId?: string;
  apartmentTitle?: string;
  apartmentDistrict?: string;
  apartmentAddress?: string;
  apartmentPriceUsd?: number;
  apartmentImage?: string;
  apartmentSourceUrl?: string;
  viewingSlot?: {
    date: string;
    time: string;
  };
  registeredAt: string;
  notes?: string;
  paidAmountUsd?: number;
  questionnaireSummary?: {
    period: string;
    peopleCount: number;
    pets: string;
    district: string;
  };
  messages?: ChatMessage[];
  unreadByAdmin?: number;
}
