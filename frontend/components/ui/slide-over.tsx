import { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode; // 👈 This is missing in your current version
}

export default function SlideOver({ open, onClose, title, children }: SlideOverProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg sm:translate-x-0 sm:animate-slide-in-from-right w-full">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">{children}</div> {/* ✅ Injects passed content */}
      </DialogContent>
    </Dialog>
  );
}
