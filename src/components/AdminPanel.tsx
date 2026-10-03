import React, { useState } from 'react';
import { 
  Briefcase, 
  Lock, 
  LogOut, 
  Plus, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Calendar, 
  ArrowRight, 
  ArrowLeft, 
  Search, 
  Building2, 
  Sparkles, 
  User, 
  Phone, 
  Send, 
  Trash2, 
  Edit3, 
  Eye, 
  Home, 
  MapPin, 
  AlertCircle,
  FileCheck,
  Smartphone,
  AlertTriangle,
  Image as ImageIcon,
  ExternalLink,
  ChevronRight as ChevronRightIcon,
  Archive,
  FolderArchive,
  Layers,
  Check,
  Globe,
  Download,
  Loader2,
  RefreshCw,
  Languages,
  MessageSquare,
  X,
  Bot,
  Shield
} from 'lucide-react';
import { CrmLead, CrmStage, Apartment, TbilisiDistrict, CityDistrict, RentchCity, FurnitureStatus, PetPolicy, LeasePeriod, Currency, ApartmentChat, ChatMessage } from '../types';
import {
  loginAdminOnServer,
  clearAdminSession,
  getAdminAuthHeaders,
  AdminAuditEntry,
} from '../utils/adminAuth';
import { TBILISI_DISTRICTS } from '../data/mockApartments';
import { detectDistrictFromText, formatDistrictDisplay, CITIES_CONFIG, RENTCH_CITIES, getDistrictsForCity, getApartmentCity } from '../utils/districtUtils';
import { getMyHomeOriginalUrl, getMyHomeStatementId } from '../utils/myhomeParser';
import { RentchLogo } from './RentchLogo';
import { AdminPwaSection } from './AdminPwaSection';
import { MyHomeImportTab } from './MyHomeImportTab';
import { HaloOglasiImportTab } from './HaloOglasiImportTab';
import { DailyAnalyticsStats } from '../utils/analytics';
import { parseApartmentPdf, ExtractedPdfApartment } from '../utils/pdfParser';
import { parseZipArchive, ExtractedZipResult } from '../utils/zipParser';
import { readFileAsDataUrl, readMultipleImagesAsDataUrls } from '../utils/imageUtils';

interface AdminPanelProps {
  leads: CrmLead[];
  onUpdateLeads: (leads: CrmLead[]) => void;
  apartments: Apartment[];
  onAddApartment: (apartment: Apartment) => void;
  onDeleteApartment: (id: string) => void;
  onClearAllApartments?: () => void;
  onClearAllLeads?: () => void;
  onClose: () => void;
  onAuthSuccess?: () => void;
  onLogout?: () => void;
  onViewApartment?: (apartment: Apartment) => void;
  onSwitchToSwipe?: () => void;
  onUpdateApartment?: (apartment: Apartment) => void;
  onRefreshCatalog?: () => void;
  isAdmin?: boolean;
  chats?: Record<string, ApartmentChat>;
  onAdminSendMessage?: (leadId: string, text: string) => void;
  onMarkLeadRead?: (leadId: string) => void;
}

const STAGES: { key: CrmStage; title: string; color: string; bg: string; border: string }[] = [
  {
    key: 'registered',
    title: 'Заявки (Свайп вправо / Регистрация)',
    color: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
  },
  {
    key: 'viewing_scheduled',
    title: 'Записались на осмотр',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  {
    key: 'viewing_done_thinking',
    title: 'Сделали осмотр, думают',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  {
    key: 'paid',
    title: 'Оплатили',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  leads,
  onUpdateLeads,
  apartments,
  onAddApartment,
  onDeleteApartment,
  onClearAllApartments,
  onClearAllLeads,
  onClose,
  onAuthSuccess,
  onLogout,
  onViewApartment,
  onSwitchToSwipe,
  onUpdateApartment,
  onRefreshCatalog,
  isAdmin = false,
  chats = {},
  onAdminSendMessage,
  onMarkLeadRead,
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(isAdmin) || sessionStorage.getItem('rentch_admin_auth') === 'true';
  });

  React.useEffect(() => {
    if (isAdmin) {
      setIsAuthenticated(true);
    }
  }, [isAdmin]);
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Admin Section Navigation
  const [adminTab, setAdminTab] = useState<'crm' | 'upload_form' | 'upload_pdf' | 'myhome' | 'halooglasi' | 'catalog' | 'pwa' | 'security'>('crm');
  const [auditEntries, setAuditEntries] = useState<AdminAuditEntry[]>([]);
  const [activeAdminSessions, setActiveAdminSessions] = useState<
    Array<{ ip: string; deviceSummary: string; createdAt: string }>
  >([]);
  const [securityToast, setSecurityToast] = useState('');

  // Today's Real-Time View & Swipe Statistics
  const [todayStats, setTodayStats] = useState<DailyAnalyticsStats | null>(null);
  const [allTimeStats, setAllTimeStats] = useState<{
    uniqueVisitors: number;
    pageViews: number;
    apartmentViews: number;
    swipesRight: number;
    swipesLeft: number;
    daysTracked: number;
    firstDate: string;
  } | null>(null);
  const [analyticsHistory, setAnalyticsHistory] = useState<
    Array<{
      date: string;
      pageViews: number;
      uniqueVisitors: number;
      apartmentViews: number;
      swipesRight: number;
      swipesLeft: number;
    }>
  >([]);
  const [showTopApartmentsToday, setShowTopApartmentsToday] = useState(false);

  const fetchAnalytics = React.useCallback(() => {
    fetch('/api/analytics')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.today) {
          setTodayStats(data.today);
        }
        if (data && data.allTime) {
          setAllTimeStats(data.allTime);
        }
        if (data && Array.isArray(data.history)) {
          setAnalyticsHistory(data.history);
        }
      })
      .catch(() => {});
  }, []);

  const fetchAuditLog = React.useCallback(() => {
    fetch('/api/admin/audit', {
      headers: getAdminAuthHeaders(),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.audit)) {
          setAuditEntries(data.audit);
        }
        if (data && Array.isArray(data.activeSessions)) {
          setActiveAdminSessions(data.activeSessions);
        }
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    fetchAnalytics();
    fetchAuditLog();
    const timer = setInterval(() => {
      fetchAnalytics();
      if (adminTab === 'security') fetchAuditLog();
    }, 5000);
    return () => clearInterval(timer);
  }, [isAuthenticated, fetchAnalytics, fetchAuditLog, adminTab]);

  const handleRestoreLeadsBackup = async () => {
    try {
      const res = await fetch('/api/admin/restore-backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        if (Array.isArray(data.leads)) {
          onUpdateLeads(data.leads);
        }
        onRefreshCatalog?.();
        fetchAuditLog();
        setSecurityToast(`Восстановлено лидов из резервной копии: ${data.leads?.length || 0}`);
        setTimeout(() => setSecurityToast(''), 5000);
      } else {
        setSecurityToast(data?.error || 'Не удалось восстановить резервную копию');
        setTimeout(() => setSecurityToast(''), 4000);
      }
    } catch {
      setSecurityToast('Ошибка соединения с сервером');
      setTimeout(() => setSecurityToast(''), 4000);
    }
  };

  // Active CRM Lead Chat Modal State
  const [activeChatLeadId, setActiveChatLeadId] = useState<string | null>(null);
  const [adminChatInput, setAdminChatInput] = useState('');

  const activeChatLead = leads.find((l) => l.id === activeChatLeadId) || null;

  const getLeadMessages = (lead: CrmLead): ChatMessage[] => {
    const map = new Map<string, ChatMessage>();
    if (lead.apartmentId && chats[lead.apartmentId]?.messages) {
      chats[lead.apartmentId].messages.forEach((m) => map.set(m.id, m));
    }
    if (lead.messages && Array.isArray(lead.messages)) {
      lead.messages.forEach((m) => map.set(m.id, m));
    }
    return Array.from(map.values());
  };

  const handleOpenLeadChat = (lead: CrmLead) => {
    setActiveChatLeadId(lead.id);
    onMarkLeadRead?.(lead.id);
  };

  const handleSendAdminMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatLead || !adminChatInput.trim()) return;
    onAdminSendMessage?.(activeChatLead.id, adminChatInput.trim());
    setAdminChatInput('');
  };

  // Deletion Confirmation Dialogs
  const [leadToDelete, setLeadToDelete] = useState<CrmLead | null>(null);
  const [isDeleteAllLeadsOpen, setIsDeleteAllLeadsOpen] = useState(false);
  const [aptToDelete, setAptToDelete] = useState<Apartment | null>(null);
  const [isDeleteAllAptsOpen, setIsDeleteAllAptsOpen] = useState(false);

  // Search & Filters in CRM
  const [searchQuery, setSearchQuery] = useState('');

  // New Lead Modal State
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadTelegram, setNewLeadTelegram] = useState('');
  const [newLeadStage, setNewLeadStage] = useState<CrmStage>('registered');
  const [newLeadNotes, setNewLeadNotes] = useState('');

  // Object Upload Form State
  const [formCity, setFormCity] = useState<RentchCity>('tbilisi');
  const [formTitle, setFormTitle] = useState('');
  const [formDistrict, setFormDistrict] = useState<CityDistrict>('Ваке (Vake)');
  const [catalogCityFilter, setCatalogCityFilter] = useState<'all' | RentchCity>('all');
  const [formAddress, setFormAddress] = useState('');
  const [formCurrency, setFormCurrency] = useState<Currency>('USD');
  const [formPriceAmount, setFormPriceAmount] = useState<number>(750);
  const [formRooms, setFormRooms] = useState<number>(2);
  const [formBedrooms, setFormBedrooms] = useState<number>(1);
  const [formAreaSqm, setFormAreaSqm] = useState<number>(55);
  const [formFloor, setFormFloor] = useState<number>(4);
  const [formTotalFloors, setFormTotalFloors] = useState<number>(9);
  const [formFurniture, setFormFurniture] = useState<FurnitureStatus>('full');
  const [formPetPolicy, setFormPetPolicy] = useState<PetPolicy>('allowed');
  const [formMinPeriod, setFormMinPeriod] = useState<LeasePeriod>('month_to_year');
  const [formMetro, setFormMetro] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [isReadingFormImages, setIsReadingFormImages] = useState(false);
  const [isDraggingFormImages, setIsDraggingFormImages] = useState(false);
  const [isReadingPdfImages, setIsReadingPdfImages] = useState(false);
  const [formNewImageUrl, setFormNewImageUrl] = useState('');
  const [isFormZipExtracting, setIsFormZipExtracting] = useState(false);
  const [formZipNotice, setFormZipNotice] = useState('');
  const [formSuccessMessage, setFormSuccessMessage] = useState('');

  // PDF & ZIP Archive Upload & Extraction State
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [isPdfProcessing, setIsPdfProcessing] = useState(false);
  const [pdfProcessingStep, setPdfProcessingStep] = useState<string>('');
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const [pdfExtractedData, setPdfExtractedData] = useState<ExtractedPdfApartment | null>(null);
  const [pdfSuccessApartment, setPdfSuccessApartment] = useState<Apartment | null>(null);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState('');
  const [pdfError, setPdfError] = useState('');
  const [showRawText, setShowRawText] = useState(false);
  const [newPhotoUrlInput, setNewPhotoUrlInput] = useState('');
  const [catalogZipToast, setCatalogZipToast] = useState('');
  const [isTranslatingCatalog, setIsTranslatingCatalog] = useState(false);
  const [isDeepParsingMyHome, setIsDeepParsingMyHome] = useState(false);

  const handleDeepParseMyHome200 = async () => {
    setIsDeepParsingMyHome(true);
    setCatalogZipToast('Глубокий парсинг до 200 новых квартир с MyHome.ge (обход до 24 страниц)...');
    try {
      const response = await fetch('/api/apartments/seed-myhome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 200, startPage: 1 }),
      });
      const data = await response.json();
      if (data.success) {
        setCatalogZipToast(
          `Успешно загружено ${data.count || 0} новых квартир с MyHome! Всего объектов в базе: ${data.total || 0}.`
        );
        if (onRefreshCatalog) {
          onRefreshCatalog();
        }
      } else {
        setCatalogZipToast('Ошибка при парсинге квартир с MyHome');
      }
    } catch (err: any) {
      console.error('Deep parse error:', err);
      setCatalogZipToast('Ошибка при парсинге квартир с MyHome');
    } finally {
      setIsDeepParsingMyHome(false);
      setTimeout(() => setCatalogZipToast(''), 6000);
    }
  };

  const handleTranslateCatalog = async () => {
    setIsTranslatingCatalog(true);
    setCatalogZipToast('Автоматический перевод всех объектов на русский язык...');
    try {
      const response = await fetch('/api/apartments/translate-all', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        setCatalogZipToast(`Перевод завершен! Переведено объектов: ${data.translatedCount || 0}`);
        if (onRefreshCatalog) {
          onRefreshCatalog();
        }
      } else {
        setCatalogZipToast('Ошибка при переводе каталога');
      }
    } catch (err: any) {
      console.error('Translation error:', err);
      setCatalogZipToast('Ошибка при переводе каталога');
    } finally {
      setIsTranslatingCatalog(false);
      setTimeout(() => setCatalogZipToast(''), 5000);
    }
  };

  // Handle Login (strictly verified on backend with brute-force protection & audit logging)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const result = await loginAdminOnServer(loginInput, passwordInput);
    if (result.ok) {
      setIsAuthenticated(true);
      setPasswordInput('');
      onAuthSuccess?.();
      fetchAuditLog();
    } else {
      setAuthError(result.error || 'Неверный логин или пароль администратора');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    clearAdminSession();
    onLogout?.();
  };

  // Move lead forward or backward in CRM pipeline
  const handleMoveLead = (leadId: string, direction: 'forward' | 'backward') => {
    const stageOrder: CrmStage[] = ['registered', 'viewing_scheduled', 'viewing_done_thinking', 'paid'];
    onUpdateLeads(
      leads.map((lead) => {
        if (lead.id !== leadId) return lead;
        const currentIndex = stageOrder.indexOf(lead.stage);
        const targetIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
        if (targetIndex < 0 || targetIndex >= stageOrder.length) return lead;
        return {
          ...lead,
          stage: stageOrder[targetIndex],
        };
      })
    );
  };

  // Add lead manually
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim() || !newLeadPhone.trim()) return;

    const newLead: CrmLead = {
      id: 'lead-custom-' + Date.now(),
      clientName: newLeadName.trim(),
      clientPhone: newLeadPhone.trim(),
      clientTelegram: newLeadTelegram.trim() || undefined,
      stage: newLeadStage,
      registeredAt: 'Только что',
      notes: newLeadNotes.trim() || undefined,
    };

    onUpdateLeads([newLead, ...leads]);
    setIsAddLeadModalOpen(false);
    setNewLeadName('');
    setNewLeadPhone('');
    setNewLeadTelegram('');
    setNewLeadNotes('');
  };

  // Delete lead with reliable in-app modal confirmation
  const handleRequestDeleteLead = (lead: CrmLead) => {
    setLeadToDelete(lead);
  };

  const handleConfirmDeleteLead = () => {
    if (!leadToDelete) return;
    onUpdateLeads(leads.filter((l) => l.id !== leadToDelete.id));
    setLeadToDelete(null);
  };

  const handleConfirmClearAllLeads = () => {
    onUpdateLeads([]);
    onClearAllLeads?.();
    setIsDeleteAllLeadsOpen(false);
  };

  const handleRequestDeleteApartment = (apt: Apartment) => {
    setAptToDelete(apt);
  };

  const handleConfirmDeleteApartment = () => {
    if (!aptToDelete) return;
    onDeleteApartment(aptToDelete.id);
    setAptToDelete(null);
  };

  const handleConfirmClearAllApartments = () => {
    if (onClearAllApartments) {
      onClearAllApartments();
    } else {
      apartments.forEach((a) => onDeleteApartment(a.id));
    }
    setIsDeleteAllAptsOpen(false);
  };

  // Currency toggle handler with intelligent auto-conversion
  const handleFormCurrencyChange = (newCurrency: Currency) => {
    if (newCurrency === formCurrency) return;
    if (newCurrency === 'GEL') {
      setFormCurrency('GEL');
      if (formPriceAmount) {
        setFormPriceAmount(Math.round(formPriceAmount * 2.72));
      }
    } else {
      setFormCurrency('USD');
      if (formPriceAmount) {
        setFormPriceAmount(Math.round(formPriceAmount / 2.72));
      }
    }
  };

  // Handle Manual Property Form Upload
  const handleCreateApartmentFromForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formAddress.trim()) return;

    const parsedAmount = Number(formPriceAmount) || (formCurrency === 'USD' ? 750 : 2040);
    const priceUsd = formCurrency === 'USD'
      ? Math.round(parsedAmount)
      : Math.round(parsedAmount / 2.72);

    const priceGel = formCurrency === 'GEL'
      ? Math.round(parsedAmount)
      : Math.round(parsedAmount * 2.72);

    const cityConfig = CITIES_CONFIG[formCity];
    const newApt: Apartment = {
      id: 'apt-custom-' + Date.now(),
      city: formCity,
      title: formTitle.trim(),
      district: formDistrict,
      address: formAddress.trim(),
      priceUsd,
      priceGel,
      currency: formCurrency,
      originalPrice: parsedAmount,
      rooms: Number(formRooms) || 2,
      bedrooms: Number(formBedrooms) || 1,
      areaSqm: Number(formAreaSqm) || 50,
      floor: Number(formFloor) || 3,
      totalFloors: Number(formTotalFloors) || 9,
      furniture: formFurniture,
      petPolicy: formPetPolicy,
      minPeriod: formMinPeriod,
      maxResidents: formRooms * 2,
      images: formImages.length > 0 
        ? formImages 
        : [
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
          ],
      description: formDescription.trim() || `Светлая, уютная квартира со свежим ремонтом и всей необходимой бытовой техникой ${cityConfig.nameInRu}.`,
      amenities: ['Кондиционер', 'Стиральная машина', 'Wi-Fi', 'Отопление Karma/Центральное', 'Балкон'],
      lat: cityConfig.centerLat + (Math.random() - 0.5) * 0.03,
      lng: cityConfig.centerLng + (Math.random() - 0.5) * 0.03,
      metro: formMetro.trim() || undefined,
      isNew: true,
      landlord: {
        id: 'landlord-admin',
        name: 'Отдел аренды Rentch',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
        phone: '+995 599 00-11-22',
        verified: true,
        responseTime: '~5 минут',
        rating: 4.9,
      },
    };

    onAddApartment(newApt);
    const priceDisplay = formCurrency === 'GEL'
      ? `${priceGel} ₾ / мес (~$${priceUsd})`
      : `$${priceUsd} / мес (~${priceGel} ₾)`;
    setFormSuccessMessage(`Объект «${newApt.title}» (${priceDisplay}, ${newApt.images.length} фото) успешно опубликован и доступен в свайпах и на карте!`);
    setFormTitle('');
    setFormAddress('');
    setFormDescription('');
    setFormImages([]);
    setTimeout(() => setFormSuccessMessage(''), 5000);
  };

  // Add individual photos one by one or multiple from device
  const handleAddPhotosFromFiles = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    setIsReadingFormImages(true);
    setFormZipNotice('Обработка и оптимизация фото...');
    try {
      const addedDataUrls = await readMultipleImagesAsDataUrls(files);
      if (addedDataUrls.length > 0) {
        setFormImages((prev) => [...prev, ...addedDataUrls]);
        setFormZipNotice(`Добавлено фото: +${addedDataUrls.length} шт. (всего в анкете: ${formImages.length + addedDataUrls.length})`);
        setTimeout(() => setFormZipNotice(''), 4000);
      } else {
        setFormZipNotice('Выбранные файлы не являются поддерживаемыми изображениями (JPG, PNG, WEBP).');
        setTimeout(() => setFormZipNotice(''), 4000);
      }
    } catch (err) {
      console.error('Error adding photos:', err);
      setFormZipNotice('Не удалось обработать файл изображения.');
      setTimeout(() => setFormZipNotice(''), 4000);
    } finally {
      setIsReadingFormImages(false);
    }
  };

  // Drag and drop handler for photos in manual form
  const handleFormPhotosDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFormImages(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files: File[] = Array.from(e.dataTransfer.files);
      const zipFile = files.find((f: File) => f.name.toLowerCase().endsWith('.zip') || f.type === 'application/zip');
      if (zipFile) {
        handleUploadFormZip(zipFile);
      } else {
        handleAddPhotosFromFiles(files);
      }
    }
  };

  // Add individual photos to extracted PDF apartment preview
  const handleAddPhotosToExtractedPdf = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0 || !pdfExtractedData) return;
    setIsReadingPdfImages(true);
    try {
      const addedDataUrls = await readMultipleImagesAsDataUrls(files);
      if (addedDataUrls.length > 0) {
        setPdfExtractedData({
          ...pdfExtractedData,
          images: [...pdfExtractedData.images, ...addedDataUrls],
        });
      }
    } catch (err) {
      console.error('Error adding photos to PDF data:', err);
    } finally {
      setIsReadingPdfImages(false);
    }
  };

  // ZIP Archive upload handler for manual form
  const handleUploadFormZip = async (file: File) => {
    setIsFormZipExtracting(true);
    setFormZipNotice(`Распаковка архива «${file.name}»...`);
    try {
      const result = await parseZipArchive(file);
      if (result.imageUrls.length === 0) {
        setFormZipNotice(`В архиве «${file.name}» не обнаружено файлов изображений (.jpg, .png, .webp).`);
        return;
      }
      setFormImages((prev) => [...prev, ...result.imageUrls]);
      setFormZipNotice(`Успешно распаковано ${result.totalImagesCount} фото! Все фотографии прогружены в карточку по отдельности.`);
      if (result.extractedTextNotes && !formDescription) {
        setFormDescription(result.extractedTextNotes);
      }
      setTimeout(() => setFormZipNotice(''), 6000);
    } catch (err: any) {
      console.error('Error unpacking zip in form:', err);
      setFormZipNotice('Ошибка распаковки архива. Убедитесь, что файл является корректным .zip архивом.');
      setTimeout(() => setFormZipNotice(''), 4000);
    } finally {
      setIsFormZipExtracting(false);
    }
  };

  // Real PDF & ZIP Archive File Upload & Extraction Handler
  const handleProcessArchiveOrPdfFile = async (file: File) => {
    const isZip = file.name.toLowerCase().endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed';
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

    if (!isZip && !isPdf) {
      setPdfError('Пожалуйста, выберите файл в формате .ZIP (архив с фото) или .PDF (презентация объекта)');
      return;
    }

    setSelectedUploadFile(file);
    setIsPdfProcessing(true);
    setPdfSuccessMessage('');
    setPdfSuccessApartment(null);
    setPdfError('');

    if (isZip) {
      setPdfProcessingStep(`Распаковка ZIP-архива «${file.name}» и извлечение фотографий по отдельности...`);
      try {
        const zipResult = await parseZipArchive(file);
        if (zipResult.images.length === 0) {
          setPdfError(`В архиве «${file.name}» не найдено файлов фотографий (.jpg, .png, .webp). Проверьте содержимое архива.`);
          return;
        }

        let titleGuess = file.name.replace(/\.[^/.]+$/, '').replace(/[_\\-]/g, ' ');
        const combinedText = (file.name + ' ' + (zipResult.extractedTextNotes || '')).toLowerCase();
        const detected = detectDistrictFromText(combinedText);
        let districtGuess: TbilisiDistrict = detected.district;
        let priceGuess = 850;

        const priceMatch = (zipResult.extractedTextNotes || '').match(/\$?\s*(\d{3,4})\s*(?:\$|usd|долл|\/мес)?/i);
        if (priceMatch && priceMatch[1]) {
          const p = parseInt(priceMatch[1], 10);
          if (p >= 250 && p <= 10000) priceGuess = p;
        }

        setPdfExtractedData({
          title: titleGuess || `Квартира в Тбилиси (${formatDistrictDisplay(districtGuess)})`,
          district: districtGuess,
          address: `г. Тбилиси, район ${formatDistrictDisplay(districtGuess)}`,
          priceUsd: priceGuess,
          rooms: 2,
          bedrooms: 1,
          areaSqm: 60,
          floor: 4,
          totalFloors: 10,
          furniture: 'full',
          petPolicy: 'allowed',
          description: zipResult.extractedTextNotes || `Светлая уютная квартира в Тбилиси. Все ${zipResult.totalImagesCount} фотографий извлечены по отдельности из архива «${file.name}» и готовы к показу клиентам. Качественный ремонт, полный комплект бытовой техники и мебели.`,
          amenities: ['Кондиционер', 'Стиральная машина', 'Wi-Fi', 'Центральное отопление', 'Балкон', 'Оборудованная кухня'],
          images: zipResult.imageUrls,
          extractedFile: file.name,
          rawTextPreview: `ZIP-архив: ${file.name}\nВсего извлечено фото: ${zipResult.totalImagesCount} шт.\n\nСписок файлов в архиве:\n` +
            zipResult.images.map((img, i) => `${i + 1}. ${img.name} (${Math.round(img.sizeBytes / 1024)} KB)`).join('\n') +
            (zipResult.extractedTextNotes ? `\n\nТекстовые заметки из архива:\n${zipResult.extractedTextNotes}` : ''),
          sourceType: 'zip',
          zipFileNames: zipResult.images.map((i) => i.name),
        });

        setPdfSuccessMessage(`Из архива «${file.name}» успешно извлечено ${zipResult.totalImagesCount} фото! Все фотографии прогружены в карточку по отдельности.`);
      } catch (err: any) {
        console.error('Error parsing zip file:', err);
        setPdfError('Не удалось распаковать ZIP-архив. Убедитесь, что файл является корректным .zip архивом.');
      } finally {
        setIsPdfProcessing(false);
        setPdfProcessingStep('');
      }
    } else {
      // PDF processing
      setPdfProcessingStep('Распознавание страниц PDF и извлечение фотографий...');
      try {
        const extracted = await parseApartmentPdf(file);
        setPdfExtractedData({
          ...extracted,
          sourceType: 'pdf',
        });
      } catch (err: any) {
        console.error('Error parsing PDF file:', err);
        setPdfError('Внимание: не все текстовые блоки удалось распознать автоматически (возможно, сканированный PDF). Базовые поля заполнены, проверьте и скорректируйте их перед публикацией.');
        setPdfExtractedData({
          title: file.name.replace(/\.[^/.]+$/, '').replace(/[_\\-]/g, ' ') || 'Квартира в Тбилиси',
          district: 'Ваке (Vake)',
          address: 'Тбилиси, район Ваке',
          priceUsd: 850,
          rooms: 2,
          bedrooms: 1,
          areaSqm: 55,
          floor: 4,
          totalFloors: 9,
          furniture: 'full',
          petPolicy: 'allowed',
          description: 'Уютная и светлая квартира со свежим ремонтом и мебелью по материалам PDF-презентации.',
          amenities: ['Кондиционер', 'Стиральная машина', 'Wi-Fi', 'Центральное отопление', 'Балкон'],
          images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'],
          extractedFile: file.name,
          rawTextPreview: 'Файл: ' + file.name,
          sourceType: 'pdf',
        });
      } finally {
        setIsPdfProcessing(false);
        setPdfProcessingStep('');
      }
    }
  };

  // Update existing apartment photos from ZIP archive in catalog
  const handleUpdateApartmentPhotosFromZip = async (apt: Apartment, file: File) => {
    setCatalogZipToast(`Распаковка архива «${file.name}» для объекта «${apt.title}»...`);
    try {
      const result = await parseZipArchive(file);
      if (result.imageUrls.length === 0) {
        setCatalogZipToast(`В архиве «${file.name}» не найдено файлов изображений.`);
        setTimeout(() => setCatalogZipToast(''), 4000);
        return;
      }
      const updatedApt: Apartment = {
        ...apt,
        images: result.imageUrls,
      };
      onUpdateApartment?.(updatedApt);
      setCatalogZipToast(`Успешно прогружено ${result.totalImagesCount} фото из архива в карточку «${apt.title}»!`);
      setTimeout(() => setCatalogZipToast(''), 6000);
    } catch (e) {
      console.error(e);
      setCatalogZipToast('Ошибка распаковки архива.');
      setTimeout(() => setCatalogZipToast(''), 4000);
    }
  };

  // Publish PDF apartment to Rentch database and offer directly to clients in cards
  const handleImportPdfApartment = () => {
    if (!pdfExtractedData) return;

    // Approximate district coordinates in Tbilisi
    let lat = 41.7151;
    let lng = 44.7874;
    const districtLower = pdfExtractedData.district.toLowerCase();
    if (districtLower.includes('ваке') || districtLower.includes('vake')) {
      lat = 41.7118; lng = 44.7571;
    } else if (districtLower.includes('сабуртало') || districtLower.includes('saburtalo')) {
      lat = 41.7289; lng = 44.7645;
    } else if (districtLower.includes('вера') || districtLower.includes('vera')) {
      lat = 41.7082; lng = 44.7834;
    } else if (districtLower.includes('мтацминда') || districtLower.includes('mtatsminda')) {
      lat = 41.6961; lng = 44.7938;
    } else if (districtLower.includes('чугурети') || districtLower.includes('chugureti')) {
      lat = 41.7126; lng = 44.8015;
    } else if (districtLower.includes('дидубе') || districtLower.includes('didube')) {
      lat = 41.7456; lng = 44.7789;
    } else if (districtLower.includes('багеби') || districtLower.includes('bagebi')) {
      lat = 41.7089; lng = 44.7321;
    } else if (districtLower.includes('исани') || districtLower.includes('isani')) {
      lat = 41.6892; lng = 44.8398;
    }

    const newApt: Apartment = {
      id: (pdfExtractedData.sourceType === 'zip' ? 'apt-zip-' : 'apt-pdf-') + Date.now(),
      title: pdfExtractedData.title.trim() || 'Апартаменты в Тбилиси',
      district: (pdfExtractedData.district as TbilisiDistrict) || 'Ваке (Vake)',
      address: pdfExtractedData.address.trim() || 'Тбилиси',
      priceUsd: Number(pdfExtractedData.priceUsd) || 800,
      rooms: Number(pdfExtractedData.rooms) || 2,
      bedrooms: Number(pdfExtractedData.bedrooms) || Math.max(1, (Number(pdfExtractedData.rooms) || 2) - 1),
      areaSqm: Number(pdfExtractedData.areaSqm) || 50,
      floor: Number(pdfExtractedData.floor) || 4,
      totalFloors: Number(pdfExtractedData.totalFloors) || 9,
      furniture: pdfExtractedData.furniture || 'full',
      petPolicy: pdfExtractedData.petPolicy || 'allowed',
      minPeriod: 'month_to_year',
      maxResidents: (Number(pdfExtractedData.rooms) || 2) * 2,
      images: pdfExtractedData.images.length > 0 
        ? pdfExtractedData.images 
        : ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'],
      description: pdfExtractedData.description.trim() || 'Уютная современная квартира в Тбилиси.',
      amenities: pdfExtractedData.amenities && pdfExtractedData.amenities.length > 0
        ? pdfExtractedData.amenities
        : ['Кондиционер', 'Стиральная машина', 'Wi-Fi', 'Центральное отопление', 'Балкон'],
      lat: lat + (Math.random() - 0.5) * 0.015,
      lng: lng + (Math.random() - 0.5) * 0.015,
      isNew: true,
      landlord: {
        id: 'landlord-pdf',
        name: 'Rentch Verified Partner',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
        phone: '+995 599 44-55-66',
        verified: true,
        responseTime: '~3 минуты',
        rating: 5.0,
      },
    };

    onAddApartment(newApt);
    setPdfSuccessApartment(newApt);
    const srcType = pdfExtractedData.sourceType === 'zip' ? 'ZIP-архива' : 'PDF';
    setPdfSuccessMessage(`Объект из ${srcType} «${newApt.title}» успешно размещён в карточках Rentch! ${newApt.images.length} фото по отдельности, цена $${newApt.priceUsd} и описание загружены и предлагаются клиентам.`);
    setPdfExtractedData(null);
    setSelectedUploadFile(null);
  };

  // Unauthenticated Screen
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md min-w-0 mx-auto my-8 p-6 sm:p-8 bg-white rounded-3xl border border-stone-200 shadow-xl text-stone-900 pb-24">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <RentchLogo size="lg" showText={false} />
          </div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">Панель администратора</h2>
          <p className="text-xs text-stone-500 mt-1">
            Вход в CRM-систему сервиса Rentch Тбилиси
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Логин (Email)
            </label>
            <input
              type="email"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="Введите email администратора"
              required
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Пароль
            </label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {authError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            id="admin-login-btn"
            className="w-full bg-gradient-to-r from-stone-900 to-stone-800 hover:from-black hover:to-stone-900 text-white font-bold py-3.5 px-6 rounded-2xl text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Войти в систему CRM</span>
          </button>
        </form>
      </div>
    );
  }

  // Authenticated Admin Dashboard
  return (
    <div id="admin-panel-container" className="w-full max-w-7xl min-w-0 mx-auto py-4 px-2 sm:px-4 space-y-5 pb-28 overflow-x-hidden">
      {/* Top Admin Header Bar */}
      <div className="bg-stone-900 text-white rounded-3xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-500 flex items-center justify-center shadow-md">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                Rentch CRM & Управление
              </h2>
              <span className="text-[10px] bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full">
                ADMIN
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Вы вошли как: <strong className="text-stone-200">ai9292@mail.ru</strong>
            </p>
          </div>
        </div>

        {/* Navigation tabs inside admin */}
        <div className="flex flex-wrap items-center gap-1.5 bg-stone-800/90 p-1.5 rounded-2xl border border-stone-700">
          <button
            type="button"
            id="admin-tab-crm-btn"
            onClick={() => setAdminTab('crm')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'crm'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            Канбан CRM ({leads.length})
          </button>

          <button
            type="button"
            id="admin-tab-form-btn"
            onClick={() => setAdminTab('upload_form')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'upload_form'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            Загрузка: Анкета
          </button>

          <button
            type="button"
            id="admin-tab-pdf-btn"
            onClick={() => setAdminTab('upload_pdf')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              adminTab === 'upload_pdf'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Загрузка: ZIP / PDF</span>
          </button>

          <button
            type="button"
            id="admin-tab-myhome-btn"
            onClick={() => setAdminTab('myhome')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              adminTab === 'myhome'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-rose-300" />
            <span>🇬🇪 Импорт: Тбилиси (MyHome)</span>
          </button>

          <button
            type="button"
            id="admin-tab-halooglasi-btn"
            onClick={() => setAdminTab('halooglasi')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              adminTab === 'halooglasi'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-sky-300" />
            <span>🇷🇸 Импорт: Белград (HaloOglasi)</span>
          </button>

          <button
            type="button"
            id="admin-tab-catalog-btn"
            onClick={() => setAdminTab('catalog')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'catalog'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            Каталог ({apartments.length})
          </button>

          <button
            type="button"
            id="admin-tab-pwa-btn"
            onClick={() => setAdminTab('pwa')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              adminTab === 'pwa'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>PWA-приложение</span>
          </button>

          <button
            type="button"
            id="admin-tab-security-btn"
            onClick={() => {
              setAdminTab('security');
              fetchAuditLog();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              adminTab === 'security'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-300 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Безопасность и Домен</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 text-stone-400 hover:text-rose-400 rounded-xl transition-colors cursor-pointer ml-1"
            title="Выйти из панели"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SECTION 1: KANBAN CRM BOARD */}
      {adminTab === 'crm' && (
        <div className="space-y-4">
          {/* Today's View & Swipe Statistics Dashboard */}
          <div
            id="admin-today-analytics-card"
            className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200 shadow-xs space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-stone-900">
                      Статистика просмотров за сегодня
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE · {todayStats?.date || new Date().toISOString().slice(0, 10)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Обновляется в реальном времени (посетители приложения, просмотры карточек и свайпы)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {todayStats?.apartmentBreakdown &&
                  Object.keys(todayStats.apartmentBreakdown).length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowTopApartmentsToday((v) => !v)}
                      className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {showTopApartmentsToday
                        ? 'Скрыть детализацию по квартирам'
                        : `По квартирам (${Object.keys(todayStats.apartmentBreakdown).length})`}
                    </button>
                  )}
                <button
                  type="button"
                  onClick={fetchAnalytics}
                  className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
                  title="Обновить статистику"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-2xl bg-stone-900 text-white border border-stone-800">
                <p className="text-[11px] font-semibold text-stone-300">
                  Уникальных за всё время
                </p>
                <p className="text-2xl font-black text-white font-mono tabular-nums mt-1">
                  {allTimeStats?.uniqueVisitors ?? todayStats?.uniqueVisitors ?? 1}
                </p>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  Всего визитов: {allTimeStats?.pageViews ?? todayStats?.pageViews ?? 1}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
                <p className="text-[11px] font-semibold text-stone-500">
                  Уникальных сегодня
                </p>
                <p className="text-2xl font-black text-stone-900 font-mono tabular-nums mt-1">
                  {todayStats?.uniqueVisitors ?? 1}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
                <p className="text-[11px] font-semibold text-stone-500">
                  Визитов сегодня
                </p>
                <p className="text-2xl font-black text-stone-900 font-mono tabular-nums mt-1">
                  {todayStats?.pageViews ?? 1}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
                <p className="text-[11px] font-semibold text-stone-500">
                  Просмотров квартир (всего)
                </p>
                <p className="text-2xl font-black text-stone-900 font-mono tabular-nums mt-1">
                  {allTimeStats?.apartmentViews ?? todayStats?.apartmentViews ?? 0}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80">
                <p className="text-[11px] font-semibold text-rose-700">
                  Свайпов вправо (Rentch! ❤️)
                </p>
                <p className="text-2xl font-black text-rose-600 font-mono tabular-nums mt-1">
                  {allTimeStats?.swipesRight ?? todayStats?.swipesRight ?? 0}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                <p className="text-[11px] font-semibold text-amber-800">
                  Заявок и чатов в CRM
                </p>
                <p className="text-2xl font-black text-amber-700 font-mono tabular-nums mt-1">
                  {leads.length}
                </p>
              </div>
            </div>

            {showTopApartmentsToday &&
              todayStats?.apartmentBreakdown &&
              Object.keys(todayStats.apartmentBreakdown).length > 0 && (
                <div className="pt-3 border-t border-stone-200/80 space-y-2">
                  <p className="text-xs font-bold text-stone-700">
                    Просмотры конкретных объектов за сегодня:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {Object.entries(todayStats.apartmentBreakdown)
                      .sort((a, b) => b[1].views - a[1].views)
                      .map(([aptId, item]) => (
                        <div
                          key={aptId}
                          className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="font-semibold text-stone-800 truncate">
                            {item.title}
                          </span>
                          <div className="flex items-center gap-2 shrink-0 font-mono">
                            <span className="px-2 py-0.5 rounded-md bg-stone-200/80 text-stone-700 font-bold">
                              👁 {item.views}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-bold">
                              ❤️ {item.likes}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </div>

          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по имени клиента, телефону, объекту..."
                className="w-full text-xs text-stone-900 bg-transparent focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              {leads.length > 0 && (
                <button
                  type="button"
                  id="clear-all-leads-btn"
                  onClick={() => setIsDeleteAllLeadsOpen(true)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Удалить всех клиентов из CRM"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Очистить CRM ({leads.length})</span>
                </button>
              )}

              <button
                type="button"
                id="add-lead-btn"
                onClick={() => setIsAddLeadModalOpen(true)}
                className="bg-stone-900 hover:bg-black text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить лид вручную</span>
              </button>
            </div>
          </div>

          {/* Kanban 4 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
            {STAGES.map((col) => {
              const colLeads = leads.filter((l) => {
                if (l.stage !== col.key) return false;
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return (
                  l.clientName.toLowerCase().includes(q) ||
                  l.clientPhone.toLowerCase().includes(q) ||
                  (l.apartmentTitle && l.apartmentTitle.toLowerCase().includes(q)) ||
                  (l.notes && l.notes.toLowerCase().includes(q))
                );
              });

              return (
                <div
                  key={col.key}
                  id={`crm-col-${col.key}`}
                  className="bg-stone-100/90 rounded-3xl p-3.5 border border-stone-200/80 flex flex-col min-h-[480px]"
                >
                  {/* Column Header */}
                  <div className={`p-3 rounded-2xl ${col.bg} ${col.border} border mb-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        col.key === 'registered' ? 'bg-sky-500' :
                        col.key === 'viewing_scheduled' ? 'bg-amber-500' :
                        col.key === 'viewing_done_thinking' ? 'bg-purple-500' : 'bg-emerald-500'
                      }`} />
                      <h3 className={`font-black text-xs uppercase tracking-wider ${col.color}`}>
                        {col.title}
                      </h3>
                    </div>
                    <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-white/90 shadow-2xs text-stone-800">
                      {colLeads.length}
                    </span>
                  </div>

                  {/* Cards inside column */}
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {colLeads.length === 0 ? (
                      <div className="py-12 text-center text-xs text-stone-400">
                        В этом этапе пока нет заявок
                      </div>
                    ) : (
                      colLeads.map((lead) => (
                        <div
                          key={lead.id}
                          id={`lead-card-${lead.id}`}
                          className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-xs hover:shadow-md transition-shadow space-y-2.5"
                        >
                          {/* Client Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-sm text-stone-900 leading-snug">
                                {lead.clientName}
                              </h4>
                              <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5">
                                <Phone className="w-3 h-3 text-stone-400" />
                                <a href={`tel:${lead.clientPhone}`} className="hover:text-rose-600 transition-colors">
                                  {lead.clientPhone}
                                </a>
                              </div>
                              {lead.clientTelegram && (
                                <div className="text-[10px] text-sky-600 font-medium mt-0.5">
                                  TG: {lead.clientTelegram}
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              id={`delete-lead-btn-${lead.id}`}
                              onClick={() => handleRequestDeleteLead(lead)}
                              className="text-stone-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg border border-transparent hover:border-rose-200 transition-all cursor-pointer flex-shrink-0"
                              title="Удалить клиента из CRM"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Object / Viewing info */}
                          {(lead.apartmentTitle || lead.apartmentId) && (() => {
                            const linkedApt = apartments.find((a) => a.id === lead.apartmentId);
                            const myhomeUrl =
                              lead.apartmentSourceUrl ||
                              getMyHomeOriginalUrl(
                                linkedApt || { id: lead.apartmentId, title: lead.apartmentTitle }
                              );
                            const myhomeId = getMyHomeStatementId(lead.apartmentId || linkedApt?.id);
                            const displayTitle = lead.apartmentTitle || linkedApt?.title || 'Объект Rentch';
                            const displayDistrict = lead.apartmentDistrict || linkedApt?.district || '';
                            const displayAddress = lead.apartmentAddress || linkedApt?.address || '';
                            const displayPrice = lead.apartmentPriceUsd || linkedApt?.priceUsd;
                            const displayThumb = lead.apartmentImage || linkedApt?.images?.[0];

                            return (
                              <div className="bg-stone-50 rounded-xl p-2.5 text-xs border border-stone-200 space-y-2">
                                <div className="flex items-start gap-2.5">
                                  {displayThumb && (
                                    <img
                                      src={displayThumb}
                                      alt={displayTitle}
                                      onClick={() => linkedApt && onViewApartment?.(linkedApt)}
                                      className={`w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-stone-200 ${
                                        linkedApt ? 'cursor-pointer hover:opacity-90' : ''
                                      }`}
                                    />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div
                                      onClick={() => linkedApt && onViewApartment?.(linkedApt)}
                                      className={`font-bold text-stone-900 leading-snug line-clamp-2 ${
                                        linkedApt ? 'cursor-pointer hover:text-rose-600 transition-colors' : ''
                                      }`}
                                    >
                                      🏠 {displayTitle}
                                    </div>
                                    {displayAddress && (
                                      <div className="text-[11px] text-stone-500 truncate mt-0.5">
                                        📍 {displayAddress}
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1">
                                      <span className="truncate">{displayDistrict}</span>
                                      {displayPrice && (
                                        <span className="font-bold text-rose-600 flex-shrink-0 ml-1">
                                          ${displayPrice}/мес
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Original MyHome Publication Link */}
                                {myhomeUrl && (
                                  <div className="pt-1.5 border-t border-stone-200/80 space-y-1">
                                    <a
                                      href={myhomeUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      id={`crm-lead-myhome-link-${lead.id}`}
                                      className="w-full py-1.5 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] flex items-center justify-between gap-1.5 transition-colors"
                                      title="Открыть оригинальную публикацию на сайте MyHome.ge"
                                    >
                                      <span className="flex items-center gap-1.5 truncate">
                                        <Globe className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                                        <span className="truncate">
                                          Оригинал в MyHome {myhomeId ? `(ID ${myhomeId})` : ''}
                                        </span>
                                      </span>
                                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                    </a>
                                    <a
                                      href={myhomeUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block text-[10px] text-stone-500 hover:text-rose-600 hover:underline truncate px-0.5"
                                    >
                                      {myhomeUrl}
                                    </a>
                                  </div>
                                )}

                                {linkedApt && onViewApartment && (
                                  <button
                                    type="button"
                                    onClick={() => onViewApartment(linkedApt)}
                                    className="w-full py-1 px-2 rounded-lg bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3 text-stone-500" />
                                    <span>Открыть карточку объекта</span>
                                  </button>
                                )}
                              </div>
                            );
                          })()}

                          {/* Questionnaire summary for registered stage */}
                          {lead.questionnaireSummary && (
                            <div className="text-[11px] text-stone-600 bg-sky-50/70 p-2 rounded-xl border border-sky-100/80 space-y-1">
                              <div><strong>Район:</strong> {lead.questionnaireSummary.district}</div>
                              <div><strong>Срок:</strong> {lead.questionnaireSummary.period}</div>
                              <div><strong>Человек:</strong> {lead.questionnaireSummary.peopleCount} • <strong>Питомцы:</strong> {lead.questionnaireSummary.pets}</div>
                            </div>
                          )}

                          {/* Viewing Date for scheduled/thinking */}
                          {lead.viewingSlot && (
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80">
                              <Calendar className="w-3 h-3 text-amber-600" />
                              <span>{lead.viewingSlot.date} в {lead.viewingSlot.time}</span>
                            </div>
                          )}

                          {/* Paid amount badge */}
                          {lead.paidAmountUsd && (
                            <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Оплачено: ${lead.paidAmountUsd}</span>
                            </div>
                          )}

                          {/* Notes */}
                          {lead.notes && (
                            <p className="text-[11px] text-stone-500 italic bg-stone-50/80 p-2 rounded-lg leading-relaxed">
                              "{lead.notes}"
                            </p>
                          )}

                          {/* Latest chat message snippet if available */}
                          {(() => {
                            const leadMsgs = getLeadMessages(lead);
                            const lastUserMsg = [...leadMsgs].reverse().find((m) => m.sender === 'user');
                            const lastMsg = lastUserMsg || leadMsgs[leadMsgs.length - 1];
                            return (
                              <div className="pt-1">
                                {lastMsg && (
                                  <div
                                    onClick={() => handleOpenLeadChat(lead)}
                                    className="mb-2 p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/80 text-[11px] text-stone-700 cursor-pointer hover:bg-rose-50 transition"
                                  >
                                    <div className="flex items-center justify-between text-[10px] text-stone-400 mb-0.5">
                                      <span className="font-bold text-rose-600">
                                        {lastMsg.sender === 'user'
                                          ? `👤 ${lead.clientName}:`
                                          : lastMsg.sender === 'bot'
                                          ? '🤖 Бот:'
                                          : '👨‍💼 Вы (Админ):'}
                                      </span>
                                      <span>{lastMsg.timestamp}</span>
                                    </div>
                                    <p className="line-clamp-3 leading-snug text-stone-800 whitespace-pre-line">{lastMsg.text}</p>
                                  </div>
                                )}

                                <button
                                  type="button"
                                  id={`open-lead-chat-btn-${lead.id}`}
                                  onClick={() => handleOpenLeadChat(lead)}
                                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-bold shadow-2xs hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer relative"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Переписка с клиентом</span>
                                  {leadMsgs.length > 0 && (
                                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px] font-extrabold">
                                      {leadMsgs.length}
                                    </span>
                                  )}
                                  {(lead.unreadByAdmin || 0) > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black flex items-center justify-center shadow border border-white animate-bounce">
                                      {lead.unreadByAdmin}
                                    </span>
                                  )}
                                </button>
                              </div>
                            );
                          })()}

                          {/* Stage Movement Buttons */}
                          <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-stone-400">{lead.registeredAt}</span>

                            <div className="flex items-center gap-1">
                              {col.key !== 'registered' && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveLead(lead.id, 'backward')}
                                  className="p-1 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                                  title="Переместить назад"
                                >
                                  <ArrowLeft className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {col.key !== 'paid' && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveLead(lead.id, 'forward')}
                                  className="px-2 py-1 bg-stone-900 hover:bg-black text-white text-[10px] font-bold rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Переместить на следующий этап"
                                >
                                  <span>Далее</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: PROPERTY UPLOAD VIA FORM */}
      {adminTab === 'upload_form' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-stone-900">Загрузка объекта: Заполнение анкеты</h3>
              <p className="text-xs text-stone-500">
                Заполните параметры квартиры, чтобы она мгновенно появилась в свайп-ленте пользователей Rentch
              </p>
            </div>
          </div>

          {formSuccessMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 mb-6">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{formSuccessMessage}</span>
            </div>
          )}

          <form onSubmit={handleCreateApartmentFromForm} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Раздел города *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {RENTCH_CITIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setFormCity(c.id);
                        const dList = getDistrictsForCity(c.id);
                        setFormDistrict(dList[0]);
                      }}
                      className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        formCity === c.id
                          ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                      }`}
                    >
                      <span>{c.flag}</span>
                      <span>{c.nameRu}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Название объявления *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Например: Стильная видовая евротрешка с панорамой"
                  required
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Район ({CITIES_CONFIG[formCity].nameRu}) *
                </label>
                <select
                  value={formDistrict}
                  onChange={(e) => setFormDistrict(e.target.value as CityDistrict)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {getDistrictsForCity(formCity).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Адрес (улица, номер) *
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="пр. Чавчавадзе, 42"
                  required
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Стоимость аренды в месяц *
                  </label>
                  <span className="text-[11px] text-stone-400">
                    Курс: 1 $ ≈ 2.72 ₾
                  </span>
                </div>

                <div className="flex rounded-2xl border border-stone-200 bg-stone-50 overflow-hidden focus-within:ring-2 focus-within:ring-rose-500 focus-within:border-transparent transition-all">
                  {/* Currency selector toggle: USD or GEL */}
                  <div className="flex p-1 bg-stone-200/70 border-r border-stone-200 gap-1 items-center flex-shrink-0">
                    <button
                      type="button"
                      id="form-currency-usd-btn"
                      onClick={() => handleFormCurrencyChange('USD')}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                        formCurrency === 'USD'
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                      }`}
                      title="Выбрать доллары США"
                    >
                      <span>$ USD</span>
                      <span className="text-[10px] font-normal opacity-90 hidden sm:inline">(Доллары)</span>
                    </button>
                    <button
                      type="button"
                      id="form-currency-gel-btn"
                      onClick={() => handleFormCurrencyChange('GEL')}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                        formCurrency === 'GEL'
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                      }`}
                      title="Выбрать грузинские лари"
                    >
                      <span>₾ GEL</span>
                      <span className="text-[10px] font-normal opacity-90 hidden sm:inline">(Лари)</span>
                    </button>
                  </div>

                  {/* Input field */}
                  <div className="relative flex-1 flex items-center">
                    <span className="pl-3.5 pr-1 text-sm font-bold text-stone-400 select-none">
                      {formCurrency === 'USD' ? '$' : '₾'}
                    </span>
                    <input
                      type="number"
                      id="form-price-input"
                      value={formPriceAmount || ''}
                      onChange={(e) => setFormPriceAmount(Math.max(0, Number(e.target.value)))}
                      min={formCurrency === 'USD' ? 50 : 150}
                      max={formCurrency === 'USD' ? 20000 : 60000}
                      required
                      placeholder={formCurrency === 'USD' ? '750' : '2000'}
                      className="w-full bg-transparent py-2.5 pr-4 text-xs font-bold text-stone-900 focus:outline-none"
                    />
                    <span className="pr-3 text-[11px] font-semibold text-stone-400 select-none flex-shrink-0">
                      / месяц
                    </span>
                  </div>
                </div>

                {/* Conversion helper banner & presets */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] px-1 pt-0.5">
                  <div className="flex items-center gap-1.5 text-stone-600 font-medium">
                    <span className="text-stone-400">Эквивалент:</span>
                    <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                      {formCurrency === 'USD'
                        ? `≈ ${Math.round(formPriceAmount * 2.72).toLocaleString('ru-RU')} ₾ (Лари)`
                        : `≈ $${Math.round(formPriceAmount / 2.72).toLocaleString('ru-RU')} USD (Доллары)`
                      }
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-stone-400 mr-0.5">Быстро:</span>
                    {formCurrency === 'USD' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setFormPriceAmount(500)}
                          className="px-1.5 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px] font-semibold cursor-pointer transition"
                        >
                          $500
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormPriceAmount(750)}
                          className="px-1.5 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px] font-semibold cursor-pointer transition"
                        >
                          $750
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormPriceAmount(1000)}
                          className="px-1.5 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px] font-semibold cursor-pointer transition"
                        >
                          $1000
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormPriceAmount(1400)}
                          className="px-1.5 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px] font-semibold cursor-pointer transition"
                        >
                          $1400
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setFormPriceAmount(1400)}
                          className="px-1.5 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px] font-semibold cursor-pointer transition"
                        >
                          1400 ₾
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormPriceAmount(2000)}
                          className="px-1.5 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px] font-semibold cursor-pointer transition"
                        >
                          2000 ₾
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormPriceAmount(2700)}
                          className="px-1.5 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px] font-semibold cursor-pointer transition"
                        >
                          2700 ₾
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormPriceAmount(4000)}
                          className="px-1.5 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px] font-semibold cursor-pointer transition"
                        >
                          4000 ₾
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Метро / Ориентир
                </label>
                <input
                  type="text"
                  value={formMetro}
                  onChange={(e) => setFormMetro(e.target.value)}
                  placeholder="м. Руставели (5 мин пешком)"
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Комнат
                  </label>
                  <input
                    type="number"
                    value={formRooms}
                    onChange={(e) => setFormRooms(Number(e.target.value))}
                    min={1}
                    max={10}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Площадь (м²)
                  </label>
                  <input
                    type="number"
                    value={formAreaSqm}
                    onChange={(e) => setFormAreaSqm(Number(e.target.value))}
                    min={15}
                    max={500}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Мебель
                  </label>
                  <select
                    value={formFurniture}
                    onChange={(e) => setFormFurniture(e.target.value as FurnitureStatus)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2 py-2 text-xs"
                  >
                    <option value="full">С мебелью</option>
                    <option value="partial">Частично</option>
                    <option value="none">Без мебели</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Питомцы
                  </label>
                  <select
                    value={formPetPolicy}
                    onChange={(e) => setFormPetPolicy(e.target.value as PetPolicy)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2 py-2 text-xs"
                  >
                    <option value="allowed">Разрешены</option>
                    <option value="cats_only">Только кошки</option>
                    <option value="dogs_only">Только собаки</option>
                    <option value="no_pets">Без животных</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                        Фотографии объекта ({formImages.length})
                      </label>
                      {formImages.length > 0 && (
                        <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          {formImages.length} фото
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Добавляйте фото <strong>по одной</strong> с устройства/галереи, перетаскивайте или загружайте ZIP-архивом
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    {/* Primary Button: Add photos one-by-one or multiple from device */}
                    <label
                      id="form-add-photo-btn"
                      className="inline-flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Добавить фото</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            handleAddPhotosFromFiles(e.target.files);
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>

                    {/* Secondary: ZIP archive option */}
                    <label
                      id="form-upload-zip-btn"
                      className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
                      title="Распаковать архив с множеством фото сразу"
                    >
                      <Archive className="w-3.5 h-3.5 text-stone-500" />
                      <span className="hidden sm:inline">ZIP-архив</span>
                      <input
                        type="file"
                        accept=".zip,application/zip,application/x-zip-compressed"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadFormZip(file);
                        }}
                      />
                    </label>

                    {formImages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormImages([])}
                        className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg text-xs transition cursor-pointer"
                        title="Очистить все добавленные фото"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Notice / Progress */}
                {(formZipNotice || isReadingFormImages) && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                    {isFormZipExtracting || isReadingFormImages ? (
                      <Clock className="w-4 h-4 text-amber-600 animate-spin flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    )}
                    <span>{formZipNotice || 'Загрузка и оптимизация фото...'}</span>
                  </div>
                )}

                {/* Dropzone & Photo Gallery Grid */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFormImages(true);
                  }}
                  onDragLeave={() => setIsDraggingFormImages(false)}
                  onDrop={handleFormPhotosDrop}
                  className={`p-3.5 rounded-2xl border-2 transition-all ${
                    isDraggingFormImages
                      ? 'border-rose-500 bg-rose-50/60 ring-4 ring-rose-500/10'
                      : 'border-stone-200 bg-stone-50/50'
                  }`}
                >
                  {formImages.length === 0 ? (
                    <label className="flex flex-col items-center justify-center p-8 text-center cursor-pointer group">
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-stone-900">
                        Нажмите, чтобы добавить первую фотографию квартиры
                      </p>
                      <p className="text-[11px] text-stone-500 mt-1 max-w-sm">
                        Выбирайте фотографии <strong>по одной</strong> или сразу несколько. Поддерживаются JPG, PNG, WEBP, а также перетаскивание файлов.
                      </p>
                      <span className="mt-3.5 inline-flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs">
                        <Plus className="w-4 h-4" />
                        Выбрать фото с устройства
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            handleAddPhotosFromFiles(e.target.files);
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                      {formImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className={`relative rounded-xl overflow-hidden aspect-4/3 bg-stone-900 border transition-all shadow-2xs group ${
                            idx === 0 ? 'ring-2 ring-rose-500 border-rose-500' : 'border-stone-200'
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Фото ${idx + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className={`absolute top-1 left-1 text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs ${
                            idx === 0 ? 'bg-rose-500 text-white' : 'bg-stone-950/70 text-white'
                          }`}>
                            {idx === 0 ? '★ Обложка' : `#${idx + 1}`}
                          </div>

                          <div className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = formImages.filter((_, i) => i !== idx);
                                  setFormImages(updated);
                                }}
                                className="bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-md cursor-pointer transition shadow"
                                title="Удалить это фото"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between gap-1">
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...formImages];
                                    const [moved] = updated.splice(idx, 1);
                                    updated.splice(idx - 1, 0, moved);
                                    setFormImages(updated);
                                  }}
                                  className="bg-white/90 hover:bg-white text-stone-900 p-1 rounded shadow cursor-pointer"
                                  title="Переместить влево"
                                >
                                  <ArrowLeft className="w-3 h-3" />
                                </button>
                              )}

                              {idx !== 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...formImages];
                                    const [moved] = updated.splice(idx, 1);
                                    updated.unshift(moved);
                                    setFormImages(updated);
                                  }}
                                  className="flex-1 bg-white/95 hover:bg-white text-stone-900 text-[9px] font-bold py-1 px-1 rounded shadow cursor-pointer text-center truncate"
                                  title="Сделать главной обложкой"
                                >
                                  Обложка
                                </button>
                              )}

                              {idx < formImages.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...formImages];
                                    const [moved] = updated.splice(idx, 1);
                                    updated.splice(idx + 1, 0, moved);
                                    setFormImages(updated);
                                  }}
                                  className="bg-white/90 hover:bg-white text-stone-900 p-1 rounded shadow cursor-pointer ml-auto"
                                  title="Переместить вправо"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Dedicated interactive tile in grid to add next photo one by one */}
                      <label
                        id="form-grid-add-one-more-photo"
                        className="relative rounded-xl border-2 border-dashed border-stone-300 hover:border-rose-500 hover:bg-rose-50/50 aspect-4/3 flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-all group"
                        title="Добавить ещё одну фотографию"
                      >
                        <div className="w-8 h-8 rounded-xl bg-stone-100 group-hover:bg-rose-100 text-stone-500 group-hover:text-rose-600 flex items-center justify-center transition-colors">
                          <Plus className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-bold text-stone-700 group-hover:text-rose-600 mt-1">
                          + Ещё фото
                        </span>
                        <span className="text-[9px] text-stone-400">по одной</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) {
                              handleAddPhotosFromFiles(e.target.files);
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Add photo by URL */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formNewImageUrl}
                    onChange={(e) => setFormNewImageUrl(e.target.value)}
                    placeholder="Или вставьте ссылку на ещё одно фото (https://...)..."
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (formNewImageUrl.trim()) {
                        setFormImages((prev) => [...prev, formNewImageUrl.trim()]);
                        setFormNewImageUrl('');
                      }
                    }}
                    className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors"
                  >
                    Добавить по ссылке
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Описание
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  placeholder="Особенности квартиры, вид из окна, техника..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <button
              type="submit"
              id="submit-property-form-btn"
              className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold py-3.5 px-6 rounded-2xl text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Опубликовать объект в базу Rentch</span>
            </button>
          </form>
        </div>
      )}

      {/* SECTION 3: PROPERTY UPLOAD VIA ZIP ARCHIVE OR PDF FILE */}
      {adminTab === 'upload_pdf' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 via-rose-600 to-amber-500 text-white flex items-center justify-center shadow-xs">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-stone-900">Загрузка объекта: ZIP-архив с фото или PDF</h3>
              <p className="text-xs text-stone-500">
                Загрузите архив с фотографиями (.zip) или презентацию (.pdf). Система распакует все фото по отдельности, прогрузит их в карточку объекта, извлечёт параметры и предложит клиентам в свайпах!
              </p>
            </div>
          </div>

          {pdfError && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>{pdfError}</span>
            </div>
          )}

          {pdfSuccessMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{pdfSuccessMessage}</span>
            </div>
          )}

          {/* Success State & Apartment Preview */}
          {pdfSuccessApartment && (
            <div className="p-6 rounded-3xl bg-emerald-50/90 border border-emerald-200 space-y-4 animate-in fade-in">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-emerald-900">Объект успешно опубликован в Rentch!</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Карточка с {pdfSuccessApartment.images.length} отдельными фотографиями, ценой и описанием размещена в общей базе и сразу доступна клиентам для свайпов и записи на просмотр.
                  </p>
                </div>
              </div>

              {/* Apartment Preview Card */}
              <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-full sm:w-48 h-36 rounded-xl overflow-hidden bg-stone-900 flex-shrink-0 relative">
                  <img
                    src={pdfSuccessApartment.images[0]}
                    alt={pdfSuccessApartment.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-stone-950/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-rose-400" />
                    <span>{pdfSuccessApartment.images.length} фото</span>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-rose-600 text-white text-xs font-black px-2 py-0.5 rounded-lg">
                    ${pdfSuccessApartment.priceUsd} / мес
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
                    {pdfSuccessApartment.district}
                  </div>
                  <h5 className="font-bold text-sm text-stone-900 leading-snug">
                    {pdfSuccessApartment.title}
                  </h5>
                  <div className="flex flex-wrap gap-2 text-xs text-stone-600">
                    <span className="font-semibold">{pdfSuccessApartment.rooms}-комн.</span>
                    <span>•</span>
                    <span>{pdfSuccessApartment.areaSqm} м²</span>
                    <span>•</span>
                    <span className="truncate">{pdfSuccessApartment.address}</span>
                  </div>
                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                    {pdfSuccessApartment.description}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2.5 pt-1">
                {onSwitchToSwipe && (
                  <button
                    type="button"
                    id="view-client-swipes-btn"
                    onClick={() => {
                      onSwitchToSwipe();
                      onClose();
                    }}
                    className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Посмотреть в свайпах (как видит клиент)</span>
                  </button>
                )}

                {onViewApartment && (
                  <button
                    type="button"
                    id="view-apartment-modal-btn"
                    onClick={() => {
                      onViewApartment(pdfSuccessApartment);
                    }}
                    className="bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 text-stone-500" />
                    <span>Открыть подробную карточку</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setPdfSuccessApartment(null);
                    setPdfExtractedData(null);
                    setSelectedUploadFile(null);
                    setPdfSuccessMessage('');
                  }}
                  className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Загрузить ещё объект
                </button>
              </div>
            </div>
          )}

          {/* Drag and Drop Zone for ZIP & PDF */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingPdf(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDraggingPdf(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingPdf(false);
              const file = e.dataTransfer.files?.[0];
              if (file) {
                handleProcessArchiveOrPdfFile(file);
              }
            }}
            className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
              isDraggingPdf 
                ? 'border-rose-500 bg-rose-50/60 scale-[1.01]' 
                : 'border-stone-300 hover:border-rose-400 bg-stone-50/50'
            }`}
          >
            <div className="flex justify-center items-center gap-2 mb-3">
              <Archive className={`w-10 h-10 transition-colors ${isDraggingPdf ? 'text-rose-500' : 'text-amber-500'}`} />
              <FileText className={`w-10 h-10 transition-colors ${isDraggingPdf ? 'text-rose-500' : 'text-rose-400'}`} />
            </div>
            <h4 className="font-bold text-sm text-stone-800">
              {isDraggingPdf ? 'Отпустите архив или PDF для загрузки' : 'Перетащите ZIP-архив с фото или PDF-презентацию сюда'}
            </h4>
            <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
              Поддерживаются ZIP-архивы с фото комнат (.zip) и PDF-презентации (.pdf). Система автоматически распакует все фотографии по отдельности!
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <label className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-xs cursor-pointer transition-colors inline-flex items-center gap-2">
                <Archive className="w-4 h-4" />
                <span>Выбрать ZIP-архив с фото (.zip)</span>
                <input
                  type="file"
                  accept=".zip,application/zip,application/x-zip-compressed"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleProcessArchiveOrPdfFile(file);
                  }}
                />
              </label>

              <label className="bg-stone-900 hover:bg-black text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-xs cursor-pointer transition-colors inline-flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Выбрать PDF-файл (.pdf)</span>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleProcessArchiveOrPdfFile(file);
                  }}
                />
              </label>
            </div>
          </div>

          {/* Loading Indicator */}
          {isPdfProcessing && (
            <div className="p-8 rounded-3xl bg-stone-50 border border-stone-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6 animate-spin" />
              </div>
              <div className="text-sm font-bold text-stone-800">
                {pdfProcessingStep || 'Обработка и распаковка файла...'}
              </div>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Система распаковывает архив, извлекает все фотографии по отдельности, распознаёт параметры и формирует карточку объекта для клиентов.
              </p>
            </div>
          )}

          {/* Extracted Metadata Card & Individual Photos Gallery */}
          {pdfExtractedData && !isPdfProcessing && (
            <div className="bg-stone-50/70 rounded-3xl p-6 border border-stone-200 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h4 className="font-black text-sm text-stone-900">
                      {pdfExtractedData.sourceType === 'zip' ? '📦 Извлечено из ZIP-архива' : '📄 Извлечено из PDF-файла'}: {pdfExtractedData.extractedFile}
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Все фотографии по отдельности прогружены в карточку. Проверьте или скорректируйте данные перед публикацией клиентам
                    </p>
                  </div>
                </div>
                <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{pdfExtractedData.images.length} фото готово</span>
                </span>
              </div>

              {/* Extracted Individual Photos Gallery */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-rose-500" />
                      <span>Фотографии объекта по отдельности ({pdfExtractedData.images.length})</span>
                    </label>
                    <p className="text-[11px] text-stone-400">
                      Первое фото — обложка карточки. Клиенты смогут листать все эти фото в карусели свайпа.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    {/* Add photo one by one or multiple from device */}
                    <label
                      id="pdf-add-photo-one-by-one"
                      className="inline-flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Добавить фото</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            handleAddPhotosToExtractedPdf(e.target.files);
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>

                    {/* Add more photos from ZIP button */}
                    <label className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer">
                      <Archive className="w-3.5 h-3.5 text-stone-500" />
                      <span className="hidden sm:inline">ZIP-архив</span>
                      <input
                        type="file"
                        accept=".zip,application/zip,application/x-zip-compressed"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const res = await parseZipArchive(file);
                              if (res.imageUrls.length > 0) {
                                setPdfExtractedData({
                                  ...pdfExtractedData,
                                  images: [...pdfExtractedData.images, ...res.imageUrls],
                                  zipFileNames: [...(pdfExtractedData.zipFileNames || []), ...res.images.map((img) => img.name)],
                                });
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {pdfExtractedData.images.map((imgUrl, idx) => {
                    const fileName = pdfExtractedData.zipFileNames?.[idx];
                    return (
                      <div key={idx} className="relative rounded-2xl overflow-hidden aspect-4/3 bg-stone-900 border border-stone-200 group shadow-2xs">
                        <img
                          src={imgUrl}
                          alt={`Фото ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Photo index / cover badge */}
                        <div className="absolute top-1.5 left-1.5 bg-stone-950/75 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          {idx === 0 ? (
                            <span className="text-amber-400 font-black">★ Обложка</span>
                          ) : (
                            <span>#{idx + 1}</span>
                          )}
                        </div>

                        {/* Filename caption if extracted from zip */}
                        {fileName && (
                          <div className="absolute bottom-0 inset-x-0 bg-stone-950/80 backdrop-blur-xs text-stone-200 text-[9px] px-2 py-1 truncate">
                            {fileName}
                          </div>
                        )}

                        {/* Hover action overlay */}
                        <div className="absolute inset-0 bg-stone-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...pdfExtractedData.images];
                                const [moved] = updated.splice(idx, 1);
                                updated.unshift(moved);
                                const updatedNames = pdfExtractedData.zipFileNames ? [...pdfExtractedData.zipFileNames] : undefined;
                                if (updatedNames) {
                                  const [movedName] = updatedNames.splice(idx, 1);
                                  updatedNames.unshift(movedName);
                                }
                                setPdfExtractedData({
                                  ...pdfExtractedData,
                                  images: updated,
                                  zipFileNames: updatedNames,
                                });
                              }}
                              className="bg-white/95 hover:bg-white text-stone-900 text-[10px] font-bold px-2 py-1 rounded-md shadow cursor-pointer transition"
                              title="Сделать главной обложкой карточки"
                            >
                              Сделать обложкой
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...pdfExtractedData.images];
                              updated.splice(idx, 1);
                              const updatedNames = pdfExtractedData.zipFileNames ? [...pdfExtractedData.zipFileNames] : undefined;
                              if (updatedNames) {
                                updatedNames.splice(idx, 1);
                              }
                              setPdfExtractedData({
                                ...pdfExtractedData,
                                images: updated.length > 0 ? updated : ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'],
                                zipFileNames: updatedNames,
                              });
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-md cursor-pointer transition"
                            title="Удалить это фото"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Dedicated card to add photo one by one */}
                  <label
                    id="pdf-grid-add-one-more-photo"
                    className="relative rounded-2xl border-2 border-dashed border-stone-300 hover:border-rose-500 hover:bg-rose-50/50 aspect-4/3 flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-stone-100 group-hover:bg-rose-100 text-stone-500 group-hover:text-rose-600 flex items-center justify-center transition-colors">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-stone-700 group-hover:text-rose-600 mt-1.5">
                      + Добавить фото
                    </span>
                    <span className="text-[10px] text-stone-400">по одной</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          handleAddPhotosToExtractedPdf(e.target.files);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Add photo by URL */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="url"
                    placeholder="Добавить ещё ссылку на фото (Unsplash, CDN)..."
                    value={newPhotoUrlInput}
                    onChange={(e) => setNewPhotoUrlInput(e.target.value)}
                    className="flex-1 bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-900"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newPhotoUrlInput.trim()) {
                        setPdfExtractedData({
                          ...pdfExtractedData,
                          images: [...pdfExtractedData.images, newPhotoUrlInput.trim()]
                        });
                        setNewPhotoUrlInput('');
                      }
                    }}
                    className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer transition-colors"
                  >
                    Добавить фото
                  </button>
                </div>
              </div>

              {/* Form fields for extracted details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Название объекта
                  </label>
                  <input
                    type="text"
                    value={pdfExtractedData.title}
                    onChange={(e) => setPdfExtractedData({ ...pdfExtractedData, title: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 font-medium text-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Стоимость ($ / месяц)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-rose-500 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      value={pdfExtractedData.priceUsd}
                      onChange={(e) => setPdfExtractedData({ ...pdfExtractedData, priceUsd: Number(e.target.value) || 0 })}
                      className="w-full bg-white border border-stone-200 rounded-xl pl-8 pr-3 py-2 font-bold text-rose-600 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Район Тбилиси
                  </label>
                  <select
                    value={pdfExtractedData.district}
                    onChange={(e) => setPdfExtractedData({ ...pdfExtractedData, district: e.target.value as TbilisiDistrict })}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 font-medium text-stone-900"
                  >
                    {TBILISI_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Точный адрес
                  </label>
                  <input
                    type="text"
                    value={pdfExtractedData.address}
                    onChange={(e) => setPdfExtractedData({ ...pdfExtractedData, address: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 font-medium text-stone-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Комнат
                    </label>
                    <input
                      type="number"
                      value={pdfExtractedData.rooms}
                      onChange={(e) => setPdfExtractedData({ ...pdfExtractedData, rooms: Number(e.target.value) || 1 })}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Площадь (м²)
                    </label>
                    <input
                      type="number"
                      value={pdfExtractedData.areaSqm}
                      onChange={(e) => setPdfExtractedData({ ...pdfExtractedData, areaSqm: Number(e.target.value) || 20 })}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-stone-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Мебель
                    </label>
                    <select
                      value={pdfExtractedData.furniture}
                      onChange={(e) => setPdfExtractedData({ ...pdfExtractedData, furniture: e.target.value as FurnitureStatus })}
                      className="w-full bg-white border border-stone-200 rounded-xl px-2.5 py-2 text-stone-900"
                    >
                      <option value="full">С мебелью</option>
                      <option value="partial">Частично</option>
                      <option value="none">Без мебели</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Питомцы
                    </label>
                    <select
                      value={pdfExtractedData.petPolicy}
                      onChange={(e) => setPdfExtractedData({ ...pdfExtractedData, petPolicy: e.target.value as PetPolicy })}
                      className="w-full bg-white border border-stone-200 rounded-xl px-2.5 py-2 text-stone-900"
                    >
                      <option value="allowed">Разрешены</option>
                      <option value="cats_only">Только кошки</option>
                      <option value="dogs_only">Только собаки</option>
                      <option value="no_pets">Без животных</option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Описание объекта для клиентов (извлечено из PDF)
                  </label>
                  <textarea
                    rows={4}
                    value={pdfExtractedData.description}
                    onChange={(e) => setPdfExtractedData({ ...pdfExtractedData, description: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-xl p-3 text-stone-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Описание преимуществ, ремонта, техники и инфраструктуры..."
                  />
                </div>
              </div>

              {/* Raw Extracted Text Viewer Toggle */}
              {pdfExtractedData.rawTextPreview && (
                <div className="border-t border-stone-200 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowRawText(!showRawText)}
                    className="text-[11px] font-semibold text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showRawText ? 'Скрыть исходный текст из PDF' : 'Показать распознанный исходный текст из PDF'}</span>
                    <ChevronRightIcon className={`w-3.5 h-3.5 transition-transform ${showRawText ? 'rotate-90' : ''}`} />
                  </button>
                  {showRawText && (
                    <pre className="mt-2 p-3 bg-white rounded-xl border border-stone-200 text-[10px] text-stone-600 overflow-x-auto whitespace-pre-wrap max-h-40 font-mono">
                      {pdfExtractedData.rawTextPreview}
                    </pre>
                  )}
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="button"
                id="import-pdf-to-rentch-btn"
                onClick={handleImportPdfApartment}
                className="w-full bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold py-4 px-6 rounded-2xl text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>Разместить в карточки и предложить клиентам</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* SECTION: MYHOME.GE IMPORT */}
      {adminTab === 'myhome' && (
        <MyHomeImportTab
          onAddApartment={onAddApartment}
          onRefreshCatalog={onRefreshCatalog}
          onSuccessSwitchToCatalog={() => setAdminTab('catalog')}
        />
      )}

      {/* SECTION: HALOOGLASI.COM BELGRADE IMPORT */}
      {adminTab === 'halooglasi' && (
        <HaloOglasiImportTab
          onAddApartment={onAddApartment}
          onRefreshCatalog={onRefreshCatalog}
          onSuccessSwitchToCatalog={() => {
            setCatalogCityFilter('belgrade');
            setAdminTab('catalog');
          }}
        />
      )}

      {/* SECTION 4: CATALOG LIST */}
      {adminTab === 'catalog' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-stone-900">Каталог объектов в сервисе ({apartments.length})</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                  ● Онлайн-синхронизация
                </span>
              </div>
              <p className="text-xs text-stone-500">Все активные квартиры, доступные клиентам в приложении</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                id="deep-parse-200-catalog-btn"
                onClick={handleDeepParseMyHome200}
                disabled={isDeepParsingMyHome}
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-60"
                title="Глубокий парсинг до 200 новых квартир из каталога MyHome.ge"
              >
                {isDeepParsingMyHome ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{isDeepParsingMyHome ? 'Парсинг 200 объектов...' : '⚡ +200 новых с MyHome'}</span>
              </button>

              <button
                type="button"
                id="translate-all-btn"
                onClick={handleTranslateCatalog}
                disabled={isTranslatingCatalog}
                className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Автоматически перевести все названия, адреса и описания на русский язык"
              >
                {isTranslatingCatalog ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Languages className="w-3.5 h-3.5" />
                )}
                <span>{isTranslatingCatalog ? 'Перевод...' : 'Перевести на русский'}</span>
              </button>

              {onRefreshCatalog && (
                <button
                  type="button"
                  id="refresh-catalog-btn"
                  onClick={onRefreshCatalog}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Подтянуть свежие объекты с сервера"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Обновить</span>
                </button>
              )}
              {apartments.length > 0 && (
                <button
                  type="button"
                  id="clear-all-apartments-btn"
                  onClick={() => setIsDeleteAllAptsOpen(true)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Удалить все</span>
                </button>
              )}
            </div>
          </div>

          {/* City Section Filter Tabs in Admin Catalog */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {[
              { id: 'all' as const, label: `Все города (${apartments.length})` },
              ...RENTCH_CITIES.map((c) => ({
                id: c.id,
                label: `${c.flag} ${c.nameRu} (${apartments.filter((a) => getApartmentCity(a) === c.id).length})`,
              })),
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCatalogCityFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  catalogCityFilter === tab.id
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Catalog Toast */}
          {catalogZipToast && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{catalogZipToast}</span>
            </div>
          )}

          {apartments.length === 0 ? (
            <div className="bg-stone-50 border border-dashed border-stone-200 rounded-3xl p-10 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-3">
                <Home className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-stone-800">Каталог пуст</h4>
              <p className="text-xs text-stone-500 max-w-sm mt-1 mb-4">
                Все тестовые объекты удалены. Загрузите реальные квартиры через ZIP-архив с фото или PDF либо заполните анкету вручную.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdminTab('upload_pdf')}
                  className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Загрузить ZIP с фото / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab('upload_form')}
                  className="bg-stone-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow-xs"
                >
                  Заполнить анкету
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {apartments
                .filter((apt) => catalogCityFilter === 'all' || getApartmentCity(apt) === catalogCityFilter)
                .map((apt) => (
                <div key={apt.id} className="border border-stone-200 rounded-2xl overflow-hidden p-3 flex gap-3 bg-stone-50/50 hover:shadow-xs transition">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-stone-900">
                    <img
                      src={apt.images[0]}
                      alt={apt.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 left-1 bg-stone-950/80 text-white text-[9px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5">
                      <ImageIcon className="w-2.5 h-2.5 text-rose-400" />
                      <span>{apt.images.length}</span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col justify-between">
                    <div>
                      <h4
                        onClick={() => onViewApartment?.(apt)}
                        className="font-bold text-xs text-stone-900 truncate cursor-pointer hover:text-rose-600 transition-colors"
                      >
                        {apt.title}
                      </h4>
                      <p className="text-[11px] text-stone-500 truncate">{apt.district} • {apt.address}</p>
                      <div className="text-xs font-black text-rose-600 mt-0.5">
                        {apt.currency === 'EUR' || apt.city === 'belgrade'
                          ? `€${apt.originalPrice || apt.priceUsd}/мес`
                          : apt.currency === 'GEL'
                          ? `${apt.priceGel || Math.round(apt.priceUsd * 2.72)} ₾ (~$${apt.priceUsd})/мес`
                          : `$${apt.priceUsd} (~${apt.priceGel || Math.round(apt.priceUsd * 2.72)} ₾)/мес`}
                      </div>
                      {(() => {
                        const myhomeUrl = getMyHomeOriginalUrl(apt);
                        if (!myhomeUrl) return null;
                        const isHalo = myhomeUrl.includes('halooglasi.com') || String(apt.id).startsWith('halo-');
                        return (
                          <a
                            href={myhomeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 hover:underline"
                            title={isHalo ? 'Открыть оригинал на HaloOglasi.com' : 'Открыть оригинал на MyHome.ge'}
                          >
                            <Globe className="w-3 h-3" />
                            <span>{isHalo ? 'Оригинал в HaloOglasi' : 'Оригинал в MyHome'}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        );
                      })()}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1">
                      <span>{apt.rooms} комн. • {apt.areaSqm} м²</span>
                      <div className="flex items-center gap-1">
                        <label className="text-stone-600 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg cursor-pointer transition flex items-center gap-1 border border-stone-200 hover:border-rose-200 text-[10px] font-bold" title="Загрузить ZIP-архив с фото для этого объекта">
                          <Archive className="w-3 h-3 text-rose-500" />
                          <span>+ZIP</span>
                          <input
                            type="file"
                            accept=".zip,application/zip,application/x-zip-compressed"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUpdateApartmentPhotosFromZip(apt, file);
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRequestDeleteApartment(apt)}
                          className="text-stone-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg cursor-pointer transition"
                          title="Удалить объект"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 5: PWA APPLICATION GENERATOR & SETTINGS */}
      {adminTab === 'pwa' && (
        <AdminPwaSection />
      )}

      {/* SECTION 6: SECURITY AUDIT LOG, BACKUP RESTORE & HOSTING GUIDE */}
      {adminTab === 'security' && (
        <div className="space-y-5">
          {securityToast && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{securityToast}</span>
            </div>
          )}

          {/* Security Status & Active Protections */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-stone-900">
                    Центр безопасности и журнал входов в админ-панель
                  </h3>
                  <p className="text-xs text-stone-500">
                    Контроль доступа, защита от взлома и резервное копирование лидов и свайпов
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRestoreLeadsBackup}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Восстановить лиды из резервной копии</span>
                </button>
                <button
                  type="button"
                  onClick={fetchAuditLog}
                  className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Обновить журнал</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Серверные 256-bit токены</span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-1">
                  Пароль удалён из клиентского кода и проверяется только на сервере (`crypto.timingSafeEqual`).
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Анти-Брутфорс защита</span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-1">
                  Блокировка IP-адреса на 15 минут после 5 неудачных попыток подбора пароля.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Защита API и Авто-Бэкап</span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-1">
                  Удаление лидов и объектов закрыто токеном. Лид от Родиона и свайпы вправо защищены в резервной копии.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Защита от SSRF и XSS</span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-1">
                  Фильтрация внутренних IP-адресов при скачивании фото и экранирование HTML при импорте.
                </p>
              </div>
            </div>

            {/* Active Admin Sessions */}
            {activeAdminSessions.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Активные авторизованные сессии администратора ({activeAdminSessions.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {activeAdminSessions.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="font-bold text-stone-900">{s.deviceSummary}</p>
                        <p className="text-[11px] text-stone-500">IP: {s.ip} • Вход: {s.createdAt}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                        Активна
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Log Table */}
            <div className="pt-2">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Журнал всех входов и событий безопасности ({auditEntries.length})
              </h4>
              <div className="overflow-x-auto rounded-2xl border border-stone-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-100 text-stone-600 border-b border-stone-200">
                      <th className="py-2.5 px-3 font-bold">Дата и время</th>
                      <th className="py-2.5 px-3 font-bold">Событие</th>
                      <th className="py-2.5 px-3 font-bold">Устройство / Браузер</th>
                      <th className="py-2.5 px-3 font-bold">IP-адрес</th>
                      <th className="py-2.5 px-3 font-bold">Подробности</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 bg-white">
                    {auditEntries.map((item) => (
                      <tr key={item.id} className="hover:bg-stone-50/80">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-stone-600 whitespace-nowrap">
                          {item.timestamp}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'success'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'danger'
                                ? 'bg-rose-100 text-rose-800'
                                : item.status === 'warning'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {item.event === 'login_success'
                              ? '✓ Вход в админ-панель'
                              : item.event === 'login_failed'
                              ? '⚠ Отказ в доступе'
                              : item.event === 'blocked_brute_force'
                              ? '⛔ Блокировка IP'
                              : item.event === 'restore_backup'
                              ? '↺ Восстановление базы'
                              : item.event === 'delete_lead'
                              ? 'Удаление лида'
                              : item.event === 'security_init'
                              ? '🛡️ Защита включена'
                              : item.event}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-stone-800 whitespace-nowrap">
                          {item.deviceSummary}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-stone-600 whitespace-nowrap">
                          {item.ip}
                        </td>
                        <td className="py-2.5 px-3 text-stone-700">{item.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Step-by-Step Guide: How to Host & Connect a Real Custom Domain */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-stone-900 text-white flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-stone-900">
                  Инструкция: как разместить Rentch на своём домене и хостинге
                </h3>
                <p className="text-xs text-stone-500">
                  Пошаговое руководство для запуска на реальном домене (например, rentch.ge / rentch.com)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-stone-900 text-white text-[10px] font-bold">
                  ШАГ 1 • ХОСТИНГ
                </span>
                <h4 className="font-bold text-stone-900 text-sm">
                  Выбор хостинга с поддержкой Node.js
                </h4>
                <p className="text-stone-600 leading-relaxed">
                  Проект состоит из фронтенда (React/Vite) и единого сервера (Express в <code>server.ts</code>) с файловой базой в папке <code>/data</code>. Лучшие варианты:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-stone-700 font-medium">
                  <li><strong>Railway.app</strong> или <strong>Render.com</strong> — подключение через GitHub в 2 клика (поддерживают постоянный диск Volume для папки <code>/data</code>).</li>
                  <li><strong>Google Cloud Run</strong> — прямо из AI Studio (кнопка Deploy в правом верхнем углу).</li>
                  <li><strong>VPS (Timeweb Cloud / Hetzner / DigitalOcean)</strong> — Ubuntu 22.04 + Node.js 20 + PM2 (данные в <code>/data</code> хранятся прямо на диске сервера).</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                  ШАГ 2 • ПОКУПКА И ПРИВЯЗКА ДОМЕНА
                </span>
                <h4 className="font-bold text-stone-900 text-sm">
                  Подключение реального домена и SSL (HTTPS)
                </h4>
                <ol className="list-decimal pl-4 space-y-1.5 text-stone-700">
                  <li>Купите домен у регистратора (Namecheap, Cloudflare, GoDaddy, REG.RU или nic.ge для зоны <code>.ge</code>).</li>
                  <li>В панели хостинга (Railway / Render / Cloud Run) откройте <strong>Settings → Custom Domains</strong> и введите ваш домен.</li>
                  <li>У регистратора домена в разделе <strong>DNS</strong> добавьте выданную запись:
                    <br />• <code>A-запись</code> (`@`) → IP вашего сервера
                    <br />• <code>CNAME</code> (`www`) → адрес хостинга
                  </li>
                  <li>Бесплатный сертификат <strong>HTTPS (Let’s Encrypt)</strong> выпустится автоматически за 2–5 минут.</li>
                </ol>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                  ШАГ 3 • ПЕРЕМЕННЫЕ И TELEGRAM
                </span>
                <h4 className="font-bold text-stone-900 text-sm">
                  Команды запуска и переменные окружения
                </h4>
                <p className="text-stone-600 leading-relaxed">
                  В настройках хостинга укажите:
                </p>
                <div className="bg-stone-900 text-stone-100 p-2.5 rounded-xl font-mono text-[11px] space-y-1">
                  <div>Build: npm install &amp;&amp; npm run build</div>
                  <div>Start: npx tsx server.ts</div>
                  <div>ADMIN_EMAIL=ai9292@mail.ru</div>
                  <div>ADMIN_PASSWORD=ваш_пароль</div>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  После привязки домена откройте вкладку <strong>«PWA-приложение»</strong> и укажите новый домен для кнопки в Telegram-боте (`@BotFather`).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for adding manual CRM lead */}
      {isAddLeadModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-stone-200 shadow-2xl space-y-4">
            <h3 className="font-black text-base text-stone-900">Добавить клиента в CRM</h3>

            <form onSubmit={handleCreateLead} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Имя клиента *
                </label>
                <input
                  type="text"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  placeholder="Введите имя клиента"
                  required
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Телефон *
                </label>
                <input
                  type="tel"
                  value={newLeadPhone}
                  onChange={(e) => setNewLeadPhone(e.target.value)}
                  placeholder="Введите номер телефона"
                  required
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Telegram
                </label>
                <input
                  type="text"
                  value={newLeadTelegram}
                  onChange={(e) => setNewLeadTelegram(e.target.value)}
                  placeholder="@username"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Этап в канбане
                </label>
                <select
                  value={newLeadStage}
                  onChange={(e) => setNewLeadStage(e.target.value as CrmStage)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900"
                >
                  <option value="registered">Зарегистрировались в сервисе</option>
                  <option value="viewing_scheduled">Записались на осмотр</option>
                  <option value="viewing_done_thinking">Сделали осмотр, думают</option>
                  <option value="paid">Оплатили</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Заметка
                </label>
                <textarea
                  value={newLeadNotes}
                  onChange={(e) => setNewLeadNotes(e.target.value)}
                  rows={2}
                  placeholder="Бюджет, предпочтения..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddLeadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold"
                >
                  Создать лид
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal 1: Delete Single Lead */}
      {leadToDelete && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-stone-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-stone-900">Удалить клиента из CRM?</h3>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                Вы действительно хотите удалить клиента <strong className="text-stone-800">{leadToDelete.clientName}</strong> ({leadToDelete.clientPhone}) из воронки?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLeadToDelete(null)}
                className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteLead}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-xs cursor-pointer"
              >
                Да, удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal 2: Clear All Leads */}
      {isDeleteAllLeadsOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-stone-200 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">Очистить всю базу клиентов?</h3>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                Все клиенты ({leads.length}) будут безвозвратно удалены из всех 4-х этапов воронки CRM.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteAllLeadsOpen(false)}
                className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAllLeads}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer"
              >
                Удалить всех
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal 3: Delete Single Apartment */}
      {aptToDelete && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-stone-200 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">Удалить объект?</h3>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                Квартира «<strong className="text-stone-800">{aptToDelete.title}</strong>» будет удалена из ленты свайпов, каталога и карты.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAptToDelete(null)}
                className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteApartment}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal 4: Clear All Apartments */}
      {isDeleteAllAptsOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-stone-200 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">Удалить все объекты?</h3>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                Все {apartments.length} объектов будут удалены. База будет пуста, пока вы не загрузите новые объекты через PDF или анкету.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteAllAptsOpen(false)}
                className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAllApartments}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer"
              >
                Удалить все
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: CRM Lead Chat Modal for Administrator */}
      {activeChatLead && (
        <div
          id="crm-lead-chat-modal"
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
          onClick={() => setActiveChatLeadId(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-2xl h-[88vh] sm:h-[82vh] border border-stone-200 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Chat Header */}
            <div className="bg-stone-900 text-white p-4 sm:px-6 flex items-center justify-between gap-3 border-b border-stone-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-black text-base flex items-center justify-center flex-shrink-0 shadow-md">
                  {activeChatLead.clientName ? activeChatLead.clientName.charAt(0).toUpperCase() : 'К'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm sm:text-base text-white truncate">
                      {activeChatLead.clientName}
                    </h3>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                      CRM Клиент
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-stone-300 mt-0.5 flex-wrap">
                    <a
                      href={`tel:${activeChatLead.clientPhone}`}
                      className="hover:text-rose-400 flex items-center gap-1 transition-colors"
                    >
                      <Phone className="w-3 h-3 text-emerald-400" />
                      <span>{activeChatLead.clientPhone}</span>
                    </a>
                    {activeChatLead.clientTelegram && (
                      <a
                        href={`https://t.me/${activeChatLead.clientTelegram.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-400 hover:underline font-medium"
                      >
                        @{activeChatLead.clientTelegram.replace(/^@/, '')}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Stage Switcher inside Chat */}
                <select
                  value={activeChatLead.stage}
                  onChange={(e) => {
                    const nextStage = e.target.value as CrmStage;
                    onUpdateLeads(
                      leads.map((l) => (l.id === activeChatLead.id ? { ...l, stage: nextStage } : l))
                    );
                  }}
                  className="hidden sm:block bg-stone-800 border border-stone-700 text-white text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {STAGES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.title}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setActiveChatLeadId(null)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Client Context Bar (Apartment / Viewing / Questionnaire) */}
            <div className="bg-stone-100 border-b border-stone-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                {activeChatLead.apartmentTitle ? (
                  <>
                    <span
                      onClick={() => {
                        const apt = apartments.find((a) => a.id === activeChatLead.apartmentId);
                        if (apt && onViewApartment) onViewApartment(apt);
                      }}
                      className="inline-flex items-center gap-1.5 font-bold text-stone-800 bg-white px-2.5 py-1 rounded-xl border border-stone-200 cursor-pointer hover:border-rose-300 transition-colors"
                    >
                      <Home className="w-3.5 h-3.5 text-rose-500" />
                      <span>{activeChatLead.apartmentTitle}</span>
                      {activeChatLead.apartmentPriceUsd && (
                        <span className="text-rose-600">(${activeChatLead.apartmentPriceUsd}/мес)</span>
                      )}
                    </span>
                    {(() => {
                      const linkedApt = apartments.find((a) => a.id === activeChatLead.apartmentId);
                      const myhomeUrl =
                        activeChatLead.apartmentSourceUrl ||
                        getMyHomeOriginalUrl(
                          linkedApt || { id: activeChatLead.apartmentId, title: activeChatLead.apartmentTitle }
                        );
                      if (!myhomeUrl) return null;
                      return (
                        <a
                          href={myhomeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-xl border border-rose-200 transition-colors"
                          title="Открыть оригинальную публикацию в MyHome"
                        >
                          <Globe className="w-3.5 h-3.5 text-rose-600" />
                          <span>Оригинал в MyHome</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      );
                    })()}
                  </>
                ) : (
                  <span className="text-stone-500 font-medium">
                    Прямой диалог с клиентом из CRM
                  </span>
                )}

                {activeChatLead.viewingSlot && (
                  <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>Осмотр: {activeChatLead.viewingSlot.date} в {activeChatLead.viewingSlot.time}</span>
                  </span>
                )}
              </div>

              {activeChatLead.questionnaireSummary && (
                <div className="text-[11px] text-stone-600">
                  Район: <strong>{activeChatLead.questionnaireSummary.district}</strong> • Срок: <strong>{activeChatLead.questionnaireSummary.period}</strong>
                </div>
              )}
            </div>

            {/* Messages History */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-stone-50">
              {(() => {
                const msgs = getLeadMessages(activeChatLead);
                if (msgs.length === 0) {
                  return (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                      <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-3 border border-rose-100">
                        <MessageSquare className="w-7 h-7" />
                      </div>
                      <h4 className="font-bold text-sm text-stone-900">
                        Начните переписку с клиентом {activeChatLead.clientName}
                      </h4>
                      <p className="text-xs text-stone-500 mt-1 max-w-sm">
                        Все отправленные отсюда сообщения мгновенно отображаются у клиента в разделе «Диалоги» и в чате объекта.
                      </p>
                    </div>
                  );
                }

                return msgs.map((msg) => {
                  const isAdminMsg = msg.sender === 'landlord';
                  const isBotMsg = msg.sender === 'bot';

                  if (isAdminMsg) {
                    return (
                      <div key={msg.id} className="flex items-start justify-end gap-2.5">
                        <div className="bg-stone-900 text-white rounded-3xl rounded-tr-xs p-3.5 sm:p-4 shadow-xs text-xs sm:text-sm max-w-lg">
                          <div className="flex items-center justify-end gap-2 mb-1">
                            <span className="text-[10px] text-stone-400">{msg.timestamp}</span>
                            <span className="font-bold text-rose-400 text-xs">
                              {msg.senderName || 'Вы (Администратор)'}
                            </span>
                          </div>
                          <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                        </div>
                        <div className="w-8 h-8 rounded-2xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-black shadow-xs">
                          A
                        </div>
                      </div>
                    );
                  }

                  if (isBotMsg) {
                    return (
                      <div key={msg.id} className="flex items-start gap-2.5 max-w-lg">
                        <div className="w-8 h-8 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-xs p-3 text-xs text-stone-600">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-amber-700 text-[11px]">Авто-бот Rentch</span>
                            <span className="text-[10px] text-stone-400">{msg.timestamp}</span>
                          </div>
                          <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                        </div>
                      </div>
                    );
                  }

                  // Client message
                  return (
                    <div key={msg.id} className="flex items-start gap-2.5 max-w-lg">
                      <div className="w-8 h-8 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                        {activeChatLead.clientName ? activeChatLead.clientName.charAt(0).toUpperCase() : 'К'}
                      </div>
                      <div className="bg-white border border-rose-200 rounded-3xl rounded-tl-xs p-3.5 sm:p-4 shadow-xs text-xs sm:text-sm text-stone-900">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-rose-600 text-xs">
                            {activeChatLead.clientName}
                          </span>
                          <span className="text-[10px] text-stone-400">{msg.timestamp}</span>
                        </div>
                        <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Admin Message Input Form */}
            <form
              onSubmit={handleSendAdminMessageSubmit}
              className="p-3 sm:p-4 bg-white border-t border-stone-200 flex items-center gap-2"
            >
              <input
                type="text"
                id="admin-crm-chat-input"
                value={adminChatInput}
                onChange={(e) => setAdminChatInput(e.target.value)}
                placeholder={`Написать сообщение клиенту ${activeChatLead.clientName}...`}
                className="flex-1 bg-stone-100 border border-stone-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <button
                type="submit"
                id="admin-crm-chat-send-btn"
                disabled={!adminChatInput.trim()}
                className="px-4 h-10 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer flex-shrink-0 shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Отправить</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
