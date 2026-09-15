import { create } from 'zustand';

import type { CountryDto } from '../api/types';

export const GLOBAL_COUNTRY: CountryDto = { code: 'GLOBAL', name: 'Global', flagEmoji: '🌐', isFeatured: true };

interface ClubsFilterState {
  /** Country chip shared by the Explore and Hot tabs. */
  country: CountryDto;
  setCountry: (country: CountryDto) => void;
}

export const useClubsFilterStore = create<ClubsFilterState>(set => ({
  country: GLOBAL_COUNTRY,
  setCountry: country => set({ country }),
}));
