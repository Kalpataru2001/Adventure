// src/app/models/user.model.ts
export interface User {
  email: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dob: string; // Added dob field
}

export interface AuthResponse {
  token: string;
  email: string;
  firstName: string;
  lastName: string;
}