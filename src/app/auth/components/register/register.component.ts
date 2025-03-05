import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  error: string = '';
  
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) { }
  
  ngOnInit(): void {
    this.registerForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, {
      validator: this.mustMatch('password', 'confirmPassword')
    });
    
    // Auto navigate to home if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }
  
  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    const user = {
      firstName: this.registerForm.controls['firstName'].value,
      lastName: this.registerForm.controls['lastName'].value,
      email: this.registerForm.controls['email'].value,
      password: this.registerForm.controls['password'].value
    };
    
    console.log('Attempting to register user:', user.email);
    
    this.authService.register(user).subscribe({
      next: (response) => {
        console.log('Registration successful, response:', response);
        
        // Check if the registration response includes the token
        if (response && response.token) {
          console.log('Token received from registration');
          // Store auth data
          localStorage.setItem('token', response.token);
          if (response.user) {
            localStorage.setItem('currentUser', JSON.stringify(response.user));
          }
          
          // Redirect to home
          this.router.navigate(['/']);
        } else {
          // Traditional flow - redirect to login
          console.log('No token from registration, redirecting to login');
          this.router.navigate(['/auth/login'], { 
            queryParams: { 
              registered: true, 
              email: user.email 
            }
          });
        }
      },
      error: error => {
        console.error('Registration error:', error);
        this.error = error.message || error.error?.message || 'Registration failed';
        this.loading = false;
      }
    });
  }
  
  // Custom validator for password match
  mustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];
      
      if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
        return;
      }
      
      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true });
      } else {
        matchingControl.setErrors(null);
      }
    };
  }
}
