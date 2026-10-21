// Coquille provisoire du socle : les modules A1 (tableau de bord) et A2 (alertes) viennent s'y intégrer.
export default function App() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-3 border-b border-white/10 px-6 py-4">
        <span className="grid size-11 place-items-center rounded-xl bg-bmc-gold font-display text-sm font-extrabold text-bmc-charcoal">
          BMC
        </span>
        <div>
          <p className="font-display text-xl font-bold leading-tight">BMC Food</p>
          <p className="text-sm text-zinc-400">Cuisine & caisse</p>
        </div>
      </header>
      <main className="grid flex-1 place-items-center p-6">
        <p className="font-display text-2xl font-bold">En attente de commandes</p>
      </main>
    </div>
  )
}
