import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProjectCategory } from '../services/projectService';

export type PrivacyMode = 'private' | 'public' | 'monetizable';

interface ProjectData {
  name: string;
  description: string;
  category: ProjectCategory;
  website_url?: string;
}

interface WalletData {
  address: string;
  label: string;
  privacy_mode: PrivacyMode;
}

interface OnboardingState {
  currentStep: number;
  projectData: Partial<ProjectData>;
  walletData: Partial<WalletData>;
  createdProjectId: string | null;
  createdWalletId: string | null;
  
  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateProjectData: (data: Partial<ProjectData>) => void;
  updateWalletData: (data: Partial<WalletData>) => void;
  setCreatedProjectId: (id: string) => void;
  setCreatedWalletId: (id: string) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 1,
  projectData: {},
  walletData: {
    privacy_mode: 'private' as PrivacyMode,
  },
  createdProjectId: null,
  createdWalletId: null,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setStep: (step) => set({ currentStep: step }),
      
      nextStep: () => set((state) => ({ 
        currentStep: Math.min(state.currentStep + 1, 3) 
      })),
      
      previousStep: () => set((state) => ({ 
        currentStep: Math.max(state.currentStep - 1, 1) 
      })),
      
      updateProjectData: (data) => set((state) => ({
        projectData: { ...state.projectData, ...data }
      })),
      
      updateWalletData: (data) => set((state) => ({
        walletData: { ...state.walletData, ...data }
      })),
      
      setCreatedProjectId: (id) => set({ createdProjectId: id }),
      
      setCreatedWalletId: (id) => set({ createdWalletId: id }),
      
      reset: () => set(initialState),
    }),
    {
      name: 'onboarding-storage',
      partialize: (state) => ({
        currentStep: state.currentStep,
        projectData: state.projectData,
        walletData: state.walletData,
        createdProjectId: state.createdProjectId,
        createdWalletId: state.createdWalletId,
      }),
    }
  )
);
