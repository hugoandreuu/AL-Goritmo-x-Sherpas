/*
 * fondo.js — fondo de malla morada animada (WebGL, sin librerías).
 * Acompaña el momento: se calma con la carga, tira a magenta con una mala noticia,
 * se aclara con una buena, abre ondas cuando cae la gota y se ondula al escribir.
 * Si no hay WebGL queda un degradado CSS (clase .nogl en <body>).
 */
(function () {
  const api = { show() {}, mood() {}, focus() {}, ripple() {}, pulse() {}, who() {} };
  window.Fondo = api;
  const cv = document.createElement('canvas');
  cv.id = 'fondo'; cv.setAttribute('aria-hidden', 'true');
  document.body.prepend(cv);
  const gl = cv.getContext('webgl', { antialias: false, premultipliedAlpha: false, alpha: false });
  if (!gl) { document.body.classList.add('nogl'); api.show = on => document.body.classList.toggle('fondo-on', !!on); return; }
  document.body.classList.add('gl');

  const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  const FS = `precision mediump float;
uniform vec2 r;uniform float t,mood,focus,rt,pulse,who;uniform vec2 rc;
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
  vec3 col=base;
  float m=clamp(-mood,0.,1.),g=clamp(mood,0.,1.);
  col=mix(col,lilac,.55*blob(q,vec2(.15*asp+.12*sin(tt*.11),.95+.08*cos(tt*.13)),.22));
  col=mix(col,violet,(.30-.12*g)*blob(q,vec2(.90*asp+.10*cos(tt*.09),.80+.10*sin(tt*.12)),.16));
  col=mix(col,mag,(.16+.30*m)*blob(q,vec2(.75*asp+.12*sin(tt*.07+1.),.12+.08*cos(tt*.1)),.20));
  col=mix(col,blue,.16*blob(q,vec2(.10*asp+.10*cos(tt*.08+2.),.20+.10*sin(tt*.09)),.18));
  col=mix(col,vec3(1.),.25*g);
  // modo pareja: el fondo tira al color de quien contesta (who<0 azul, who>0 naranja) y vuelve a morado juntos
  float wa=clamp(-who,0.,1.),wb=clamp(who,0.,1.);
  vec3 pa=vec3(.42,.52,.93),pb=vec3(.93,.62,.42);
  col=mix(col,pa,wa*(.30+.35*blob(q,vec2(.2*asp+.1*sin(tt*.1),.8+.1*cos(tt*.12)),.30)));
  col=mix(col,pb,wb*(.30+.35*blob(q,vec2(.8*asp+.1*cos(tt*.1),.25+.1*sin(tt*.11)),.30)));
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
  const U = {}; ['r', 't', 'mood', 'focus', 'rt', 'pulse', 'rc', 'who'].forEach(k => { U[k] = gl.getUniformLocation(pr, k); });

  const SCALE = 0.5; // el degradado es suave: media resolución basta y ahorra batería
  let W = 0, H = 0;
  const size = () => { W = Math.max(1, Math.round(innerWidth * SCALE)); H = Math.max(1, Math.round(innerHeight * SCALE)); cv.width = W; cv.height = H; gl.viewport(0, 0, W, H); };
  size(); addEventListener('resize', size);

  const st = { on: false, who: 0, whoT: 0, mood: 0, moodT: 0, focus: 0, focusT: 0, pulse: 0, rt: -99, rc: [0, 0] };
  const t0 = performance.now(); let raf = null;
  const frame = now => {
    raf = null;
    if (!st.on || document.hidden) return;
    const t = (now - t0) / 1000;
    st.mood += (st.moodT - st.mood) * 0.03; st.focus += (st.focusT - st.focus) * 0.04; st.pulse *= 0.95; st.who += (st.whoT - st.who) * 0.04;
    gl.uniform2f(U.r, W, H); gl.uniform1f(U.t, t); gl.uniform1f(U.mood, st.mood); gl.uniform1f(U.focus, st.focus);
    gl.uniform1f(U.pulse, st.pulse); gl.uniform1f(U.who, st.who); gl.uniform1f(U.rt, st.rt); gl.uniform2f(U.rc, st.rc[0], st.rc[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  };
  const go = () => { if (!raf && st.on && !document.hidden) raf = requestAnimationFrame(frame); };
  document.addEventListener('visibilitychange', go);

  api.show = on => { st.on = !!on; document.body.classList.toggle('fondo-on', st.on); go(); };
  api.mood = v => { st.moodT = Math.max(-1, Math.min(1, v || 0)); };
  api.focus = on => { st.focusT = on ? 1 : 0; };
  api.who = v => { st.whoT = Math.max(-1, Math.min(1, v || 0)); };
  api.pulse = () => { st.pulse = Math.min(1, st.pulse + 0.35); };
  api.ripple = (x, y) => { st.rt = (performance.now() - t0) / 1000; st.rc = [x * SCALE, (innerHeight - y) * SCALE]; };
})();
