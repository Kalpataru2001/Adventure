import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Post } from 'src/app/models/post.model';
import { NotificationService } from 'src/app/services/notification.service';
import { PostService } from 'src/app/services/post.service';
import Swal from 'sweetalert2';
import { Comment } from 'src/app/models/comment.model';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-social',
  templateUrl: './social.component.html',
  styleUrls: ['./social.component.scss']
})
export class SocialComponent implements OnInit {
  posts: Post[] = [];
  isLoading = true;
  openMenuPostId: string | null = null;
  currentUserId: string | null = null;
  newCommentText: { [postId: string]: string } = {};
  constructor(
    private postService: PostService,
    private notify: NotificationService,
    private authService: AuthService
  ) {
    const token = this.authService.getToken();
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.currentUserId = payload.sub; // 'sub' is the standard claim for user ID
    }
   }

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.isLoading = true;
    this.postService.getPosts().subscribe(data => {
      this.posts = data;
      this.isLoading = false;
    });
  }

  onLike(post: Post): void {
    // Optimistic UI update
    post.likedByCurrentUser = !post.likedByCurrentUser;
    post.likeCount += post.likedByCurrentUser ? 1 : -1;

    // Call the service
    this.postService.toggleLike(post.id).subscribe({
      error: () => {
        // Roll back on error
        post.likedByCurrentUser = !post.likedByCurrentUser;
        post.likeCount += post.likedByCurrentUser ? 1 : -1;
        this.notify.error('Could not update like status.');
      }
    });
  }

  async onCreatePost(): Promise<void> {
    const { value: formValues } = await Swal.fire({
      title: 'Create a New Post',
      html: `
        <textarea id="swal-post-text" class="swal2-textarea" placeholder="What's on your mind?"></textarea>
        <input id="swal-post-file" type="file" class="swal2-file" accept="image/*,video/*">
      `,
      focusConfirm: false,
      preConfirm: () => {
        return {
          text: (document.getElementById('swal-post-text') as HTMLTextAreaElement).value,
          file: (document.getElementById('swal-post-file') as HTMLInputElement).files?.[0]
        }
      },
      showCancelButton: true,
      confirmButtonText: 'Post'
    });

    if (formValues) {
      this.postService.createPost(formValues.text || null, formValues.file || null).subscribe({
        next: () => {
          this.notify.success('Post created successfully!');
          this.loadPosts(); // Refresh the feed
        },
        error: () => this.notify.error('Failed to create post.')
      });
    }
  }
  toggleComments(post: Post): void {
    post.isCommentsVisible = !post.isCommentsVisible;
    if (post.isCommentsVisible && !post.comments) {
      this.fetchCommentsForPost(post);
    }
  }

  fetchCommentsForPost(post: Post): void {
    post.isCommentsLoading = true;
    this.postService.getComments(post.id).subscribe(comments => {
      // This line will now work correctly
      post.comments = comments;
      post.isCommentsLoading = false;
    });
  }

  onPostComment(post: Post): void {
    const commentText = this.newCommentText[post.id];
    if (!commentText || commentText.trim() === '') return;

    this.postService.addComment(post.id, commentText).subscribe(newComment => {
      // This line will now work correctly
      post.comments = [newComment, ...(post.comments || [])];
      post.commentCount++;
      this.newCommentText[post.id] = '';
      this.notify.success('Comment posted!');
    });
  }

  // --- NEW METHOD FOR SHARING ---
  async onShare(post: Post): Promise<void> {
    const shareData = {
      title: 'Adventure App Post',
      text: post.postText || `Check out this adventure!`,
      url: window.location.href 
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        this.notify.success('Post shared successfully!');
      } catch (err) {
        console.log('Share was cancelled.', err);
      }
    } else {
      await navigator.clipboard.writeText(shareData.url);
      this.notify.info('Link copied to clipboard!');
    }
  }

  togglePostMenu(postId: string): void {
    if (this.openMenuPostId === postId) {
      this.openMenuPostId = null; // Close if already open
    } else {
      this.openMenuPostId = postId; // Open this one
    }
  }

  async onEditPost(post: Post): Promise<void> {
    this.openMenuPostId = null; // Close the menu
    const { value: newText } = await Swal.fire({
      title: 'Edit your post',
      input: 'textarea',
      inputValue: post.postText,
      inputPlaceholder: 'Type your message here...',
      showCancelButton: true,
      confirmButtonText: 'Save Changes'
    });

    if (newText) {
      this.postService.editPost(post.id, newText).subscribe({
        next: (updatedPost) => {
          post.postText = updatedPost.postText; // Update the UI instantly
          this.notify.success('Post updated!');
        },
        error: () => this.notify.error('Failed to update post.')
      });
    }
  }

  onDeletePost(post: Post): void {
    this.openMenuPostId = null; // Close the menu
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.postService.deletePost(post.id).subscribe({
          next: () => {
            // Remove the post from the array to update the UI instantly
            this.posts = this.posts.filter(p => p.id !== post.id);
            this.notify.success('Post deleted.');
          },
          error: () => this.notify.error('Failed to delete post.')
        });
      }
    });
  }

}
