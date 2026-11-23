/* Mel Beauty Studio · 3D-Skulptur (Three.js)
   Eine organische, schimmernde Form aus Perlmutt, Champagner-Gold und einem
   Hauch Salbei. Sie atmet, reagiert auf die Maus und wandert beim Scrollen
   zu der Position, die die jeweilige Sektion per data-blob vorgibt. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

const canvas = document.getElementById('scene');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = matchMedia('(max-width: 767px)').matches;
const compact = matchMedia('(max-width: 1023px)'); // einspaltiges Layout: Skulptur an den Rand

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

if (canvas && webglOK() && !reduce) init();

function init() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 1.75));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.z = 6;

  /* ---- Shader: Simplex-Noise-Verformung + Fresnel-Perlmuttglanz ---- */
  const noise = /* glsl */`
    vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
    vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
    vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
    float snoise(vec3 v){
      const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
      vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
      vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
      vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
      i=mod289(i);
      vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
      float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
      vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
      vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
      vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
      vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
      vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
      vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
      vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
      p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
      vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
      return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
    }`;

  const uniforms = {
    uTime: { value: 0 },
    uAmp: { value: 0.28 },
    uFreq: { value: 0.95 },
    uMouse: { value: new THREE.Vector3(0, 0, 1) },
    uPearl: { value: new THREE.Color('#FBF7F0') },
    uChamp: { value: new THREE.Color('#C5A86F') },
    uSand: { value: new THREE.Color('#E8DCC8') },
    uSage: { value: new THREE.Color('#9FB3A0') },
  };

  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true,
    vertexShader: /* glsl */`
      uniform float uTime, uAmp, uFreq; uniform vec3 uMouse;
      varying vec3 vN; varying vec3 vView; varying float vDisp; varying vec3 vPos;
      ${noise}
      float disp(vec3 p){
        float n = snoise(p*uFreq + vec3(0., uTime*.18, uTime*.12));
        n += .45*snoise(p*uFreq*2.1 - vec3(uTime*.1));
        float pull = smoothstep(1.4, 0., distance(normalize(p), normalize(uMouse))) * .22;
        return n*uAmp + pull;
      }
      void main(){
        vec3 p = position;
        float d = disp(p);
        vec3 np = p + normal*d;
        // Normale über Nachbarpunkte neu berechnen
        vec3 t = normalize(cross(normal, vec3(0.,1.,.001)));
        vec3 b = normalize(cross(normal, t));
        float e = .02;
        vec3 p1 = p + t*e; vec3 p2 = p + b*e;
        vec3 n1 = p1 + normalize(p1)*disp(p1);
        vec3 n2 = p2 + normalize(p2)*disp(p2);
        vec3 nn = normalize(cross(n1-np, n2-np));
        vN = normalize(normalMatrix * nn);
        vec4 mv = modelViewMatrix * vec4(np,1.);
        vView = normalize(-mv.xyz);
        vDisp = d; vPos = np;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uPearl,uChamp,uSand,uSage; uniform float uTime;
      varying vec3 vN; varying vec3 vView; varying float vDisp; varying vec3 vPos;
      void main(){
        vec3 n = normalize(vN);
        float fres = pow(1. - max(dot(n, vView), 0.), 2.4);
        // weiches Licht von oben links
        vec3 L = normalize(vec3(-.5,.8,.6));
        float diff = max(dot(n,L),0.);
        float spec = pow(max(dot(reflect(-L,n), vView),0.), 48.);
        // Perlmutt-Verlauf entlang der Oberfläche (irisierend, aber dezent)
        float band = .5 + .5*sin(vPos.y*2.4 + vDisp*7. + uTime*.35);
        vec3 base = mix(uSand, uPearl, diff*.85);
        base = mix(base, uChamp, smoothstep(.55,1.,band)*.55);
        base = mix(base, uSage, smoothstep(.25,0.,band)*.18);
        vec3 col = base + uChamp*fres*.55 + vec3(1.)*spec*.65;
        float alpha = .92 - fres*.15;
        gl_FragColor = vec4(col, alpha);
      }`,
  });

  const geo = new THREE.IcosahedronGeometry(1, small ? 48 : 96);
  const blob = new THREE.Mesh(geo, material);
  scene.add(blob);

  /* ---- Größe & Bildschirm-Koordinaten ---- */
  let W = 1, H = 1, viewH = 1, viewW = 1;
  function resize() {
    W = innerWidth; H = innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    viewH = 2 * Math.tan((camera.fov * Math.PI / 180) / 2) * camera.position.z;
    viewW = viewH * camera.aspect;
  }
  addEventListener('resize', () => { resize(); pickTarget(); }); resize();

  /* ---- Ziele aus den Sektionen (data-blob="x y scale" in Bildschirmanteilen) ---- */
  const target = { x: .16, y: .02, s: .62 }, cur = { x: .4, y: -.2, s: .05 };
  const sections = [...document.querySelectorAll('[data-blob]')].map(el => {
    const [x, y, s] = el.dataset.blob.split(/\s+/).map(Number);
    return { el, x, y, s };
  });
  function pickTarget() {
    const mid = innerHeight * .45;
    let best = sections[0], bd = Infinity;
    for (const sec of sections) {
      const r = sec.el.getBoundingClientRect();
      const d = r.top <= mid && r.bottom >= mid ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
      if (d < bd) { bd = d; best = sec; }
    }
    let { x, y, s } = best;
    // Handy: an den Rand, damit Text lesbar bleibt
    if (compact.matches) { x = (x < 0 ? -1 : 1) * .52; s *= .75; }
    Object.assign(target, { x, y, s });
  }

  /* ---- Maus & Scroll ---- */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', e => { mouse.tx = e.clientX / W * 2 - 1; mouse.ty = -(e.clientY / H * 2 - 1); }, { passive: true });
  let lastScroll = scrollY, vel = 0, spin = 0;
  addEventListener('scroll', () => { pickTarget(); }, { passive: true });
  pickTarget();

  /* ---- Render-Schleife (pausiert im Hintergrund-Tab) ---- */
  const clock = new THREE.Clock();
  let running = true;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) { clock.getDelta(); loop(); } });
  const lerp = (a, b, k) => a + (b - a) * k;

  function loop() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
    const sy = scrollY; vel = lerp(vel, (sy - lastScroll) / Math.max(dt, 1e-3) / 1000, .1); lastScroll = sy;

    mouse.x = lerp(mouse.x, mouse.tx, .05); mouse.y = lerp(mouse.y, mouse.ty, .05);
    const k = 1 - Math.pow(.02, dt);           // zeitunabhängiges Nachziehen
    cur.x = lerp(cur.x, target.x, k * .9); cur.y = lerp(cur.y, target.y, k * .9); cur.s = lerp(cur.s, target.s, k * .8);

    uniforms.uTime.value = t;
    uniforms.uAmp.value = lerp(uniforms.uAmp.value, .24 + Math.min(Math.abs(vel) * .12, .1), .04);
    uniforms.uMouse.value.set(mouse.x * 1.6, mouse.y * 1.6, 1);

    spin += vel * dt * 0.8;
    blob.rotation.y = t * .12 + mouse.x * .35 + spin;
    blob.rotation.x = Math.sin(t * .2) * .15 - mouse.y * .25 + spin * .4;
    blob.position.set(cur.x * viewW, cur.y * viewH + Math.sin(t * .6) * .06, 0);
    blob.scale.setScalar(cur.s * viewH * .5);

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  loop();
  requestAnimationFrame(() => canvas.classList.add('is-ready'));
}
