import { useState } from 'react';
import { ScanFormViewModel, ScanRequestDTO, ScanResponseDTO } from '../types';

/**
 * Custom hook for handling scan form operations
 * Designed to work with React Hook Form
 */
export const useScanForm = () => {
  const [formState, setFormState] = useState<ScanFormViewModel>({
    url: '',
    isValid: false,
    isSubmitting: false
  });
  
  /**
   * Submits a scan request with the provided URL
   * @param url The URL to scan
   * @returns Promise with scan response or void
   */
  const submitScan = async (url: string): Promise<ScanResponseDTO | void> => {
    if (!url || !url.trim()) {
      return;
    }
    
    setFormState((prev) => ({
      ...prev,
      url,
      isSubmitting: true,
      errorMessage: undefined
    }));
    
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url
        } as ScanRequestDTO)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const error = new Error(errorData.message || 'Failed to scan URL');
        error.cause = { code: errorData.code };
        throw error;
      }
      
      const scanResponse: ScanResponseDTO = await response.json();
      
      setFormState((prev) => ({
        ...prev,
        isSubmitting: false,
        scanResponse
      }));
      
      return scanResponse;
    } catch (error) {
      const typedError = error as Error & { cause?: { code?: string } };
      setFormState((prev) => ({
        ...prev,
        isSubmitting: false,
        errorMessage: typedError.message || 'An error occurred while scanning the URL',
        errorCode: typedError.cause?.code
      }));
      throw typedError;
    }
  };
  
  /**
   * Resets the form state
   */
  const resetForm = (): void => {
    setFormState({
      url: '',
      isValid: false,
      isSubmitting: false
    });
  };
  
  return { 
    formState, 
    submitScan, 
    resetForm 
  };
};
