import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserContextType, LoginData, RegisterData } from "@/types/user";
import { toast } from "sonner";

const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
}

interface UserProviderProps {
  children: ReactNode;
}

const USER_STORAGE_KEY = "ledchat_user";
const USERS_STORAGE_KEY = "ledchat_users";
const LOGIN_TIMESTAMP_KEY = "ledchat_login_timestamp";
const ADMIN_PASSWORD = "976431";

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from localStorage on mount and check 24h expiry
  useEffect(() => {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    const loginTimestamp = localStorage.getItem(LOGIN_TIMESTAMP_KEY);
    
    if (saved && loginTimestamp) {
      try {
        const loginTime = parseInt(loginTimestamp);
        const currentTime = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000; // 24 horas em millisegundos
        
        // Verifica se passou 24 horas desde o último login
        if (currentTime - loginTime > twentyFourHours) {
          // Remove dados do usuário e força novo login
          localStorage.removeItem(USER_STORAGE_KEY);
          localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
          setUser(null);
          setIsAuthenticated(false);
          toast.info("Sua sessão expirou. Faça login novamente.");
          return;
        }
        
        const parsed = JSON.parse(saved);
        const userWithDates = {
          ...parsed,
          createdAt: new Date(parsed.createdAt),
        };
        setUser(userWithDates);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error loading user:", error);
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
      }
    }
  }, []);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      // Salva timestamp do login se não existir
      if (!localStorage.getItem(LOGIN_TIMESTAMP_KEY)) {
        localStorage.setItem(LOGIN_TIMESTAMP_KEY, Date.now().toString());
      }
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
    }
  }, [user]);

  // Função para salvar usuários registrados
  const saveRegisteredUser = (userData: RegisterData & { id: string }) => {
    const users = getRegisteredUsers();
    users.push(userData);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  };

  // Função para obter usuários registrados
  const getRegisteredUsers = (): (RegisterData & { id: string })[] => {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error("Error loading users:", error);
      }
    }
    return [];
  };

  // Login como administrador
  const loginAsAdmin = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      const adminUser: User = {
        id: "admin",
        name: "Administrador",
        email: "admin@ledmkt.com",
        isAdmin: true,
        createdAt: new Date(),
      };
      setUser(adminUser);
      setIsAuthenticated(true);
      localStorage.setItem(LOGIN_TIMESTAMP_KEY, Date.now().toString());
      toast.success("Login como administrador realizado com sucesso!");
      return true;
    } else {
      toast.error("Senha de administrador incorreta!");
      return false;
    }
  };

  // Login normal
  const login = async (data: LoginData): Promise<boolean> => {
    const users = getRegisteredUsers();
    const foundUser = users.find(u => u.email === data.email && u.password === data.password);
    
    if (foundUser) {
      const user: User = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        isAdmin: false,
        createdAt: new Date(),
      };
      setUser(user);
      setIsAuthenticated(true);
      localStorage.setItem(LOGIN_TIMESTAMP_KEY, Date.now().toString());
      toast.success(`Bem-vindo, ${foundUser.name}!`);
      return true;
    } else {
      toast.error("Email ou senha incorretos!");
      return false;
    }
  };

  // Cadastro
  const register = async (data: RegisterData): Promise<boolean> => {
    const users = getRegisteredUsers();
    const existingUser = users.find(u => u.email === data.email);
    
    if (existingUser) {
      toast.error("Este email já está cadastrado!");
      return false;
    }

    const newRegisteredUser = {
      ...data,
      id: crypto.randomUUID(),
    };

    saveRegisteredUser(newRegisteredUser);

    const user: User = {
      id: newRegisteredUser.id,
      name: data.name,
      email: data.email,
      isAdmin: false,
      createdAt: new Date(),
    };

    setUser(user);
    setIsAuthenticated(true);
    localStorage.setItem(LOGIN_TIMESTAMP_KEY, Date.now().toString());
    toast.success(`Cadastro realizado com sucesso! Bem-vindo, ${data.name}!`);
    return true;
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) {
      // Create new user
      const newUser: User = {
        id: crypto.randomUUID(),
        name: userData.name || "Usuário",
        email: userData.email,
        avatar: userData.avatar,
        createdAt: new Date(),
      };
      setUser(newUser);
    } else {
      // Update existing user
      setUser(prev => prev ? { ...prev, ...userData } : null);
    }
  };

  const updateAvatar = (avatarUrl: string) => {
    if (user) {
      setUser(prev => prev ? { ...prev, avatar: avatarUrl } : null);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    toast.success("Logout realizado com sucesso!");
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        register,
        loginAsAdmin,
        updateUser,
        updateAvatar,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}