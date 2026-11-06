import React from 'react'
import { AlertTriangle, Clock, Flame, Inbox } from 'lucide-react'

interface StatCountersProps {
  pendingCount: number
  preparingCount: number
  lateCount: number
  avgWaitMinutes: number
}

export const StatCounters: React.FC<StatCountersProps> = ({
  pendingCount,
  preparingCount,
  lateCount,
  avgWaitMinutes,
}) => {
  const isLateActive = lateCount > 0

  return (
    <section
      className="px-3 py-2 border-b border-[#262D38] bg-[#0E1116] flex items-center justify-between gap-3 shrink-0 select-none"
      aria-label="Statistiques de production cuisine"
    >
      {/* 3 GROS BLOCS COMPTEURS */}
      <div className="flex items-center gap-2.5 flex-1 max-w-3xl">
        {/* BLOC 1 : À PRÉPARER */}
        <div className="flex-1 h-12 rounded-lg bg-[#1A1F27] border border-[#262D38] px-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="size-4 text-[#2F6FED]" />
            <span className="text-xs font-bold text-[#9AA4B2] uppercase tracking-wider">
              À préparer
            </span>
          </div>
          <span className="font-mono text-2xl font-black text-[#FFFFFF]">
            {pendingCount}
          </span>
        </div>

        {/* BLOC 2 : EN CUISSON */}
        <div className="flex-1 h-12 rounded-lg bg-[#1A1F27] border border-[#262D38] px-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="size-4 text-[#F5B800]" />
            <span className="text-xs font-bold text-[#9AA4B2] uppercase tracking-wider">
              En cuisson
            </span>
          </div>
          <span className="font-mono text-2xl font-black text-[#FFFFFF]">
            {preparingCount}
          </span>
        </div>

        {/* BLOC 3 : EN RETARD (DEVIENT ROUGE SI > 0) */}
        <div
          className={`flex-1 h-12 rounded-lg px-3.5 flex items-center justify-between transition-colors ${
            isLateActive
              ? 'bg-[#E5362B] text-[#FFFFFF] shadow-lg border border-[#E5362B]'
              : 'bg-[#1A1F27] border border-[#262D38] text-[#9AA4B2]'
          }`}
          role={isLateActive ? 'alert' : undefined}
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            {isLateActive ? (
              <AlertTriangle className="size-4 text-[#FFFFFF] animate-pulse stroke-[2.5]" />
            ) : (
              <Clock className="size-4 text-[#687385]" />
            )}
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                isLateActive ? 'text-[#FFFFFF]' : 'text-[#9AA4B2]'
              }`}
            >
              En retard
            </span>
          </div>
          <span
            className={`font-mono text-2xl font-black ${
              isLateActive ? 'text-[#FFFFFF]' : 'text-[#687385]'
            }`}
          >
            {lateCount}
          </span>
        </div>
      </div>

      {/* TEMPS D'ATTENTE MOYEN */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1A1F27] border border-[#262D38] text-xs font-semibold text-[#9AA4B2] shrink-0">
        <Clock className="size-3.5 text-[#F5B800]" />
        <span>Attente moy. :</span>
        <span className="font-mono font-bold text-[#FFFFFF] text-sm">
          {avgWaitMinutes} min
        </span>
      </div>
    </section>
  )
}
