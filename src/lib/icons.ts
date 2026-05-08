import {
  Atom,
  Book,
  Bookmark,
  BookOpen,
  Brain,
  Briefcase,
  Calculator,
  Camera,
  Code,
  Coffee,
  Compass,
  Database,
  FileText,
  Flag,
  FlaskConical,
  Globe,
  GraduationCap,
  Headphones,
  Heart,
  Library,
  Lightbulb,
  Map,
  Mic,
  Microscope,
  Music,
  Notebook as NotebookIcon,
  Palette,
  Pen,
  PenTool,
  Scroll,
  Star,
  Target,
  Video,
  Zap,
} from "lucide-react";

export interface IconCatalogEntry {
  name: string;
  component: React.ComponentType<{
    className?: string;
    "aria-hidden"?: boolean;
  }>;
  keywords?: string[];
}

export const ICON_CATALOG: IconCatalogEntry[] = [
  { name: "book", component: Book, keywords: ["livro", "leitura"] },
  { name: "book-open", component: BookOpen, keywords: ["livro", "leitura"] },
  { name: "notebook", component: NotebookIcon, keywords: ["caderno"] },
  { name: "library", component: Library, keywords: ["biblioteca"] },
  {
    name: "graduation-cap",
    component: GraduationCap,
    keywords: ["estudo", "formatura", "escola"],
  },
  {
    name: "lightbulb",
    component: Lightbulb,
    keywords: ["ideia", "inspiração"],
  },
  { name: "code", component: Code, keywords: ["programação", "tech"] },
  {
    name: "palette",
    component: Palette,
    keywords: ["arte", "design", "cor"],
  },
  {
    name: "calculator",
    component: Calculator,
    keywords: ["matemática", "cálculo"],
  },
  {
    name: "atom",
    component: Atom,
    keywords: ["física", "química", "ciência"],
  },
  {
    name: "microscope",
    component: Microscope,
    keywords: ["biologia", "ciência"],
  },
  {
    name: "flask",
    component: FlaskConical,
    keywords: ["química", "experimento"],
  },
  { name: "brain", component: Brain, keywords: ["psicologia", "mente"] },
  { name: "music", component: Music, keywords: ["música"] },
  { name: "video", component: Video, keywords: ["vídeo", "filme"] },
  { name: "mic", component: Mic, keywords: ["voz", "áudio"] },
  { name: "headphones", component: Headphones, keywords: ["áudio", "música"] },
  { name: "pen-tool", component: PenTool, keywords: ["escrita", "design"] },
  { name: "pen", component: Pen, keywords: ["escrita"] },
  {
    name: "file-text",
    component: FileText,
    keywords: ["documento", "texto"],
  },
  { name: "scroll", component: Scroll, keywords: ["história", "antigo"] },
  { name: "map", component: Map, keywords: ["geografia", "mapa"] },
  { name: "globe", component: Globe, keywords: ["mundo", "geografia"] },
  { name: "compass", component: Compass, keywords: ["direção"] },
  { name: "bookmark", component: Bookmark, keywords: ["favorito", "salvar"] },
  { name: "briefcase", component: Briefcase, keywords: ["trabalho"] },
  { name: "camera", component: Camera, keywords: ["foto", "fotografia"] },
  { name: "coffee", component: Coffee, keywords: ["café", "pausa"] },
  { name: "database", component: Database, keywords: ["dados", "banco"] },
  { name: "heart", component: Heart, keywords: ["amor", "favorito"] },
  { name: "star", component: Star, keywords: ["estrela", "favorito"] },
  { name: "flag", component: Flag, keywords: ["bandeira", "objetivo"] },
  { name: "target", component: Target, keywords: ["alvo", "objetivo", "meta"] },
  { name: "zap", component: Zap, keywords: ["raio", "rápido", "energia"] },
];

export function getIconComponent(
  name?: string
): IconCatalogEntry["component"] | null {
  if (!name) return null;
  return ICON_CATALOG.find((i) => i.name === name)?.component ?? Book;
}
