import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ScanResponseDTO } from '../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Search } from 'lucide-react';
import { useScanForm } from '../hooks/useScanForm';


interface ScanFormProps {
  onScanSuccess: (response: ScanResponseDTO) => void;
  onScanStart: () => void;
  onScanError: (error: Error & { cause?: { code?: string } }) => void;
}

// Function to ensure URL has HTTPS prefix
const ensureHttpsPrefix = (url: string): string => {
  if (!url) return url;
  url = url.trim();
  
  // If URL already has a protocol, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Add https:// prefix
  return `https://${url}`;
};

// Zod schema for form validation following clean architecture principles
const formSchema = z.object({
  url: z.string()
    .min(1, { message: 'URL is required' })
    .max(2048, { message: 'URL is too long (max 2048 characters)' })
    .transform(ensureHttpsPrefix) // Add HTTPS prefix if missing
    .refine(
      (value) => {
        try {
          const url = new URL(value);
          return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
          return false;
        }
      },
      { message: 'Please enter a valid URL' }
    ),
});

export const ScanForm: React.FC<ScanFormProps> = ({ 
  onScanSuccess, 
  onScanStart,
  onScanError 
}: ScanFormProps) => {
  // Use both React Hook Form for UI validation and useScanForm for API interaction
  const { submitScan, resetForm: resetScanForm } = useScanForm();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
    },
    mode: 'onChange', // Validate on change for better user experience
  });



  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    onScanStart();
    
    try {
      // URL already has HTTPS prefix added by the transform function in the schema
      const scanResponse = await submitScan(values.url);
      
      // Handle successful scan
      if (scanResponse) {
        onScanSuccess(scanResponse);
      }
    } catch (error) {
      // Handle errors from the hook
      const typedError = error as Error & { cause?: { code?: string } };
      onScanError(typedError);
    } finally {
      // Reset both form states
      form.reset();
      resetScanForm();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input 
                    placeholder="example.com" 
                    {...field} 
                    className="h-12 transition-all focus-visible:ring-primary"
                    aria-label="Enter website URL to scan"
                  />
                </FormControl>
                <FormMessage className="text-sm font-medium text-destructive mt-1" />
              </FormItem>
            )}
          />
          <Button 
            type="submit" 
            className="h-12 px-8 transition-all"
            disabled={form.formState.isSubmitting || !form.formState.isValid}
          >
            <Search className="mr-2 h-4 w-4" />
            Scan Now
          </Button>
        </div>
      </form>
    </Form>
  );
};
