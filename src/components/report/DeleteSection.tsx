import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DeleteSectionProps } from '../../types/reportTypes';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { useReportDelete } from '../../hooks/useReportDelete';

/**
 * DeleteSection component for deleting a report
 */
export const DeleteSection: React.FC<DeleteSectionProps> = ({ hash }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { deleteReport, isDeleting, deleteError } = useReportDelete(hash);
  
  // Open delete confirmation modal
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };
  
  // Close delete confirmation modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  // Handle delete confirmation
  const handleConfirmDelete = (token: string) => {
    deleteReport(token);
  };
  
  return (
    <div className="mt-8">
      <div className="border rounded-md">
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-medium">Delete this report</h3>
              <p className="text-sm text-muted-foreground">
                Once deleted, this report will no longer be accessible.
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={handleOpenModal}
              className="md:self-end"
            >
              Delete Report
            </Button>
          </div>
        </div>
      </div>
      
      <DeleteConfirmationModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        errorMessage={deleteError}
        isSubmitting={isDeleting}
      />
    </div>
  );
};
