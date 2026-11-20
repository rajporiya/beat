import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, MessageCircle, Search, Send, TriangleAlert } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlanBadge } from "@/components/PlanBadge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { axiosInstance } from "@/lib/axios";
import { formatRelativeDate } from "@/lib/media";
import { isPlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";

type Contact = {
  _id: string;
  fullName: string;
  imageUrl?: string;
  email?: string;
  plan?: string;
};

type ChatMessage = {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
};

const initialsFor = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

export default function ChatPage() {
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact._id === selectedId) ?? null,
    [contacts, selectedId],
  );

  const filteredContacts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return contacts;
    return contacts.filter((contact) =>
      `${contact.fullName} ${contact.email ?? ""}`.toLowerCase().includes(term),
    );
  }, [contacts, query]);

  useEffect(() => {
    if (!user) {
      setContacts([]);
      setSelectedId(null);
      setMessages([]);
      return;
    }

    let cancelled = false;
    setIsLoadingContacts(true);
    axiosInstance
      .get("/v1/messages/contacts")
      .then((res) => {
        if (!cancelled) setContacts(Array.isArray(res.data?.data) ? res.data.data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message ?? "Could not load your contacts");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingContacts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const loadMessages = useCallback(async (contactId: string, silent = false) => {
    if (!silent) setIsLoadingMessages(true);
    try {
      const res = await axiosInstance.get(`/v1/messages/${contactId}`);
      setMessages(Array.isArray(res.data?.data?.messages) ? res.data.data.messages : []);
      setError(null);
    } catch (err: any) {
      if (!silent) setError(err.response?.data?.message ?? "Could not load this conversation");
    } finally {
      if (!silent) setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  useEffect(() => {
    if (!selectedId || !user) return;
    const timer = window.setInterval(() => {
      void loadMessages(selectedId, true);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [selectedId, user, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !selectedContact || isSending) return;

    setIsSending(true);
    setError(null);
    try {
      const res = await axiosInstance.post(`/v1/messages/${selectedContact._id}`, { content });
      setMessages((current) => [...current, res.data.data]);
      setDraft("");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Message could not be sent");
    } finally {
      setIsSending(false);
    }
  };

  if (!user) {
    return (
      <div className="grid h-full place-items-center bg-[#121212] p-6 text-center">
        <div>
          <MessageCircle className="mx-auto size-10 text-emerald-400" />
          <h1 className="mt-4 text-2xl font-bold text-white">Messages</h1>
          <p className="mt-2 text-sm text-zinc-400">Log in to chat with other BeatMusic listeners.</p>
          <Link
            to="/login"
            className="mt-5 inline-block rounded-full bg-white px-5 py-2 text-sm font-bold text-black hover:scale-[1.02]"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 bg-[#121212]">
      {/* Contacts */}
      <aside
        className={cn(
          "flex h-full w-full shrink-0 flex-col border-white/10 md:w-80 md:border-r",
          selectedContact && "hidden md:flex",
        )}
      >
        <div className="border-b border-white/10 px-4 py-4">
          <h1 className="flex items-center gap-2 text-lg font-bold text-white">
            <MessageCircle className="size-5 text-emerald-400" />
            Messages
          </h1>
          <label className="mt-3 flex items-center gap-2 rounded-full bg-[#242424] px-3 py-2 text-sm text-zinc-300">
            <Search className="size-4 shrink-0" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a listener"
              className="w-full bg-transparent text-white placeholder:text-zinc-500 outline-none"
            />
          </label>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          {isLoadingContacts ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-400">
              <Loader2 className="size-4 animate-spin" /> Loading listeners...
            </div>
          ) : filteredContacts.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-zinc-500">
              {contacts.length === 0
                ? "No other listeners have signed up yet."
                : "No listeners match your search."}
            </p>
          ) : (
            <div className="space-y-1 p-2">
              {filteredContacts.map((contact) => {
                const active = contact._id === selectedId;
                return (
                  <button
                    key={contact._id}
                    type="button"
                    onClick={() => setSelectedId(contact._id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                      active ? "bg-white/10" : "hover:bg-white/5",
                    )}
                  >
                    <Avatar className="size-10">
                      {contact.imageUrl && <AvatarImage src={contact.imageUrl} alt={contact.fullName} />}
                      <AvatarFallback className="bg-[#282828] text-xs font-bold text-white">
                        {initialsFor(contact.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{contact.fullName}</p>
                      <p className="truncate text-[11px] text-zinc-500">{contact.email || "Listener"}</p>
                    </div>
                    {isPlanId(contact.plan) && <PlanBadge plan={contact.plan} size="xs" withIcon={false} />}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </aside>

      {/* Conversation */}
      <section className={cn("flex min-w-0 flex-1 flex-col", !selectedContact && "hidden md:flex")}>
        {!selectedContact ? (
          <div className="grid h-full place-items-center p-8 text-center">
            <div>
              <MessageCircle className="mx-auto size-12 text-zinc-700" />
              <h2 className="mt-4 text-xl font-bold text-white">Your messages</h2>
              <p className="mt-2 text-sm text-zinc-400">Choose a listener to start a conversation.</p>
            </div>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label="Back to contacts"
                className="grid size-8 place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white md:hidden"
              >
                <ArrowLeft className="size-4" />
              </button>
              <Avatar className="size-9">
                {selectedContact.imageUrl && (
                  <AvatarImage src={selectedContact.imageUrl} alt={selectedContact.fullName} />
                )}
                <AvatarFallback className="bg-[#282828] text-xs font-bold text-white">
                  {initialsFor(selectedContact.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{selectedContact.fullName}</p>
                <p className="truncate text-[11px] text-zinc-500">{selectedContact.email || "Listener"}</p>
              </div>
            </header>

            <ScrollArea className="min-h-0 flex-1">
              <div className="flex flex-col gap-2 p-4">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-400">
                    <Loader2 className="size-4 animate-spin" /> Loading conversation...
                  </div>
                ) : messages.length === 0 ? (
                  <p className="py-12 text-center text-sm text-zinc-500">
                    Say hello to {selectedContact.fullName.split(" ")[0]}.
                  </p>
                ) : (
                  messages.map((message) => {
                    const mine = message.senderId === user._id;
                    return (
                      <div key={message._id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                            mine ? "rounded-br-md bg-[#1ed760] text-black" : "rounded-bl-md bg-[#282828] text-zinc-100",
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          <p className={cn("mt-1 text-[10px]", mine ? "text-black/50" : "text-zinc-500")}>
                            {formatRelativeDate(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            {error && (
              <div className="mx-4 mb-2 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-2.5 text-xs text-red-300">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-white/10 p-3">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={`Message ${selectedContact.fullName}`}
                maxLength={2000}
                className="h-10 flex-1 rounded-full border border-white/10 bg-[#242424] px-4 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-white/30"
              />
              <button
                type="submit"
                disabled={!draft.trim() || isSending}
                aria-label="Send message"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-[#1ed760] text-black transition-transform hover:scale-105 disabled:opacity-40"
              >
                {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
