import { Comment } from './comment.model';

export interface Post {
    id: string;
    postText: string;
    photoUrl: string;
    videoUrl: string | null; 
    commentCount: number; 
    createdAt: string;
    userId: string;
    authorFirstName: string;
    authorLastName: string;
    authorAvatarUrl: string;
    likeCount: number;
    likedByCurrentUser: boolean;
    comments?: Comment[];
    isCommentsVisible?: boolean;
    isCommentsLoading?: boolean;
}

// export interface Comment {
//     id: string;
//     commentText: string;
//     createdAt: string;
//     userId: string;
//     authorFirstName: string;
//     authorLastName: string;
//     authorAvatarUrl: string | null; 
//   }