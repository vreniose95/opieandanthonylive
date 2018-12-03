import { ActionContext, Store } from 'vuex';

import { RootState } from './types';
import { max, clamp } from '../util';

export interface Track<M> {
  url: string;
  metadata: M;
}

interface Playlist<M> {
  index: number;
  tracks: Array<Track<M>>;
}

type PlaybackStatus = 'paused' | 'loading' | 'playing';

interface State<M> {
  status: PlaybackStatus;
  elapsed: number;
  duration: number;
  muted: boolean;
  volume: number;
  playlist: Playlist<M>;
}

const mkGetters = <M>() => ({

  isPlaying: (s: State<M>) => s.status === 'playing',
  isLoading: (s: State<M>) => s.status === 'loading',
  isEmpty:   (s: State<M>) => s.playlist.tracks.length === 0,
  isMuted:   (s: State<M>) => s.muted,
  volume:    (s: State<M>) => s.muted ? 0 : s.volume,

  currentTrack: (s: State<M>) =>
    s.playlist.tracks.length === 0
      ? undefined
      : s.playlist.tracks[s.playlist.index],

});

const mkMutations = <M>() => ({

  status:   (s: State<M>, status: PlaybackStatus) => s.status = status,
  elapsed:  (s: State<M>, elapsed: number)        => s.elapsed = elapsed,
  duration: (s: State<M>, duration: number)       => s.duration = duration,
  muted:    (s: State<M>, b: boolean)             => s.muted = b,
  volume:   (s: State<M>, v: number)              => s.volume = v,

  prev: (s: State<M>) =>
    s.playlist.index = max(0, s.playlist.index - 1),

  next: (s: State<M>) =>
    s.playlist.index = (s.playlist.index + 1) % s.playlist.tracks.length,

  add: (s: State<M>, t: Track<M>) =>
    s.playlist.tracks.push(t),

});

const mkActions = <M>(audio: HTMLAudioElement) => ({

  muted: (ctx: ActionContext<State<M>, RootState>, b: boolean) => {
    ctx.commit('muted', b);
    audio.muted = b;
  },

  toggleMute: async (ctx: ActionContext<State<M>, RootState>) =>
    await ctx.dispatch('muted', !ctx.state.muted),

  volume: async (ctx: ActionContext<State<M>, RootState>, v: number) => {
    const value = clamp(0, v, 1);
    if (value === 0) {
      await ctx.dispatch('muted', true);
    } else {
      ctx.commit('volume', value);
      audio.volume = value;
      await ctx.dispatch('muted', false);
    }
  },

  pause: () =>
    audio.pause(),

  seek: (ctx: ActionContext<State<M>, RootState>, time: number) => {
    audio.currentTime = time;
    ctx.commit('elapsed', time);
  },

  play: async (ctx: ActionContext<State<M>, RootState>) => {
    if (ctx.state.playlist.tracks.length === 0) {
      return;
    }

    try {
      await audio.play();
    } catch (e) {
      if (e.code === e.ABORT_ERR) {
        // This only ever seems to occur when the `play()` action is
        // disrupted, for example by changing `audio.src`.  As best as I can
        // tell, ignoring this error is harmless.
        return;
      } else {
        // TOOD: Better error reporting capabilities.
        alert(e);
      }
    }
  },

  prev: async (ctx: ActionContext<State<M>, RootState>) => {
    const playlist = ctx.state.playlist;

    if (playlist.tracks.length === 0) {
      return;
    }

    if (playlist.index === 0 || audio.currentTime >= 3) {
      audio.currentTime = 0;
    } else {
      ctx.commit('prev');
      audio.src = playlist.tracks[playlist.index].url;
      await ctx.dispatch('play');
    }
  },

  next: async (ctx: ActionContext<State<M>, RootState>) => {
    const playlist = ctx.state.playlist;
    if (playlist.tracks.length === 0) {
      return;
    }

    ctx.commit('next');
    audio.src = playlist.tracks[playlist.index].url;

    if (playlist.index > 0) {
      await ctx.dispatch('play');
    }
  },

  add: (ctx: ActionContext<State<M>, RootState>, t: Track<M>) => {
    if (ctx.state.playlist.tracks.length === 0) {
      audio.src = t.url;
    }

    ctx.commit('add', t);
  },

});

export const mkPlugin = <M>(
  audio: HTMLAudioElement,
  moduleName = 'audio',
  tracks: Array<Track<M>> = [],
) => <S>(s: Store<S>) => {

  const state: State<M> = {
    status:   'paused',
    elapsed:  audio.currentTime,
    duration: audio.duration,
    muted:    audio.muted,
    volume:   audio.volume,
    playlist: { index: 0, tracks: [] },
  };

  s.registerModule(moduleName, {
    namespaced: true,
    state,
    getters: mkGetters<M>(),
    mutations: mkMutations<M>(),
    actions: mkActions<M>(audio),
  });

  audio.addEventListener('pause',   () => s.commit(`${moduleName}/status`, 'pause'));
  audio.addEventListener('playing', () => s.commit(`${moduleName}/status`, 'playing'));
  audio.addEventListener('waiting', () => s.commit(`${moduleName}/status`, 'loading'));

  audio.addEventListener('durationchange', () => s.commit(`${moduleName}/duration`, audio.duration));
  audio.addEventListener('timeupdate',     () => s.commit(`${moduleName}/elapsed`, audio.currentTime));

  for (const t of tracks) {
    s.dispatch(`${moduleName}/add`, t);
  }

};