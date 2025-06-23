export interface ChatMessage {
    id: string;
    messageText: string | null;
    mediaUrl: string | null;
    createdAt: string;
    userId: string;
    authorFirstName: string | null;
    authorAvatarUrl: string | null;
  }