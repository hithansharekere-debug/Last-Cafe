import React, { createContext, useContext, useState, type ReactNode } from 'react';

export type ScreenType = 'welcome' | 'cafe' | 'table' | 'discover' | 'puzzle' | 'profile';

interface NavigationContextType {
  currentScreen: ScreenType;
  navigateTo: (screen: ScreenType) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({ 
  children, 
  initialScreen = 'welcome' 
}: { 
  children: ReactNode; 
  initialScreen?: ScreenType;
}) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>(initialScreen);

  const navigateTo = (screen: ScreenType) => {
    setCurrentScreen(screen);
  };

  return (
    <NavigationContext.Provider value={{ currentScreen, navigateTo }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
