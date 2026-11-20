import { AlertCircle, FileAudio, FileVideo, ImageIcon, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { MAX_IMAGE_BYTES, MAX_UPLOAD_BYTES, MEDIA_ACCEPT, formatBytes } from "@/lib/media";

type DropzoneKind = "image" | "audio" | "video";

type FileDropzoneProps = {
  label: string;
  kind: DropzoneKind;
  file: File | null;
  onChange: (file: File | null) => void;
  existingUrl?: string;
  hint?: string;
  required?: boolean;
  className?: string;
};

const KIND_META: Record<DropzoneKind, { icon: typeof ImageIcon; title: string; subtitle: string }> = {
  image: { icon: ImageIcon, title: "Drop artwork here", subtitle: "PNG, JPG, WEBP or GIF • up to 10 MB" },
  audio: { icon: FileAudio, title: "Drop audio here", subtitle: "MP3, WAV, AAC, FLAC, M4A or OGG • up to 100 MB" },
  video: { icon: FileVideo, title: "Drop video here", subtitle: "MP4, WEBM or MOV • up to 100 MB" },
};

const EXTENSION_MATCH: Record<DropzoneKind, RegExp> = {
  image: /\.(png|jpe?g|webp|gif|avif)$/i,
  audio: /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|webm)$/i,
  video: /\.(mp4|webm|mov|m4v|ogv|mkv|avi)$/i,
};

const FileDropzone = ({ label, kind, file, onChange, existingUrl, hint, required, className }: FileDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const previewUrl = objectUrl || existingUrl || "";
  const meta = KIND_META[kind];
  const Icon = meta.icon;

  const acceptFile = (candidate?: File | null) => {
    if (!candidate) return;
    const typeMatches = candidate.type ? candidate.type.startsWith(`${kind}/`) : EXTENSION_MATCH[kind].test(candidate.name);
    if (!typeMatches) {
      setError(`Please choose a valid ${kind} file.`);
      return;
    }
    if (candidate.size > (kind === "image" ? MAX_IMAGE_BYTES : MAX_UPLOAD_BYTES)) {
      setError(`File is too large. Maximum size is ${formatBytes(kind === "image" ? MAX_IMAGE_BYTES : MAX_UPLOAD_BYTES)}.`);
      return;
    }
    setError(null);
    onChange(candidate);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-zinc-200">
          {label} {required && <span className="text-[#1ed760]">*</span>}
        </p>
        {file && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 transition-colors hover:text-red-300"
          >
            <X className="size-3" /> Remove
          </button>
        )}
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "group mt-2 cursor-pointer overflow-hidden rounded-xl border border-dashed transition-all outline-none focus-visible:border-[#1ed760]",
          dragging
            ? "border-[#1ed760] bg-[#1ed760]/10"
            : "border-white/15 bg-[#202020] hover:border-white/30 hover:bg-[#242424]",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={MEDIA_ACCEPT[kind]}
          className="hidden"
          onChange={(event) => {
            acceptFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        {kind === "image" && previewUrl ? (
          <div className="flex items-center gap-4 p-3">
            <img src={previewUrl} alt="Preview" className="size-20 shrink-0 rounded-lg object-cover ring-1 ring-white/10" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{file ? file.name : "Current artwork"}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{file ? formatBytes(file.size) : "Click or drop a new image to replace it"}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#1ed760]">
                <UploadCloud className="size-3.5" /> {file ? "Change image" : "Replace artwork"}
              </p>
            </div>
          </div>
        ) : previewUrl && (kind === "audio" || kind === "video") ? (
          <div className="space-y-3 p-3">
            {kind === "video" ? (
              <div onClick={(event) => event.stopPropagation()}>
                <video src={previewUrl} controls preload="metadata" className="max-h-52 w-full rounded-lg bg-black object-contain" />
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg bg-black/30 p-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#1ed760]/15 text-[#1ed760]">
                  <FileAudio className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{file ? file.name : "Current audio"}</p>
                  <p className="text-xs text-zinc-500">{file ? formatBytes(file.size) : "Uploaded audio file"}</p>
                </div>
              </div>
            )}
            {kind === "audio" && (
              <div onClick={(event) => event.stopPropagation()}>
                <audio src={previewUrl} controls preload="metadata" className="h-9 w-full" />
              </div>
            )}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                inputRef.current?.click();
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#1ed760]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#1ed760] transition-colors hover:bg-[#1ed760]/20"
            >
              <UploadCloud className="size-3.5" /> Replace file
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 px-5 py-7 text-center">
            <div
              className={cn(
                "grid size-11 place-items-center rounded-full transition-colors",
                dragging ? "bg-[#1ed760] text-black" : "bg-white/[0.06] text-zinc-400 group-hover:text-[#1ed760]",
              )}
            >
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{meta.title}</p>
              <p className="mt-0.5 text-[11px] text-zinc-500">{meta.subtitle}</p>
            </div>
            <span className="mt-1 rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-bold text-zinc-300">Browse files</span>
          </div>
        )}
      </div>

      {hint && !error && <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">{hint}</p>}
      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-red-400">
          <AlertCircle className="size-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
};

export default FileDropzone;
