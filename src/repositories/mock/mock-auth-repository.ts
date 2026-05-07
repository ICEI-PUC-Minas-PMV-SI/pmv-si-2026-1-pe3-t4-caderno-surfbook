import { storage } from "@/lib/storage";

import type {
  IAuthRepository,
  LoginInput,
  SignupInput,
  User,
} from "../auth-repository";
import { simulateDelay } from "../utils";

const USERS_KEY = "users";
const SESSION_KEY = "current-user";

interface StoredUser extends User {
  passwordHash: string;
}

/**
 * Hash trivial só pra não armazenar senha em texto plano no localStorage.
 * NÃO é seguro — backend real fará bcrypt/argon2. Aqui é mock acadêmico.
 */
function hashPassword(password: string): string {
  let h = 0;
  for (let i = 0; i < password.length; i++) {
    h = (h << 5) - h + password.charCodeAt(i);
    h |= 0;
  }
  return `mock:${h}`;
}

export class MockAuthRepository implements IAuthRepository {
  async signup(input: SignupInput): Promise<User> {
    await simulateDelay();

    if (!input.email.includes("@")) {
      throw new Error("Email inválido.");
    }
    if (input.password.length < 4) {
      throw new Error("A senha deve ter pelo menos 4 caracteres.");
    }
    if (!input.name.trim()) {
      throw new Error("Informe seu nome.");
    }

    const users = storage.get<StoredUser[]>(USERS_KEY, []);
    if (users.some((u) => u.email === input.email)) {
      throw new Error("Já existe uma conta com esse email.");
    }

    const stored: StoredUser = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      email: input.email.toLowerCase(),
      createdAt: new Date().toISOString(),
      passwordHash: hashPassword(input.password),
    };

    storage.set(USERS_KEY, [...users, stored]);
    const user = this.toUser(stored);
    storage.set(SESSION_KEY, user);
    return user;
  }

  async login(input: LoginInput): Promise<User> {
    await simulateDelay();

    const users = storage.get<StoredUser[]>(USERS_KEY, []);
    const stored = users.find((u) => u.email === input.email.toLowerCase());

    if (!stored || stored.passwordHash !== hashPassword(input.password)) {
      throw new Error("Email ou senha incorretos.");
    }

    const user = this.toUser(stored);
    storage.set(SESSION_KEY, user);
    return user;
  }

  async logout(): Promise<void> {
    await simulateDelay(100, 200);
    storage.remove(SESSION_KEY);
  }

  async me(): Promise<User | null> {
    return storage.get<User | null>(SESSION_KEY, null);
  }

  private toUser(stored: StoredUser): User {
    return {
      id: stored.id,
      name: stored.name,
      email: stored.email,
      createdAt: stored.createdAt,
    };
  }
}
