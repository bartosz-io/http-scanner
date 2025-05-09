import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DeleteConfirmationModalProps } from '../../types/reportTypes';

/**
 * DeleteConfirmationModal component for confirming report deletion
 */
export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  errorMessage,
  isSubmitting
}) => {
  const [token, setToken] = React.useState('');

  // Handle token input change
  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToken(e.target.value);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(token);
  };

  // Reset token when modal is closed
  React.useEffect(() => {
    if (!isOpen) {
      setToken('');
    }
  }, [isOpen]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Report</AlertDialogTitle>
          <AlertDialogDescription>
            To confirm deletion, please enter the delete token that was provided when this report was created.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deleteToken">Delete Token</Label>
              <Input
                id="deleteToken"
                placeholder="Enter the 32-character delete token"
                value={token}
                onChange={handleTokenChange}
                required
                pattern="^[0-9a-f]{32}$"
                autoComplete="off"
                className={errorMessage ? 'border-red-500' : ''}
              />
              {errorMessage && (
                <p className="text-sm text-red-500">{errorMessage}</p>
              )}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={isSubmitting || token.length !== 32}>
              {isSubmitting ? 'Deleting...' : 'Delete Report'}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};
