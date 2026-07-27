'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn, formatDateTime } from '@/lib/utils';
import { useMe } from '@/features/auth/hooks';
import { useMessageThread, useSendMessage } from './hooks';

export function MessageThreadDialog({
  bookingId,
  vendorId,
  triggerLabel,
  title,
}: {
  bookingId: string;
  vendorId: string;
  triggerLabel: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const { data: user } = useMe();
  const { data: messages, isLoading } = useMessageThread(bookingId, vendorId, open);
  const sendMessage = useSendMessage(bookingId, vendorId);
  const [body, setBody] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || sendMessage.isPending) return;
    sendMessage.mutate({ body: trimmed }, { onSuccess: () => setBody('') });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div ref={scrollRef} className="max-h-96 min-h-64 space-y-3 overflow-y-auto py-2">
          {isLoading ? (
            <p className="text-center text-sm text-ink-soft">Loading…</p>
          ) : !messages || messages.length === 0 ? (
            <p className="text-center text-sm text-ink-soft">No messages yet — say hello.</p>
          ) : (
            messages.map((message) => {
              const isMine = message.senderId === user?.id;
              return (
                <div key={message.id} className={cn('flex flex-col', isMine ? 'items-end' : 'items-start')}>
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm',
                      isMine ? 'bg-emerald text-ivory' : 'bg-linen text-ink',
                    )}
                  >
                    {message.body}
                  </div>
                  <span className="mt-1 text-[10px] text-ink-soft">
                    {message.senderName} · {formatDateTime(message.createdAt)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-line pt-3">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message…"
            className="min-h-11"
            maxLength={2000}
            aria-label="Message"
          />
          <Button
            type="submit"
            size="icon"
            isLoading={sendMessage.isPending}
            disabled={!body.trim() || sendMessage.isPending}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
