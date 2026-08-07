import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/api/client';
import { authService } from '../services/auth/authService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFetchingRestaurants, setIsFetchingRestaurants] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [currentRestaurant, setCurrentRestaurant] = useState(null);

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchRestaurants();
      } else {
        setLoading(false);
        setIsFetchingRestaurants(false);
      }
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setIsFetchingRestaurants(true);
        fetchRestaurants();
      } else {
        setRestaurants([]);
        setCurrentRestaurant(null);
        localStorage.removeItem('currentRestaurantId');
        setLoading(false);
        setIsFetchingRestaurants(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const data = await authService.getMyRestaurants();
      setRestaurants(data || []);
      
      // Si hay un restaurante guardado en localStorage, usarlo
      const savedRest = localStorage.getItem('currentRestaurantId');
      if (savedRest && data?.find(r => r.id === savedRest)) {
        setCurrentRestaurant(data.find(r => r.id === savedRest));
      } else {
        setCurrentRestaurant(null);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
      setIsFetchingRestaurants(false);
    }
  };

  const selectRestaurant = (restaurant) => {
    setCurrentRestaurant(restaurant);
    if (restaurant) {
      localStorage.setItem('currentRestaurantId', restaurant.id);
    } else {
      localStorage.removeItem('currentRestaurantId');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      loading, 
      isFetchingRestaurants,
      restaurants, 
      currentRestaurant, 
      selectRestaurant,
      refreshRestaurants: fetchRestaurants
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
