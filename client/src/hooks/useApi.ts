import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiResponse } from '../services/api';

/**
 * Hook personnalisé pour gérer les appels API avec gestion d'état
 */
export function useApi<T>(
  apiFunction: () => Promise<any>,
  immediate: boolean = true,
  dependencies: any[] = []
): [ApiResponse<T>, () => Promise<any>, boolean] {
  const [state, setState] = useState<ApiResponse<T>>({
    data: undefined,
    loading: immediate,
    error: undefined,
  });
  
  // Utiliser useRef pour conserver une référence stable à la fonction API
  // et pour suivre si le hook est monté
  const apiFunctionRef = useRef(apiFunction);
  const isMountedRef = useRef(true);
  const hasInitialFetchOccurredRef = useRef(false);
  
  // Mettre à jour la référence uniquement si la fonction change
  useEffect(() => {
    apiFunctionRef.current = apiFunction;
  }, [apiFunction]);
  
  // Nettoyer la référence de montage lorsque le composant est démonté
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async (): Promise<any> => {
    try {
      if (isMountedRef.current) {
        setState(prevState => ({ ...prevState, loading: true, error: undefined }));
      }
      
      // Utiliser la référence stable à la fonction API
      console.log('Exécution d\'un appel API');
      const response = await apiFunctionRef.current();
      
      if (isMountedRef.current) {
        setState({ data: response.data, loading: false, error: undefined });
        console.log('Appel API réussi:', response.data);
      }
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      if (isMountedRef.current) {
        setState({ data: undefined, loading: false, error: errorMessage });
        console.error('Erreur dans l\'appel API:', errorMessage);
      }
      
      throw error;
    }
  }, []);

  useEffect(() => {
    // Exécuter l'appel API uniquement si:
    // 1. Le chargement immédiat est demandé
    // 2. Ce n'est pas le premier rendu ou les dépendances ont changé
    // 3. Le composant est monté
    if (immediate && isMountedRef.current) {
      // Si c'est le premier chargement ou si les dépendances ont changé
      if (!hasInitialFetchOccurredRef.current || dependencies.length > 0) {
        console.log('Exécution automatique de l\'appel API');
        execute().catch(error => {
          console.error('Erreur dans le hook useApi:', error);
        });
        
        // Marquer que le premier fetch a eu lieu
        hasInitialFetchOccurredRef.current = true;
      }
    }
  }, [execute, immediate, ...dependencies]);

  // Retourner l'état, la fonction d'exécution, et un drapeau indiquant si c'est le premier chargement
  return [state, execute, hasInitialFetchOccurredRef.current];
}

export default useApi; 