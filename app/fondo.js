/*
 * fondo.js — fondo de malla morada animada (WebGL, sin librerías).
 * Acompaña el momento: se calma con la carga, tira a magenta con una mala noticia,
 * se aclara con una buena, abre ondas cuando cae la gota y se ondula al escribir.
 * En el quiz, al contestar cambia de color (tint): turquesa al responder, verde si va bien, coral si toca mejorar.
 * En el modo pareja, mientras contesta uno, la misma malla toma su color (who); la respuesta, la malla morada.
 * Si no hay WebGL queda un degradado CSS (clase .nogl en <body>).
 */
(function () {
  const api = { show() {}, mood() {}, focus() {}, ripple() {}, pulse() {}, who() {}, tint() {} };
  window.Fondo = api;
  const cv = document.createElement('canvas');
  cv.id = 'fondo'; cv.setAttribute('aria-hidden', 'true');
  document.body.prepend(cv);
  const gl = cv.getContext('webgl', { antialias: false, premultipliedAlpha: false, alpha: false });
  if (!gl) { document.body.classList.add('nogl'); api.show = on => document.body.classList.toggle('fondo-on', !!on); return; }
  document.body.classList.add('gl');

  const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  const FS = `precision mediump float;
uniform vec2 r;uniform float t,mood,focus,rt,pulse,dots,tk;uniform vec2 rc;uniform vec3 tc,dc;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float blob(vec2 p,vec2 c,float s){vec2 d=p-c;return exp(-dot(d,d)/s);}
void main(){
  float asp=r.x/r.y;vec2 p=gl_FragCoord.xy/r.y;
  vec2 rp=rc/r.y;float dd=distance(p,rp),age=t-rt,ring=0.;
  for(int k=0;k<3;k++){float a=age-float(k)*.3;if(a>0.&&a<1.8){float rad=a*.42;
    ring+=exp(-pow((dd-rad)*30.,2.))*(1.-a/1.8);}}
  float tt=t*(1.+pulse*.6);
  vec2 q=p+(.30+pulse*.08)*vec2(n(p*1.3+tt*.05)-.5,n(p*1.3-tt*.04+3.7)-.5)+ring*.015*normalize(p-rp+1e-4);
  vec3 base=vec3(.972,.964,1.);
  vec3 violet=vec3(.55,.42,1.),lilac=vec3(.78,.70,1.),mag=vec3(.90,.47,.93),blue=vec3(.40,.52,.95);
  // modo pareja: la misma malla, con la paleta pasada al color de quien contesta (dc); la respuesta, en morado
  base=mix(base,mix(vec3(1.),dc,.08),dots);
  violet=mix(violet,dc,dots);lilac=mix(lilac,mix(dc,vec3(1.),.45),dots);
  mag=mix(mag,mix(dc,vec3(1.,.85,.75),.35),dots);blue=mix(blue,mix(dc,vec3(1.),.2),dots);
  vec3 col=base;
  float m=clamp(-mood,0.,1.),g=clamp(mood,0.,1.);
  col=mix(col,lilac,.55*blob(q,vec2(.15*asp+.12*sin(tt*.11),.95+.08*cos(tt*.13)),.22));
  col=mix(col,violet,(.30-.12*g)*blob(q,vec2(.90*asp+.10*cos(tt*.09),.80+.10*sin(tt*.12)),.16));
  col=mix(col,mag,(.16+.30*m)*blob(q,vec2(.75*asp+.12*sin(tt*.07+1.),.12+.08*cos(tt*.1)),.20));
  col=mix(col,blue,.16*blob(q,vec2(.10*asp+.10*cos(tt*.08+2.),.20+.10*sin(tt*.09)),.18));
  col=mix(col,vec3(1.),.25*g);
  // al contestar: el morado vira hacia otro color (tc) que entra con fuerza y se queda mientras dure la pantalla
  float tb=blob(q,vec2(.5*asp+.25*sin(tt*.06),.55+.2*cos(tt*.07)),.45);
  col=mix(col,tc,tk*(.26+.36*tb));
  violet=mix(violet,tc,tk*.8);
  vec2 uv=gl_FragCoord.xy/r-.5;
  col=mix(col,col*vec3(.90,.88,.98),focus*smoothstep(.15,.75,length(uv)));
  col=mix(col,violet,clamp(ring,0.,1.)*.32);
  col+=(h(gl_FragCoord.xy+fract(t)*91.)-.5)*.028;
  gl_FragColor=vec4(col,1.);}`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { document.body.classList.replace('gl', 'nogl'); api.show = on => document.body.classList.toggle('fondo-on', !!on); return; }
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['r', 't', 'mood', 'focus', 'rt', 'pulse', 'rc', 'dots', 'dc', 'tk', 'tc'].forEach(k => { U[k] = gl.getUniformLocation(pr, k); });

  const SCALE = 0.5; // el degradado es suave: media resolución basta y ahorra batería
  let W = 0, H = 0;
  const size = () => { W = Math.max(1, Math.round(innerWidth * SCALE)); H = Math.max(1, Math.round(innerHeight * SCALE)); cv.width = W; cv.height = H; gl.viewport(0, 0, W, H); };
  size(); addEventListener('resize', size);

  const st = { on: false, tk: 0, tkT: 0, tc: [.55, .42, 1], tcT: [.55, .42, 1], dots: 0, dotsT: 0, dc: [.55, .42, 1], dcT: [.55, .42, 1], mood: 0, moodT: 0, focus: 0, focusT: 0, pulse: 0, rt: -99, rc: [0, 0] };
  const t0 = performance.now(); let raf = null;
  const frame = now => {
    raf = null;
    if (!st.on || document.hidden) return;
    const t = (now - t0) / 1000;
    st.mood += (st.moodT - st.mood) * 0.03; st.focus += (st.focusT - st.focus) * 0.04; st.pulse *= 0.95; st.dots += (st.dotsT - st.dots) * 0.06; for (let i = 0; i < 3; i++) st.dc[i] += (st.dcT[i] - st.dc[i]) * 0.08;
    st.tk += (st.tkT - st.tk) * 0.05; for (let i = 0; i < 3; i++) st.tc[i] += (st.tcT[i] - st.tc[i]) * 0.06;
    gl.uniform2f(U.r, W, H); gl.uniform1f(U.t, t); gl.uniform1f(U.mood, st.mood); gl.uniform1f(U.focus, st.focus);
    gl.uniform1f(U.pulse, st.pulse); gl.uniform1f(U.dots, st.dots); gl.uniform3f(U.dc, st.dc[0], st.dc[1], st.dc[2]); gl.uniform1f(U.tk, st.tk); gl.uniform3f(U.tc, st.tc[0], st.tc[1], st.tc[2]); gl.uniform1f(U.rt, st.rt); gl.uniform2f(U.rc, st.rc[0], st.rc[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  };
  const go = () => { if (!raf && st.on && !document.hidden) raf = requestAnimationFrame(frame); };
  document.addEventListener('visibilitychange', go);

  api.show = on => { st.on = !!on; document.body.classList.toggle('fondo-on', st.on); go(); };
  api.mood = v => { st.moodT = Math.max(-1, Math.min(1, v || 0)); };
  api.focus = on => { st.focusT = on ? 1 : 0; };
  // Modo pareja: 'a' (azul) o 'b' (teja) mientras contesta uno; null (también si contestan juntos), la malla morada.
  const WHO = { a: [.27, .40, .86], b: [.80, .45, .24], duo: [.50, .38, .95] };
  api.who = k => { const c = WHO[k]; if (c) { if (st.dots < .05) { st.dc = c.slice(); } st.dcT = c.slice(); st.dotsT = 1; } else st.dotsT = 0; };
  // Colores al contestar: pick (ya ha contestado), bien (acierta o el dato va bien), mal (toca mejorar). null vuelve al morado.
  const TINT = { pick: [.20, .82, .88], bien: [.38, .84, .42], mal: [1, .50, .40] };
  api.tint = k => { const c = TINT[k]; if (c) { st.tcT = c.slice(); st.tkT = 1; } else st.tkT = 0; };
  api.pulse = () => { st.pulse = Math.min(1, st.pulse + 0.35); };
  api.ripple = (x, y) => { st.rt = (performance.now() - t0) / 1000; st.rc = [x * SCALE, (innerHeight - y) * SCALE]; };
})();
