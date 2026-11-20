import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { useEffect, useState } from 'react';
import { JoinScreen } from '@/components/join-screen';
import { RoomView } from '@/components/room-view';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Home() {
  const [roomCode, setRoomCode] = useState<string | null>(() => sessionStorage.getItem('hushroom-room'));
  const [username, setUsername] = useState<string | null>(() => sessionStorage.getItem('hushroom-name'));

  useEffect(() => {
    if (roomCode && username) {
      sessionStorage.setItem('hushroom-room', roomCode);
      sessionStorage.setItem('hushroom-name', username);
    }
  }, [roomCode, username]);

  const leaveRoom = () => {
    sessionStorage.removeItem('hushroom-room');
    sessionStorage.removeItem('hushroom-name');
    setRoomCode(null);
    setUsername(null);
  };

  if (roomCode && username) {
    return <RoomView roomCode={roomCode} username={username} onLeave={leaveRoom} />;
  }

  return (
    <JoinScreen
      initialRoomCode={new URLSearchParams(window.location.search).get('room') ?? ''}
      onJoined={(joinedRoom, joinedName) => {
        sessionStorage.setItem('hushroom-room', joinedRoom);
        sessionStorage.setItem('hushroom-name', joinedName);
        setRoomCode(joinedRoom);
        setUsername(joinedName);
      }}
    />
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;