import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SettingState {
  handle: string;
  title: string;
  variantTitle: string;
  sku: string;
  metal: string;
  shape: string;
  price: number;
  image?: string;
  ringSize?: string;
  engraving?: string;
  prongType?: string;
}

export interface DiamondState {
  id: string;
  shape: string;
  carat: number;
  color: string;
  clarity: string;
  cut?: string;
  polish?: string;
  symmetry?: string;
  fluorescence?: string;
  price: number;
  image?: string;
  video?: string;
  certificate?: string;
  lab?: string;
  length?: number;
  width?: number;
  depth?: number;
}

export interface BuilderState {
  startWith: 'setting' | 'diamond' | null;
  setting: SettingState | null;
  diamond: DiamondState | null;
  
  setStartWith: (startWith: 'setting' | 'diamond') => void;
  setSetting: (setting: SettingState) => void;
  setSettingDetails: (details: { ringSize?: string; engraving?: string; prongType?: string }) => void;
  setDiamond: (diamond: DiamondState) => void;
  clearSetting: () => void;
  clearDiamond: () => void;
  resetBuilder: () => void;
}

export const useBuilderStore = create<BuilderState>()(
  persist(
    (set) => ({
      startWith: null,
      setting: null,
      diamond: null,
      
      setStartWith: (startWith) => set({ startWith }),
      setSetting: (setting) => set({ setting }),
      setSettingDetails: (details) => set((state) => ({ 
        setting: state.setting ? { ...state.setting, ...details } : null 
      })),
      setDiamond: (diamond) => set({ diamond }),
      clearSetting: () => set({ setting: null }),
      clearDiamond: () => set({ diamond: null }),
      resetBuilder: () => set({ startWith: null, setting: null, diamond: null })
    }),
    {
      name: 'southern-star-builder'
    }
  )
);
