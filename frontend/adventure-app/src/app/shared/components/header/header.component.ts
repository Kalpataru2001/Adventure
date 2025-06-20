import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  open = false;

 constructor(
    public authService: AuthService, 
    private router: Router
  ) {}

  toggleMenu() {
    this.open = !this.open;
  }

  closeMenu() {
    this.open = false;
  }

  onLogout(): void {
    // Close the mobile menu first if it's open
    this.closeMenu();
    
    // Show the confirmation dialog
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of your account.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6', // Blue
      cancelButtonColor: '#d33',    // Red
      confirmButtonText: 'Yes, log me out!',
      customClass: {
        // You can add custom classes for more specific styling if needed
        popup: 'rounded-lg' 
      }
    }).then((result) => {
      // If the user clicked "Yes"
      if (result.isConfirmed) {
        this.authService.logout();
        // The logout method in AuthService already handles navigation to the login page.
      }
    });
  }
}
