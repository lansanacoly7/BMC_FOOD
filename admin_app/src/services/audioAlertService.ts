/*
 * Carillon d'alerte de la cuisine, synthétisé avec la Web Audio API : aucun fichier MP3 à télécharger,
 * donc aucun risque d'erreur de chargement réseau pendant le service.
 */

/** Carillon à deux tons : La5 (880 Hz) puis Ré6 (1174,66 Hz). */
const CHIME_NOTES_HZ = [880, 1174.66] as const
/** Écart entre les deux notes du carillon, en secondes. */
const NOTE_GAP_S = 0.22
/** Durée de résonance de chaque note, en secondes. */
const NOTE_DECAY_S = 1.1
/** Harmoniques ajoutées à la fondamentale pour un timbre de cloche : [rapport de fréquence, volume relatif]. */
const BELL_PARTIALS = [
  [1, 1],
  [2, 0.32],
  [3, 0.12],
] as const
/** Volume général (les deux notes se chevauchent : rester sous 0,5 pour éviter la saturation). */
const MASTER_VOLUME = 0.45
/** Le carillon se répète toutes les 3 secondes jusqu'à l'acquittement. */
const REPEAT_INTERVAL_MS = 3000
/** Fondu de sortie lors de l'arrêt, assez court pour être immédiat sans produire de « clic ». */
const FADE_OUT_S = 0.03

interface AudioGraph {
  context: AudioContext
  master: GainNode
}

class AudioAlertService {
  private graph: AudioGraph | null = null
  private repeatTimer: number | null = null
  private readonly voices = new Set<OscillatorNode>()

  /** Vrai entre start() et stop(). */
  get isRinging(): boolean {
    return this.repeatTimer !== null
  }

  /** Vrai si le navigateur autorise la lecture du son (après une première interaction de l'utilisateur). */
  get isUnlocked(): boolean {
    return this.graph?.context.state === 'running'
  }

  /**
   * Autorise le son. Les navigateurs bloquent l'audio tant que l'utilisateur n'a pas interagi avec la page :
   * à appeler directement dans un gestionnaire de clic. Si la sonnerie était déjà demandée, elle retentit aussitôt.
   */
  async unlock(): Promise<boolean> {
    const { context } = this.getGraph()
    if (context.state !== 'running') {
      try {
        await context.resume()
      } catch {
        return false
      }
    }
    if (this.isUnlocked && this.isRinging) {
      this.clearRepeat()
      this.ring()
    }
    return this.isUnlocked
  }

  /** Lance la sonnerie répétée. Sans effet si elle est déjà en cours. */
  start(): void {
    if (!this.isRinging) this.ring()
  }

  /** Coupe la sonnerie immédiatement, y compris le carillon en train de résonner. */
  stop(): void {
    this.clearRepeat()
    if (!this.graph) return

    const { context, master } = this.graph
    const now = context.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(master.gain.value, now)
    master.gain.linearRampToValueAtTime(0, now + FADE_OUT_S)
    for (const voice of this.voices) voice.stop(now + FADE_OUT_S)
    this.voices.clear()
  }

  /** Joue un seul carillon pour vérifier le son avant le service. Sans effet pendant une sonnerie. */
  playTestChime(): void {
    if (this.isRinging) return
    this.resetVolume()
    this.playChime()
  }

  private ring(): void {
    this.resetVolume()
    this.playChime()
    this.repeatTimer = window.setInterval(() => this.playChime(), REPEAT_INTERVAL_MS)
  }

  private clearRepeat(): void {
    if (this.repeatTimer === null) return
    window.clearInterval(this.repeatTimer)
    this.repeatTimer = null
  }

  /** Rétablit le volume après le fondu de sortie d'un stop(). */
  private resetVolume(): void {
    const { context, master } = this.getGraph()
    master.gain.cancelScheduledValues(context.currentTime)
    master.gain.setValueAtTime(MASTER_VOLUME, context.currentTime)
  }

  private playChime(): void {
    const { context, master } = this.getGraph()
    // Contexte encore bloqué : ne rien programmer, sinon les carillons s'empileraient au déblocage.
    if (context.state !== 'running') return

    const startAt = context.currentTime + 0.01
    CHIME_NOTES_HZ.forEach((frequency, index) => {
      this.playBell(context, master, frequency, startAt + index * NOTE_GAP_S)
    })
  }

  private playBell(context: AudioContext, master: GainNode, frequency: number, startAt: number): void {
    const stopAt = startAt + NOTE_DECAY_S
    const envelope = context.createGain()
    envelope.gain.setValueAtTime(0.0001, startAt)
    envelope.gain.exponentialRampToValueAtTime(1, startAt + 0.01)
    envelope.gain.exponentialRampToValueAtTime(0.0001, stopAt)
    envelope.connect(master)

    BELL_PARTIALS.forEach(([ratio, level], index) => {
      const oscillator = context.createOscillator()
      const partialGain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency * ratio
      partialGain.gain.value = level
      oscillator.connect(partialGain).connect(envelope)

      oscillator.onended = () => {
        this.voices.delete(oscillator)
        oscillator.disconnect()
        partialGain.disconnect()
        // Toutes les harmoniques s'arrêtent ensemble : la première libère l'enveloppe commune.
        if (index === 0) envelope.disconnect()
      }

      this.voices.add(oscillator)
      oscillator.start(startAt)
      oscillator.stop(stopAt)
    })
  }

  private getGraph(): AudioGraph {
    if (!this.graph) {
      const context = new AudioContext()
      const master = context.createGain()
      master.gain.value = MASTER_VOLUME
      master.connect(context.destination)
      this.graph = { context, master }
    }
    return this.graph
  }
}

/** Instance unique : une seule sonnerie pour toute l'application admin. */
export const audioAlertService = new AudioAlertService()
