/**
 * Emula latência de rede em mock repositories.
 * Forçar async desde o início expõe loading states e erros de UX cedo
 * (regra de ouro 4: feedback informativo).
 */
export function simulateDelay(min = 300, max = 800): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}
