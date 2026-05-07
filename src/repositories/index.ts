/**
 * Re-export das interfaces de repositórios.
 * Uma entrada por entidade — adiciona conforme cada repo nasce.
 *
 * Componentes/hooks NÃO devem importar daqui diretamente — usar `@/services/...`.
 */

export type {
  IAuthRepository,
  LoginInput,
  SignupInput,
  User,
} from "./auth-repository";

export type {
  CreateNotebookInput,
  INotebookRepository,
  Notebook,
  UpdateNotebookInput,
} from "./notebook-repository";

export type {
  CreateNoteInput,
  INoteRepository,
  Note,
  UpdateNoteInput,
} from "./note-repository";

export type { Tag } from "@/types/tag";
