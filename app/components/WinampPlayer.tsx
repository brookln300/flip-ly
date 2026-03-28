'use client'

import { useState, useEffect, useRef, useCallback, MouseEvent as ReactMouseEvent } from 'react'

// Each "track" has a unique chiptune generator — 12 tracks of internet history
const PLAYLIST = [
  { title: 'Dial-Up Dealz (56k Banger)', duration: '3:42', bpm: 140, key: 'C', wave: 'square' as OscillatorType },
  { title: 'KEYBOARD_KITTY_FINAL.midi', duration: '2:18', bpm: 125, key: 'C', wave: 'custom_organ' as unknown as OscillatorType },
  { title: 'Sandst0rm (LimeWire 128k Rip)', duration: '4:20', bpm: 136, key: 'Am', wave: 'sawtooth' as OscillatorType },
  { title: 'never_gonna_give_u_up.exe', duration: '3:33', bpm: 113, key: 'C', wave: 'square' as OscillatorType },
  { title: 'Modem Screech Anthem (G1TC#)', duration: '2:56', bpm: 160, key: 'E', wave: 'sawtooth' as OscillatorType },
  { title: 'all_ur_base_r_belong_2_us.mod', duration: '3:01', bpm: 120, key: 'D', wave: 'square' as OscillatorType },
  { title: 'Flip That Couch (Pirate Remix)', duration: '4:20', bpm: 110, key: 'Am', wave: 'square' as OscillatorType },
  { title: 'HAMP5TER_DANCE_2002.mp3', duration: '2:42', bpm: 150, key: 'G', wave: 'square' as OscillatorType },
  { title: 'badger_badger_mushroom.wma', duration: '1:58', bpm: 144, key: 'C', wave: 'square' as OscillatorType },
  { title: 'estate_sale_mckinney_v2.mp3', duration: '3:33', bpm: 120, key: 'D', wave: 'triangle' as OscillatorType },
  { title: 'craigslist_lofi_beats.wma', duration: '6:09', bpm: 85, key: 'G', wave: 'triangle' as OscillatorType },
  { title: 'AIM_away_msg_anthem.mid', duration: '2:22', bpm: 100, key: 'F', wave: 'sine' as OscillatorType },
]

// Note frequencies — extended range for maximum chaos
const NOTES: Record<string, number> = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50,
}

// Melodic patterns per track (offset from base index in scale)
const MELODIES: number[][] = [
  // 0: Dial-Up Dealz — bouncy major
  [0, 2, 4, 5, 4, 2, 0, 3, 5, 7, 5, 3, 0, 4, 7, 4],
  // 1: Keyboard Cat — bouncy boogie-woogie organ shuffle in C
  // Swinging ascending riff, repeats with variation, cheerful & dumb
  [0, 2, 4, 0, 2, 4, 5, 4, 2, 0, 4, 2, 0, -1, 0, 2,
   0, 2, 4, 0, 2, 4, 7, 5, 4, 2, 4, 2, 0, 2, 4, 5,
   7, 5, 4, 2, 0, 2, 4, 5, 4, 2, 0, -1, 0, 2, 0, -1,
   0, 2, 4, 0, 2, 4, 5, 7, 5, 4, 2, 0, 2, 4, 5, 4],
  // 2: Sandstorm — driving trance arpeggios
  [0, 0, 3, 3, 5, 5, 7, 7, 0, 0, 3, 3, 5, 5, 8, 8,
   0, 3, 5, 7, 5, 3, 0, 3, 5, 7, 8, 7, 5, 3, 0, 0],
  // 3: Rick Roll — that unmistakable bassline groove
  [0, 2, 3, 5, 3, 0, -2, 0, 2, 3, 2, 0, 3, 5, 7, 5,
   3, 2, 0, 2, 3, 5, 3, 2, 0, -2, 0, 2, 3, 2, 0, -2],
  // 4: Modem Screech — chaotic ascending runs
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2, 1,
   7, 5, 4, 2, 0, 2, 4, 7, 5, 7, 9, 7, 5, 4, 2, 0],
  // 5: All Your Base — dramatic minor key march
  [0, 0, 3, 3, 5, 4, 3, 2, 0, 0, 5, 5, 7, 5, 3, 2,
   0, 2, 3, 5, 7, 5, 3, 2, 0, -1, 0, 2, 3, 2, 0, -1],
  // 6: Flip That Couch — funky groove
  [0, 0, 3, 3, 5, 5, 3, -1, 0, 2, 3, 5, 7, 5, 3, 2],
  // 7: Hampster Dance — manic fast arpeggios
  [0, 2, 4, 2, 0, 2, 4, 7, 4, 2, 0, 4, 7, 4, 2, 0,
   5, 7, 9, 7, 5, 7, 9, 10, 9, 7, 5, 4, 2, 4, 5, 7],
  // 8: Badger Badger — hypnotic repeating pattern
  [0, 0, 2, 2, 3, 3, 5, 5, 0, 0, 2, 2, 3, 3, 5, 5,
   7, 7, 5, 5, 3, 3, 2, 2, 7, 5, 3, 2, 0, 2, 3, 5],
  // 9: Estate Sale — gentle arpeggio
  [0, 4, 7, 4, 0, 3, 7, 3, 0, 5, 7, 5, 0, 4, 7, 4],
  // 10: Lofi beats — smooth jazzy
  [0, 2, 3, 5, 3, 2, 0, -2, 0, 3, 5, 7, 5, 3, 0, -1],
  // 11: AIM Away Message — dreamy slow pads
  [0, 4, 7, 10, 7, 4, 0, 3, 7, 10, 7, 3, 0, 5, 7, 10,
   7, 5, 0, 4, 7, 4, 0, 3, 5, 3, 0, 2, 4, 2, 0, -1],
]

// Scale mappings per key
const SCALES: Record<string, string[]> = {
  C:  ['C3','D3','E3','F3','G3','A3','B3','C4','D4','E4','F4','G4','A4','B4','C5','D5','E5'],
  Am: ['A3','B3','C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5','A5','B5','C6'],
  E:  ['E3','F3','G3','A3','B3','C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5'],
  F:  ['F3','G3','A3','B3','C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5','A5'],
  D:  ['D3','E3','F3','G3','A3','B3','C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5'],
  G:  ['G3','A3','B3','C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5','A5','B5'],
}

// Bass patterns per track — unique grooves
const BASS_PATTERNS: number[][] = [
  [0, 0, 3, 3, 5, 5, 3, 3],              // Dial-Up: straight
  [0, 2, 4, 5, 4, 2, 0, 2, 4, 5, 7, 5, 4, 2, 0, 2], // Keyboard Cat: boogie walking bass
  [0, 0, 0, 0, 5, 5, 5, 5, 3, 3, 3, 3, 5, 5, 7, 7], // Sandstorm: pounding
  [0, 0, 5, 5, 3, 3, 5, 0],              // Rick Roll: the groove
  [0, 7, 5, 3, 0, 7, 5, 3],              // Modem: descending
  [0, 0, 3, 5, 7, 5, 3, 0],              // All Base: march
  [0, 0, 0, 3, 5, 5, 3, 0],              // Flip Couch: funky
  [0, 4, 0, 4, 0, 4, 7, 4],              // Hampster: bouncy
  [0, 0, 5, 5, 0, 0, 5, 5],              // Badger: hypnotic
  [0, 4, 7, 4, 0, 3, 7, 3],              // Estate: gentle
  [0, 0, 3, 3, 5, 5, 7, 7],              // Lofi: smooth
  [0, 7, 5, 0, 3, 7, 5, 3],              // AIM: dreamy
]

// Drum pattern variations per track
const DRUM_STYLES: Record<number, string> = {
  0: 'standard',     // 4-on-floor
  1: 'boogie',       // keyboard cat shuffle
  2: 'trance',       // driving
  3: 'funk',         // syncopated
  4: 'chaos',        // random hits
  5: 'march',        // military
  6: 'funk',
  7: 'fast',         // double time
  8: 'tribal',       // toms
  9: 'gentle',       // brushes
  10: 'lofi',        // sparse
  11: 'none',        // pad track, no drums
}

function EQBar({ color, maxH }: { color: string; maxH: number }) {
  const [h, setH] = useState(4)
  useEffect(() => {
    const i = setInterval(() => setH(Math.random() * maxH + 2), 120)
    return () => clearInterval(i)
  }, [maxH])
  return <div style={{ width: '3px', height: `${h}px`, background: color, transition: 'height 0.1s' }} />
}

// Chiptune audio engine using Web Audio API
function useChiptuneEngine() {
  const ctxRef = useRef<AudioContext | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepRef = useRef(0)
  const trackRef = useRef(0)

  const getCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext()
      gainRef.current = ctxRef.current.createGain()
      gainRef.current.gain.value = 0.15
      gainRef.current.connect(ctxRef.current.destination)
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume()
    }
    return { ctx: ctxRef.current, gain: gainRef.current! }
  }, [])

  // Organ sound — stacks square + sine at fundamental + 2nd + 3rd harmonics (like a cheesy Casio)
  const playOrgan = useCallback((freq: number, duration: number, vol = 0.12) => {
    const { ctx, gain } = getCtx()
    const noteGain = ctx.createGain()
    noteGain.gain.setValueAtTime(vol, ctx.currentTime)
    noteGain.gain.setValueAtTime(vol * 0.9, ctx.currentTime + duration * 0.7)
    noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    // Fundamental — square (organ body)
    const osc1 = ctx.createOscillator()
    osc1.type = 'square'
    osc1.frequency.value = freq
    osc1.connect(noteGain)
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + duration)
    // 2nd harmonic — sine (warmth)
    const osc2 = ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.value = freq * 2
    const h2Gain = ctx.createGain()
    h2Gain.gain.value = vol * 0.4
    osc2.connect(h2Gain)
    h2Gain.connect(noteGain)
    osc2.start(ctx.currentTime)
    osc2.stop(ctx.currentTime + duration)
    // 3rd harmonic — sine (brightness, that cheesy organ shimmer)
    const osc3 = ctx.createOscillator()
    osc3.type = 'sine'
    osc3.frequency.value = freq * 3
    const h3Gain = ctx.createGain()
    h3Gain.gain.value = vol * 0.2
    osc3.connect(h3Gain)
    h3Gain.connect(noteGain)
    osc3.start(ctx.currentTime)
    osc3.stop(ctx.currentTime + duration)
    noteGain.connect(gain)
  }, [getCtx])

  const playNote = useCallback((freq: number, duration: number, type: OscillatorType = 'square', vol = 0.15) => {
    const { ctx, gain } = getCtx()
    const osc = ctx.createOscillator()
    const noteGain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    noteGain.gain.setValueAtTime(vol, ctx.currentTime)
    noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(noteGain)
    noteGain.connect(gain)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  }, [getCtx])

  const playDrum = useCallback((type: 'kick' | 'snare' | 'hat') => {
    const { ctx, gain } = getCtx()
    if (type === 'kick') {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(150, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.15)
      g.gain.setValueAtTime(0.3, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      osc.connect(g)
      g.connect(gain)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.15)
    } else if (type === 'snare') {
      const bufferSize = ctx.sampleRate * 0.1
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.15, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
      noise.connect(g)
      g.connect(gain)
      noise.start(ctx.currentTime)
    } else {
      const bufferSize = ctx.sampleRate * 0.03
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 8000
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.08, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03)
      noise.connect(hp)
      hp.connect(g)
      g.connect(gain)
      noise.start(ctx.currentTime)
    }
  }, [getCtx])

  const playModemSound = useCallback(() => {
    const { ctx, gain } = getCtx()
    // Classic 56k handshake sweep
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const g = ctx.createGain()
    osc1.type = 'sawtooth'
    osc2.type = 'square'
    osc1.frequency.setValueAtTime(1000, ctx.currentTime)
    osc1.frequency.linearRampToValueAtTime(2400, ctx.currentTime + 0.5)
    osc1.frequency.linearRampToValueAtTime(300, ctx.currentTime + 1.0)
    osc1.frequency.linearRampToValueAtTime(1800, ctx.currentTime + 1.5)
    osc2.frequency.setValueAtTime(2600, ctx.currentTime)
    osc2.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.8)
    osc2.frequency.linearRampToValueAtTime(2200, ctx.currentTime + 1.5)
    g.gain.setValueAtTime(0.06, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5)
    osc1.connect(g)
    osc2.connect(g)
    g.connect(gain)
    osc1.start(ctx.currentTime)
    osc2.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 2.5)
    osc2.stop(ctx.currentTime + 2.5)
  }, [getCtx])

  const startTrack = useCallback((trackIndex: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    stepRef.current = 0
    trackRef.current = trackIndex
    const track = PLAYLIST[trackIndex]
    const scale = SCALES[track.key] || SCALES['C']
    const melody = MELODIES[trackIndex] || MELODIES[0]
    const bass = BASS_PATTERNS[trackIndex] || BASS_PATTERNS[0]
    const drumStyle = DRUM_STYLES[trackIndex] || 'standard'
    const waveType = track.wave || 'square'
    const msPerBeat = (60 / track.bpm) * 1000 / 2 // 8th notes

    intervalRef.current = setInterval(() => {
      const step = stepRef.current

      // Melody — use track-specific waveform
      const melodyIdx = melody[step % melody.length]
      const baseIdx = 5 // start from middle of scale
      const noteIdx = Math.max(0, Math.min(scale.length - 1, baseIdx + melodyIdx))
      const noteFreq = NOTES[scale[noteIdx]]
      if (noteFreq) {
        const melVol = drumStyle === 'none' ? 0.08 : 0.1
        if (trackIndex === 1) {
          // KEYBOARD CAT — cheesy organ with sustained notes
          playOrgan(noteFreq, msPerBeat / 1000 * 1.2, 0.1)
        } else {
          playNote(noteFreq, msPerBeat / 1000 * 0.8, waveType as OscillatorType, melVol)
        }
        // Harmony on certain tracks (adds richness)
        if (trackIndex === 2 || trackIndex === 7) { // Sandstorm + Hampster get octave doubling
          playNote(noteFreq * 2, msPerBeat / 1000 * 0.4, 'square', 0.04)
        }
        if (trackIndex === 11) { // AIM gets dreamy chord pads
          playNote(noteFreq * 1.5, msPerBeat / 1000 * 1.5, 'sine', 0.05)
        }
      }

      // Bass (every 2 steps)
      if (step % 2 === 0) {
        const bassIdx = bass[Math.floor(step / 2) % bass.length]
        const bassNoteIdx = Math.max(0, Math.min(scale.length - 1, bassIdx))
        const bassFreq = NOTES[scale[bassNoteIdx]]
        if (bassFreq) {
          if (trackIndex === 1) {
            // Keyboard Cat — organ bass (left hand boogie-woogie)
            playOrgan(bassFreq / 2, msPerBeat / 1000 * 1.8, 0.1)
          } else {
            const bassType: OscillatorType = trackIndex === 2 ? 'sawtooth' : 'triangle'
            playNote(bassFreq / 2, msPerBeat / 1000 * 1.5, bassType, 0.12)
          }
        }
      }

      // Drums — style-dependent patterns
      if (drumStyle === 'standard' || drumStyle === 'funk') {
        if (step % 4 === 0) playDrum('kick')
        if (step % 4 === 2) playDrum('snare')
        if (step % 2 === 0) playDrum('hat')
        if (drumStyle === 'funk' && step % 8 === 3) playDrum('kick') // offbeat kick
      } else if (drumStyle === 'trance') {
        // Four on the floor, hats on every 8th
        if (step % 2 === 0) playDrum('kick')
        playDrum('hat')
        if (step % 4 === 2) playDrum('snare')
      } else if (drumStyle === 'jazzy') {
        // Swing feel — kick on 1, snare loose, lots of hats
        if (step % 8 === 0) playDrum('kick')
        if (step % 8 === 3 || step % 8 === 6) playDrum('snare')
        if (step % 2 === 0) playDrum('hat')
        if (step % 3 === 0) playDrum('hat') // triplet feel
      } else if (drumStyle === 'boogie') {
        // Keyboard Cat — shuffle groove, bouncy like a cheap drum machine
        if (step % 4 === 0) playDrum('kick')
        if (step % 4 === 2) playDrum('kick') // double kick for boogie
        if (step % 8 === 2 || step % 8 === 6) playDrum('snare')
        if (step % 2 === 0) playDrum('hat')
        if (step % 4 === 1) playDrum('hat') // shuffle hat on the "and"
      } else if (drumStyle === 'chaos') {
        // Modem track — random percussive hits
        if (Math.random() > 0.6) playDrum('hat')
        if (Math.random() > 0.8) playDrum('kick')
        if (Math.random() > 0.85) playDrum('snare')
      } else if (drumStyle === 'march') {
        if (step % 4 === 0) playDrum('kick')
        if (step % 4 === 0) playDrum('snare')
        if (step % 2 === 0) playDrum('hat')
      } else if (drumStyle === 'fast') {
        // Hampster dance — double time everything
        playDrum('hat')
        if (step % 2 === 0) playDrum('kick')
        if (step % 2 === 1) playDrum('snare')
      } else if (drumStyle === 'tribal') {
        // Badger — emphasis on 1 and 3
        if (step % 4 === 0) { playDrum('kick'); playDrum('kick') }
        if (step % 4 === 2) playDrum('snare')
        if (step % 8 === 6) playDrum('hat')
      } else if (drumStyle === 'lofi') {
        // Sparse, dusty
        if (step % 8 === 0) playDrum('kick')
        if (step % 8 === 4) playDrum('snare')
        if (step % 4 === 0) playDrum('hat')
      } else if (drumStyle === 'gentle') {
        if (step % 4 === 0) playDrum('kick')
        if (step % 8 === 4) playDrum('hat')
      }
      // 'none' = no drums (AIM pad track)

      stepRef.current = step + 1
    }, msPerBeat)
  }, [playNote, playOrgan, playDrum])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const setVolume = useCallback((v: number) => {
    if (gainRef.current) gainRef.current.gain.value = v
  }, [])

  return { startTrack, stop, playModemSound, setVolume }
}

export default function WinampPlayer() {
  const [playing, setPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [minimized, setMinimized] = useState(false)
  const [showPlaylist, setShowPlaylist] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [connected, setConnected] = useState(false)
  const [showConnectPopup, setShowConnectPopup] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [volume, setVolumeState] = useState(75)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const audio = useChiptuneEngine()

  // Draggable title bar
  const handleDragStart = (e: ReactMouseEvent) => {
    e.preventDefault()
    const el = (e.target as HTMLElement).closest('[data-winamp-container]') as HTMLElement
    if (!el) return
    const rect = el.getBoundingClientRect()
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    setIsDragging(true)
  }

  useEffect(() => {
    if (!isDragging) return
    const handleMove = (e: globalThis.MouseEvent) => {
      setDragPos({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      })
    }
    const handleUp = () => setIsDragging(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [isDragging])

  useEffect(() => {
    if (!playing) return
    const i = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(i)
  }, [playing])

  // Sync audio engine with playing state
  useEffect(() => {
    if (playing) {
      audio.startTrack(currentTrack)
    } else {
      audio.stop()
    }
    return () => audio.stop()
  }, [playing, currentTrack, audio])

  const handleConnect = () => {
    setShowConnectPopup(true)
    audio.playModemSound() // 56k dialup screech!
    setTimeout(() => {
      setConnected(true)
      setShowConnectPopup(false)
      setPlaying(true)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 5000)
    }, 3000)
  }

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value)
    setVolumeState(v)
    audio.setVolume(v / 500) // scale 0-100 to 0-0.2
  }

  const nextTrack = () => {
    setCurrentTrack(t => (t + 1) % PLAYLIST.length)
    setElapsed(0)
  }

  const prevTrack = () => {
    setCurrentTrack(t => t === 0 ? PLAYLIST.length - 1 : t - 1)
    setElapsed(0)
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-[80] cursor-pointer" onClick={() => setMinimized(false)}
        style={{
          background: '#232323', border: '2px solid #404040', padding: '4px 12px',
          fontFamily: 'Tahoma, sans-serif', fontSize: '10px', color: '#0FFF50',
        }}>
        ▶ Winamp {playing ? '(playing)' : '(paused)'}
      </div>
    )
  }

  return (
    <>
      {/* Connected toast */}
      {showToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] px-6 py-3" style={{
          background: '#000', border: '2px solid #0FFF50',
          boxShadow: '0 0 20px rgba(15, 255, 80, 0.3), 4px 4px 0 rgba(0,0,0,0.4)',
          fontFamily: '"Comic Sans MS", cursive',
          animation: 'fallIn 0.4s ease-out',
        }}>
          <p className="text-sm font-bold" style={{ color: '#0FFF50' }}>
            📡 Connected at 56,000 bps
          </p>
          <p className="text-xs" style={{ color: '#FFB81C' }}>
            69 new chaotic listings found in your area
          </p>
          <p className="text-[10px] mt-1" style={{ color: '#555' }}>
            (none of them are real)
          </p>
        </div>
      )}

      {/* Connect popup */}
      {showConnectPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="win98-window" style={{ width: '320px' }}>
            <div className="win98-titlebar">
              <span className="win98-titlebar-text">Connecting...</span>
            </div>
            <div className="win98-body text-center py-6">
              <p className="text-sm mb-2" style={{ fontFamily: 'Tahoma, sans-serif' }}>
                📡 Connecting at 56,000 bps...
              </p>
              <p className="text-xs" style={{ color: '#666' }}>
                ██████████░░░░░ 67%
              </p>
              <p className="text-xs mt-2 blink" style={{ color: 'green' }}>
                CARRIER DETECTED
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Winamp window — hidden on mobile, draggable, default bottom-right */}
      <div data-winamp-container className="fixed z-[80] select-none hidden md:block" style={{
        width: '275px',
        backgroundImage: 'url(/assets/winamp-skin.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: '4px',
        overflow: 'hidden',
        ...(dragPos
          ? { left: `${dragPos.x}px`, top: `${dragPos.y}px` }
          : { right: '12px', bottom: '80px' }
        ),
      }}>
        {/* Title bar — drag handle */}
        <div
          onMouseDown={handleDragStart}
          style={{
            background: 'linear-gradient(180deg, #3a3a3a 0%, #232323 40%, #1a1a1a 100%)',
            border: '1px solid #505050',
            borderBottom: 'none',
            padding: '2px 4px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}>
          <div className="flex gap-1">
            <button onClick={() => setMinimized(true)} style={{ width: '9px', height: '9px', background: '#FFB81C', border: '1px solid #806000', fontSize: '0', cursor: 'pointer' }} />
            <button onClick={() => setMinimized(true)} style={{ width: '9px', height: '9px', background: '#FF10F0', border: '1px solid #800080', fontSize: '0', cursor: 'pointer' }} />
          </div>
          <span className="blink" style={{
            fontFamily: 'Tahoma, sans-serif', fontSize: '8px', color: '#0FFF50',
            letterSpacing: '0.5px', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px',
          }}>
            Winamp 2.91 — ILLEGAL DEALS @ 56k
          </span>
          <button onClick={() => setMinimized(true)} style={{
            width: '9px', height: '9px', background: '#FF6600', border: '1px solid #804000',
            fontSize: '0', cursor: 'pointer',
          }} />
        </div>

        {/* Main display */}
        <div style={{
          background: '#000', border: '1px solid #505050',
          borderTop: '1px solid #303030', padding: '8px',
        }}>
          {/* Track info display */}
          <div style={{
            background: '#0a0a0a', border: '1px inset #333',
            padding: '6px 8px', marginBottom: '6px',
          }}>
            <div className="flex justify-between items-center mb-1">
              <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#0FFF50' }}>
                {playing ? '▶' : '■'} {currentTrack + 1}/{PLAYLIST.length}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#0FFF50' }}>
                {formatTime(elapsed)}
              </span>
            </div>
            <div style={{
              fontFamily: 'monospace', fontSize: '9px', color: '#0FFF50',
              overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            }}>
              {PLAYLIST[currentTrack].title}
            </div>
            <div className="flex items-center gap-1 mt-1" style={{ fontSize: '8px', color: '#006600' }}>
              <span>128kbps</span>
              <span>44kHz</span>
              <span>stereo</span>
              {connected && <span style={{ color: '#0FFF50' }}>● 56k</span>}
            </div>
          </div>

          {/* Equalizer */}
          <div style={{
            background: '#0a0a0a', border: '1px inset #333',
            padding: '4px 6px', marginBottom: '6px',
            display: 'flex', alignItems: 'flex-end', gap: '2px', height: '28px',
          }}>
            {playing ? (
              Array.from({ length: 20 }).map((_, i) => (
                <EQBar key={i} color={i % 3 === 0 ? '#FF10F0' : '#0FFF50'} maxH={20} />
              ))
            ) : (
              Array.from({ length: 20 }).map((_, i) => (
                <div key={i} style={{ width: '3px', height: '3px', background: '#003300' }} />
              ))
            )}
          </div>

          {/* Transport controls */}
          <div className="flex items-center justify-center gap-1">
            {[
              { label: '⏮', action: prevTrack },
              { label: playing ? '⏸' : '▶', action: () => { setPlaying(!playing); if (!connected) handleConnect() } },
              { label: '⏹', action: () => { setPlaying(false); setElapsed(0) } },
              { label: '⏭', action: nextTrack },
            ].map((btn, i) => (
              <button key={i} onClick={btn.action} style={{
                width: '28px', height: '18px',
                background: 'linear-gradient(180deg, #4a4a4a, #2a2a2a)',
                border: '1px solid', borderColor: '#606060 #1a1a1a #1a1a1a #606060',
                color: '#ccc', fontSize: '10px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {btn.label}
              </button>
            ))}
            <button onClick={handleConnect} style={{
              padding: '2px 8px', marginLeft: '8px',
              background: connected ? '#003300' : 'linear-gradient(180deg, #4a4a4a, #2a2a2a)',
              border: '1px solid', borderColor: '#606060 #1a1a1a #1a1a1a #606060',
              color: connected ? '#0FFF50' : '#FFB81C',
              fontSize: '8px', fontFamily: 'Tahoma, sans-serif', cursor: 'pointer',
              fontWeight: 700,
            }}>
              {connected ? '● ONLINE' : 'CONNECT'}
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 mt-1 px-1">
            <span style={{ fontSize: '8px', color: '#666' }}>VOL</span>
            <div style={{ flex: 1, position: 'relative', height: '12px', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', width: '100%', height: '4px', background: '#1a1a1a', border: '1px inset #333' }}>
                <div style={{ width: `${volume}%`, height: '100%', background: 'linear-gradient(90deg, #0FFF50, #FFB81C)' }} />
              </div>
              <input type="range" min="0" max="100" value={volume} onChange={handleVolume}
                style={{
                  position: 'absolute', width: '100%', height: '12px',
                  opacity: 0, cursor: 'pointer', margin: 0,
                }} />
            </div>
            <span style={{ fontSize: '7px', color: '#0FFF50', minWidth: '20px', textAlign: 'right' }}>{volume}%</span>
          </div>
        </div>

        {/* Playlist */}
        {showPlaylist && (
          <div style={{
            background: '#0a0a0a', border: '1px solid #505050',
            borderTop: '1px solid #303030', maxHeight: '120px', overflowY: 'auto',
          }}>
            <div style={{
              background: '#1a1a1a', padding: '2px 6px',
              borderBottom: '1px solid #333',
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '8px', color: '#0FFF50', fontFamily: 'Tahoma, sans-serif' }}>
                PLAYLIST ({PLAYLIST.length} tracks)
              </span>
              <button onClick={() => setShowPlaylist(false)} style={{
                background: 'none', border: 'none', color: '#666', fontSize: '8px', cursor: 'pointer',
              }}>▾</button>
            </div>
            {PLAYLIST.map((track, i) => (
              <div key={i} onClick={() => { setCurrentTrack(i); setElapsed(0) }}
                className="flex justify-between items-center px-2 py-0.5 cursor-pointer"
                style={{
                  background: i === currentTrack ? '#003300' : 'transparent',
                  borderBottom: '1px solid #1a1a1a',
                }}>
                <span style={{
                  fontFamily: 'monospace', fontSize: '9px',
                  color: i === currentTrack ? '#0FFF50' : '#888',
                  overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                }}>
                  {i + 1}. {track.title}
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#555', flexShrink: 0 }}>
                  {track.duration}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
