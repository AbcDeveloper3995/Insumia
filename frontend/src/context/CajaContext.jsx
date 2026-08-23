import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { cajaService } from '../services/api/caja';

const CajaContext = createContext({});

export const CajaProvider = ({ children }) => {
  const { currentRestaurant, session } = useAuth();
  const [cajaActiva, setCajaActiva] = useState(null);
  const [isLoadingCaja, setIsLoadingCaja] = useState(true);

  const checkCaja = async () => {
    if (!session || !currentRestaurant?.id) {
      setCajaActiva(null);
      setIsLoadingCaja(false);
      return;
    }

    try {
      setIsLoadingCaja(true);
      const caja = await cajaService.getCajaAbierta(currentRestaurant.id);
      setCajaActiva(caja || null);
    } catch (error) {
      console.error('Error verificando caja:', error);
      setCajaActiva(null);
    } finally {
      setIsLoadingCaja(false);
    }
  };

  useEffect(() => {
    checkCaja();
  }, [currentRestaurant?.id, session]);

  return (
    <CajaContext.Provider value={{
      cajaActiva,
      isLoadingCaja,
      refreshCaja: checkCaja
    }}>
      {children}
    </CajaContext.Provider>
  );
};

export const useCaja = () => {
  return useContext(CajaContext);
};
