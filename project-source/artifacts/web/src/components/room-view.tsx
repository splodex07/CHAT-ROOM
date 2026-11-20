import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, Check, Clipboard, Info, LogOut, Menu, Radio, RefreshCw, Users, Wifi, WifiOff, X } from 'lucide-react';
import { getGetRoomStateQueryKey, useGetRoomState, useSendMessage } from '@workspace/api-client-react';
import type { ChatMessage, Participant, RoomState } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { BrandMark } from './brand-mark';

type RoomViewProps = {
  roomCode: string;
  username: string;
  onLeave: () => void;
};

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || '??';
}

function timeLabel(date: string) {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return '';
  return value.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function Avatar({ participant, index = 0 }: { participant: Pick<Participant, 'username'>; index?: number }) {
  const colors = ['bg-primary text-primary-foreground', 'bg-accent text-accent-foreground', 'bg-[#cf8d9a] text-[#27141b]', 'bg-[#8d9ecf] text-[#151b31]'];
  return (
    <div className={`grid size-9 shrink-0 place-items-center rounded-xl text-[11px] font-extrabold ${colors[index % colors.length]}`} title={participant.username}>
      {initials(participant.username)}
    </div>
  );
}

function RoomSkeleton() {
  return (
    <div className="space-y-5 p-6" data-testid="state-room-loading">
      {[70, 45, 62, 38, 55].map((width, index) => (
        <div key={index} className={`flex gap-3 ${index % 2 ? 'justify-end' : ''}`}>
          <div className={`skeleton h-11 rounded-2xl ${index % 2 ? 'w-2/5' : 'w-3/5'}`} style={{ width: `${width}%` }} />
        </div>
      ))}
    </div>
  );
}

export function RoomView({ roomCode, username, onLeave }: RoomViewProps) {
  const queryClient = useQueryClient();
  const roomQuery = useGetRoomState(roomCode, {
    query: {
      enabled: Boolean(roomCode),
      queryKey: getGetRoomStateQueryKey(roomCode),
      refetchInterval: 30000,
      staleTime: 10000,
    },
  });
  const serverState = roomQuery.data as RoomState | undefined;
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);
  const [mobilePeopleOpen, setMobilePeopleOpen] = useState(false);
  const [connection, setConnection] = useState<'connecting' | 'live' | 'offline'>('connecting');
  const [sendError, setSendError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const sendMessageMutation = useSendMessage();

  const messages = useMemo(() => [...(serverState?.messages ?? []), ...localMessages], [serverState?.messages, localMessages]);
  const participants = serverState?.participants ?? [];

  useEffect(() => {
    const basePath = import.meta.env.BASE_URL.endsWith('/')
      ? import.meta.env.BASE_URL
      : `${import.meta.env.BASE_URL}/`;
    const eventSource = new EventSource(
      `${basePath}api/rooms/${encodeURIComponent(roomCode)}/events`,
    );

    const setRoomState = (event: MessageEvent<string>) => {
      try {
        const nextState = JSON.parse(event.data) as RoomState;
        queryClient.setQueryData(getGetRoomStateQueryKey(roomCode), nextState);
        setConnection('live');
      } catch {
        setConnection('offline');
      }
    };

    const addMessage = (event: MessageEvent<string>) => {
      try {
        const nextMessage = JSON.parse(event.data) as ChatMessage;
        queryClient.setQueryData<RoomState | undefined>(
          getGetRoomStateQueryKey(roomCode),
          (current) => {
            if (!current || current.messages.some((message) => message.id === nextMessage.id)) {
              return current;
            }
            return { ...current, messages: [...current.messages, nextMessage] };
          },
        );
        setConnection('live');
      } catch {
        setConnection('offline');
      }
    };

    eventSource.addEventListener('room', setRoomState);
    eventSource.addEventListener('message', addMessage);
    eventSource.onopen = () => setConnection('live');
    eventSource.onerror = () => setConnection('offline');

    return () => {
      eventSource.close();
    };
  }, [queryClient, roomCode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sendMessageMutation.isPending) return;
    setSendError('');
    sendMessageMutation.mutate(
      { roomCode, data: { username, body } },
      {
        onSuccess: (message) => {
          queryClient.setQueryData<RoomState | undefined>(
            getGetRoomStateQueryKey(roomCode),
            (current) => {
              if (!current || current.messages.some((item) => item.id === message.id)) {
                return current;
              }
              return { ...current, messages: [...current.messages, message] };
            },
          );
          setDraft('');
        },
        onError: () => {
          setSendError('That message could not be sent. Try again.');
        },
      },
    );
  };

  return (
    <main className="noise min-h-[100dvh] bg-background" data-testid="page-room">
      <div className="mx-auto flex min-h-[100dvh] max-w-[1480px] flex-col px-3 py-3 sm:px-5 sm:py-5">
        <header className="flex items-center justify-between px-2 pb-4 sm:px-1 sm:pb-5">
          <BrandMark compact />
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden items-center gap-2 text-xs font-semibold text-muted-foreground sm:flex">
              <span className="live-dot size-1.5 rounded-full bg-accent" />
              Live room
            </div>
            <button data-testid="button-leave-room" onClick={onLeave} className="focus-ring flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <LogOut size={14} />
              <span className="hidden sm:inline">Leave room</span>
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 overflow-hidden rounded-[1.25rem] border border-border bg-card shadow-[0_20px_80px_rgba(0,0,0,0.18)]">
          <aside className="hidden w-[280px] shrink-0 flex-col border-r border-border bg-background/35 md:flex">
            <RoomDetails roomCode={roomCode} participants={participants} copied={copied} copyCode={copyCode} />
          </aside>

          <section className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-7">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-mono text-sm font-medium tracking-[0.12em] text-foreground">{roomCode}</h1>
                  <button data-testid="button-copy-room-code-mobile" onClick={copyCode} className="focus-ring rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden">
                    {copied ? <Check size={14} className="text-accent" /> : <Clipboard size={14} />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {roomQuery.isFetching ? 'Syncing room…' : `${participants.length} ${participants.length === 1 ? 'person' : 'people'} here now`}
                </p>
              </div>
              <button data-testid="button-toggle-participants" onClick={() => setMobilePeopleOpen((open) => !open)} className="focus-ring flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden">
                <Users size={14} />
                {participants.length}
                {mobilePeopleOpen ? <X size={14} /> : <Menu size={14} />}
              </button>
              <div className="hidden items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-[11px] font-bold text-accent md:flex">
                 {connection === 'live' ? <Wifi size={14} /> : <WifiOff size={14} />}
                 {connection === 'live' ? 'Live connection' : connection === 'connecting' ? 'Connecting…' : 'Reconnecting…'}
              </div>
            </div>

            {mobilePeopleOpen && (
              <div className="border-b border-border bg-background/60 px-4 py-4 md:hidden">
                <RoomDetails roomCode={roomCode} participants={participants} copied={copied} copyCode={copyCode} compact />
              </div>
            )}

            <div className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
              {roomQuery.isLoading ? <RoomSkeleton /> : roomQuery.isError ? (
                <div className="flex min-h-full flex-col items-center justify-center text-center" data-testid="state-room-error">
                  <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive"><WifiOff size={20} /></div>
                  <h2 className="font-bold">The room went quiet</h2>
                  <p className="mt-2 max-w-[280px] text-sm leading-6 text-muted-foreground">We could not reach this room right now. Your invite may have expired.</p>
                  <button data-testid="button-retry-room" onClick={() => roomQuery.refetch()} className="focus-ring mt-5 flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-bold hover:bg-secondary">
                    <RefreshCw size={14} /> Try again
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex min-h-full flex-col items-center justify-center text-center" data-testid="state-room-empty">
                  <div className="mb-5 grid size-14 place-items-center rounded-[1.25rem] border border-primary/25 bg-primary/10 text-primary"><Radio size={23} /></div>
                  <h2 className="font-bold tracking-[-0.02em]">The room is yours</h2>
                  <p className="mt-2 max-w-[300px] text-sm leading-6 text-muted-foreground">Say hello, ask a question, or leave the first note in this moment.</p>
                </div>
              ) : (
                <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5">
                  <div className="mb-2 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">
                    <span className="h-px flex-1 bg-border" /> Today <span className="h-px flex-1 bg-border" />
                  </div>
                  {messages.map((message, index) => {
                    const isSelf = message.username === username;
                    return (
                      <div key={`${message.id}-${index}`} className={`message-enter flex gap-3 ${isSelf ? 'flex-row-reverse' : ''}`} data-testid={`message-${message.id}`}>
                        {!isSelf && <Avatar participant={message} index={index} />}
                        <div className={`max-w-[78%] ${isSelf ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div className={`mb-1.5 flex items-baseline gap-2 ${isSelf ? 'flex-row-reverse' : ''}`}>
                            <span className="text-xs font-bold text-foreground">{isSelf ? 'You' : message.username}</span>
                            <span className="font-mono text-[10px] text-muted-foreground">{timeLabel(message.sentAt)}</span>
                          </div>
                          <div className={`rounded-2xl px-4 py-3 text-sm leading-6 ${isSelf ? 'rounded-tr-md bg-primary text-primary-foreground' : 'rounded-tl-md bg-secondary text-foreground'}`}>
                            {message.body}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <div className="border-t border-border p-3 sm:p-5">
              <form onSubmit={sendMessage} className="mx-auto flex max-w-[760px] items-end gap-2 rounded-xl border border-input bg-background p-1.5 transition-colors focus-within:border-primary/60">
                <textarea
                  data-testid="input-message"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  rows={1}
                  placeholder="Write something…"
                  className="focus-ring min-h-[42px] max-h-28 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground/60"
                />
                <button data-testid="button-send-message" type="submit" disabled={!draft.trim() || sendMessageMutation.isPending} className="focus-ring grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0">
                  <ArrowUp size={18} strokeWidth={2.5} />
                </button>
              </form>
              {sendError && <p className="mx-auto mt-2 max-w-[760px] px-1 text-[11px] font-semibold text-destructive">{sendError}</p>}
              <p className="mx-auto mt-2 max-w-[760px] px-1 text-[10px] text-muted-foreground/60">Press Enter to send · Shift + Enter for a new line</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function RoomDetails({ roomCode, participants, copied, copyCode, compact = false }: {
  roomCode: string;
  participants: Participant[];
  copied: boolean;
  copyCode: () => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? '' : 'flex flex-1 flex-col'}>
      <div className="border-b border-border p-5">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Private room</p>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-lg font-medium tracking-[0.12em] text-primary">{roomCode}</span>
          <button data-testid="button-copy-room-code" onClick={copyCode} className="focus-ring rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Copy room code">
            {copied ? <Check size={15} className="text-accent" /> : <Clipboard size={15} />}
          </button>
        </div>
        {copied && <p className="mt-2 text-[11px] font-semibold text-accent">Code copied to clipboard</p>}
      </div>
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-bold text-foreground"><Users size={14} className="text-primary" /> People here</span>
          <span className="rounded-md bg-secondary px-2 py-1 font-mono text-[10px] text-muted-foreground" data-testid="text-participant-count">{participants.length}</span>
        </div>
        {participants.length > 0 ? (
          <div className={`space-y-3 ${compact ? 'grid grid-cols-2 gap-x-4 space-y-0' : ''}`}>
            {participants.map((participant, index) => (
              <div key={participant.id} className="flex items-center gap-2.5 py-1" data-testid={`participant-${participant.id}`}>
                <div className="relative">
                  <Avatar participant={participant} index={index} />
                  <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card bg-accent" />
                </div>
                <span className="min-w-0 truncate text-xs font-semibold text-muted-foreground">{participant.username}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs leading-5 text-muted-foreground">Waiting for the first person to arrive.</p>
        )}
      </div>
      {!compact && (
        <div className="mt-auto border-t border-border p-5">
          <div className="flex gap-2.5 text-muted-foreground">
            <Info size={14} className="mt-0.5 shrink-0 text-primary" />
            <p className="text-[11px] leading-5">This room is private and temporary. Share the code only with the people you want here.</p>
          </div>
        </div>
      )}
    </div>
  );
}