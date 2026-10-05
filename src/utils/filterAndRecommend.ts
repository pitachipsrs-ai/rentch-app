import { Apartment, FilterState, QuestionnaireAnswers } from '../types';
import { getAccurateApartmentDistrict, getApartmentCity } from './districtUtils';

export const CENTRAL_TBILISI_DISTRICTS: string[] = [
  'Ваке (Vake)',
  'Вера (Vera)',
  'Мтацминда (Mtatsminda)',
  'Старый Тбилиси / Сололаки',
  'Чугурети / Марджанишвили',
  // Yerevan central districts
  'Кентрон / Центр (Kentron)',
  'Арабкир (Arabkir)',
  // Belgrade central districts
  'Стари Град / Дорчол (Stari Grad / Dorćol)',
  'Врачар (Vračar)',
  'Нови Београд (Novi Beograd)',
  'Савски Венац / Belgrade Waterfront',
];

export function isCenterDistrict(district: string): boolean {
  if (!district) return false;
  return CENTRAL_TBILISI_DISTRICTS.includes(district);
}

export function isDateRangeOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA < endB && endA > startB;
}

export function filterAndRecommendApartments(
  apartments: Apartment[],
  filters: FilterState,
  questionnaire?: QuestionnaireAnswers
): Apartment[] {
  const activeCity = filters.city || 'tbilisi';
  const category = filters.rentalCategory || 'long_term';

  return apartments
    // Step 1: Hard filters
    .filter((apt) => {
      // 0. Rental Category filter: Daily vs Long-term vs Double Rentch
      if (category === 'daily') {
        if (apt.rentalType !== 'daily') {
          return false;
        }

        // Daily availability check based on selected dates
        if (filters.checkInDate && filters.checkOutDate) {
          const inDate = filters.checkInDate;
          const outDate = filters.checkOutDate;
          if (Array.isArray(apt.bookedRanges) && apt.bookedRanges.length > 0) {
            const hasConflict = apt.bookedRanges.some((range) =>
              isDateRangeOverlapping(inDate, outDate, range.startDate, range.endDate)
            );
            if (hasConflict) {
              return false; // Occupied on selected dates!
            }
          }
        }

        // Daily guests count filter
        if (filters.guestsCount && apt.maxGuests && apt.maxGuests < filters.guestsCount) {
          return false;
        }
      } else if (category === 'long_term') {
        if (apt.rentalType === 'daily') {
          return false;
        }
      } else if (category === 'double_rentch') {
        if (apt.rentalType === 'daily') {
          return false;
        }
      }

      // City section filter (Tbilisi / Yerevan / Belgrade)
      const aptCity = getApartmentCity(apt);
      if (aptCity !== activeCity) {
        return false;
      }

      // Budget filter (skip or adapt for daily if daily mode)
      if (category !== 'daily') {
        if (apt.priceUsd < filters.minPrice || apt.priceUsd > filters.maxPrice) {
          return false;
        }
      } else {
        // Daily price per night filter if active
        const pricePerNight = apt.pricePerNight || Math.round(apt.priceUsd / 30);
        if (pricePerNight < 10) return false;
      }

      // Furniture filter
      if (filters.furniture !== 'any' && apt.furniture !== filters.furniture) {
        return false;
      }

      // District filter from drawer or quick filters
      const aptTrueDistrict = getAccurateApartmentDistrict(apt);
      if (filters.district === 'center') {
        if (!isCenterDistrict(aptTrueDistrict) && !isCenterDistrict(apt.district)) {
          return false;
        }
      } else if (filters.district !== 'all' && aptTrueDistrict !== filters.district && apt.district !== filters.district) {
        return false;
      }

      // Period filter from drawer
      if (filters.period !== 'any' && apt.minPeriod !== filters.period) {
        return false;
      }

      // Pet-friendly filter
      if (filters.petFriendlyOnly && apt.petPolicy === 'no_pets') {
        return false;
      }

      // Questionnaire strict criteria
      if (questionnaire) {
        // If user has pets and apartment forbids pets
        if (questionnaire.hasPets !== 'none') {
          if (apt.petPolicy === 'no_pets') return false;
          if (questionnaire.hasPets === 'dog' && apt.petPolicy === 'cats_only') return false;
          if (questionnaire.hasPets === 'cat' && apt.petPolicy === 'dogs_only') return false;
        }

        // People count constraint
        if (questionnaire.peopleCount > apt.maxResidents) {
          return false;
        }

        // Specific district from questionnaire if not set to 'all'
        if (questionnaire.preferredDistrict !== 'all' && filters.district === 'all') {
          // If preferred district is set in questionnaire, prioritize or filter
          // Let's prioritize via scoring below or allow same
        }
      }

      return true;
    })
    // Step 2: Scoring & Sorting based on Questionnaire compatibility
    .sort((a, b) => {
      if (!questionnaire) return 0;

      let scoreA = 0;
      let scoreB = 0;

      // 1. District preference bonus (+100)
      if (questionnaire.preferredDistrict !== 'all') {
        if (a.district === questionnaire.preferredDistrict) scoreA += 100;
        if (b.district === questionnaire.preferredDistrict) scoreB += 100;
      }

      // 2. Period compatibility bonus (+40)
      if (questionnaire.period === a.minPeriod) scoreA += 40;
      if (questionnaire.period === b.minPeriod) scoreB += 40;

      // 3. Pet-friendly bonus (+30)
      if (questionnaire.hasPets !== 'none') {
        if (a.petPolicy === 'allowed') scoreA += 30;
        if (b.petPolicy === 'allowed') scoreB += 30;
      }

      // 4. Rating bonus
      scoreA += a.landlord.rating * 5;
      scoreB += b.landlord.rating * 5;

      return scoreB - scoreA;
    });
}
