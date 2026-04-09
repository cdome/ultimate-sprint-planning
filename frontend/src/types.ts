export interface Participant {
  name: string;
  vote: string | null;
  online: boolean;
}

export interface RoomState {
  roomId: string;
  facilitatorId: string;
  participants: Record<string, Participant>;
  revealed: boolean;
  createdAt: number;
}

export const CARD_VALUES = ["0", "1", "2", "3", "5", "8", "13", "21", "?", "☕"];
