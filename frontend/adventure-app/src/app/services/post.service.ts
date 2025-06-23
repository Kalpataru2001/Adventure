import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post } from '../models/post.model';
import { Comment } from '../models/comment.model';
import { environment } from 'src/environments/environment';
@Injectable({
    providedIn: 'root'
})
export class PostService {
    private readonly apiUrl = environment.apiUrl + '/Posts';

    constructor(private http: HttpClient) { }

    getPosts(): Observable<Post[]> {
        return this.http.get<Post[]>(this.apiUrl);
    }

    createPost(postText: string | null, file: File | null): Observable<any> {
        const formData = new FormData();
        if (postText) {
            formData.append('postText', postText);
        }
        if (file) {
            formData.append('file', file, file.name);
        }
        return this.http.post(this.apiUrl, formData);
    }

    toggleLike(postId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/${postId}/like`, {});
    }
    getComments(postId: string): Observable<Comment[]> {
        return this.http.get<Comment[]>(`${this.apiUrl}/${postId}/comments`);
    }
    

    addComment(postId: string, commentText: string): Observable<Comment> {
        return this.http.post<Comment>(`${this.apiUrl}/${postId}/comments`, { commentText });
      }

    editPost(postId: string, postText: string): Observable<Post> {
        return this.http.put<Post>(`${this.apiUrl}/${postId}`, { postText });
    }

    deletePost(postId: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${postId}`);
      }
}