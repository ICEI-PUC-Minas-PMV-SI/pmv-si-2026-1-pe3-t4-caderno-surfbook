import { redirect } from "next/navigation";

export default async function NotebookIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/cadernos/${id}/notas`);
}
