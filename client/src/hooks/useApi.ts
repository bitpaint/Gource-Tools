import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiResponse } from '../types';

/**
 * Custom hook for managing API calls with state handling
 * @param apiFunc - Function that makes the API call
 * @param immediate - Whether to call the API immediately
 * @returns [state, fetchData, setData] - Current state, fetch function, and setter
 */
export const useApi = <T>(
  apiFunc: () => Promise<{ data: T }>,
  immediate = false
): [
  ApiResponse<T>,
  () => Promise<T | undefined>,
  (data: T) => void
] => {
  const [state, setState] = useState<ApiResponse<T>>({
    data: undefined,
    loading: false,
    error: undefined
  });
  
  const isMountedRef = useRef(true);
  
  // Clean up mounted ref on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Create a stable fetch function
  const fetchData = useCallback(async () => {
    try {
      if (isMountedRef.current) {
        setState((prevState: ApiResponse<T>) => ({ ...prevState, loading: true, error: undefined }));
      }
      
      // Use the stable reference to the API function
      const result = await apiFunc();
      
      if (isMountedRef.current) {
        setState({
          data: result.data,
          loading: false,
          error: undefined
        });
      }
      
      return result.data;
    } catch (error) {
      if (isMountedRef.current) {
        setState({
          data: undefined,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      return undefined;
    }
  }, [apiFunc]);
  
  // Create a setter function to update data manually
  const setData = useCallback((data: T) => {
    if (isMountedRef.current) {
      setState({
        data,
        loading: false,
        error: undefined
      });
    }
  }, []);
  
  // Call the API immediately if requested
  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, fetchData]);
  
  return [state, fetchData, setData];
};

export default useApi; 