import { createContext, useContext, useState, useEffect } from 'react';

const TourContext = createContext({});

export const TourProvider = ({ children }) => {
  const [runTour, setRunTour] = useState(false);
  const [tourSteps, setTourSteps] = useState([]);
  const [currentTourKey, setCurrentTourKey] = useState(null);
  const [activePageTour, setActivePageTour] = useState(null);
  const [tourId, setTourId] = useState(0);

  // Iniciar un tour explícitamente
  const startTour = (tourKey, steps) => {
    setCurrentTourKey(tourKey);
    setTourSteps(steps);
    setTourId(prev => prev + 1);
    setRunTour(true);
  };

  // Cada página registra su tour al montarse
  const registerPageTour = (tourKey, steps) => {
    setActivePageTour({ tourKey, steps });
    const hasSeen = localStorage.getItem(`tour_seen_${tourKey}`);
    if (!hasSeen) {
      // Pequeño timeout para asegurar que el DOM cargó
      setTimeout(() => startTour(tourKey, steps), 500);
    }
  };

  // Botón de ayuda manual (Sidebar)
  const startActivePageTour = () => {
    if (activePageTour) {
      startTour(activePageTour.tourKey, activePageTour.steps);
    }
  };

  const clearActiveTour = () => {
    setActivePageTour(null);
  };

  const handleTourCallback = (data) => {
    const { status, action } = data;
    const finishedStatuses = ['finished', 'skipped'];
    
    if (finishedStatuses.includes(status) || action === 'close') {
      setRunTour(false);
      if (currentTourKey) {
        localStorage.setItem(`tour_seen_${currentTourKey}`, 'true');
      }
    }
  };

  return (
    <TourContext.Provider value={{ runTour, registerPageTour, startActivePageTour, clearActiveTour, tourSteps, handleTourCallback, hasActiveTour: !!activePageTour, tourId }}>
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => useContext(TourContext);
