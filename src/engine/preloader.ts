/* Прелоадер: WebGL-планета (полосы, атмосфера, HUD-сетка, сканирующий луч, звёзды, туманность),
   поверх — орбиты со спутниками и Луной на canvas 2D (с честным перекрытием планетой), HUD-циферблат прогресса.
   На выходе камера «ныряет» в планету. */
import { gsap, onTick, S, t, U } from './core';
import type { Sequence } from './sequence';
import * as T from './text';

const TAU = Math.PI * 2;

const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';

const FRAG = [
  '#extension GL_OES_standard_derivatives : enable',
  'precision highp float;',
  'uniform vec2 uRes;',
  'uniform float uTime;',
  'uniform vec3 uPlanet;', // центр (px, origin снизу-слева) и радиус (px)
  'uniform vec3 uLight;',
  'uniform float uScan;',
  'uniform float uDpr;',
  'uniform float uSpace;', // видимость звёзд/туманности (гаснут при «нырке»)

  'vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}',
  'vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}',
  'vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}',
  'vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}',
  'float snoise(vec3 v){',
  '  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);',
  '  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);',
  '  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);',
  '  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;',
  '  i=mod289(i);',
  '  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));',
  '  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;',
  '  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);',
  '  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);',
  '  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);',
  '  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));',
  '  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;',
  '  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);',
  '  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));',
  '  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;',
  '  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;',
  '  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));',
  '}',
  'float fbm(vec3 p){float f=0.0;float a=0.5;for(int i=0;i<4;i++){f+=a*snoise(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=0.5;}return f;}',
  'float fbm3(vec3 p){float f=0.0;float a=0.5;for(int i=0;i<3;i++){f+=a*snoise(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=0.5;}return f;}',
  'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
  'mat3 rotY(float a){float c=cos(a);float s=sin(a);return mat3(c,0.0,-s,0.0,1.0,0.0,s,0.0,c);}',
  'mat3 rotX(float a){float c=cos(a);float s=sin(a);return mat3(1.0,0.0,0.0,0.0,c,s,0.0,-s,c);}',

  'vec3 stars(vec2 fc){',
  '  vec3 col=vec3(0.0);',
  '  for(int i=0;i<3;i++){',
  '    float fi=float(i);',
  '    float cell=(64.0+fi*42.0)*uDpr;',
  '    vec2 p=fc/cell+fi*17.13+vec2(uTime*0.006*(fi+1.0),0.0);',
  '    vec2 id=floor(p);vec2 f=fract(p)-0.5;',
  '    float h=hash(id+fi*3.1);',
  '    if(h>0.6){',
  '      vec2 off=vec2(hash(id+1.7),hash(id+9.3))-0.5;',
  '      float d=length((f-off*0.75)*cell)/uDpr;',
  '      float size=0.5+1.1*hash(id+4.2)*(1.0-fi*0.3);',
  '      float tw=0.55+0.45*sin(uTime*(0.8+h*2.5)+h*50.0);',
  '      float s=(1.0-smoothstep(0.0,size,d))+0.22*(1.0-smoothstep(0.0,size*4.5,d));',
  '      col+=mix(vec3(0.74,0.78,1.0),vec3(1.0,0.88,1.0),hash(id+2.2))*s*tw*(1.0-fi*0.25);',
  '    }',
  '  }',
  '  return col;',
  '}',

  'void main(){',
  '  vec2 fc=gl_FragCoord.xy;',
  '  vec2 uv=(fc-0.5*uRes)/uRes.y;',
  // космос: туманность + звёзды
  '  float neb=fbm3(vec3(uv*1.35,uTime*0.018));',
  '  vec3 space=vec3(0.010,0.008,0.026);',
  '  space+=mix(vec3(0.32,0.10,0.55),vec3(0.10,0.22,0.60),smoothstep(-0.6,0.6,uv.x+neb*0.6))*smoothstep(-0.1,0.75,neb)*0.2;',
  '  space+=stars(fc);',
  '  space*=uSpace;',
  // атмосфера вокруг планеты
  '  vec2 p=fc-uPlanet.xy;float R=uPlanet.z;float r=length(p);',
  '  vec3 L=normalize(uLight);',
  '  vec2 dir=p/max(r,1.0);',
  '  float side=smoothstep(-0.75,0.9,dot(dir,normalize(L.xy)));',
  '  float hgt=max(r-R,0.0)/R;',
  '  vec3 atmo=vec3(0.52,0.42,1.0)*exp(-hgt*9.0)*(0.1+1.1*side)+vec3(0.40,0.60,1.0)*exp(-hgt*32.0)*side*0.7;',
  '  vec3 outside=space+atmo;',
  // поверхность (координаты считаем для всех пикселей — производные вне ветвлений)
  '  float rr=min(r/R,1.0);',
  '  vec3 n=vec3(p/R,sqrt(max(0.0,1.0-rr*rr)));',
  '  vec3 q=rotY(uTime*0.07)*(rotX(0.38)*n);',
  '  float lon=atan(q.x,q.z)/6.2831853*24.0;',
  '  float lat=asin(clamp(q.y,-1.0,1.0))/3.1415926*12.0;',
  '  float wl=max(min(fwidth(lon),fwidth(fract(lon))),1e-4);',
  '  float wt=max(fwidth(lat),1e-4);',
  '  vec3 inside=vec3(0.0);',
  '  if(r<R+2.0){',
  '    float w=fbm(q*1.8+vec3(0.0,0.0,uTime*0.02));',
  '    float bands=0.5+0.5*sin((q.y+w*0.22)*16.0);',
  '    vec3 base=mix(vec3(0.05,0.035,0.12),vec3(0.21,0.12,0.40),bands);',
  '    base=mix(base,vec3(0.30,0.40,0.90),smoothstep(0.3,0.8,w)*0.45);',
  '    float ndl=dot(n,L);',
  '    float diff=smoothstep(-0.08,1.0,ndl);',
  '    vec3 c=base*(0.04+1.35*diff);',
  '    c+=vec3(0.65,0.35,1.0)*(1.0-smoothstep(0.0,0.22,abs(ndl)))*0.08;',
  // HUD-сетка широт/долгот и сканирующий луч
  '    float gx=1.0-smoothstep(0.0,wl*1.3,abs(fract(lon+0.5)-0.5));',
  '    float gy=1.0-smoothstep(0.0,wt*1.3,abs(fract(lat+0.5)-0.5));',
  '    float grid=max(gx,gy)*smoothstep(0.0,0.35,n.z)*(1.0-smoothstep(0.72,0.93,abs(q.y)));',
  '    float scan=exp(-pow((n.y-uScan)*7.0,2.0));',
  '    c+=vec3(0.58,0.50,1.0)*grid*(0.07+0.55*scan)*(1.0-diff*0.65);',
  '    c+=vec3(0.45,0.40,1.0)*scan*0.06;',
  '    float fres=pow(1.0-n.z,2.6);',
  '    c+=vec3(0.54,0.47,1.0)*fres*(0.16+1.5*smoothstep(-0.35,0.7,ndl));',
  '    inside=c;',
  '  }',
  '  float aa=1.0-smoothstep(R-0.9*uDpr,R+0.9*uDpr,r);',
  '  vec3 col=mix(outside,inside,aa);',
  '  col*=1.0-0.38*dot(uv*0.9,uv*0.9);',
  '  gl_FragColor=vec4(col,1.0);',
  '}'
].join('\n');

// три наклонные орбиты: радиус (в радиусах планеты), наклон к лучу зрения, поворот, скорость
type Orbit = { r: number; tilt: number; roll: number; speed: number; sats?: string[]; moon?: boolean; dash: boolean };

const ORBITS: Orbit[] = [
  { r: 1.52, tilt: 0.3, roll: -0.34, speed: 0.5, sats: ['SAT-01', 'SAT-04'], dash: false },
  { r: 1.9, tilt: 0.44, roll: 0.24, speed: -0.34, sats: ['RLY-07'], dash: true },
  { r: 2.35, tilt: 0.2, roll: -0.1, speed: 0.17, moon: true, dash: false },
];

// пороги прогресса; тексты — из словаря страницы (strings.log / strings.status)
const LOG_AT = [0, 0.12, 0.35, 0.6, 0.85];
const STATUS_AT = [0, 0.3, 0.65];

type Uniform = 'uRes' | 'uTime' | 'uPlanet' | 'uLight' | 'uScan' | 'uDpr' | 'uSpace';
type GL = { gl: WebGLRenderingContext; u: Record<Uniform, WebGLUniformLocation | null> };

function createGL(canvas: HTMLCanvasElement): GL | null {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, powerPreference: 'high-performance' });
  if (!gl || !gl.getExtension('OES_standard_derivatives')) return null;
  function compile(type: number, src: string) {
    const s = gl!.createShader(type);
    if (!s) return null;
    gl!.shaderSource(s, src);
    gl!.compileShader(s);
    if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
      console.warn(gl!.getShaderInfoLog(s));
      return null;
    }
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const pr = gl.createProgram();
  if (!pr) return null;
  gl.attachShader(pr, vs);
  gl.attachShader(pr, fs);
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
  gl.useProgram(pr);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = {} as GL['u'];
  (['uRes', 'uTime', 'uPlanet', 'uLight', 'uScan', 'uDpr', 'uSpace'] as Uniform[]).forEach((k) => {
    u[k] = gl.getUniformLocation(pr, k);
  });
  return { gl, u };
}

function glowSprite(rgb: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.2, 'rgba(' + rgb + ',.75)');
  grd.addColorStop(0.5, 'rgba(' + rgb + ',.18)');
  grd.addColorStop(1, 'rgba(' + rgb + ',0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return c;
}

// шрифт подписей спутников: next/font даёт семейству служебное имя — берём его из CSS-переменной --ff-mono
function monoFamily() {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--ff-mono').trim();
  return (v ? v + ', ' : '') + 'ui-monospace, monospace';
}

type Geometry = { x: number; y: number; r: number };
type Point = { x: number; y: number; z: number };
type Body = Point & { o: Orbit; moon?: boolean; a?: number; label?: string };

export function run(seq: Sequence, fontsReady: Promise<unknown>, onDone: () => void) {
  const el = U.$('[data-preloader]')!;
  const glCanvas = U.$<HTMLCanvasElement>('[data-pre-gl]', el)!;
  const hud = U.$<HTMLCanvasElement>('[data-pre-hud]', el)!;
  const ui = U.$('[data-pre-ui]', el);
  const ctx = hud.getContext('2d')!;
  const countEl = U.$('[data-preloader-count]', el)!;
  const barEl = U.$('[data-preloader-bar]', el)!;
  const statusEl = U.$('[data-pre-status]', el)!;
  const logEl = U.$('[data-pre-log]', el)!;
  const bufEl = U.$('[data-pre-buf]', el)!;
  const sprite = glowSprite('190,160,255');
  const LOG = LOG_AT.map((at, i) => [at, t('log')[i]] as const);
  const STATUS = STATUS_AT.map((at, i) => [at, t('status')[i]] as const);
  let GL: GL | null = null;
  try {
    GL = createGL(glCanvas);
  } catch (e) {
    GL = null;
  }
  if (!GL) el.classList.add('is-fallback');

  const st = { shown: 0, intro: 0, dive: 0, hud: 1 };
  let fontsOk = false;
  let labelFont = '500 10px ui-monospace, monospace';
  let finished = false;
  let running = true;
  const started = performance.now();
  let logIdx = 0;
  let statusIdx = -1;
  let W = 0;
  let H = 0;
  let dprGL = 1;
  let dprHud = 1;
  let lastCount = '';
  fontsReady.then(() => {
    fontsOk = true;
    labelFont = '500 10px ' + monoFamily();
  });

  function layout() {
    W = window.innerWidth;
    H = window.innerHeight;
    // ограничиваем число пикселей шейдера — плавно даже на слабых видеокартах
    dprGL = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(2400000 / (W * H)));
    dprHud = Math.min(window.devicePixelRatio || 1, 2);
    glCanvas.width = Math.round(W * dprGL);
    glCanvas.height = Math.round(H * dprGL);
    hud.width = Math.round(W * dprHud);
    hud.height = Math.round(H * dprHud);
    ctx.setTransform(dprHud, 0, 0, dprHud, 0, 0);
    if (GL) GL.gl.viewport(0, 0, glCanvas.width, glCanvas.height);
  }
  layout();
  window.addEventListener('resize', layout);

  function geometry(): Geometry {
    const base = Math.min(W * (W < 768 ? 0.2 : 0.16), H * 0.17);
    const intro = 0.72 + 0.28 * st.intro;
    const zoom = Math.pow(22, st.dive); // экспоненциальный зум — ровное ощущение «полёта»
    return {
      x: W / 2,
      y: U.lerp(H * 0.43, H * 0.5, st.dive),
      r: base * intro * zoom,
    };
  }

  // точка орбиты: окружность в плоскости XZ → наклон → поворот в плоскости экрана
  function proj(o: Orbit, a: number, g: Geometry): Point {
    const x = Math.cos(a) * o.r;
    const z = Math.sin(a) * o.r;
    const y1 = z * Math.sin(o.tilt);
    const z1 = z * Math.cos(o.tilt);
    const cr = Math.cos(o.roll);
    const sr = Math.sin(o.roll);
    return { x: g.x + (x * cr - y1 * sr) * g.r, y: g.y - (x * sr + y1 * cr) * g.r, z: z1 };
  }

  function strokeOrbit(pts: Point[], front: boolean, o: Orbit, alpha: number) {
    ctx.beginPath();
    for (let k = 0; k < pts.length - 1; k++) {
      if (pts[k].z + pts[k + 1].z > 0 === front) {
        ctx.moveTo(pts[k].x, pts[k].y);
        ctx.lineTo(pts[k + 1].x, pts[k + 1].y);
      }
    }
    ctx.setLineDash(o.dash ? [3, 7] : []);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(196,176,255,' + (alpha * (front ? 0.5 : 0.16)).toFixed(3) + ')';
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawSat(b: Body, g: Geometry, alpha: number, time: number) {
    const o = b.o;
    const a = b.a!;
    const s = Math.max(0.75, g.r / 150);
    // шлейф
    for (let j = 1; j < 28; j++) {
      const p0 = proj(o, a - Math.sign(o.speed) * (j - 1) * 0.018, g);
      const p1 = proj(o, a - Math.sign(o.speed) * j * 0.018, g);
      ctx.strokeStyle = 'rgba(206,186,255,' + (alpha * 0.55 * (1 - j / 28)).toFixed(3) + ')';
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
    const gs = 22 * s;
    ctx.globalAlpha = alpha * (0.75 + 0.25 * Math.sin(time * 6 + a * 3));
    ctx.drawImage(sprite, b.x - gs / 2, b.y - gs / 2, gs, gs);
    ctx.globalAlpha = alpha;
    // корпус и панели ═•═
    ctx.fillStyle = '#fff';
    ctx.fillRect(b.x - 1.6 * s, b.y - 1.6 * s, 3.2 * s, 3.2 * s);
    ctx.fillStyle = 'rgba(206,190,255,.9)';
    ctx.fillRect(b.x - 7 * s, b.y - 0.8 * s, 4 * s, 1.6 * s);
    ctx.fillRect(b.x + 3 * s, b.y - 0.8 * s, 4 * s, 1.6 * s);
    ctx.globalAlpha = 1;
    // подпись — только у спутников «перед» планетой
    if (b.z > 0.15 && b.label) {
      const la = alpha * U.range(b.z, 0.15, 0.6);
      const lx = b.x + 14 * s;
      const ly = b.y - 14 * s;
      ctx.strokeStyle = 'rgba(206,186,255,' + (la * 0.6).toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(b.x + 4 * s, b.y - 4 * s);
      ctx.lineTo(lx, ly);
      ctx.lineTo(lx + 46, ly);
      ctx.stroke();
      ctx.fillStyle = 'rgba(236,230,255,' + la.toFixed(3) + ')';
      ctx.font = labelFont;
      ctx.fillText(b.label, lx + 2, ly - 5);
    }
  }

  function drawMoon(b: Body, g: Geometry, alpha: number) {
    const rad = g.r * 0.15;
    const grd = ctx.createRadialGradient(b.x - rad * 0.45, b.y - rad * 0.45, rad * 0.1, b.x, b.y, rad);
    grd.addColorStop(0, '#e6e0ff');
    grd.addColorStop(0.45, '#6f6596');
    grd.addColorStop(1, '#0d0b18');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(b.x, b.y, rad, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(200,180,255,.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // циферблат прогресса вокруг планеты: риски, дуга, «головка», вращающийся сканер
  function drawDial(g: Geometry, alpha: number, time: number) {
    const rp = g.r * 1.26;
    const top = -TAU / 4;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(200,186,255,.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(g.x, g.y, rp, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 72; i++) {
      const a = top + (i / 72) * TAU;
      const major = i % 6 === 0;
      const on = i / 72 <= st.shown;
      ctx.strokeStyle = on ? 'rgba(206,186,255,.9)' : 'rgba(206,186,255,.22)';
      ctx.lineWidth = major ? 1.4 : 1;
      ctx.beginPath();
      ctx.moveTo(g.x + Math.cos(a) * (rp + 6), g.y + Math.sin(a) * (rp + 6));
      ctx.lineTo(g.x + Math.cos(a) * (rp + (major ? 15 : 10)), g.y + Math.sin(a) * (rp + (major ? 15 : 10)));
      ctx.stroke();
    }
    const grad = ctx.createLinearGradient(g.x - rp, g.y - rp, g.x + rp, g.y + rp);
    grad.addColorStop(0, '#c38bff');
    grad.addColorStop(1, '#5d8dff');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(160,120,255,.9)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(g.x, g.y, rp, top, top + TAU * Math.max(0.001, st.shown));
    ctx.stroke();
    const ha = top + TAU * st.shown;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(ha) * rp, g.y + Math.sin(ha) * rp, 2.6, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    // два вращающихся сегмента-сканера
    ctx.strokeStyle = 'rgba(206,186,255,.55)';
    ctx.lineWidth = 1.2;
    [0, Math.PI].forEach((off) => {
      ctx.beginPath();
      ctx.arc(g.x, g.y, rp + 24, time * 0.6 + off, time * 0.6 + off + 0.35);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawFallbackPlanet(g: Geometry) {
    const grd = ctx.createRadialGradient(g.x - g.r * 0.4, g.y - g.r * 0.4, g.r * 0.1, g.x, g.y, g.r);
    grd.addColorStop(0, '#6c5bd6');
    grd.addColorStop(0.5, '#241a52');
    grd.addColorStop(1, '#07060f');
    ctx.save();
    ctx.shadowColor = 'rgba(140,110,255,.8)';
    ctx.shadowBlur = g.r * 0.3;
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawHud(time: number, g: Geometry) {
    ctx.clearRect(0, 0, W, H);
    if (!GL) drawFallbackPlanet(g);
    const alpha = st.intro * st.hud;
    if (alpha <= 0.002) return;
    drawDial(g, alpha, time);

    const pts = ORBITS.map((o) => {
      const arr: Point[] = [];
      for (let k = 0; k <= 160; k++) arr.push(proj(o, (k / 160) * TAU, g));
      return arr;
    });
    const bodies: Body[] = [];
    ORBITS.forEach((o, oi) => {
      const base = oi * 1.7 + time * o.speed;
      if (o.moon) {
        const pm = proj(o, base + 2.2, g);
        bodies.push({ moon: true, x: pm.x, y: pm.y, z: pm.z, o });
      }
      (o.sats || []).forEach((label, si) => {
        const a = base + (si * TAU) / o.sats!.length;
        const p = proj(o, a, g);
        bodies.push({ x: p.x, y: p.y, z: p.z, a, o, label });
      });
    });

    // задний план — с вырезом под диск планеты, чтобы орбиты уходили «за» неё
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.arc(g.x, g.y, g.r, 0, TAU, true);
    ctx.clip('evenodd');
    pts.forEach((p, i) => strokeOrbit(p, false, ORBITS[i], alpha));
    bodies.forEach((b) => {
      if (b.z < 0) {
        if (b.moon) drawMoon(b, g, alpha * 0.8);
        else drawSat(b, g, alpha * 0.6, time);
      }
    });
    ctx.restore();

    pts.forEach((p, i) => strokeOrbit(p, true, ORBITS[i], alpha));
    bodies.forEach((b) => {
      if (b.z >= 0) {
        if (b.moon) drawMoon(b, g, alpha);
        else drawSat(b, g, alpha, time);
      }
    });
  }

  function drawGL(time: number, g: Geometry) {
    if (!GL) return;
    const gl = GL.gl;
    const u = GL.u;
    gl.uniform2f(u.uRes, glCanvas.width, glCanvas.height);
    gl.uniform1f(u.uTime, time);
    gl.uniform3f(u.uPlanet, g.x * dprGL, (H - g.y) * dprGL, g.r * dprGL);
    gl.uniform3f(u.uLight, -0.62, 0.52, 0.42);
    gl.uniform1f(u.uScan, 1.2 - ((time * 0.28) % 1) * 2.4);
    gl.uniform1f(u.uDpr, dprGL);
    gl.uniform1f(u.uSpace, 1 - U.clamp(st.dive * 1.4, 0, 1));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function addLog(text: string) {
    const line = document.createElement('div');
    line.textContent = '> ' + text;
    logEl.appendChild(line);
    while (logEl.children.length > 4) logEl.removeChild(logEl.firstChild!);
    T.scramble(line, { per: 0.012, dur: 0.25 }).play();
  }

  function setStatus(text: string, locked?: boolean) {
    statusEl.textContent = text;
    statusEl.classList.toggle('is-locked', !!locked);
  }

  function target() {
    return (fontsOk ? 0.1 : 0) + 0.9 * Math.min(1, seq.loadedCount / seq.firstPass);
  }

  function updateUI() {
    const c = ('00' + Math.round(st.shown * 100)).slice(-3);
    if (c !== lastCount) {
      lastCount = c;
      countEl.textContent = c;
    }
    barEl.style.transform = 'scaleX(' + st.shown.toFixed(4) + ')';
    bufEl.textContent = t('buffer') + ' ' + ('00' + seq.loadedCount).slice(-3) + ' / ' + seq.count;
    while (logIdx < LOG.length && st.shown >= LOG[logIdx][0]) addLog(LOG[logIdx++][1]);
    for (let i = STATUS.length - 1; i >= 0; i--) {
      if (st.shown >= STATUS[i][0]) {
        if (i !== statusIdx && !finished) {
          statusIdx = i;
          setStatus(STATUS[i][1]);
        }
        break;
      }
    }
  }

  function exit() {
    if (finished) return;
    finished = true;
    st.shown = 1;
    updateUI();
    setStatus(t('status')[3], true);
    addLog(t('log')[5]);
    if (S.reduced) {
      gsap.to(el, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
          running = false;
          el.style.display = 'none';
        },
      });
      onDone();
      return;
    }
    gsap
      .timeline({
        onComplete: () => {
          running = false;
          el.style.display = 'none';
          window.removeEventListener('resize', layout);
        },
      })
      .to(ui, { opacity: 0, y: -14, duration: 0.6, ease: 'power2.in' }, 0.45)
      // орбиты и циферблат гаснут до того, как зум разнесёт их в линии
      .to(st, { hud: 0, duration: 0.75, ease: 'power2.in' }, 0.5)
      .to(st, { dive: 1, duration: 1.9, ease: 'expo.in' }, 0.5)
      .add(onDone, 1.95)
      .to(el, { opacity: 0, duration: 0.65, ease: 'power2.inOut' }, 2.0);
  }

  gsap.to(st, { intro: 1, duration: 2.2, ease: 'expo.out', delay: 0.1 });

  onTick((time, dt) => {
    if (!running) return;
    if (!finished) {
      st.shown = U.damp(st.shown, target(), 3.2, dt);
      const t0 = target();
      // минимум ~2.8 с — чтобы сцену успели увидеть
      if (t0 >= 0.999 && st.shown > 0.985 && fontsOk && performance.now() - started > 2800) exit();
    }
    updateUI();
    const g = geometry();
    drawGL(time, g);
    drawHud(time, g);
  });

  // страховка: не держим посетителя дольше 12 секунд
  setTimeout(exit, 12000);
}
