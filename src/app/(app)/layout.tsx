"use client";

import {
  BookOpen,
  Calendar,
  FileText,
  Home,
  ListTodo,
  LogOut,
  Network,
  Search,
  Settings,
  User as UserIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CommandPalette } from "@/components/feature/command-palette";
import { CreateButton } from "@/components/feature/create-button";
import { ShortcutsHelp } from "@/components/feature/shortcuts-help";
import { Avatar } from "@/components/ui/avatar/avatar";
import { Button } from "@/components/ui/button/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarItem,
  SidebarSection,
} from "@/components/ui/sidebar/sidebar";
import {
  Topbar,
  TopbarLeft,
  TopbarRight,
} from "@/components/ui/topbar/topbar";
import { Tooltip } from "@/components/ui/tooltip/tooltip";
import { bootstrapForUser, teardownOnLogout } from "@/lib/app-bootstrap";
import { authService, type User } from "@/services/auth-service";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    authService.me().then((u) => {
      if (!u) {
        router.replace("/login");
      } else {
        setUser(u);
        bootstrapForUser(u.id);
      }
    });
  }, [router]);

  // Atalhos globais: Cmd/Ctrl+K abre busca; `?` (Shift+/) abre ajuda
  // (somente quando o foco não está em campo de texto, pra não atrapalhar
  // digitação literal de "?" em notas).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        const isEditable =
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          target?.isContentEditable === true;
        if (isEditable) return;
        e.preventDefault();
        setHelpOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function handleLogout() {
    await authService.logout();
    teardownOnLogout();
    router.replace("/login");
  }

  if (user === undefined) {
    return (
      <div className="text-muted-foreground flex min-h-screen items-center justify-center text-sm">
        Carregando…
      </div>
    );
  }

  if (user === null) {
    return null;
  }

  return (
    <div className="bg-bg flex h-screen">
      <Sidebar>
        <SidebarHeader>
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="" width={28} height={28} />
            <span className="font-display text-lg font-semibold">
              <span className="text-brand-500 font-normal">Surf</span>
              <span className="text-brand-700">Book.</span>
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarSection title="Navegação">
            <SidebarItem href="/" icon={Home}>
              Início
            </SidebarItem>
            <SidebarItem href="/cadernos" icon={BookOpen}>
              Cadernos
            </SidebarItem>
            <SidebarItem href="/notas" icon={FileText}>
              Notas
            </SidebarItem>
            <SidebarItem
              href="/tarefas"
              icon={ListTodo}
              disabled
              hint="em breve"
            >
              Tarefas
            </SidebarItem>
            <SidebarItem
              href="/calendario"
              icon={Calendar}
              disabled
              hint="em breve"
            >
              Calendário
            </SidebarItem>
            <SidebarItem
              href="/grafo"
              icon={Network}
              disabled
              hint="em breve"
            >
              Grafo
            </SidebarItem>
          </SidebarSection>
        </SidebarContent>
      </Sidebar>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar>
          <TopbarLeft />
          <TopbarRight>
            <Tooltip
              content={
                <span className="flex items-center gap-1.5">
                  Buscar
                  <kbd className="bg-bg/20 rounded px-1 py-0.5 font-mono text-[10px]">
                    Ctrl K
                  </kbd>
                </span>
              }
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPaletteOpen(true)}
                aria-label="Buscar (Ctrl+K)"
              >
                <Search className="size-4" aria-hidden />
              </Button>
            </Tooltip>
            <CreateButton />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Conta de ${user.name}`}
                  className="hover:ring-brand-300 rounded-full transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 hover:ring-2"
                >
                  <Avatar name={user.name} size="md" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-foreground font-medium">
                      {user.name}
                    </span>
                    <span className="text-muted-foreground truncate text-xs font-normal">
                      {user.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <UserIcon className="size-4" aria-hidden />
                  Perfil
                  <DropdownMenuShortcut>em breve</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Settings className="size-4" aria-hidden />
                  Configurações
                  <DropdownMenuShortcut>em breve</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout}>
                  <LogOut className="size-4" aria-hidden />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TopbarRight>
        </Topbar>
        <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onOpenHelp={() => setHelpOpen(true)}
      />
      <ShortcutsHelp open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}
