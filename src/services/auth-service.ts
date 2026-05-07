import { isApiEnabled } from "@/lib/api";
import type { IAuthRepository } from "@/repositories/auth-repository";
import { MockAuthRepository } from "@/repositories/mock/mock-auth-repository";

const repo: IAuthRepository = isApiEnabled
  ? (() => {
      throw new Error(
        "ApiAuthRepository ainda não implementado — backend real fora do escopo do eixo-3."
      );
    })()
  : new MockAuthRepository();

export const authService = {
  signup: (input: Parameters<IAuthRepository["signup"]>[0]) =>
    repo.signup(input),
  login: (input: Parameters<IAuthRepository["login"]>[0]) => repo.login(input),
  logout: () => repo.logout(),
  me: () => repo.me(),
};

export type { User } from "@/repositories/auth-repository";
