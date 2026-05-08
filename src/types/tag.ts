/**
 * Tag — entidade compartilhada por cadernos e (futuramente) notas.
 * Cor é derivada do nome via hash determinístico em
 * `@/components/ui/tag-selector/tag-selector` (`colorForTagName`).
 */
export interface Tag {
  id: string;
  name: string;
  color: string;
}
