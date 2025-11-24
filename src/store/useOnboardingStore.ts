import { create } from 'zustand';

interface OnboardingState {
  currentStep: number;
  walletConnected: boolean;
  startupName: string;
  description: string;
  tAddress: string;
  zAddress: string;
  isPrivate: boolean;
  setStep: (step: number) => void;
  setWalletConnected: (connected: boolean) => void;
  setStartupDetails: (details: Partial<OnboardingState>) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 1,
  walletConnected: false,
  startupName: '',
  description: '',
  tAddress: '',
  zAddress: '',
  isPrivate: true,
  setStep: (step) => set({ currentStep: step }),
  setWalletConnected: (connected) => set({ walletConnected: connected }),
  setStartupDetails: (details) => set((state) => ({ ...state, ...details })),
}));
