import { useState } from 'react';
import type { ScanFormViewModel, ScanRequestDTO, ScanResponseDTO } from '../types';
import { capturePostHogEvent } from '../lib/posthogClient';
import type { ScannerMode } from '../lib/reportView';

/**
 * Custom hook for handling scan form operations
 * Designed to work with React Hook Form
 */
export const useScanForm = (scannerMode: ScannerMode) => {
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

    capturePostHogEvent('scan submitted', { url, scanner_mode: scannerMode });

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
      capturePostHogEvent('scan failed', {
        url,
        scanner_mode: scannerMode,
        error_message: typedError.message,
        error_code: typedError.cause?.code,
      });
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
