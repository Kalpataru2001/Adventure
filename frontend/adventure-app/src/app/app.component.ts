import { Component } from '@angular/core';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'adventure-app';
   constructor(private notify: NotificationService) {}

    ngOnInit(): void {
    const splashScreen = document.querySelector('.app-loading-splash');

    if (splashScreen) {
      splashScreen.classList.add('fade-out');
      setTimeout(() => {
        splashScreen.remove();
      }, 500);
    }
  }

  showSuccess() {
    this.notify.success('Welcome to Adventure App!');
  }
}
