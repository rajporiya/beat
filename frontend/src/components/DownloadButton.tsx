import { useState } from "react";
import { Check, Download, Loader2, Lock, TriangleAlert } from "lucide-react";
import { axiosInstance } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { useSubscriptionStore } from "@/stores/useSubscriptionStore";
import { useUpgradeStore } from "@/stores/useUpgradeStore";
import type { PlanId } from "@/lib/plans";

export type DownloadKind = "song" | "podcast" | "video";

interface DownloadButtonProps {
  kind: DownloadKind;
  title: string;
  mediaUrl: string;
  label?: string;
  compactLabel?: string;
  variant?: "icon" | "pill" | "small";
  className?: string;
}

const REQUIRED_PLAN: Record<DownloadKind, PlanId> = {
  song: "premium",
  podcast: "pro",
  video: "pro",
};

const FEATURE_LABEL: Record<DownloadKind, string> = {
  song: "MP3 song downloads",
  podcast: "Podcast audio downloads",
  video: "Video episode downloads",
};

const PLAN_LABEL: Record<PlanId, string> = {
  free: "Normal",
  basic: "Basic",
  premium: "Premium",
  pro: "Pro",
};

const saveBlob = (blob: Blob, filename: string) => {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
};

const saveDirectUrl = (url: string, filename: string) => {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};

export const DownloadButton = ({
  kind,
  title,
  mediaUrl,
  label,
  compactLabel,
  variant = "icon",
  className,
}: DownloadButtonProps) => {
  const { entitlements } = useSubscriptionStore();
  const openUpgrade = useUpgradeStore((state) => state.open);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requiredPlan = REQUIRED_PLAN[kind];
  const allowed =
    kind === "song"
      ? entitlements.songDownloads
      : kind === "podcast"
        ? entitlements.podcastDownloads
        : entitlements.videoDownloads;

  const handleDownload = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!allowed) {
      openUpgrade(requiredPlan, FEATURE_LABEL[kind]);
      return;
    }

    if (status === "loading") return;

    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await axiosInstance.post("/downloads/authorize", {
        type: kind,
        title,
        mediaUrl,
      });
      const data = res.data?.data;
      if (!data?.downloadUrl) throw new Error("The server did not return a download link");

      if (data.direct) {
        saveDirectUrl(data.downloadUrl, data.filename || title);
      } else {
        const path = String(data.downloadUrl).replace(/^\/api/, "");
        const blobResponse = await axiosInstance.get(path, { responseType: "blob" });
        saveBlob(blobResponse.data as Blob, data.filename || title);
      }

      setStatus("done");
      window.setTimeout(() => setStatus("idle"), 2200);
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error?.response?.data?.message ?? "Download failed. Please try again.");
      window.setTimeout(() => setStatus("idle"), 3200);
    }
  };

  const tooltip = allowed
    ? `Download ${kind === "song" ? "MP3" : kind}`
    : `${PLAN_LABEL[requiredPlan]} plan required`;

  const icon =
    status === "loading" ? (
      <Loader2 className="size-4 animate-spin" />
    ) : status === "done" ? (
      <Check className="size-4 text-emerald-400" />
    ) : status === "error" ? (
      <TriangleAlert className="size-4 text-red-400" />
    ) : allowed ? (
      <Download className="size-4" />
    ) : (
      <Lock className="size-3.5" />
    );

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleDownload}
        title={errorMessage ?? tooltip}
        aria-label={tooltip}
        disabled={status === "loading"}
        className={cn(
          "grid size-8 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60",
          !allowed && "text-zinc-500",
          className,
        )}
      >
        {icon}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      title={errorMessage ?? tooltip}
      aria-label={
        allowed
          ? (label ?? tooltip)
          : `${label ?? tooltip} — ${PLAN_LABEL[requiredPlan]} plan required`
      }
      disabled={status === "loading"}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full border font-bold transition-all disabled:opacity-60",
        variant === "pill"
          ? "border-white/15 bg-white/[0.06] px-2 py-1.5 text-[11px] font-semibold text-zinc-100 hover:border-white/30 hover:bg-white/[0.12] hover:text-white sm:px-3"
          : "border-white/15 bg-white/5 px-2.5 py-1 text-[10px] text-zinc-300 hover:border-white/35 hover:text-white",
        !allowed && "border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200",
        className,
      )}
    >
      {icon}
      {compactLabel ? (
        <>
          <span className="sm:hidden">{compactLabel}</span>
          <span className="hidden sm:inline">{label ?? (kind === "song" ? "MP3" : "Download")}</span>
        </>
      ) : (
        <span>{label ?? (kind === "song" ? "MP3" : "Download")}</span>
      )}
      {!allowed && (
        <span className="rounded-md bg-amber-300/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-300">
          {PLAN_LABEL[requiredPlan]}
        </span>
      )}
    </button>
  );
};

export default DownloadButton;
