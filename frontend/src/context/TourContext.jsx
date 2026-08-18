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
    localStorage.setItem(`tour_seen_${tourKey}`, 'true');
  };

  // Cada página registra su tour al montarse
  const registerPageTour = (tourKey, steps) => {
    setActivePageTour({ tourKey, steps });
    
    const hasSeen = localStorage.getItem(`tour_seen_${tourKey}`);
    if (!hasSeen) {
      setTimeout(() => startTour(tourKey, steps), 500);
    } else {
      setRunTour(false);
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
    setRunTour(false);
  };

  const handleTourCallback = (data) => {
    const { status, action, type } = data;
    const finishedStatuses = ['finished', 'skipped'];
    
    if (finishedStatuses.includes(status) || action === 'close' || type === 'error' || type === 'tour:end') {
      setRunTour(false);
    }
  };

  return (
    <TourContext.Provider value={{ runTour, registerPageTour, startActivePageTour, clearActiveTour, tourSteps, handleTourCallback, hasActiveTour: !!activePageTour, tourId }}>
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => useContext(TourContext);
