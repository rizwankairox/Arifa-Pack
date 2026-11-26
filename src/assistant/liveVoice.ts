/*
  Live voice through the Arifa backend: a LiveKit room with the voice agent (WEBSITE_API.pdf §3.3).

  POST /v1/public/sessions/{id}/voice gives a room token; we join with livekit-client, publish the
  microphone and play the agent's audio. The agent itself plays the recording notice first, and
  "stop" makes it wait: nothing for the page to do. The token admits one room for 30 minutes; a
  new one is asked for if it runs out.

  The call's data channel (WEBSITE_API.md §2a, "Voice"), JSON on reliable topics:
    kx.site.actions   agent → page   a site action, the same as in the chat (onAction)
    kx.captions       agent → page   { role: visitor | assistant, text, final } (onLine)
    kx.chat.in        page → agent   text typed during the call, answered in the call (sendText)
    kx.site.context   page → agent   where the visitor is, when they move (sendContext)

  livekit-client is only downloaded when a visitor actually turns the mic on.

  A call carries on across pages (assistant.ts rejoins it on the next page: same session, same room,
  a fresh token; the backend neither replays the recording notice nor greets again). A rejoining page
  hasn't been tapped yet: the mic is on again at once (that also lets most browsers play the agent's
  voice), and if a browser still holds the sound back, `onNeedTap` asks for one tap and `resume()` plays it.
*/
import { voiceRoom, siteContext, type SiteAction, type SiteContext } from '@/lib/arifaApi';

export type LiveVoice = {
  /** leave the room (mic off) */
  stop: () => Promise<void>;
  /** mute or unmute the visitor's microphone */
  mute: (v: boolean) => Promise<void>;
  /** text typed during the call: the agent answers it in the call */
  sendText: (text: string) => void;
  /** where the visitor is now (sent on its own when they open or close a product) */
  sendContext: (ctx?: SiteContext) => void;
  /** play the agent's voice after the browser held it back (call from a tap) */
  resume: () => Promise<void>;
};

type Handlers = {
  /** 'listening' | 'speaking' (the agent is talking) | 'off' */
  onState: (s: 'listening' | 'speaking' | 'off') => void;
  /** a finished line, from the visitor (`me`) or the agent */
  onLine: (text: string, me: boolean) => void;
  /** the mic level, 0–1, for the leaf's glow */
  onLevel?: (v: number) => void;
  /** a site action from the agent (show a family, open a product, go to a page…) */
  onAction?: (a: SiteAction) => void;
  /** the browser won't play the agent's voice until the visitor taps (a call rejoined on a new page) */
  onNeedTap?: (needed: boolean) => void;
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
      if (!captioned) line(info?.id || `${from.identity}-${Date.now()}`, text, from.identity === room.localParticipant.identity);
    });
  } catch { /* older SDK: the event below covers it */ }
  room.on(lk.RoomEvent.TranscriptionReceived, (segments, participant) => {
    if (!captioned) segments.filter((s) => s.final).forEach((s) => line(s.id, s.text, participant?.identity === room.localParticipant.identity));
  });
  // the agent's site actions and captions (and the reverse direction: sendText, sendContext below)
  let captioned = false; // (once kx.captions arrive, they are the captions; the transcripts step aside)
  room.on(lk.RoomEvent.DataReceived, (payload, _participant, _kind, topic) => {
    let data: any;
    try { data = JSON.parse(new TextDecoder().decode(payload)); } catch { return; }
    if (topic === 'kx.site.actions') h.onAction?.(data);
    else if (topic === 'kx.captions' && data?.final && data.text) {
      captioned = true;
      line(`cap-${data.role}-${data.text}`, data.text, data.role === 'visitor');
    }
  });
  room.on(lk.RoomEvent.Disconnected, () => h.onState('off'));
  room.on(lk.RoomEvent.AudioPlaybackStatusChanged, () => h.onNeedTap?.(!room.canPlaybackAudio));

  const send = (topic: string, data: unknown) => {
    room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(data)), { reliable: true, topic }).catch(() => { /* call ending */ });
  };

  await room.connect(creds.livekit_url, creds.token);
  // the mic first: a page that is capturing the microphone may play sound without a tap
  await room.localParticipant.setMicrophoneEnabled(true);
  try { await room.startAudio(); } catch { /* held back: onNeedTap below */ }
  if (!room.canPlaybackAudio) h.onNeedTap?.(true);
  h.onState('listening');
  send('kx.site.context', siteContext({ input: 'voice' }));

  // the token is good for 30 minutes: past that, the next call fails and the visitor taps again
  return {
    async stop() {
      await room.disconnect();
      audios.forEach((el) => el.remove());
      h.onState('off');
    },
    async mute(v) { await room.localParticipant.setMicrophoneEnabled(!v); },
    sendText(text) { send('kx.chat.in', { text, context: siteContext({ input: 'text' }) }); },
    sendContext(ctx) { send('kx.site.context', ctx || siteContext({ input: 'voice' })); },
    async resume() { await room.startAudio(); h.onNeedTap?.(!room.canPlaybackAudio); },
  };
}
