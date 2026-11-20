import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
};

const Modal = ({ open, onClose, title, children, className }: ModalProps) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#181818] p-6 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-200",
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;