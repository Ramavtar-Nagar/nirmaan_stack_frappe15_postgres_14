import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ContinueProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  onRestart: () => void;
}

export const ContinueProjectDialog = ({
  isOpen,
  onOpenChange,
  onContinue,
  onRestart,
}: ContinueProjectDialogProps) => {

  const handleContinue = () => {
    onContinue();
    onOpenChange(false);
  };

  const handleRestart = () => {
    onRestart();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>In-Progress Project Found</AlertDialogTitle>
          <AlertDialogDescription>
            You have a project creation that was not completed. Would you like to continue where you left off or restart with a new form?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-y-2 sm:gap-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleRestart}>
            Restart
          </Button>
          <Button onClick={handleContinue}>Continue</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};