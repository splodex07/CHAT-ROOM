import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  KeyRound,
  LockKeyhole,
  Radio,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useJoinRoom } from "@workspace/api-client-react";
import { BrandMark } from "./brand-mark";

type JoinScreenProps = {
  initialRoomCode?: string;
  onJoined: (roomCode: string, username: string) => void;
};

export function JoinScreen({
  initialRoomCode = "",
  onJoined,
}: JoinScreenProps) {
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [username, setUsername] = useState(
    () => localStorage.getItem("hushroom-username") ?? "",
  );
  const joinRoom = useJoinRoom();

  useEffect(() => {
    if (initialRoomCode) setRoomCode(initialRoomCode);
  }, [initialRoomCode]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanCode = roomCode.trim().toUpperCase();
    const cleanName = username.trim();
    if (!cleanCode || !cleanName || joinRoom.isPending) return;
    joinRoom.mutate(
      { roomCode: cleanCode, data: { username: cleanName } },
      {
        onSuccess: () => {
          localStorage.setItem("hushroom-username", cleanName);
          onJoined(cleanCode, cleanName);
        },
      },
    );
  };

  return (
    <main className="noise min-h-[100dvh] overflow-hidden bg-background">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1220px] flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <BrandMark />
          <div className="hidden items-center gap-2 text-xs font-semibold text-muted-foreground sm:flex">
            <ShieldCheck size={15} className="text-accent" />
            No accounts. No history.
          </div>
        </header>

        <div className="grid flex-1 items-center gap-14 py-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(380px,0.8fr)] lg:gap-24 lg:py-20">
          <section
            className="page-enter max-w-[680px]"
            aria-labelledby="join-heading"
          >
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              <span className="live-dot size-1.5 rounded-full bg-accent" />A
              quiet place to talk
            </div>
            <h1
              id="join-heading"
              className="max-w-[680px] text-[clamp(3.6rem,8vw,7.5rem)] font-extrabold leading-[0.88] tracking-[-0.08em] text-foreground"
            >
              Meet in the
              <span className="block text-primary">moment.</span>
            </h1>
            <p className="mt-8 max-w-[480px] text-base leading-7 text-muted-foreground sm:text-lg">
              Share a room code, choose a name, and start talking. Hushroom is
              made for the conversations that do not need a permanent home.
            </p>
            <div className="mt-10 hidden items-center gap-7 text-xs font-semibold text-muted-foreground sm:flex">
              <span className="flex items-center gap-2">
                <LockKeyhole size={14} className="text-primary" />
                Private by default
              </span>
              <span className="flex items-center gap-2">
                <Radio size={14} className="text-accent" />
                Live, room-sized
              </span>
            </div>
          </section>

          <section
            className="page-enter relative lg:justify-self-end"
            style={{ animationDelay: "100ms" }}
          >
            <div className="absolute -inset-8 rounded-[2.5rem] bg-primary/[0.035] blur-3xl" />
            <div className="relative rounded-[1.75rem] border border-border bg-card/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:p-8">
              <div className="mb-8 flex items-start justify-between">
                <div>
                  <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary">
                    <KeyRound size={20} />
                  </div>
                  <h2 className="text-xl font-extrabold tracking-[-0.04em]">
                    Enter a room
                  </h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Your invite is the key.
                  </p>
                </div>
                <Sparkles size={17} className="text-primary/70" />
              </div>

              <form onSubmit={submit} className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Room code
                  </span>
                  <input
                    data-testid="input-room-code"
                    value={roomCode}
                    onChange={(event) =>
                      setRoomCode(
                        event.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9-]/g, ""),
                      )
                    }
                    placeholder="e.g. LANTERN-42"
                    maxLength={32}
                    autoComplete="off"
                    className="focus-ring w-full rounded-xl border border-input bg-background px-4 py-3.5 font-mono text-sm font-medium tracking-[0.16em] text-foreground placeholder:font-sans placeholder:tracking-normal placeholder:text-muted-foreground/60"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Your name
                  </span>
                  <input
                    data-testid="input-username"
                    value={username}
                    onChange={(event) =>
                      setUsername(event.target.value.slice(0, 32))
                    }
                    placeholder="What should the room call you?"
                    maxLength={32}
                    autoComplete="nickname"
                    className="focus-ring w-full rounded-xl border border-input bg-background px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/60"
                  />
                </label>
                {joinRoom.isError && (
                  <div
                    className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm leading-5 text-destructive"
                    data-testid="status-join-error"
                  >
                    We could not open that room. Check the code and try again.
                  </div>
                )}
                <button
                  data-testid="button-join-room"
                  type="submit"
                  disabled={
                    !roomCode.trim() || !username.trim() || joinRoom.isPending
                  }
                  className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-extrabold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                >
                  {joinRoom.isPending ? "Opening room…" : "Join room"}
                  {!joinRoom.isPending && <ArrowRight size={17} />}
                </button>
              </form>
              <p className="mt-5 text-center text-[11px] leading-5 text-muted-foreground">
                Rooms are temporary by design. Use a code you trust.
              </p>
            </div>
          </section>
        </div>
        <footer className="flex items-center justify-between border-t border-border/70 pt-5 text-[11px] font-medium text-muted-foreground">
          <span>One room. One moment. Nothing to maintain.</span>
          <span className="font-mono text-muted-foreground/60">
            v1.0 / live
          </span>
        </footer>
      </div>
    </main>
  );
}
