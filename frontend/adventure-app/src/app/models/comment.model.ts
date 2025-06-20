// src/app/models/comment.model.ts

export interface Comment {
    id: string;
    commentText: string;
    createdAt: string;
    userId: string;
    authorFirstName: string;
    authorLastName: string;
    authorAvatarUrl: string | null;
  }