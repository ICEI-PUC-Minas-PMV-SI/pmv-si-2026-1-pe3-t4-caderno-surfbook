export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface IAuthRepository {
  signup(input: SignupInput): Promise<User>;
  login(input: LoginInput): Promise<User>;
  logout(): Promise<void>;
  me(): Promise<User | null>;
}
