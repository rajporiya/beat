import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import Modal from "@/components/ui/modal";
import { usePlaylistStore } from "@/stores/usePlaylistStore";

type EditablePlaylist = {
  _id: string;
  name: string;
  description?: string;
  isPublic: boolean;
};

type CreatePlaylistModalProps = {
  open: boolean;
  onClose: () => void;
  playlist?: EditablePlaylist | null;
  onSaved?: (playlist: { _id: string; name: string }) => void;
};

const inputClass =
  "mt-2 w-full rounded-md border border-zinc-600 bg-[#242424] p-3 text-sm text-white outline-none focus:border-[#22c55e]";
const labelClass = "block text-sm font-semibold text-white";

const CreatePlaylistModal = ({ open, onClose, playlist, onSaved }: CreatePlaylistModalProps) => {
  const { createPlaylist, updatePlaylist } = usePlaylistStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(playlist?.name ?? "");
    setDescription(playlist?.description ?? "");
    setIsPublic(playlist?.isPublic ?? true);
    setError(null);
  }, [open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give your playlist a name.");
      return;
    }

    const input = { name: trimmed, description: description.trim(), isPublic };
    setSaving(true);
    setError(null);
    try {
      if (playlist) {
        await updatePlaylist(playlist._id, input);
        onSaved?.({ _id: playlist._id, name: trimmed });
      } else {
        const created = await createPlaylist(input);
        onSaved?.(created);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Could not save your playlist. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={playlist ? "Edit details" : "Create playlist"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className={labelClass}>
          Name
          <input
            required
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="My playlist #1"
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          Description (optional)
          <textarea
            maxLength={500}
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add an optional description"
            className={`${inputClass} resize-none`}
          />
        </label>

        <label className="flex items-center justify-between gap-3 rounded-md bg-[#242424] p-3 text-sm text-white">
          <span>
            <span className="block font-semibold">Public playlist</span>
            <span className="block text-xs text-zinc-400">Other listeners can find and open it.</span>
          </span>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
            className="size-4 accent-[#22c55e]"
          />
        </label>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          disabled={saving}
          className="flex w-full items-center justify-center rounded-full bg-[#22c55e] py-3 font-bold text-black hover:bg-[#3be477] disabled:opacity-60"
        >
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          {playlist ? "Save" : "Create"}
        </button>
      </form>
    </Modal>
  );
};

export default CreatePlaylistModal;
