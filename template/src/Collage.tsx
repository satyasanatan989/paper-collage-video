/* Paper-collage engine: reads storyboard.json + beats.json and lays every station out on one scrapbook wall. */
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Img, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import sbRaw from './storyboard.json';
import beatsRaw from './beats.json';

type El = Record<string, any> & {type: string};
type Station = {start: number; sheet?: string; rot?: number; elements: El[]};
const sb = sbRaw as any;
const STATIONS: Station[] = sb.stations;
const DUR: number = sb.duration;
const FONT: string = sb.font ?? 'Rozha One';
const PAL: Record<string, [string, string]> = {
  cream: ['#EFE6D2', '#1B1A17'], vermilion: ['#D9381E', '#FFF4DC'], marigold: ['#F2A71B', '#1B1A17'],
  indigo: ['#1F2F6B', '#FFE7A8'], ink: ['#1B1A17', '#F2A71B'], teal: ['#167A72', '#FFF4DC'], pink: ['#F2A1B5', '#1B1A17'],
  ...(sb.palette ?? {}),
};
const BEATS: number[] = (() => {
  const b = (beatsRaw as any).beats as number[] | undefined;
  if (b && b.length) return b;
  const step = 60 / (sb.bpm ?? 120), off = sb.beatOffset ?? 0;
  return Array.from({length: Math.ceil(DUR / step) + 2}, (_, i) => off + i * step);
})();

/* ---------- maths ---------- */
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const outCubic = (p: number) => 1 - (1 - p) ** 3;
const inOut = (p: number) => (p < .5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
const outBack = (p: number) => 1 + 2.2 * (p - 1) ** 3 + 1.2 * (p - 1) ** 2;
const rnd = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const beatAfter = (start: number, n: number) => {
  const i = BEATS.findIndex((b) => b >= start - .03);
  return i < 0 ? start + n * .5 : BEATS[Math.min(i + Math.floor(n), BEATS.length - 1)] + (n % 1) * .5;
};
const lastBeat = (t: number) => { let b = -9; for (const x of BEATS) { if (x <= t) b = x; else break; } return b; };
const beatsBetween = (a: number, b: number) => BEATS.filter((x) => x >= a - .03 && x < b);
const when = (el: El, st: Station) => (el.at != null ? el.at : beatAfter(st.start, el.beat ?? 0));

type Ctx = {t: number; h: number; f: number; W: number; H: number};

/* ---------- the slap: oversized + spun, lands flat with a squash, then a hand-made wobble ---------- */
const enter = (c: Ctx, at: number, seed: number, rot = 0, mode = 'slap'): React.CSSProperties | null => {
  const p = (c.h - at) / (mode === 'drop' ? .35 : .2);
  if (p < 0) return null;
  const e = outCubic(clamp(p));
  const tick = Math.floor(c.f / 4);
  const jx = (rnd(seed + tick) - .5) * 2.4, jy = (rnd(seed + tick + 50) - .5) * 2.4, jr = (rnd(seed + tick + 90) - .5) * .5;
  let tr = '';
  if (mode === 'slap') {
    const squash = p > 1 && p < 1.8 ? .03 * Math.sin((p - 1) / .8 * Math.PI) : 0;
    tr = `rotate(${rot + (seed % 2 ? 11 : -11) * (1 - e) + jr}deg) scale(${lerp(1.5, 1, e) - squash})`;
  } else if (mode === 'pop') tr = `rotate(${rot + jr}deg) scale(${outBack(clamp(p))})`;
  else if (mode === 'drop') tr = `translateY(${lerp(-c.H, 0, outCubic(clamp(p)))}px) rotate(${rot + (1 - e) * 25 + jr}deg)`;
  else tr = `rotate(${rot + jr}deg)`;
  return {opacity: mode === 'none' ? 1 : clamp(p / .2), transform: `translate(${jx}px,${jy}px) ${tr}`};
};
const SHADOW = 'drop-shadow(5px 11px 7px rgba(20,12,4,.42))';

/* extra motion layered on top of the entrance */
const motion = (c: Ctx, el: El, st: Station, at: number) => {
  let x = 0, y = 0, s = 1, r = 0;
  if (el.pulse) { const d = c.t - lastBeat(c.t); s *= c.t >= at ? 1 + (el.pulse === true ? .14 : el.pulse) * Math.exp(-d * 7) : 1; }
  if (el.float) { y += Math.sin(c.h * 1.7 + (el.x ?? 0)) * el.float; }
  if (el.spin) { r += (c.h - at) * el.spin; }
  if (el.move) {
    const m = el.move, ms = m.at != null ? m.at : beatAfter(st.start, m.beat ?? 0);
    let p = 0;
    if (m.ease === 'beats') { const n = beatsBetween(ms, c.h + .001).length; p = outCubic(clamp(n / (m.steps ?? 6))); }
    else p = (m.ease === 'out' ? outCubic : inOut)(clamp((c.h - ms) / (m.dur ?? 1)));
    x += (m.to?.[0] ?? 0) * p; y += (m.to?.[1] ?? 0) * p;
  }
  return `translate(${x}px,${y}px) rotate(${r}deg) scale(${s})`;
};

/* ---------- primitives ---------- */
const HEART = 'M100 172C22 112 0 72 0 45 0 15 25 0 50 0c22 0 40 12 50 30C110 12 128 0 150 0c25 0 50 15 50 45 0 27-22 67-100 127Z';
const TEAR_L = '-10,-10 100,-10 88,24 108,48 90,72 110,96 92,120 106,146 100,190 -10,190';
const TEAR_R = '210,-10 100,-10 88,24 108,48 90,72 110,96 92,120 106,146 100,190 210,190';
const HeartSvg: React.FC<{w: number; color: string; half?: 'l' | 'r'; id: string}> = ({w, color, half, id}) => (
  <svg viewBox="-8 -8 216 196" width={w} style={{display: 'block', overflow: 'visible'}}>
    {half && <clipPath id={id}><polygon points={half === 'l' ? TEAR_L : TEAR_R} /></clipPath>}
    <g clipPath={half ? `url(#${id})` : undefined}>
      <path d={HEART} fill={color} stroke="#F4ECDA" strokeWidth={8} strokeLinejoin="round" />
      <path d="M40 24c-14 3-22 14-22 26" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth={7} strokeLinecap="round" />
    </g>
  </svg>
);

const Icon: React.FC<{kind: string; d: number; c: Ctx; seed: number}> = ({kind, d, c, seed}) => {
  if (kind === 'marigold') return (
    <svg viewBox="-50 -50 100 100" width={d} height={d}>{Array.from({length: 11}, (_, i) => <ellipse key={i} cx={0} cy={-30} rx={11} ry={19} fill={i % 2 ? '#F2A71B' : '#EE7F12'} stroke="#B9500A" strokeWidth={1.5} transform={`rotate(${i * 32.7})`} />)}<circle r={15} fill="#C9560C" /></svg>);
  if (kind === 'star') return (
    <svg viewBox="-20 -20 40 40" width={d} height={d}><path d="M0-18 5-5 18 0 5 5 0 18-5 5-18 0-5-5Z" fill="#FFE7A8" stroke="#F4ECDA" strokeWidth={1.5} /></svg>);
  if (kind === 'petal') return <div style={{width: d, height: d, borderRadius: '50%', background: '#F7A8BC', border: '4px solid #F4ECDA'}} />;
  if (kind === 'lamp') {
    const fl = 1 + .1 * Math.sin(Math.floor(c.f / 3) * 2.4 + seed);
    return (<svg viewBox="-60 -80 120 120" width={d} style={{overflow: 'visible'}}><g transform={`scale(${fl})`}><circle cy={-34} r={44} fill="#F2A71B" opacity={.35} /><path d="M0 -8C-20 -26 -8 -46 0 -70 8 -46 20 -26 0 -8Z" fill="#FFD25A" stroke="#E2711D" strokeWidth={3} /></g><path d="M-50 -6C-34 30 34 30 50 -6Z" fill="#B85A24" stroke="#F4ECDA" strokeWidth={5} strokeLinejoin="round" /></svg>);
  }
  if (kind === 'confetti') return <div style={{width: d, height: d * .45, background: ['#D9381E', '#F2A71B', '#1F2F6B', '#EFE6D2'][seed % 4], border: '3px solid #F4ECDA'}} />;
  return <div style={{width: d, height: d, borderRadius: '50%', background: '#F2A71B', border: '5px solid #F4ECDA'}} />;
};

const Clock: React.FC<{el: El; st: Station; c: Ctx}> = ({el, st, c}) => {
  const d = el.d ?? 700, k = d / 740;
  const n = beatsBetween(st.start, c.h + .001).length;
  const d0 = c.h - lastBeat(c.h);
  const wob = Math.exp(-d0 * 9) * Math.sin(d0 * 40) * .12;
  return (
    <div style={{position: 'relative', width: d, height: d}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: '#F7F0E0', border: `${18 * k}px solid ${PAL[el.color ?? 'indigo'][0]}`, boxShadow: `0 0 0 ${9 * k}px #F4ECDA`}} />
      {Array.from({length: 12}, (_, i) => <div key={i} style={{position: 'absolute', left: d / 2 - 10 * k, top: 42 * k, width: 20 * k, height: (i % 3 ? 34 : 62) * k, background: '#1B1A17', transformOrigin: `${10 * k}px ${d / 2 - 42 * k}px`, transform: `rotate(${i * 30}deg)`}} />)}
      <div style={{position: 'absolute', left: d / 2 - 17 * k, top: d / 2 - 190 * k, width: 34 * k, height: 200 * k, background: '#1B1A17', transformOrigin: `${17 * k}px ${190 * k}px`, transform: `rotate(${30 * (n + wob)}deg)`}} />
      <div style={{position: 'absolute', left: d / 2 - 10 * k, top: d / 2 - 274 * k, width: 20 * k, height: 284 * k, background: '#D9381E', transformOrigin: `${10 * k}px ${274 * k}px`, transform: `rotate(${180 * (n + wob)}deg)`}} />
      <div style={{position: 'absolute', left: d / 2 - 30 * k, top: d / 2 - 30 * k, width: 60 * k, height: 60 * k, borderRadius: '50%', background: '#1B1A17'}} />
    </div>
  );
};

const Calendar: React.FC<{el: El; st: Station; c: Ctx}> = ({el, st, c}) => {
  const pages: string[] = el.pages ?? ['1', '2', '3', '4'];
  const w = el.w ?? 400, h = w * 1.18, start = when(el, st);
  return (
    <div style={{position: 'relative', width: w, height: h}}>
      <div style={{position: 'absolute', inset: 0, background: '#F4ECDA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontSize: w * .5, color: '#1B1A17', borderTop: `${w * .16}px solid ${PAL[el.color ?? 'vermilion'][0]}`}}>{el.last ?? ''}</div>
      {pages.map((_, i) => {
        const k = pages.length - 1 - i, at = beatAfter(start, k + 1), p = clamp((c.h - at) / .5);
        if (p >= 1) return null;
        return <div key={i} style={{position: 'absolute', inset: 0, background: '#F7F0E0', borderTop: `${w * .16}px solid ${PAL[el.color ?? 'vermilion'][0]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontSize: w * .5, color: '#1B1A17', transformOrigin: '10% 0', transform: `translate(${p * w * .6}px,${p * p * h * 2.2}px) rotate(${p * 58}deg)`}}>{pages[k]}</div>;
      })}
    </div>
  );
};

/* one element on a station */
const Element: React.FC<{el: El; st: Station; si: number; idx: number; c: Ctx}> = ({el, st, si, idx, c}) => {
  const at = when(el, st), seed = si * 100 + idx;
  const base: React.CSSProperties = {position: 'absolute', left: el.x ?? 0, top: el.y ?? 0, zIndex: el.z ?? (el.type === 'word' ? 6 : el.type === 'dots' ? 0 : 2)};

  if (el.type === 'dots') {
    const col = el.color ?? 'rgba(0,0,0,.12)', d = el.d ?? 800, sz = el.size ?? 30;
    return <div style={{...base, width: d, height: el.h ?? d, borderRadius: el.square ? 0 : '50%', backgroundImage: `radial-gradient(${col} 36%, transparent 39%)`, backgroundSize: `${sz}px ${sz}px`, backgroundPosition: `${c.h * 9}px ${c.h * -6}px`}} />;
  }
  if (el.type === 'burst') {
    const until = el.until ?? (STATIONS[si + 1]?.start ?? DUR);
    const times = el.every === 'beat' || el.every == null ? beatsBetween(Math.max(at, st.start), until) : [at];
    return <>{times.flatMap((b, k) => {
      const a = c.h - b; if (a < 0 || a > 1.1) return [];
      return Array.from({length: el.count ?? 10}, (_, q) => {
        const ang = q * (6.283 / (el.count ?? 10)) + k, r = outCubic(a / 1.1) * ((el.r ?? 420) + 200 * rnd(q + k));
        return <div key={`${k}-${q}`} style={{position: 'absolute', zIndex: el.z ?? 5, left: (el.x ?? 0) + r * Math.cos(ang), top: (el.y ?? 0) + r * Math.sin(ang) + a * a * 240, transform: `rotate(${a * 200 + q * 30}deg) scale(${1 - a * .55})`}}><Icon kind={el.kind ?? 'marigold'} d={el.d ?? 84} c={c} seed={q + k} /></div>;
      });
    })}</>;
  }
  if (el.type === 'sprinkle') {
    return <>{Array.from({length: el.count ?? 30}, (_, k) => {
      const t0 = at + k * (el.step ?? .06), p = clamp((c.h - t0) / .14);
      if (p <= 0) return null;
      return <div key={k} style={{position: 'absolute', zIndex: el.z ?? 3, left: (el.x ?? 0) + rnd(k + 3 + si) * (el.w ?? 400), top: (el.y ?? 0) + rnd(k + 40 + si) * (el.h ?? 300), transform: `scale(${outCubic(p)})`}}><Icon kind={el.kind ?? 'petal'} d={el.d ?? 42} c={c} seed={k} /></div>;
    })}</>;
  }
  if (el.type === 'orbit') {
    if (c.h < at) return null;
    return <>{Array.from({length: el.count ?? 12}, (_, k) => {
      const a = k * (6.283 / (el.count ?? 12)) + (c.h - at) * (el.speed ?? .5), r = (el.r ?? 400) * (1 + .2 * (rnd(k) - .5));
      return <div key={k} style={{position: 'absolute', zIndex: el.z ?? 4, left: (el.x ?? 0) + r * Math.cos(a) - (el.d ?? 54) / 2, top: (el.y ?? 0) + r * (el.squash ?? .95) * Math.sin(a) - (el.d ?? 54) / 2, opacity: clamp((c.h - at - k * .12) / .3)}}><Icon kind={el.kind ?? 'star'} d={el.d ?? 54} c={c} seed={k} /></div>;
    })}</>;
  }

  const e = enter(c, at, seed, el.rot ?? 0, el.in ?? 'slap');
  if (!e) return null;
  let inner: React.ReactNode = null;
  let shadow = SHADOW;
  if (el.type === 'word') {
    const key = el.color ?? 'cream', size = el.size ?? 150, fam = el.font ?? FONT;
    inner = <div style={{position: 'relative'}}>
      <Img src={staticFile(`tex/strip_${key}.webp`)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
      <div style={{position: 'relative', fontFamily: fam, fontSize: size, lineHeight: 1.28, color: el.textColor ?? PAL[key]?.[1] ?? '#1B1A17', padding: `${size * .06}px ${size * .46}px ${size * .14}px`, whiteSpace: 'nowrap'}}>{el.text}</div>
    </div>;
  } else if (el.type === 'image') {
    inner = <Img src={staticFile(el.src)} style={{width: el.w ?? 600, display: 'block'}} />;
  } else if (el.type === 'tape') {
    shadow = 'drop-shadow(1px 3px 2px rgba(20,12,4,.25))';
    inner = <div style={{width: el.w ?? 210, height: 62, background: 'rgba(238,218,160,.78)', clipPath: 'polygon(0 0,3% 12%,0 25%,3% 37%,0 50%,3% 62%,0 75%,3% 87%,0 100%,100% 100%,97% 87%,100% 75%,97% 62%,100% 50%,97% 37%,100% 25%,97% 12%,100% 0)'}} />;
  } else if (el.type === 'disc') {
    const d = el.d ?? 500;
    const rise = el.rise ? outCubic(clamp((c.h - at) / (el.rise.dur ?? 2))) : 1;
    const dy = el.rise ? lerp(el.rise.from ?? 600, 0, rise) : 0;
    inner = <div style={{width: d, height: d, borderRadius: '50%', background: PAL[el.color]?.[0] ?? el.color ?? '#F2A71B', boxShadow: `0 0 0 ${Math.max(6, d * .02)}px #F4ECDA`, transform: `translateY(${dy}px)`, position: 'relative', overflow: 'hidden'}}>
      {el.craters && [[.2, .26, .12], [.58, .18, .08], [.52, .58, .16], [.22, .66, .07]].map(([x, y, s], k) => <div key={k} style={{position: 'absolute', left: x * d, top: y * d, width: s * d, height: s * d, borderRadius: '50%', background: 'rgba(0,0,0,.09)'}} />)}
    </div>;
  } else if (el.type === 'heart') {
    const w = el.w ?? 300, color = PAL[el.color ?? 'vermilion']?.[0] ?? el.color;
    if (el.mend) {
      const m = outCubic(clamp((c.h - (el.mend.at ?? beatAfter(st.start, el.mend.beat ?? 1))) / .55));
      const gap = el.mend.gap ?? .33;
      inner = <div style={{position: 'relative', width: w, height: w * .9}}>
        <div style={{position: 'absolute', transform: `translate(${lerp(-w * gap, 0, m)}px,${lerp(w * .05, 0, m)}px) rotate(${lerp(-16, 0, m)}deg)`}}><HeartSvg w={w} color={color} half="l" id={`hl${seed}`} /></div>
        <div style={{position: 'absolute', transform: `translate(${lerp(w * gap, 0, m)}px,${lerp(-w * .04, 0, m)}px) rotate(${lerp(16, 0, m)}deg)`}}><HeartSvg w={w} color={color} half="r" id={`hr${seed}`} /></div>
      </div>;
    } else inner = <HeartSvg w={w} color={color} id={`h${seed}`} />;
  } else if (el.type === 'clock') inner = <Clock el={el} st={st} c={c} />;
  else if (el.type === 'calendar') inner = <Calendar el={el} st={st} c={c} />;
  else if (el.type === 'icon') inner = <Icon kind={el.kind ?? 'star'} d={el.d ?? 100} c={c} seed={seed} />;
  else if (el.type === 'text') {
    shadow = 'none';
    inner = <div style={{fontFamily: el.font ?? 'Caveat', fontSize: el.size ?? 70, color: el.textColor ?? '#1B1A17', whiteSpace: 'nowrap'}}>{el.text}</div>;
  }
  return <div style={{...base, ...e, filter: el.shadow === false ? 'none' : shadow}}><div style={{transform: motion(c, el, st, at)}}>{inner}</div></div>;
};

/* ---------- wall + camera ---------- */
const useLayout = (W: number, H: number) => {
  const n = STATIONS.length, cols = Math.min(sb.columns ?? 3, n), rows = Math.ceil(n / cols);
  const SX = W + 100, SY = H + 100;
  const cell = (i: number): [number, number] => { const r = Math.floor(i / cols), k = i % cols; return [r % 2 ? cols - 1 - k : k, r]; };
  const center = (i: number): [number, number] => { const [x, y] = cell(i); return [x * SX + W / 2, y * SY + H / 2]; };
  return {n, cols, rows, SX, SY, cell, center};
};

export const Collage: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, width: W, height: H} = useVideoConfig();
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([FONT, 'Caveat'].map((fam) => document.fonts.load(`80px "${fam}"`, 'पल Aa'))).then(() => continueRender(handle));
  }, [handle]);
  const t = f / fps, h = Math.floor(f / 2) * 2 / fps;
  const c: Ctx = {t, h, f, W, H};
  const L = useLayout(W, H);

  // camera: hold on a station with a slow push, whip to the next one around each station start
  let [x, y] = L.center(0), rot = 0, dip = 0, cur = 0;
  for (let i = 1; i < L.n; i++) {
    const p = clamp((t - (STATIONS[i].start - .24)) / .48);
    if (p > .5) cur = i;
    const [cx, cy] = L.center(i);
    x = lerp(x, cx, inOut(p)); y = lerp(y, cy, inOut(p));
    const s = Math.sin(p * Math.PI); rot += (i % 2 ? 3.2 : -3.2) * s; dip += .2 * s;
  }
  const end = STATIONS[cur + 1]?.start ?? DUR;
  let zoom = lerp(1, 1.055, clamp((t - STATIONS[cur].start) / Math.max(.1, end - STATIONS[cur].start)));
  zoom = (zoom + .018 * Math.exp(-(t - lastBeat(t)) * 7)) * (1 - dip);
  const fin = sb.finale ?? {at: DUR - 2.2, dur: 1.5};
  const q = fin === false ? 0 : inOut(clamp((t - fin.at) / (fin.dur ?? 1.5)));
  const fit = Math.min(W / (L.cols * L.SX), H / (L.rows * L.SY)) * .97;
  zoom = Math.exp(lerp(Math.log(zoom), Math.log(fit), q));
  x = lerp(x, (L.cols * L.SX - 100) / 2, q); y = lerp(y, (L.rows * L.SY - 100) / 2, q); rot *= 1 - q;

  const flyers: any[] = sb.flyers ?? [];
  return (
    <AbsoluteFill style={{background: '#1B1A17', overflow: 'hidden'}}>
      {sb.audio && <Audio src={staticFile(sb.audio)} />}
      <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${W / 2}px,${H / 2}px) rotate(${rot}deg) scale(${zoom}) translate(${-x}px,${-y}px)`}}>
        <div style={{position: 'absolute', left: -W, top: -H, width: L.cols * L.SX + 2 * W, height: L.rows * L.SY + 2 * H, backgroundImage: `url(${staticFile('tex/wall.jpg')})`, backgroundSize: '1400px 1400px'}} />
        {STATIONS.map((st, si) => {
          if (!(q > 0 || Math.abs(si - cur) <= 1)) return null;
          const [cx, cy] = L.cell(si);
          return (
            <div key={si} style={{position: 'absolute', left: cx * L.SX, top: cy * L.SY, width: W, height: H}}>
              <Img src={staticFile(`tex/sheet_${st.sheet ?? 'cream'}.webp`)} style={{position: 'absolute', left: -80, top: -80, width: W + 160, height: H + 160, transform: `rotate(${st.rot ?? (si % 2 ? .4 : -.4)}deg)`}} />
              {st.elements.map((el, k) => <Element key={k} el={el} st={st} si={si} idx={k} c={c} />)}
            </div>
          );
        })}
        {flyers.map((fl, k) => {
          const keys: any[] = fl.keys;
          if (t < keys[0].t || (fl.hideAfter && t > fl.hideAfter)) return null;
          let j = keys.findIndex((kk) => kk.t > t); if (j < 0) j = keys.length - 1;
          const a = keys[Math.max(0, j - 1)], b = keys[j], p = j === 0 ? 0 : clamp((t - a.t) / Math.max(.01, b.t - a.t));
          const pos = (kk: any) => { const [cx, cy] = L.cell(kk.station); return [cx * L.SX + kk.x, cy * L.SY + kk.y]; };
          const [ax, ay] = pos(a), [bx, by] = pos(b), e2 = inOut(p);
          const flap = t < keys[keys.length - 1].t ? Math.sin(Math.floor(f / 2) * 1.7) * 7 : 0;
          return <div key={k} style={{position: 'absolute', left: lerp(ax, bx, e2), top: lerp(ay, by, e2) - (b.arc ?? 150) * Math.sin(p * Math.PI), width: fl.w ?? 320, zIndex: 40, transform: `rotate(${flap + (fl.rot ?? -6)}deg)`, filter: SHADOW}}><Img src={staticFile(fl.src)} style={{width: '100%'}} /></div>;
        })}
      </div>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 62%, rgba(30,16,6,.34) 100%)'}} />
      <AbsoluteFill style={{background: '#1B1A17', opacity: Math.max(clamp(1 - t / .35), clamp((t - (DUR - .5)) / .5))}} />
    </AbsoluteFill>
  );
};
