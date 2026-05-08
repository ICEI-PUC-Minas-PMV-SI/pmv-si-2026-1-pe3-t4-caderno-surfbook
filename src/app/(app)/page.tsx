import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";

import { UpcomingEventsWidget } from "@/components/feature/upcoming-events-widget";
import { UpcomingTasksWidget } from "@/components/feature/upcoming-tasks-widget";
import { Button } from "@/components/ui/button/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card/card";

/**
 * Dashboard / Home autenticada. Widgets atuais: cadernos + próximos prazos.
 * Mais virão (atividade recente, tarefas pendentes) conforme Sprints futuras.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Início
        </h1>
        <p className="text-muted-foreground">
          Painel principal do SurfBook.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card variant="interactive">
          <CardHeader>
            <div className="bg-brand-100 text-brand-700 flex size-10 items-center justify-center rounded">
              <BookOpen className="size-5" aria-hidden />
            </div>
            <CardTitle>Seus cadernos</CardTitle>
            <CardDescription>
              Organize estudos em cadernos. Cada caderno reúne notas
              relacionadas e ajuda a revisitar o que você já aprendeu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/cadernos">
                Ver cadernos
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <UpcomingTasksWidget />
        <UpcomingEventsWidget />
      </div>
    </div>
  );
}
