/**
 * Service de synthèse audio Web Audio API pour les alertes cuisine (KDS)
 * Génère des carillons sonores distincts et audibles en environnement bruyant
 * sans dépendre d'aucun fichier audio externe (zéro latence, zéro 404).
 */

class AudioAlertManager {
  private ctx: AudioContext | null = null
  private isMuted: boolean = false

  constructor() {
    // Lecture du statut muet depuis le localStorage si disponible
    try {
      const stored = localStorage.getItem('bmc_kds_muted')
      this.isMuted = stored === 'true'
    } catch {
      this.isMuted = false
    }
  }

  /** Initialise ou réactive l'AudioContext sur geste utilisateur (obligatoire sur navigateur moderne) */
  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
    return this.ctx
  }

  /** Débloque le contexte audio dès le premier clic de l'utilisateur */
  public unlock(): void {
    const ctx = this.getContext()
    if (ctx && ctx.state === 'suspended') {
      void ctx.resume()
    }
  }

  public get muted(): boolean {
    return this.isMuted
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted
    try {
      localStorage.setItem('bmc_kds_muted', String(muted))
    } catch {
      // storage non disponible
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted)
    return this.isMuted
  }

  /**
   * Joue un carillon distinct pour une NOUVELLE COMMANDE entrante :
   * Accord montant harmonique (Sol 5 / Do 6 / Mi 6 : 784 Hz -> 1046 Hz -> 1318 Hz).
   * Son clair, chaleureux, traverse le bruit d'une cuisine sans être agressif.
   */
  public playNewOrder(): void {
    if (this.isMuted) return
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const notes = [
      { freq: 783.99, time: 0.0, dur: 0.35, gain: 0.3 },   // G5
      { freq: 1046.5, time: 0.12, dur: 0.45, gain: 0.4 },  // C6
      { freq: 1318.5, time: 0.25, dur: 0.65, gain: 0.45 }, // E6
    ]

    notes.forEach(({ freq, time, dur, gain }) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()

      osc.type = 'triangle' // Sonorité ronde et chaude type cloche
      osc.frequency.setValueAtTime(freq, now + time)

      // Attaque rapide, extinction progressive douce
      gainNode.gain.setValueAtTime(0.001, now + time)
      gainNode.gain.exponentialRampToValueAtTime(gain, now + time + 0.03)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + time + dur)

      osc.connect(gainNode)
      gainNode.connect(ctx.destination)

      osc.start(now + time)
      osc.stop(now + time + dur)
    })
  }

  /**
   * Bip doux de confirmation d'action (transition statut, undo, validation)
   */
  public playActionConfirm(): void {
    if (this.isMuted) return
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, now) // La 5
    osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.08) // Ré 6

    gainNode.gain.setValueAtTime(0.001, now)
    gainNode.gain.linearRampToValueAtTime(0.18, now + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.15)

    osc.connect(gainNode)
    gainNode.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.15)
  }

  /**
   * Alerte de retard critique (> 15 min) : double pulsation basse
   */
  public playOverdueWarning(): void {
    if (this.isMuted) return
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const pulses = [0, 0.22]

    pulses.forEach((offset) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(440, now + offset)

      gainNode.gain.setValueAtTime(0.001, now + offset)
      gainNode.gain.linearRampToValueAtTime(0.2, now + offset + 0.04)
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.18)

      osc.connect(gainNode)
      gainNode.connect(ctx.destination)

      osc.start(now + offset)
      osc.stop(now + offset + 0.18)
    })
  }
}

export const audioAlert = new AudioAlertManager()
