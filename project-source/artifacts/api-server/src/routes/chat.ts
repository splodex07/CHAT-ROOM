import { randomUUID } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  GetRoomStateParams,
  GetRoomStateResponse,
  JoinRoomBody,
  JoinRoomParams,
  JoinRoomResponse,
  SendMessageBody,
  SendMessageParams,
  SendMessageResponse,
} from "@workspace/api-zod";

type Participant = {
  id: string;
  username: string;
  joinedAt: string;
};

type ChatMessage = {
  id: string;
  roomCode: string;
  username: string;
  body: string;
  sentAt: string;
};

type Room = {
  roomCode: string;
  participants: Participant[];
  messages: ChatMessage[];
  clients: Set<Response>;
};

const rooms = new Map<string, Room>();

function getOrCreateRoom(roomCode: string): Room {
  const existing = rooms.get(roomCode);
  if (existing) return existing;

  const room: Room = {
    roomCode,
    participants: [],
    messages: [],
    clients: new Set(),
  };
  rooms.set(roomCode, room);
  return room;
}

function snapshot(room: Room) {
  return {
    roomCode: room.roomCode,
    participants: room.participants,
    messages: room.messages,
  };
}

function sendEvent(response: Response, event: string, payload: unknown) {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function broadcast(room: Room, event: string, payload: unknown) {
  for (const client of room.clients) {
    sendEvent(client, event, payload);
  }
}

function roomCodeFrom(request: Request): string | null {
  const parsed = GetRoomStateParams.safeParse(request.params);
  return parsed.success ? parsed.data.roomCode : null;
}

const router: IRouter = Router();

router.get("/rooms/:roomCode", (req, res) => {
  const parsed = GetRoomStateParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid room code." });
    return;
  }

  const room = rooms.get(parsed.data.roomCode);
  if (!room) {
    res.status(404).json({ error: "That room does not exist yet." });
    return;
  }

  res.json(GetRoomStateResponse.parse(snapshot(room)));
});

router.post("/rooms/:roomCode/join", (req, res) => {
  const params = JoinRoomParams.safeParse(req.params);
  const body = JoinRoomBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Enter a valid room code and username." });
    return;
  }

  const room = getOrCreateRoom(params.data.roomCode);
  const username = body.data.username.trim();
  const participant: Participant = {
    id: randomUUID(),
    username,
    joinedAt: new Date().toISOString(),
  };
  room.participants.push(participant);

  const state = JoinRoomResponse.parse(snapshot(room));
  broadcast(room, "room", state);
  res.json(state);
});

router.post("/rooms/:roomCode/messages", (req, res) => {
  const params = SendMessageParams.safeParse(req.params);
  const body = SendMessageBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Enter a message before sending." });
    return;
  }

  const room = rooms.get(params.data.roomCode);
  if (!room) {
    res.status(404).json({ error: "That room does not exist." });
    return;
  }

  const message: ChatMessage = {
    id: randomUUID(),
    roomCode: room.roomCode,
    username: body.data.username.trim(),
    body: body.data.body.trim(),
    sentAt: new Date().toISOString(),
  };
  if (!message.body) {
    res.status(400).json({ error: "Enter a message before sending." });
    return;
  }

  room.messages.push(message);
  if (room.messages.length > 100) {
    room.messages.shift();
  }
  const parsedMessage = SendMessageResponse.parse(message);
  broadcast(room, "message", parsedMessage);
  res.status(201).json(parsedMessage);
});

router.get("/rooms/:roomCode/events", (req, res) => {
  const roomCode = roomCodeFrom(req);
  if (!roomCode) {
    res.status(400).json({ error: "Enter a valid room code." });
    return;
  }

  const room = getOrCreateRoom(roomCode);
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  room.clients.add(res);
  sendEvent(res, "room", GetRoomStateResponse.parse(snapshot(room)));

  const heartbeat = setInterval(() => {
    res.write(": keep-alive\n\n");
  }, 20_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    room.clients.delete(res);
  });
});

export default router;