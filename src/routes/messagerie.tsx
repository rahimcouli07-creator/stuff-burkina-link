import { createFileRoute } from "@tanstack/react-router";
import { FileText, MessageCircle, Paperclip, Send, X } from "lucide-react";
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

function MessageriePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
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
    if (!activeId) return;
    const channel = supabase
      .channel(`messages-${activeId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` }, () => {
        void loadMessages(activeId);
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeId]);

  const activeConversation = useMemo(() => conversations.find((item) => item.id === activeId) ?? null, [conversations, activeId]);

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
        const { error: uploadError } = await supabase.storage.from("message-files").upload(filePath, file, { upsert: false, contentType: file.type || undefined });
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
      if (userId) await loadConversations(userId);
    } catch (error: any) {
      toast.error(error?.message || "Impossible d'envoyer le message.");
    } finally {
      setSending(false);
    }
  }

  async function openAttachment(message: Message) {
    if (!message.file_path) return;
    const { data, error } = await supabase.storage.from("message-files").createSignedUrl(message.file_path, 300);
    if (error || !data?.signedUrl) {
      toast.error("Impossible d'ouvrir le fichier.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  if (checking) return <AppLayout><div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground">Chargement de la messagerie...</div></AppLayout>;

  if (!userId) {
    return <AppLayout><section className="rounded-[2rem] border border-red-100 bg-white p-6 text-center shadow-sm"><MessageCircle className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-3 text-2xl font-black">Ma messagerie</h1><p className="mt-2 text-sm text-muted-foreground">Connecte-toi pour accéder à tes conversations.</p></section></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="grid min-h-[calc(100vh-12rem)] overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm md:grid-cols-[260px_1fr]">
        <aside className="border-b border-border bg-white md:border-b-0 md:border-r">
          <div className="border-b border-border p-4"><h1 className="text-lg font-black">Ma messagerie</h1><p className="mt-1 text-xs text-muted-foreground">Tes échanges STUFF MARKET</p></div>
          <div className="max-h-[34vh] overflow-y-auto md:max-h-[calc(100vh-18rem)]">
            {conversations.length === 0 ? <div className="p-5 text-sm text-muted-foreground">Aucune conversation pour le moment.</div> : conversations.map((conversation) => (
              <button key={conversation.id} type="button" onClick={() => setActiveId(conversation.id)} className={`w-full border-b border-border p-4 text-left transition ${activeId === conversation.id ? "bg-primary/5" : "hover:bg-muted/60"}`}>
                <div className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-primary" /><span className="text-sm font-black">Conversation</span></div>
                <div className="mt-1 text-[11px] text-muted-foreground">{conversation.ad_id ? "Annonce liée" : "Discussion générale"}</div>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-[520px] flex-col bg-[#fffafa]">
          <div className="border-b border-border bg-white p-4"><h2 className="font-black">{activeConversation ? "Conversation" : "Sélectionne une conversation"}</h2></div>
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {!activeConversation ? <div className="grid h-full place-items-center text-center text-sm text-muted-foreground"><div><MessageCircle className="mx-auto h-10 w-10 text-primary/40" /><p className="mt-2">Tes messages apparaîtront ici.</p></div></div> : messages.length === 0 ? <div className="grid h-full place-items-center text-sm text-muted-foreground">Aucun message pour le moment.</div> : messages.map((message) => {
              const mine = message.sender_id === userId;
              return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-sm ${mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border border-border bg-white"}`}>{message.body && <p className="whitespace-pre-wrap">{message.body}</p>}{message.file_path && <button type="button" onClick={() => openAttachment(message)} className={`mt-2 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${mine ? "bg-white/15" : "bg-muted"}`}><FileText className="h-4 w-4" />{message.file_name || "Fichier"}</button>}</div></div>;
            })}
          </div>
          <div className="border-t border-border bg-white p-3">
            {file && <div className="mb-2 flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-xs"><Paperclip className="h-4 w-4 text-primary" /><span className="min-w-0 flex-1 truncate">{file.name}</span><button type="button" onClick={() => setFile(null)}><X className="h-4 w-4" /></button></div>}
            <div className="flex items-end gap-2">
              <label className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full border border-border text-primary"><Paperclip className="h-5 w-5" /><input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Écrire un message..." rows={1} className="min-h-11 flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary" />
              <button type="button" disabled={sending || !activeId || (!body.trim() && !file)} onClick={sendMessage} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"><Send className="h-5 w-5" /></button>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
