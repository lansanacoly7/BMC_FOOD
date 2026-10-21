// Page d'accueil provisoire du socle : remplacée par les composants du module C1 (Header, Plat du Jour, catalogue).
export default function App() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="rounded-full bg-bmc-gold px-3 py-1 text-xs font-bold uppercase tracking-wider text-bmc-charcoal">
        Dakar · 11h – 02h
      </span>
      <h1 className="font-display text-5xl font-extrabold">BMC Food</h1>
      <p className="text-zinc-600">Le goût du vrai plaisir.</p>
    </main>
  )
}
