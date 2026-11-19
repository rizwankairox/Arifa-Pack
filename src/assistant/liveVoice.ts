/*
  Live voice through the Arifa backend: a LiveKit room with the voice agent (WEBSITE_API.pdf §3.3).

  POST /v1/public/sessions/{id}/voice gives a room token; we join with livekit-client, publish the
  microphone and play the agent's audio. The agent itself plays the recording notice first, and
  "stop" makes it wait: nothing for the page to do. The token admits one room for 30 minutes; a
  new one is asked for if it runs out.

  livekit-client is only downloaded when a visitor actually turns the mic on.
*/
import { voiceRoom } from '@/lib/arifaApi';

export type LiveVoice = {
  /** leave the room (mic off) */
  stop: () => Promise<void>;
  /** mute or unmute the visitor's microphone */
  mute: (v: boolean) => Promise<void>;
};

type Handlers = {
  /** 'listening' | 'speaking' (the agent is talking) | 'off' */
  onState: (s: 'listening' | 'speaking' | 'off') => void;
  /** a finished line, from the visitor (`me`) or the agent */
  onLine: (text: string, me: boolean) => void;
  /** the mic level, 0–1, for the leaf's glow */
  onLevel?: (v: number) => void;
};

export async function startLiveVoice(language: string, h: Handlers): Promise<LiveVoice> {
  const lk = await import('livekit-client');
  const creds = await voiceRoom({ language });
  const room = new lk.Room({ adaptiveStream: true, dynacast: true });
  const audios: HTMLMediaElement[] = [];
  const seen = new Set<string>();
  const line = (id: string, text: string, me: boolean) => {
    if (!text?.trim() || seen.has(id)) return;
    seen.add(id);
    h.onLine(text.trim(), me);
  };

  // the agent's voice: play every audio track it publishes
  room.on(lk.RoomEvent.TrackSubscribed, (track) => {
    if (track.kind !== lk.Track.Kind.Audio) return;
    const el = track.attach();
    el.style.display = 'none';
    document.body.appendChild(el);
    audios.push(el);
  });
  room.on(lk.RoomEvent.TrackUnsubscribed, (track) => track.detach().forEach((el) => el.remove()));
  // who's talking: the agent speaking = "speaking"; otherwise we're listening
  room.on(lk.RoomEvent.ActiveSpeakersChanged, (speakers) => {
    const agent = speakers.some((p) => p.identity !== room.localParticipant.identity);
    h.onState(agent ? 'speaking' : 'listening');
    const me = speakers.find((p) => p.identity === room.localParticipant.identity);
    h.onLevel?.(me ? Math.min(1, me.audioLevel * 3) : 0);
  });
  // captions: LiveKit agents send transcripts as a text stream (newer) or transcription events (older)
  try {
    room.registerTextStreamHandler('lk.transcription', async (reader, from) => {
      const info = reader.info as any;
      if (info?.attributes?.['lk.transcription_final'] === 'false') return; // (only whole lines)
      const text = await reader.readAll();
      line(info?.id || `${from.identity}-${Date.now()}`, text, from.identity === room.localParticipant.identity);
    });
  } catch { /* older SDK: the event below covers it */ }
  room.on(lk.RoomEvent.TranscriptionReceived, (segments, participant) => {
    segments.filter((s) => s.final).forEach((s) => line(s.id, s.text, participant?.identity === room.localParticipant.identity));
  });
  room.on(lk.RoomEvent.Disconnected, () => h.onState('off'));

  await room.connect(creds.livekit_url, creds.token);
  await room.startAudio(); // (allowed: we're inside the visitor's tap)
  await room.localParticipant.setMicrophoneEnabled(true);
  h.onState('listening');

  // the token is good for 30 minutes: past that, the next call fails and the visitor taps again
  return {
    async stop() {
      await room.disconnect();
      audios.forEach((el) => el.remove());
      h.onState('off');
    },
    async mute(v) { await room.localParticipant.setMicrophoneEnabled(!v); },
  };
}
