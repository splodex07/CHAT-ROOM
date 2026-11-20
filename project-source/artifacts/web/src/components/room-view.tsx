  useEffect(() => {
    const eventSource = new EventSource(
      `https://chat-room-9aup.onrender.com/api/rooms/${encodeURIComponent(roomCode)}/events`,
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

    return () => eventSource.close();
  }, [queryClient, roomCode]);
