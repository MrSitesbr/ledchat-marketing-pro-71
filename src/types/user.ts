export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  isAdmin?: boolean;
  createdAt: Date;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  whatsapp: string;
  age: number;
  gender: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  loginAsAdmin: (password: string) => boolean;
  updateUser: (userData: Partial<User>) => void;
  updateAvatar: (avatarUrl: string) => void;
  logout: () => void;
}