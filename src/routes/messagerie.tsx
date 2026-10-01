import { createFileRoute } from "@tanstack/react-router";
import {
  FileText,
  MessageCircle,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/messagerie")({
  component: MessageriePage,
});

type Conversation = {
  id: string;
  ad_id: string | null;
  buyer_id: string;
  seller_id: string;
  updated_at: string;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  file_path: string | null;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  stuff_id: string | null;
  first_name: string | null;
  last_name: string | null;
};

function displayIdentity(profile: Profile | undefined) {
  if (!profile) return "Utilisateur STUFF";
  if (profile.stuff_id) return profile.stuff_id;
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return name || "Utilisateur STUFF";
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function MessageriePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  async function loadConversations(id: string) {
    const { data, error } = await (supabase as any)
      .from("conversations")
      .select("id,ad_id,buyer_id,seller_id,updated_at")
      .or(`buyer_id.eq.${id},seller_id.eq.${id}`)
      .order("updated_at", { ascending: false });

    if (error) {
      setConversations([]);
      return;
    }

    const rows = (data ?? []) as Conversation[];
    setConversations(rows);
    if (!activeId && rows[0]) setActiveId(rows[0].id);

    const otherIds = Array.from(
      new Set(
        rows
          .map((row) => (row.buyer_id === id ? row.seller_id : row.buyer_id))
          .filter(Boolean),
      ),
    );

    if (otherIds.length) {
      const { data: profileRows } = await (supabase as any)
        .from("profiles")
        .select("id,stuff_id,first_name,last_name")
        .in("id", otherIds);

      const next: Record<string, Profile> = {};
      for (const profile of (profileRows ?? []) as Profile[]) next[profile.id] = profile;
      setProfiles(next);
    }
  }

  async function loadMessages(conversationId: string) {
    const { data, error } = await (supabase as any)
      .from("messages")
      .select("id,conversation_id,sender_id,body,file_path,file_name,file_type,created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      setMessages([]);
      return;
    }
    setMessages((data ?? []) as Message[]);
  }

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUserId(data.user?.id ?? null);
      setChecking(false);
      if (data.user?.id) void loadConversations(data.user.id);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (activeId) void loadMessages(activeId);
  }, [activeId]);

  useEffect(() => {
    if (!activeId || !userId) return;
    const channel = supabase
      .channel(`messages-${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeId}`,
        },
        () => void loadMessages(activeId),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeId, userId]);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeId) ?? null,
    [conversations, activeId],
  );

  const activeOtherId = activeConversation
    ? activeConversation.buyer_id === userId
      ? activeConversation.seller_id
      : activeConversation.buyer_id
    : null;

  const activeName = displayIdentity(activeOtherId ? profiles[activeOtherId] : undefined);

  async function sendMessage() {
    if (!userId || !activeId || (!body.trim() && !file)) return;
    setSending(true);

    try {
      let filePath: string | null = null;
      let fileName: string | null = null;
      let fileType: string | null = null;

      if (file) {
        fileName = file.name;
        fileType = file.type || "application/octet-stream";
        filePath = `${activeId}/${crypto.randomUUID()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("message-files")
          .upload(filePath, file, {
            upsert: false,
            contentType: file.type || undefined,
          });
        if (uploadError) throw uploadError;
      }

      const { error } = await (supabase as any).from("messages").insert({
        conversation_id: activeId,
        sender_id: userId,
        body: body.trim() || null,
        file_path: filePath,
        file_name: fileName,
        file_type: fileType,
      });

      if (error) throw error;
      setBody("");
      setFile(null);
      await loadMessages(activeId);
      await loadConversations(userId);
    } catch (error: any) {
      toast.error(error?.message || "Impossible d'envoyer le message.");
    } finally {
      setSending(false);
    }
  }

  async function openAttachment(message: Message) {
    if (!message.file_path) return;
    const { data, error } = await supabase.storage
      .from("message-files")
      .createSignedUrl(message.file_path, 300);
    if (error || !data?.signedUrl) {
      toast.error("Impossible d'ouvrir le fichier.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  if (checking) {
    return (
      <AppLayout>
        <div className="rounded-[2rem] border border-red-100 bg-white p-6 text-sm text-muted-foreground shadow-sm">
          Chargement de la messagerie...
        </div>
      </AppLayout>
    );
  }

  if (!userId) {
    return (
      <AppLayout>
        <section className="rounded-[2rem] border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <MessageCircle className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-black">Ma messagerie</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connecte-toi pour accéder à tes conversations.
          </p>
        </section>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="overflow-hidden rounded-[2rem] border border-red-100 bg-white shadow-sm">
        <div className="border-b border-red-100 bg-white px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-black">Ma messagerie</h1>
              <p className="text-xs text-muted-foreground">Échange avec les utilisateurs STUFF MARKET</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[280px_1fr]">
          <aside className="border-b border-red-100 bg-[#fffafa] md:border-b-0 md:border-r">
            <div className="border-b border-red-100 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-primary">Conversations</p>
            </div>
            <div className="max-h-[34vh] overflow-y-auto md:max-h-[calc(100vh-16rem)]">
              {conversations.length === 0 ? (
                <div className="p-5 text-center text-sm text-muted-foreground">
                  Aucune conversation pour le moment.
                </div>
              ) : (
                conversations.map((conversation) => {
                  const otherId = conversation.buyer_id === userId ? conversation.seller_id : conversation.buyer_id;
                  const name = displayIdentity(profiles[otherId]);
                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => setActiveId(conversation.id)}
                      className={`w-full border-b border-red-50 px-4 py-3 text-left transition ${
                        activeId === conversation.id ? "bg-primary/10" : "hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-black text-primary">
                          {name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-foreground">{name}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {conversation.ad_id ? "Annonce liée" : "Discussion générale"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="flex min-h-[560px] flex-col bg-[#fffafa]">
            <div className="border-b border-red-100 bg-white px-4 py-3">
              {activeConversation ? (
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-xs font-black text-primary">
                    {activeName.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-black">{activeName}</p>
                    <p className="text-[11px] text-muted-foreground">Identité publique : Stuff ID</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-black">Sélectionne une conversation</p>
              )}
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {!activeConversation ? (
                <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
                  <div>
                    <MessageCircle className="mx-auto h-10 w-10 text-primary/30" />
                    <p className="mt-2">Tes messages apparaîtront ici.</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="grid h-full place-items-center text-sm text-muted-foreground">
                  Aucun message pour le moment.
                </div>
              ) : (
                messages.map((message) => {
                  const mine = message.sender_id === userId;
                  return (
                    <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[84%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                          mine
                            ? "rounded-br-md bg-primary text-primary-foreground"
                            : "rounded-bl-md border border-red-100 bg-white"
                        }`}
                      >
                        {message.body && <p className="whitespace-pre-wrap">{message.body}</p>}
                        {message.file_path && (
                          <button
                            type="button"
                            onClick={() => openAttachment(message)}
                            className={`mt-2 inline-flex max-w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${
                              mine ? "bg-white/15" : "bg-muted"
                            }`}
                          >
                            <FileText className="h-4 w-4 shrink-0" />
                            <span className="truncate">{message.file_name || "Fichier"}</span>
                          </button>
                        )}
                        <p className={`mt-1 text-[9px] ${mine ? "text-white/70" : "text-muted-foreground"}`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-red-100 bg-white p-3">
              {file && (
                <div className="mb-2 flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-xs">
                  <Paperclip className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <button type="button" onClick={() => setFile(null)} aria-label="Retirer le fichier">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <label className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full border border-red-100 text-primary transition hover:bg-primary/5">
                  <Paperclip className="h-5 w-5" />
                  <input
                    type="file"
                    className="hidden"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  />
                </label>
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Écrire un message..."
                  rows={1}
                  className="min-h-11 flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
                <button
                  type="button"
                  disabled={sending || !activeId || (!body.trim() && !file)}
                  onClick={sendMessage}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm disabled:opacity-40"
                  aria-label="Envoyer"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
