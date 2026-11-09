const ORDEN_V = ["aurora","ofelia","noche-de-bulevar","plata","milonga","ofelia","aurora"];
const E3 = {ok:false};
(function(){
  if(!window.THREE) return;
  const T = THREE;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  if(T.ColorManagement) T.ColorManagement.legacyMode = false;
  const cv = document.createElement("canvas"); cv.className = "escena3d"; cv.setAttribute("aria-hidden","true");
  let ren;
  try{ ren = new T.WebGLRenderer({canvas:cv, alpha:true, antialias:true}); }catch(e){ return; }
  ren.setClearColor(0x000000, 0);
  ren.outputEncoding = T.sRGBEncoding; ren.toneMapping = T.ACESFilmicToneMapping; ren.toneMappingExposure = 1.0;
  const esc = new T.Scene(), cam = new T.PerspectiveCamera(30, 1, 10, 20000);
  const mundo = new T.Group(); esc.add(mundo);
  /* entorno y luces */
  const pm = new T.PMREMGenerator(ren), envS = new T.Scene();
  const domo = new T.Mesh(new T.SphereGeometry(500, 32, 16), new T.MeshBasicMaterial({side:T.BackSide, vertexColors:true}));
  const gc = domo.geometry, col = [];
  for(let i = 0; i < gc.attributes.position.count; i++){ const y = gc.attributes.position.getY(i)/500; const c = new T.Color().setHSL(.08, .22, .5 + .42*Math.max(0,y)); col.push(c.r, c.g, c.b); }
  gc.setAttribute("color", new T.Float32BufferAttribute(col, 3)); envS.add(domo);
  [[0,300,200,1.7],[-260,120,-120,1.0],[280,80,60,.75]].forEach(([x,y,z,k]) => { const l = new T.Mesh(new T.PlaneGeometry(180,120), new T.MeshBasicMaterial({color:new T.Color(k,k*.97,k*.92), side:T.DoubleSide})); l.position.set(x,y,z); l.lookAt(0,0,0); envS.add(l); });
  esc.environment = pm.fromScene(envS, .03).texture;
  esc.add(new T.HemisphereLight(0xfff1e0, 0x8f7f70, .45));
  const key = new T.DirectionalLight(0xffffff, 1.15); key.position.set(1300, 2300, 1700); esc.add(key); esc.add(key.target);
  const SOMBRAS = innerWidth > 960;
  if(SOMBRAS){ ren.shadowMap.enabled = true; ren.shadowMap.type = T.PCFSoftShadowMap; key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, {left:-1500, right:1500, top:1500, bottom:-1500, near:100, far:9000}); key.shadow.bias = -.0004; key.shadow.normalBias = 2.5; key.shadow.radius = 4; }
  const rim = new T.DirectionalLight(0xffe6cc, .8); rim.position.set(-160, 160, -180); esc.add(rim);
  const fill = new T.DirectionalLight(0xdfe7ea, .3); fill.position.set(-180, 60, 140); esc.add(fill);

  /* texturas */
  const cargar = (src, fn) => { const t = new T.Texture(); const im = new Image(); im.onload = () => { t.image = im; t.needsUpdate = true; fn && fn(t, im); }; im.src = src; t.encoding = T.sRGBEncoding; return t; };
  const lienzoTx = (w, h, dib) => { const c = document.createElement("canvas"); c.width = w; c.height = h; dib(c.getContext("2d"), w, h); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t; };
  const ruido = (rayas, fino) => { const c = document.createElement("canvas"); c.width = c.height = 512; const x = c.getContext("2d"), im = x.createImageData(512,512), d = im.data;
    for(let j = 0; j < 512; j++) for(let i = 0; i < 512; i++){ const k = (j*512+i)*4;
      let v = 128 + (Math.random()-.5)*(fino || 26) + Math.sin(j*.035 + Math.sin(i*.02)*2)*8;
      if(rayas) v += Math.cos(i/512*Math.PI*2*rayas) * 34;
      d[k] = d[k+1] = d[k+2] = v; d[k+3] = 255; }
    x.putImageData(im,0,0); const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t; };
  const RELIEVE = ruido(0), PANA_B = ruido(96, 20), PAPEL = ruido(0, 40), BALLENAS = (() => { const t = ruido(0); return t; })();
  const panaImg = cargar("{{F:tx_pana}}"); panaImg.wrapS = panaImg.wrapT = T.RepeatWrapping;

  const mat = {
    raso: (c) => new T.MeshPhysicalMaterial({color:c, bumpMap:RELIEVE, bumpScale:.35, roughness:.36, sheen:.45, sheenRoughness:.4, sheenColor:new T.Color(c).lerp(new T.Color(0xffffff), .3), clearcoat:.15, clearcoatRoughness:.4, side:T.DoubleSide, envMapIntensity:.55}),
    tul: (c, o) => new T.MeshPhysicalMaterial({color:c, roughness:.85, transparent:true, opacity:o, side:T.DoubleSide, depthWrite:false, sheen:.5, sheenColor:new T.Color(0xffffff)}),
    lame: (c) => new T.MeshPhysicalMaterial({color:c, bumpMap:RELIEVE, bumpScale:.5, roughness:.34, metalness:.6, side:T.DoubleSide, envMapIntensity:1.2}),
    crepe: (c) => new T.MeshPhysicalMaterial({color:c, bumpMap:RELIEVE, bumpScale:.6, roughness:.7, sheen:.5, sheenRoughness:.6, sheenColor:new T.Color(c).lerp(new T.Color(0xffffff), .35), side:T.DoubleSide}),
    metal: () => new T.MeshPhysicalMaterial({color:0xdcdcdc, metalness:1, roughness:.22}),
    madera: () => new T.MeshStandardMaterial({color:0x8a6a4a, roughness:.55}),
    cuero: () => new T.MeshPhysicalMaterial({color:0x4a2c1a, roughness:.48, clearcoat:.3, clearcoatRoughness:.5, bumpMap:RELIEVE, bumpScale:.3})
  };

  /* ---------- sombras de contacto ---------- */
  const sombraTx = lienzoTx(256, 256, (x,w,h) => { const g = x.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2); g.addColorStop(0,"rgba(30,22,16,.55)"); g.addColorStop(.55,"rgba(30,22,16,.2)"); g.addColorStop(1,"rgba(30,22,16,0)"); x.fillStyle = g; x.fillRect(0,0,w,h); });
  const sombra = (w, d) => { const m = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshBasicMaterial({map:sombraTx, transparent:true, depthWrite:false})); m.rotation.x = -Math.PI/2; m.position.y = .08; m.renderOrder = -1; return m; };

  /* ---------- bolso de pana blando ---------- */
  function bolso(){
    const g = new T.Group();
    const A = 40, B = 29, H = 46, N = 3.3, NX = 120, NY = 30;
    /* contorno superelíptico muestreado por largo de arco */
    const crudo = []; for(let k = 0; k <= 2000; k++){ const th = k/2000*Math.PI*2, c = Math.cos(th), s = Math.sin(th); crudo.push([Math.sign(c)*Math.pow(Math.abs(c), 2/N), Math.sign(s)*Math.pow(Math.abs(s), 2/N)]); }
    const largo = [0]; for(let k = 1; k < crudo.length; k++) largo.push(largo[k-1] + Math.hypot((crudo[k][0]-crudo[k-1][0])*A, (crudo[k][1]-crudo[k-1][1])*B));
    const L = largo[largo.length-1], contorno = [];
    for(let i = 0; i <= NX; i++){ const obj = i/NX*L; let k = 0; while(k < largo.length-1 && largo[k+1] < obj) k++; contorno.push(crudo[k]); }
    /* textura de las paredes: pana, franjas claras a los costados, logo bordado */
    const pared = lienzoTx(2048, 512, (x, w, h) => { x.fillStyle = "#8a786d"; x.fillRect(0,0,w,h); });
    const dibPared = (im, logo) => { const c = pared.image, x = c.getContext("2d"), w = c.width, h = c.height;
      const pat = x.createPattern(im, "repeat"); x.save(); x.scale(.5,.5); x.fillStyle = pat; x.fillRect(0,0,w*2,h*2); x.restore();
      x.fillStyle = "rgba(60,40,28,.06)"; x.fillRect(0,0,w,h);
      [0, .5, 1].forEach(u => { const cx = u*w, fw = w*(21/(L)); x.fillStyle = "rgba(226,212,198,.62)"; x.fillRect(cx - fw/2, 0, fw, h); x.strokeStyle = "rgba(60,40,28,.25)"; x.lineWidth = 3; x.strokeRect(cx - fw/2, -5, fw, h+10); });
      x.setLineDash([10,8]); x.strokeStyle = "rgba(255,244,232,.35)"; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 18); x.lineTo(w, 18); x.moveTo(0, h-14); x.lineTo(w, h-14); x.stroke(); x.setLineDash([]);
      /* logo bordado derecho sobre las dos franjas de los costados (la U corre al revés de cómo se mira, por eso va espejado) */
      if(logo){ const lw = w*(15/L), lh = lw*logo.height/logo.width, y0 = h*.5; x.globalAlpha = .92;
        [w*.5, 0, w].forEach(cx => { x.save(); x.translate(cx, 0); x.scale(-1, 1); x.drawImage(logo, -lw/2, y0, lw, lh); x.restore(); }); x.globalAlpha = 1; }
      pared.needsUpdate = true; };
    let pIm = null, lIm = null;
    cargar("{{F:tx_pana}}", (t, im) => { pIm = im; if(lIm) dibPared(pIm, lIm); else dibPared(pIm); if(window.__dibTapa) __dibTapa(); });
    cargar("{{F:logo_bordado}}", (t, im) => { lIm = im; if(pIm) dibPared(pIm, lIm); if(window.__dibTapa) __dibTapa(); });
    const mPana = new T.MeshPhysicalMaterial({map:pared, bumpMap:PANA_B, bumpScale:.55, roughness:.82, sheen:.9, sheenRoughness:.55, sheenColor:new T.Color(0xcab9aa), side:T.DoubleSide});
    PANA_B.repeat.set(1, 1);
    /* paredes */
    const geo = new T.BufferGeometry(), pos = [], uv = [], idx = [];
    for(let j = 0; j <= NY; j++){ const t = j/NY;
      for(let i = 0; i <= NX; i++){ const [cx, cz] = contorno[i], th = i/NX*Math.PI*2;
        const esq = Math.pow(Math.abs(cx*cz), 1.2);
        const ins = 1 - .09*Math.pow(t, 1.4);
        const bulto = 1 + .075*Math.sin(Math.PI*Math.min(1, t*1.1))*(1 - esq*1.4);
        const arr = (Math.sin(th*9 + t*2.2)*.9 + Math.sin(th*17 - t*4)*.35)*Math.pow(Math.sin(Math.PI*t), .7) + Math.sin(th*5 + 1.3)*.8*t*t;
        const x = cx*A*ins*bulto + Math.cos(th)*arr, z = cz*B*ins*bulto + Math.sin(th)*arr;
        const caida = 4.6*Math.pow(t, 2.5) + .5*Math.sin(th*4 + .7)*Math.pow(t,3);
        pos.push(x, t*H - caida, z); uv.push(i/NX, t); } }
    for(let j = 0; j < NY; j++) for(let i = 0; i < NX; i++){ const a = j*(NX+1)+i, b = a+1, c = a+NX+1, d = c+1; idx.push(a,b,c, b,d,c); }
    geo.setAttribute("position", new T.Float32BufferAttribute(pos,3)); geo.setAttribute("uv", new T.Float32BufferAttribute(uv,2)); geo.setIndex(idx); geo.computeVertexNormals();
    g.add(new T.Mesh(geo, mPana));
    /* base y fondo interior */
    const fondo = new T.Shape(); contorno.forEach(([cx,cz],i) => i ? fondo.lineTo(cx*A, cz*B) : fondo.moveTo(cx*A, cz*B));
    const base = new T.Mesh(new T.ShapeGeometry(fondo, 1), new T.MeshStandardMaterial({color:0x4a3c35, roughness:.9, side:T.DoubleSide})); base.rotation.x = Math.PI/2; base.position.y = .3; g.add(base);
    /* manijas: tira plana de cuero chocolate, horizontal sobre la franja clara del costado; los extremos van
       cosidos contra la tela con dos remaches y el medio se separa apenas para meter la mano */
    const chocolate = new T.MeshPhysicalMaterial({color:0x4a2a1a, roughness:.45, clearcoat:.4, clearcoatRoughness:.35, sheen:.3, sheenColor:new T.Color(0x9a6a4a), bumpMap:RELIEVE, bumpScale:.22, side:T.DoubleSide});
    const remache = new T.MeshPhysicalMaterial({color:0xb9b2a6, metalness:.85, roughness:.3});
    const yM = 35, AN = 3.6, GR = .45, LZ = 12.5;
    [-1, 1].forEach(sx => {
      /* la pana real a esa altura: se lee de la malla de las paredes, así la tira queda apoyada justo encima */
      const jy = Math.round(yM/H*NY);
      const pared = (z) => { let best = null;
        for(let i = 0; i < NX; i++){ const k1 = (jy*(NX+1)+i)*3, k2 = (jy*(NX+1)+i+1)*3, x1 = pos[k1], z1 = pos[k1+2], x2 = pos[k2], z2 = pos[k2+2];
          if(Math.sign(x1) !== sx || Math.sign(x2) !== sx) continue;
          if((z1 - z)*(z2 - z) <= 0 && z1 !== z2){ const f = (z - z1)/(z2 - z1); best = x1 + (x2 - x1)*f; break; } }
        return (best ?? sx*A*.93) + sx*.12; };
      const N2 = 48, pts = [];
      for(let i = 0; i <= N2; i++){ const u = i/N2, z = (u - .5)*2*LZ, f = Math.abs(z) > LZ - 3 ? 0 : Math.sin(Math.PI*(Math.abs(z) - (LZ-3))/(-(2*(LZ-3)))) ; 
        const bomba = Math.abs(z) < LZ - 3 ? .7*Math.pow(Math.cos(Math.PI/2*z/(LZ-3)), 1.5) : 0;
        pts.push(new T.Vector3(pared(z) + sx*bomba, yM, z)); }
      const tpos = [], tidx = [];
      pts.forEach((p, i) => { const q = pts[Math.min(N2, i+1)], r = pts[Math.max(0, i-1)]; const tg = new T.Vector3().subVectors(q, r).normalize(); const nrm = new T.Vector3(tg.z, 0, -tg.x); if(nrm.x*sx < 0) nrm.negate();
        [[ AN/2, 0],[-AN/2, 0],[-AN/2, GR],[ AN/2, GR]].forEach(([h, o]) => tpos.push(p.x + nrm.x*o, p.y + h, p.z + nrm.z*o)); });
      for(let i = 0; i < N2; i++) for(let k = 0; k < 4; k++){ const a0 = i*4 + k, a1 = i*4 + (k+1)%4, b0 = a0 + 4, b1 = a1 + 4; tidx.push(a0, b0, a1, a1, b0, b1); }
      const gtira = new T.BufferGeometry(); gtira.setAttribute("position", new T.Float32BufferAttribute(tpos, 3)); gtira.setIndex(tidx); gtira.computeVertexNormals();
      const mt = new T.Mesh(gtira, chocolate); mt.castShadow = true; g.add(mt);
      /* tapas de las puntas */
      [0, N2].forEach(i => { const c = pts[i]; const tap = new T.Mesh(new T.BoxGeometry(.5, AN, GR), chocolate); tap.position.set(c.x + sx*GR/2, c.y, c.z); tap.rotation.y = Math.PI/2; g.add(tap); });
      /* dos remaches en cada extremo, uno arriba del otro */
      [-(LZ - 1.4), LZ - 1.4].forEach(z => [-.9, .9].forEach(dy => { const r = new T.Mesh(new T.CylinderGeometry(.42, .42, .5, 16), remache); r.rotation.z = Math.PI/2; r.position.set(pared(z) + sx*(GR + .1), yM + dy, z); g.add(r); }));
    });
    /* tapa: solapa de pana cosida en el lado largo de atrás; se apoya sobre la boca y cae por el frente */
    const borde = (x) => { const r = Math.min(1, Math.abs(x)/(A*.91)); return B*.91*Math.pow(Math.max(0, 1 - Math.pow(r, N)), 1/N); };  /* z del frente para cada x, a la altura de la boca */
    const hb = H - 4.6;                                    /* altura media de la boca (las paredes se hunden un poco) */
    const tapa = new T.Group(); tapa.position.set(0, hb + 1.1, -borde(0));
    const TU = 64, TV = 48, CA = 15, M = 1.4;
    const tg = new T.BufferGeometry(), tp = [], tuv = [], ti = [];
    for(let j = 0; j <= TV; j++){ const v = j/TV;
      for(let i = 0; i <= TU; i++){ const u = i/TU, x = (u - .5)*2*(A*.91 + M);
        /* huella de la tapa: rectángulo de esquinas redondeadas un poco más grande que la boca */
        const Z0 = B*.91 + .4, X0 = A*.91 + M, RC = 9, ax = Math.abs(x);
        const fp = ax < X0 - RC ? Z0 : Z0 - RC + Math.sqrt(Math.max(0, RC*RC - Math.pow(ax - (X0 - RC), 2)));
        const zf = fp + M - .4, zb = -fp;
        const top = (zf - zb), L = top + CA;
        const sv = v*L;
        let y, z;
        const lado = Math.pow(Math.min(1, Math.abs(x)/(A*.91 + M)), 6);
        if(sv <= top){ z = zb + sv; const w = sv/top;
          y = 1.1*Math.sin(Math.PI*w)*(1 - lado) - 2.2*lado; }
        else { const dd = sv - top, k = dd/CA; z = zf + 1.6*Math.sin(Math.min(1, dd/3)*Math.PI/2) + .8*Math.sin(Math.PI*k)*(1 - lado);
          y = -dd*(1 - .08*Math.sin(Math.PI*u)) - 2.2*lado; }
        y += .12*Math.sin(u*Math.PI*11 + v*2.5)*v + .08*Math.sin(u*Math.PI*23 - v*5);
        tp.push(x, y, z + borde(0)); tuv.push(u, 1 - v); } }
    for(let j = 0; j < TV; j++) for(let i = 0; i < TU; i++){ const a = j*(TU+1)+i, b = a+1, c = a+TU+1, d = c+1; ti.push(a,c,b, b,c,d); }
    tg.setAttribute("position", new T.Float32BufferAttribute(tp,3)); tg.setAttribute("uv", new T.Float32BufferAttribute(tuv,2)); tg.setIndex(ti); tg.computeVertexNormals();
    /* textura de la tapa: pana con pespunte en todo el borde y el logo bordado en la caída */
    const tapaTx = lienzoTx(1024, 1024, (x,w,h) => { x.fillStyle = "#857266"; x.fillRect(0,0,w,h); });
    const dibTapa = () => { const c = tapaTx.image, x = c.getContext("2d"), w = c.width, h = c.height;
      if(pIm){ const pat = x.createPattern(pIm, "repeat"); x.save(); x.scale(.42,.42); x.fillStyle = pat; x.fillRect(0,0,w/.42,h/.42); x.restore(); }
      x.setLineDash([12,9]); x.strokeStyle = "rgba(246,236,224,.55)"; x.lineWidth = 3; x.strokeRect(22, 22, w-44, h-44); x.setLineDash([]);
      const g2 = x.createLinearGradient(0,0,0,h); g2.addColorStop(0,"rgba(40,26,18,.18)"); g2.addColorStop(.08,"rgba(40,26,18,0)"); x.fillStyle = g2; x.fillRect(0,0,w,h);
      tapaTx.needsUpdate = true; };
    const mTapa = new T.MeshPhysicalMaterial({map:tapaTx, bumpMap:PANA_B, bumpScale:.5, roughness:.84, sheen:.9, sheenRoughness:.55, sheenColor:new T.Color(0xcab9aa), side:T.DoubleSide});
    window.__dibTapa = dibTapa; dibTapa();
    /* tapa acolchada: cara de abajo (tg) + cara de arriba inflada como almohadón + vivo en todo el borde */
    const nb = tg.attributes.normal;
    { const kc = (Math.round(TV*.3)*(TU+1) + TU/2)*3; if(nb.array[kc+1] < 0){ for(let k = 0; k < nb.array.length; k++) nb.array[k] *= -1; } }
    const THK = 2.6, top = [], tq = new T.BufferGeometry();
    for(let j = 0; j <= TV; j++) for(let i = 0; i <= TU; i++){ const k = (j*(TU+1)+i)*3, u = i/TU, v = j/TV;
      const inf = THK * Math.pow(Math.sin(Math.PI*u), .28) * Math.pow(Math.sin(Math.PI*v), .28) + .15;
      /* acolchado suave: tres canales a lo ancho que hunden apenas la tela */
      const canal = .35*Math.pow(Math.abs(Math.cos(v*Math.PI*3.5)), 30)*Math.sin(Math.PI*u);
      const e = Math.max(.15, inf - canal);
      top.push(tp[k] + nb.array[k]*e, tp[k+1] + nb.array[k+1]*e, tp[k+2] + nb.array[k+2]*e); }
    tq.setAttribute("position", new T.Float32BufferAttribute(top,3)); tq.setAttribute("uv", new T.Float32BufferAttribute(tuv,2)); tq.setIndex(ti); tq.computeVertexNormals();
    const caraArriba = new T.Mesh(tq, mTapa), caraAbajo = new T.Mesh(tg, new T.MeshStandardMaterial({color:0xb7a491, roughness:.85, side:T.DoubleSide, bumpMap:PANA_B, bumpScale:.25, emissive:0x3a2e26, emissiveIntensity:.35}));
    caraArriba.castShadow = true; tapa.add(caraArriba, caraAbajo);
    /* vivo: recorre el contorno completo y tapa la unión de las dos caras */
    const P = (arr, i, j, off) => { const k = (j*(TU+1)+i)*3; return new T.Vector3(arr[k], arr[k+1], arr[k+2]).lerp(new T.Vector3(top[k], top[k+1], top[k+2]), off); };
    const anillo = [];
    for(let i = 0; i < TU; i++) anillo.push(P(tp, i, 0, .5));
    for(let j = 0; j < TV; j++) anillo.push(P(tp, TU, j, .5));
    for(let i = TU; i > 0; i--) anillo.push(P(tp, i, TV, .5));
    for(let j = TV; j > 0; j--) anillo.push(P(tp, 0, j, .5));
    const mVivo = new T.MeshPhysicalMaterial({color:0x6a564b, roughness:.75, sheen:1, sheenRoughness:.5, sheenColor:new T.Color(0xc4b3a4), bumpMap:PANA_B, bumpScale:.25});
    const curva = new T.CatmullRomCurve3(anillo, true, "centripetal");
    tapa.add(new T.Mesh(new T.TubeGeometry(curva, 520, .78, 10, true), mVivo));
    /* bisagra cosida atrás: tela enrollada con doble pespunte a la vista */
    const pesp = lienzoTx(1024, 128, (x,w,h) => { x.fillStyle = "#6a564b"; x.fillRect(0,0,w,h); x.strokeStyle = "rgba(246,236,224,.85)"; x.lineWidth = 5; x.setLineDash([16,11]);
      [.18,.34,.66,.82].forEach(v => { x.beginPath(); x.moveTo(0, v*h); x.lineTo(w, v*h); x.stroke(); }); });
    pesp.wrapS = T.RepeatWrapping; pesp.repeat.set(6, 1);
    const bis = []; for(let i = 5; i <= TU - 5; i += 2) bis.push(P(tp, i, 0, .1).add(new T.Vector3(0, -.9, -.6)));
    const bisagra = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(bis), 160, 1.5, 12), new T.MeshPhysicalMaterial({map:pesp, roughness:.8, sheen:.8, sheenColor:new T.Color(0xbfae9f), bumpMap:PANA_B, bumpScale:.25}));
    tapa.add(bisagra);
    /* broches a presión sobre la caída */
    [-.24, .24].forEach(u => { const i = Math.round((u + .5)*TU), j = Math.round(TV*.86), k = (j*(TU+1)+i)*3;
      const pz = new T.Vector3(top[k], top[k+1], top[k+2]), n = new T.Vector3(nb.array[k], nb.array[k+1], nb.array[k+2]);
      const mBroche = new T.MeshPhysicalMaterial({color:0xd9d2c6, metalness:.7, roughness:.3, clearcoat:.5}); const b = new T.Mesh(new T.CylinderGeometry(1.05, 1.05, .55, 24), mBroche); b.position.copy(pz.addScaledVector(n, .2)); b.quaternion.setFromUnitVectors(new T.Vector3(0,1,0), n); tapa.add(b);
      const aro = new T.Mesh(new T.TorusGeometry(1.05, .14, 8, 24), mBroche); aro.position.copy(b.position); aro.quaternion.setFromUnitVectors(new T.Vector3(0,0,1), n); tapa.add(aro); });
    /* ribete de la boca del bolso: termina el borde de las paredes */
    const boca = []; for(let i = 0; i < NX; i++){ const k = (NY*(NX+1)+i)*3; boca.push(new T.Vector3(pos[k], pos[k+1], pos[k+2])); }
    g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(boca, true, "centripetal"), 240, .85, 10, true), mVivo));
    g.add(tapa);
    g.add(sombra(118, 92));
    g.userData.tapa = tapa;
    return g;
  }

  /* ---------- book negro con hojas blancas ---------- */
  function book(){
    const g = new T.Group();
    const terc = new T.MeshPhysicalMaterial({color:0x131313, roughness:.92, sheen:1, sheenRoughness:.7, sheenColor:new T.Color(0x3a3a3a), bumpMap:RELIEVE, bumpScale:.4});
    const hojasTx = lienzoTx(64, 512, (x,w,h) => { for(let y = 0; y < h; y += 2){ x.fillStyle = y % 4 ? "#f4f1ea" : "#e4dfd5"; x.fillRect(0,y,w,2); } }); hojasTx.wrapS = hojasTx.wrapT = T.RepeatWrapping; hojasTx.rotation = Math.PI/2; hojasTx.center.set(.5,.5);
    const hojas = new T.MeshStandardMaterial({map:hojasTx, roughness:.85});
    const tapaS = new T.Mesh(new T.BoxGeometry(46, .45, 36), terc); tapaS.position.y = 9.8; g.add(tapaS);
    const tapaI = tapaS.clone(); tapaI.position.y = .22; g.add(tapaI);
    const lomo = new T.Mesh(new T.BoxGeometry(.6, 10, 36), terc); lomo.position.set(-22.7, 5, 0); g.add(lomo);
    const bloque = new T.Mesh(new T.BoxGeometry(44.6, 9.2, 34.8), hojas); bloque.position.set(.3, 5, 0); g.add(bloque);
    g.add(sombra(66, 54));
    return g;
  }

  /* ---------- tubos de kraft con faja ---------- */
  function tubos(){
    const g = new T.Group();
    const kraft = new T.MeshPhysicalMaterial({color:0xC49A6C, roughness:.88, bumpMap:PAPEL, bumpScale:.5, sheen:.3});
    const fajas = [["#22413A","#F3EADB"],["#F1E8D8","#22313A"],["#1C2B3A","#F3EADB"]];
    const R = [5, 7, 9], H = [13.5, 17.5, 22], X = [-21, -5, 14];
    let logo = null; const pend = [];
    cargar("{{F:logo_full}}", (t, im) => { logo = im; pend.forEach(f => f()); });
    for(let k = 0; k < 3; k++){
      const r = R[k], h = H[k], t = new T.Group(); t.position.set(X[k], 0, k === 1 ? 6 : 0);
      const cuerpo = new T.Mesh(new T.CylinderGeometry(r, r, h*.82, 48, 1, true), kraft); cuerpo.position.y = h*.41; t.add(cuerpo);
      const tapaT = new T.Mesh(new T.CylinderGeometry(r*1.035, r*1.035, h*.24, 48), kraft); tapaT.position.y = h*.88; t.add(tapaT);
      const fondoT = new T.Mesh(new T.CircleGeometry(r, 32), kraft); fondoT.rotation.x = -Math.PI/2; fondoT.position.y = .05; t.add(fondoT);
      const [bg, fg] = fajas[k];
      const ftx = lienzoTx(1024, 256, (x, w, hh) => { x.fillStyle = bg; x.fillRect(0,0,w,hh); });
      const dib = () => { const x = ftx.image.getContext("2d"), w = 1024, hh = 256; x.fillStyle = bg; x.fillRect(0,0,w,hh);
        const lw = 230, lh = lw*logo.height/logo.width, cx = w*.25; const tmp = document.createElement("canvas"); tmp.width = lw; tmp.height = lh; const tx = tmp.getContext("2d"); tx.drawImage(logo,0,0,lw,lh); tx.globalCompositeOperation = "source-in"; tx.fillStyle = fg; tx.fillRect(0,0,lw,lh);
        x.drawImage(tmp, cx - lw/2 - 40, hh/2 - lh/2);
        x.fillStyle = fg; x.fillRect(cx + 110, 60, 2, 136);
        x.font = "34px 'Century Gothic Pro', Questrial, sans-serif"; x.fillText("Accesorios", cx + 135, 100); x.fillText("de Autor", cx + 135, 140); x.font = "26px 'Century Gothic Pro', Questrial, sans-serif"; x.fillText("Herencia viva", cx + 135, 186);
        ftx.needsUpdate = true; };
      if(logo) dib(); else pend.push(dib);
      const faja = new T.Mesh(new T.CylinderGeometry(r*1.006, r*1.006, h*.32, 48, 1, true), new T.MeshPhysicalMaterial({map:ftx, roughness:.6}));
      faja.position.y = h*.42; faja.rotation.y = -Math.PI/2; t.add(faja);
      t.add(Object.assign(sombra(r*3.4, r*3.4), {}));
      g.add(t);
    }
    return g;
  }

  /* ---------- funda de lienzo: dos paños cruzados al centro, sin cierre ---------- */
  function funda(){
    const g = new T.Group();
    const W = 70, H = 178, NXh = 16, NYh = 60;
    const UA = 335/599, UB = 285/599;            /* borde del paño de arriba (izq.) y del de abajo (der.) */
    const mascara = new T.Texture();
    const frente = cargar("{{F:p_funda}}", (t, im) => { const c = document.createElement("canvas"); c.width = im.width; c.height = im.height; const x = c.getContext("2d"); x.drawImage(im,0,0); const d = x.getImageData(0,0,c.width,c.height); for(let i = 0; i < d.data.length; i += 4){ const a = d.data[i+3]; d.data[i] = d.data[i+1] = d.data[i+2] = a; d.data[i+3] = 255; } x.putImageData(d,0,0); mascara.image = c; mascara.needsUpdate = true; });
    /* espalda: lienzo liso con el isologo y el logo bordados en la mitad de abajo. Van dados vuelta a propósito:
       al doblar la funda en dos, esa mitad sube por delante y el logo queda derecho mirando a quien la recibe */
    const espalda = lienzoTx(512, 1302, (x,w,h) => { x.fillStyle = "#E3D6C3"; x.fillRect(0,0,w,h); });
    { let lg = null; const dib = () => { if(!lg) return; const c = espalda.image, x = c.getContext("2d"), w = c.width, h = c.height;
        x.fillStyle = "#E3D6C3"; x.fillRect(0,0,w,h);
        const g2 = x.createLinearGradient(0,0,w,0); g2.addColorStop(0,"rgba(90,70,50,.08)"); g2.addColorStop(.5,"rgba(90,70,50,0)"); g2.addColorStop(1,"rgba(90,70,50,.08)"); x.fillStyle = g2; x.fillRect(0,0,w,h);
        x.save(); x.translate(w/2, h*.75); x.scale(1, -1);
        const lw = w*.72, lh = lw*lg.height/lg.width; const tmp = document.createElement("canvas"); tmp.width = lw; tmp.height = lh; const tx = tmp.getContext("2d"); tx.drawImage(lg,0,0,lw,lh); tx.globalCompositeOperation = "source-in"; tx.fillStyle = "#482a1c"; tx.fillRect(0,0,lw,lh);
        x.drawImage(tmp, -lw/2, -lh/2, lw, lh); x.restore(); espalda.needsUpdate = true; };
      cargar("{{F:logo_full}}", (tt, im) => { lg = im; dib(); }); }
    const lino = new T.MeshPhysicalMaterial({map:espalda, roughness:.92, sheen:.5, sheenColor:new T.Color(0xffffff), alphaMap:mascara, alphaTest:.5, side:T.DoubleSide, bumpMap:RELIEVE, bumpScale:.4, emissive:0x3a3026, emissiveIntensity:.2});
    const fondo = new T.Mesh(new T.PlaneGeometry(W, H, 1, 96), lino); fondo.position.set(0, 0, 0); g.add(fondo);
    const fondoBase = fondo.geometry.attributes.position.array.slice();
    for(let k = 0; k < fondoBase.length; k += 3){ fondoBase[k+1] += H/2; fondoBase[k+2] = -1.8; }
    /* doblado en dos, como se lleva una funda: la mitad de abajo sube por delante con un doblez redondeado;
       así quedan juntas las manijas de las dos puntas y por fuera se ve la espalda con el logo */
    const H2 = H/2, RD = 4.5;
    const sm = x => { x = Math.max(0, Math.min(1, x)); return x*x*(3 - 2*x); };
    function plegar(arr, pl){
      if(pl < .001) return;
      const a = sm(pl)*Math.PI*.985, baja = (H2 - RD)*sm(pl);
      for(let i = 0; i < arr.length; i += 3){ const y = arr[i+1], z = arr[i+2];
        let Y = y, Z = z;
        if(y < H2){ const u = H2 - y, L = RD*a; let py, pz, f;
          if(u < L){ f = u/RD; py = H2 - RD*Math.sin(f); pz = RD - RD*Math.cos(f); }
          else { f = a; py = H2 - RD*Math.sin(a) + Math.cos(Math.PI - a)*(u - L); pz = RD - RD*Math.cos(a) + Math.sin(a)*(u - L); }
          /* normal de la tela en ese punto: (sen f, cos f) en (y, z) */
          Y = py + Math.sin(f)*z; Z = pz + Math.cos(f)*z; }
        arr[i+1] = Y - baja; arr[i+2] = Z; } }
    const mFrente = new T.MeshPhysicalMaterial({map:frente, alphaMap:mascara, alphaTest:.5, roughness:.9, emissive:0x3a3026, emissiveIntensity:.25, sheen:.55, sheenColor:new T.Color(0xffffff), side:T.DoubleSide, bumpMap:RELIEVE, bumpScale:.45});
    /* lado: -1 paño izquierdo (va arriba), 1 paño derecho (abajo) */
    const panos = [-1, 1].map(lado => {
      const ancho = lado < 0 ? UA*W : (1 - UB)*W;
      const geo = new T.BufferGeometry(), n = (NXh+1)*(NYh+1), p = new Float32Array(n*3), uv = new Float32Array(n*2), idx = [];
      for(let j = 0; j <= NYh; j++) for(let i = 0; i <= NXh; i++){ const k = j*(NXh+1)+i, e = i/NXh; uv[k*2] = lado < 0 ? e*UA : 1 - e*(1 - UB); uv[k*2+1] = 1 - j/NYh; }
      for(let j = 0; j < NYh; j++) for(let i = 0; i < NXh; i++){ const a = j*(NXh+1)+i, b = a+1, c = a+NXh+1, d = c+1; idx.push(a,c,b, b,c,d); }
      geo.setAttribute("position", new T.BufferAttribute(p,3)); geo.setAttribute("uv", new T.BufferAttribute(uv,2)); geo.setIndex(idx);
      const m = new T.Mesh(geo, mFrente); m.renderOrder = lado < 0 ? 2 : 1; g.add(m);
      return {lado, m, ancho};
    });
    let abrir = function(d, tt, pl = 0){
      { const a = fondo.geometry.attributes.position.array; a.set(fondoBase); plegar(a, pl); fondo.geometry.attributes.position.needsUpdate = true; fondo.geometry.computeVertexNormals(); }
      panos.forEach(({lado, m, ancho}) => {
        /* el de arriba abre primero; el de abajo después */
        const q = lado < 0 ? clamp(d/.62) : clamp((d - .3)/.7);
        const p = m.geometry.attributes.position.array, z0 = lado < 0 ? 1.9 : 1.3;
        for(let j = 0; j <= NYh; j++){ const s = j/NYh*H;
          /* arriba se abre un poco antes que abajo: la mano tira desde el pecho */
          const qs = clamp(q*1.25 - (s/H)*.25), ola = Math.sin(s*.07 + tt*1.2)*.5*qs*(1-qs)*4;
          for(let i = 0; i <= NXh; i++){ const e = i/NXh*ancho, k = (j*(NXh+1)+i)*3;
            const a = qs * 1.75 * Math.pow(e/ancho, .85);      /* se curva desde la costura lateral */
            const x0 = lado*(W/2);
            const xs = a ? x0 - lado*(e*Math.sin(a)/a) : x0 - lado*e, zs = a ? z0 + e*(1 - Math.cos(a))/a : z0;
            const caida = 1.2*Math.sin(Math.PI*e/ancho)*Math.sin(Math.PI*s/H)*(1 - qs);   /* panza de la tela cerrada */
            p[k] = xs; p[k+1] = H - s; p[k+2] = zs + caida + ola*(e/ancho); } }
        plegar(p, pl);
        m.geometry.attributes.position.needsUpdate = true; m.geometry.computeVertexNormals();
      });
    }
    /* manija de la punta de abajo: la misma cinta de cuero que la de arriba (patas cosidas con un cuadrado y una cruz) */
    const cintaTx = lienzoTx(1024, 64, (x,w,h) => { x.fillStyle = "#4a3122"; x.fillRect(0,0,w,h);
      for(let k = 0; k < w; k += 3){ x.fillStyle = `rgba(0,0,0,${.06 + .06*Math.random()})`; x.fillRect(k, 0, 1, h); }
      x.strokeStyle = "rgba(30,18,10,.85)"; x.lineWidth = 2; x.setLineDash([7,5]);
      x.beginPath(); x.moveTo(0, 6); x.lineTo(w, 6); x.moveTo(0, h-6); x.lineTo(w, h-6); x.stroke();
      const caja = (x0, x1) => { x.beginPath(); x.rect(x0, 9, x1 - x0, h - 18); x.moveTo(x0, 9); x.lineTo(x1, h - 9); x.moveTo(x0, h - 9); x.lineTo(x1, 9); x.stroke(); };
      caja(w*.03, w*.12); caja(w*.88, w*.97); });
    const camino = new T.CatmullRomCurve3([new T.Vector3(-8.7, 9.5, 0), new T.Vector3(-8.7, 3, 0), new T.Vector3(-8.6, -1.5, 0), new T.Vector3(-7.4, -5.2, 0), new T.Vector3(-4, -7.4, 0), new T.Vector3(0, -8, 0), new T.Vector3(4, -7.4, 0), new T.Vector3(7.4, -5.2, 0), new T.Vector3(8.6, -1.5, 0), new T.Vector3(8.7, 3, 0), new T.Vector3(8.7, 9.5, 0)]);
    const NC = 90, AC = 3.1, EC = .35, cpos = [], cuv = [], cidx = [];
    for(let i = 0; i <= NC; i++){ const u = i/NC, p = camino.getPointAt(u), tg = camino.getTangentAt(u), n = new T.Vector3(-tg.y, tg.x, 0);
      const z = 2.3 + (Math.abs(p.y) < 0 || p.y < 0 ? -.2 : 0);
      [[-1, 0],[1, 0],[1, EC],[-1, EC]].forEach(([sd, e]) => { cpos.push(p.x + n.x*sd*AC/2, p.y + n.y*sd*AC/2, z + e); cuv.push(u, sd < 0 ? 0 : 1); }); }
    for(let i = 0; i < NC; i++) for(let k = 0; k < 4; k++){ const a0 = i*4 + k, a1 = i*4 + (k+1)%4, b0 = a0 + 4, b1 = a1 + 4; cidx.push(a0, a1, b0, a1, b1, b0); }
    const gc = new T.BufferGeometry(); gc.setAttribute("position", new T.Float32BufferAttribute(cpos, 3)); gc.setAttribute("uv", new T.Float32BufferAttribute(cuv, 2)); gc.setIndex(cidx); gc.computeVertexNormals();
    const manijas = new T.Mesh(gc, new T.MeshPhysicalMaterial({map:cintaTx, roughness:.55, clearcoat:.25, clearcoatRoughness:.5, side:T.DoubleSide}));
    const manijasBase = Float32Array.from(manijas.geometry.attributes.position.array); g.add(manijas);
    const abrir0 = abrir;
    abrir = (d, tt, pl = 0) => { abrir0(d, tt, pl); const a = manijas.geometry.attributes.position.array; a.set(manijasBase); plegar(a, pl); manijas.geometry.attributes.position.needsUpdate = true; manijas.geometry.computeVertexNormals(); };
    abrir(0, 0);
    g.add(sombra(86, 30));
    g.userData.abrir = abrir;
    return g;
  }

  /* ---------- vestidos (modelos generados con detalle de taller) ---------- */
  const NX = innerWidth <= 960 ? 88 : 128, NY = innerWidth <= 960 ? 60 : 84;
  /* texturas de tela */
  const texTela = (w, h, dib, rep) => { const c = document.createElement("canvas"); c.width = w; c.height = h; dib(c.getContext("2d"), w, h); const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; if(rep) t.repeat.set(rep[0], rep[1]); t.anisotropy = 8; return t; };
  const SATEN = texTela(512, 512, (x,w,h) => { const im = x.createImageData(w,h), d = im.data; for(let j = 0; j < h; j++) for(let i = 0; i < w; i++){ const k = (j*w+i)*4; const v = 128 + ((i + (j>>1)) % 4 < 2 ? 7 : -7) + (Math.random()-.5)*10 + Math.sin(j*.05 + Math.sin(i*.013)*3)*9; d[k] = d[k+1] = d[k+2] = v; d[k+3] = 255; } x.putImageData(im,0,0); });
  const COSTURAS = texTela(1024, 256, (x,w,h) => { x.fillStyle = "#808080"; x.fillRect(0,0,w,h); for(let k = 0; k < 14; k++){ const cx = (k+.5)/14*w; const g = x.createLinearGradient(cx-10,0,cx+10,0); g.addColorStop(0,"#808080"); g.addColorStop(.4,"#a8a8a8"); g.addColorStop(.5,"#505050"); g.addColorStop(.6,"#a8a8a8"); g.addColorStop(1,"#808080"); x.fillStyle = g; x.fillRect(cx-10,0,20,h); } }, [1,1]);
  const TUL = texTela(256, 256, (x,w,h) => { x.clearRect(0,0,w,h); x.strokeStyle = "rgba(255,255,255,1)"; x.lineWidth = 1.6; const s = 16; for(let j = -1; j < h/s + 2; j++) for(let i = -1; i < w/s + 2; i++){ const cx = i*s + (j%2 ? s/2 : 0), cy = j*s*.87; x.beginPath(); for(let a = 0; a < 6; a++){ const an = a/6*Math.PI*2 + Math.PI/6; x.lineTo(cx + Math.cos(an)*s*.55, cy + Math.sin(an)*s*.55); } x.closePath(); x.stroke(); } }, [10,10]);
  const ENCAJE = texTela(512, 512, (x,w,h) => { x.clearRect(0,0,w,h); x.strokeStyle = "#fff"; x.fillStyle = "#fff"; x.lineWidth = 2;
    for(let j = 0; j < 4; j++) for(let i = 0; i < 4; i++){ const cx = i*128 + (j%2 ? 64 : 0) + 64, cy = j*128 + 64;
      for(let p = 0; p < 8; p++){ const a = p/8*Math.PI*2; x.beginPath(); x.ellipse(cx + Math.cos(a)*22, cy + Math.sin(a)*22, 16, 7, a, 0, Math.PI*2); x.stroke(); }
      x.beginPath(); x.arc(cx, cy, 8, 0, Math.PI*2); x.fill();
      x.beginPath(); x.moveTo(cx+40, cy); x.bezierCurveTo(cx+60, cy-40, cx+90, cy+30, cx+128, cy); x.stroke();
      for(let k = 0; k < 6; k++){ const t = k/6; x.beginPath(); x.arc(cx + 40 + t*88, cy + Math.sin(t*Math.PI*2)*14, 3, 0, Math.PI*2); x.fill(); } }
    x.globalAlpha = .45; x.lineWidth = 1; for(let k = 0; k < w; k += 8){ x.beginPath(); x.moveTo(k,0); x.lineTo(k+h*.5,h); x.stroke(); x.beginPath(); x.moveTo(k,0); x.lineTo(k-h*.5,h); x.stroke(); } }, [3,3]);
  const M = {
    saten: (c, o = {}) => new T.MeshPhysicalMaterial(Object.assign({color:c, bumpMap:SATEN, bumpScale:.32, roughness:.22, metalness:0, sheen:.8, sheenRoughness:.28, sheenColor:new T.Color(c).lerp(new T.Color(0xffffff), .5), clearcoat:.5, clearcoatRoughness:.18, side:T.DoubleSide, envMapIntensity:.8}, o)),
    corset: (c) => new T.MeshPhysicalMaterial({color:c, bumpMap:COSTURAS, bumpScale:.9, roughness:.3, sheen:.7, sheenRoughness:.3, sheenColor:new T.Color(c).lerp(new T.Color(0xffffff), .45), clearcoat:.35, clearcoatRoughness:.25, side:T.DoubleSide, envMapIntensity:.8}),
    tul: (c, o) => new T.MeshPhysicalMaterial({color:c, alphaMap:TUL, transparent:true, opacity:o, roughness:.8, side:T.DoubleSide, depthWrite:false, sheen:.6, sheenColor:new T.Color(0xffffff)}),
    encaje: (c) => new T.MeshPhysicalMaterial({color:c, alphaMap:ENCAJE, alphaTest:.35, roughness:.7, sheen:.6, sheenColor:new T.Color(0xffffff), side:T.DoubleSide}),
    lame: (c) => new T.MeshPhysicalMaterial({color:c, bumpMap:SATEN, bumpScale:.35, roughness:.3, metalness:.75, side:T.DoubleSide, envMapIntensity:1.3, clearcoat:.2}),
    crepe: (c) => new T.MeshPhysicalMaterial({color:c, bumpMap:RELIEVE, bumpScale:.7, roughness:.72, sheen:.6, sheenRoughness:.55, sheenColor:new T.Color(c).lerp(new T.Color(0xffffff), .4), side:T.DoubleSide}),
    piedra: () => new T.MeshPhysicalMaterial({color:0xffffff, metalness:.2, roughness:.05, clearcoat:1, clearcoatRoughness:.05, envMapIntensity:2.2, iridescence:.6})
  };
  const UVX = 9, UVY = 9;
  function pieza(perfil, opt, material){
    const g = new T.BufferGeometry(), n = (NX+1)*(NY+1);
    const pos = new Float32Array(n*3), uv = new Float32Array(n*2), idx = [];
    for(let j = 0; j <= NY; j++) for(let i = 0; i <= NX; i++){ const k = j*(NX+1)+i; uv[k*2] = i/NX*(opt.uvx || UVX); uv[k*2+1] = (1 - j/NY)*(opt.uvy || UVY); }
    for(let j = 0; j < NY; j++) for(let i = 0; i < NX; i++){ const a = j*(NX+1)+i, b = a+1, c = a+NX+1, d = c+1; idx.push(a,c,b, b,c,d); }
    g.setAttribute("position", new T.BufferAttribute(pos, 3)); g.setAttribute("uv", new T.BufferAttribute(uv, 2)); g.setIndex(idx);
    const m = new T.Mesh(g, material); m.userData = {perfil, opt}; m.frustumCulled = false;
    return m;
  }
  /* godets: pliegues con cresta redonda y valle marcado, como la tela que cae por su peso */
  const godet = (x) => { const s = Math.sin(x); return s > 0 ? Math.pow(s, .7) : -Math.pow(-s, 1.6)*.85; };
  const DIN = {tw:0, fl:0};
  function mover(m, tt, amp){
    const {perfil, opt} = m.userData, p = m.geometry.attributes.position.array;
    for(let j = 0; j <= NY; j++){
      const t = j/NY, pr = perfil(t), w = Math.pow(t, opt.libre || 1.6);
      const swx = (Math.sin(tt*1.05 + t*2.4) * 3 + Math.sin(tt*1.9 + t*5.1) * .8) * w * amp * (opt.vaiven || 1);
      const swz = Math.cos(tt*.82 + t*1.8) * 2 * w * amp * (opt.vaiven || 1);
      for(let i = 0; i <= NX; i++){
        const th = i/NX * Math.PI*2, fr = th - Math.PI/2;
        let r = pr.r * (1 + DIN.fl*Math.pow(t, 1.6));
        if(opt.pliegues){ const ph = th*opt.np + opt.fase + tt*.5*amp + t*1.1 + Math.sin(th*3 + t*2)*.6;
          r *= 1 + opt.pliegues * 1.25 * Math.pow(t, 1.1) * (.55 + .45*Math.sin(th*2.3 + opt.fase*1.7) * Math.sin(th*1.1 + 2)) * (godet(ph) * .78 + Math.sin(th*(opt.np*2+1) - tt*.7*amp + opt.fase*2) * .16 + Math.sin(th*(opt.np*4+3) + opt.fase) * .06); }
        if(opt.busto){ const dd = Math.atan2(Math.sin(fr), Math.cos(fr));
          r += 1.9*Math.exp(-Math.pow((t - .3)/.17, 2)) * Math.exp(-Math.pow((Math.abs(dd) - .42)/.32, 2))   /* busto */
             - .9*Math.exp(-Math.pow((t - .3)/.2, 2)) * Math.exp(-dd*dd/.02)                                  /* entre el busto */
             - .8*Math.pow(Math.max(0, -Math.cos(fr)), 2)*Math.sin(Math.PI*t); }                                /* espalda más plana */
        if(opt.frunce) r *= 1 + opt.frunce * Math.exp(-t*9) * Math.sin(th*opt.np*3.5 + opt.fase);   /* frunce fino en la cintura */
        if(opt.cola) r *= 1 + opt.cola * Math.pow(t, 3) * Math.max(0, -Math.sin(th));
        if(opt.drapeado) r *= 1 + opt.drapeado * Math.exp(-Math.pow((th - 0.4)/.5, 2)) * Math.sin(t*Math.PI);
        if(opt.cruce){ const c = Math.atan2(Math.sin(th - Math.PI/2), Math.cos(th - Math.PI/2)); r *= 1 + opt.cruce * Math.exp(-Math.pow((c - .5 + t*.9)/.12, 2)) * Math.sin(t*Math.PI)*.6; }  /* drapeado en diagonal */
        let y = pr.y;
        if(opt.escote && j === 0){ const dd = Math.atan2(Math.sin(fr), Math.cos(fr)); y += -3.6*Math.exp(-dd*dd/.04) + 1.4*Math.exp(-Math.pow(Math.abs(dd)-.55, 2)/.03) - 1.2*Math.max(0, -Math.cos(fr)); }
        if(opt.ruedo && j >= NY - 2) y += ((Math.sin(th*opt.np + opt.fase) * .9 + Math.sin(th*3 + tt*.4)) * amp + Math.sin(th*opt.np*2)*.4) * (j === NY ? 1 : .5);
        const k = (j*(NX+1)+i)*3;
        const tq = th + DIN.tw*Math.pow(t, 1.8);
        p[k] = Math.cos(tq) * r + swx; p[k+1] = y + DIN.fl*1.5*Math.pow(t, 3); p[k+2] = Math.sin(tq) * r * (pr.e || .78) + swz;
      }
    }
    m.geometry.attributes.position.needsUpdate = true; m.geometry.computeVertexNormals();
  }
  const lerp2 = (a,b,t) => a + (b-a)*t, suave = t => t*t*(3-2*t);
  const perfilCorset = (top, cint, rb, rc) => t => ({y: lerp2(top, cint - 1.5, t), r: t < .22 ? lerp2(rb*.93, rb, suave(t/.22)) : lerp2(rb, rc, suave((t-.22)/.78)), e:.8});
  const corset = (top, cint, rb, rc, material, escote, uvx) => pieza(perfilCorset(top, cint, rb, rc), {escote, uvx: uvx || 1, uvy: 1, busto:1}, material);
  /* pedrería sobre el corset: piedritas que brillan */
  function pedreria(perfil, n, frente, tam){
    const geo = new T.IcosahedronGeometry(tam || .32, 1), im = new T.InstancedMesh(geo, M.piedra(), n), d = new T.Object3D();
    for(let k = 0; k < n; k++){ const t = Math.pow(Math.random(), 1.3)*.95, a = (frente ? Math.PI/2 + (Math.random()-.5)*2.4 : Math.random()*Math.PI*2), pr = perfil(t), r = pr.r + .18;
      d.position.set(Math.cos(a)*r, pr.y - (t < .04 ? 1 : 0), Math.sin(a)*r*pr.e); d.rotation.set(Math.random()*3, Math.random()*3, 0); d.scale.setScalar(.6 + Math.random()*.8); d.updateMatrix(); im.setMatrixAt(k, d.matrix); }
    return im;
  }
  function percha(){
    const g = new T.Group(), md = new T.MeshPhysicalMaterial({color:0x8a6a4a, roughness:.4, clearcoat:.6, clearcoatRoughness:.3, bumpMap:RELIEVE, bumpScale:.2});
    const c = new T.CatmullRomCurve3([new T.Vector3(-21,138.5,0), new T.Vector3(-10,143,0), new T.Vector3(0,147,0), new T.Vector3(10,143,0), new T.Vector3(21,138.5,0)]);
    g.add(new T.Mesh(new T.TubeGeometry(c, 40, 1.1, 12), md));
    const barra = new T.Mesh(new T.CylinderGeometry(.5, .5, 40, 10), md); barra.rotation.z = Math.PI/2; barra.position.y = 138.5; g.add(barra);
    const gancho = new T.Mesh(new T.TorusGeometry(3.4, .42, 10, 32, Math.PI*1.3), mat.metal()); gancho.position.set(0, 154, 0); gancho.rotation.z = -.3; g.add(gancho);
    const palo = new T.Mesh(new T.CylinderGeometry(.42, .42, 4.6, 10), mat.metal()); palo.position.set(0, 149.6, 0); g.add(palo);
    return g;
  }
  const tirantes = (top, material) => { const g = new T.Group(); [-1,1].forEach(sx => { const c = new T.CatmullRomCurve3([new T.Vector3(sx*7, top-1, 8), new T.Vector3(sx*12, 139, 4), new T.Vector3(sx*12, 139, -4), new T.Vector3(sx*7, top-1, -8)]); g.add(new T.Mesh(new T.TubeGeometry(c, 32, .42, 8), material)); }); return g; };
  const cintas = (top, c) => { const g = new T.Group(), m = M.saten(c); [-1,1].forEach(sx => { const cu = new T.CatmullRomCurve3([new T.Vector3(sx*9, top-2, 0), new T.Vector3(sx*12, (top+139)/2, 0), new T.Vector3(sx*15.5, 139.5, 0)]); g.add(new T.Mesh(new T.TubeGeometry(cu, 20, .28, 6), m)); }); return g; };
  const cinto = (c, r) => { const m = new T.Mesh(new T.TorusGeometry(r || 11.3, .95, 12, 96), M.saten(c)); m.rotation.x = Math.PI/2; m.scale.set(1, .8, 1); m.position.y = 98.6; return m; };
  /* moño en la espalda: dos lazos y dos colas que caen */
  function mono(c, y){ const g = new T.Group(), m = M.saten(c);
    [-1,1].forEach(sx => { const l = new T.Mesh(new T.TorusGeometry(3.2, 1.1, 10, 24), m); l.scale.set(1.3, .7, .5); l.position.set(sx*3.6, 0, 0); l.rotation.z = sx*.25; g.add(l);
      const cu = new T.CatmullRomCurve3([new T.Vector3(sx*1, -1, .4), new T.Vector3(sx*3, -12, 1.2), new T.Vector3(sx*2.2, -26, .8), new T.Vector3(sx*4, -38, 1.6)]); const cola = new T.Mesh(new T.TubeGeometry(cu, 30, 1.3, 6), m); cola.scale.z = .35; g.add(cola); });
    g.add(new T.Mesh(new T.SphereGeometry(1.5, 14, 10), m)); g.position.set(0, y, -9.4); g.rotation.y = Math.PI; return g; }
  /* flor de satén: pétalos curvos en tres vueltas */
  function flor(c){ const g = new T.Group(), m = M.saten(c);
    const pet = new T.SphereGeometry(2.4, 18, 12, 0, Math.PI*2, 0, Math.PI*.55);
    [[9,3.2,.0],[7,2.1,.4],[5,1.1,.8]].forEach(([n, rr, f], v) => { for(let k = 0; k < n; k++){ const p = new T.Mesh(pet, m), a = k/n*Math.PI*2 + v*.5; p.scale.set(1, .5 + v*.1, 1.2 - v*.15); p.position.set(Math.cos(a)*rr, Math.sin(a)*rr, v*.5); p.lookAt(Math.cos(a)*(rr+6), Math.sin(a)*(rr+6), 4 + f*6); g.add(p); } });
    g.add(new T.Mesh(new T.SphereGeometry(.9, 12, 8), M.piedra())); return g; }
  const MODELOS = {
    aurora(){ const g = new T.Group(), c = 0xF3EBDD;
      const pc = perfilCorset(128, 99, 14, 11);
      g.add(corset(128, 99, 14, 11, M.corset(c), true)); g.add(pedreria(pc, 260, true, .28));
      const falda = (ex, o, f, m, uv) => pieza(t => ({y: lerp2(99, 0, t), r: 11 + (50 + ex) * Math.pow(Math.sin(Math.min(1, t*1.15) * Math.PI/2), 1.25), e:.86}), {pliegues:f, np:12, fase:o, ruedo:true, libre:1.7, frunce:.05, uvx:uv, uvy:uv}, m);
      g.add(falda(0, 0, .12, M.saten(c))); g.add(falda(2.5, 1.7, .16, M.tul(0xFBF7EF, .55), 1)); g.add(falda(5, 3.1, .19, M.tul(0xFFFFFF, .45), 1)); g.add(falda(7.5, 4.4, .22, M.tul(0xFFFDF8, .35), 1));
      g.add(cintas(128, c)); g.add(cinto(0xEFE5D3)); g.add(mono(0xEFE5D3, 98.6));
      const fl = flor(0xF6EFE3); fl.position.set(-7.5, 100.5, 9.4); fl.rotation.y = -.5; g.add(fl); return g; },
    ofelia(){ const g = new T.Group(), c = 0xF1EADF, m = M.saten(c);
      const pc = perfilCorset(127, 99, 13.5, 11);
      g.add(corset(127, 99, 13.5, 11, M.corset(c), true));
      const enc = corset(127.4, 99, 13.75, 11.2, M.encaje(0xFBF8F2), true, 3); enc.userData.opt.uvy = 2; g.add(enc);
      g.add(cintas(127, c)); g.add(cinto(0xECE3D6));
      const pf = t => { const y = lerp2(99, 0, t); let r; if(y > 82) r = lerp2(11, 15.5, suave((99-y)/17)); else if(y > 42) r = lerp2(15.5, 12, suave((82-y)/40)); else r = lerp2(12, 36, Math.pow((42-y)/42, 1.6)); return {y, r, e:.8}; };
      g.add(pieza(pf, {pliegues:.06, np:10, fase:.4, cola:.5, ruedo:true, libre:2.4, vaiven:.7}, m));
      /* volado de encaje que asoma en el ruedo */
      g.add(pieza(t => { const y = lerp2(30, 0, t), q = pf(1 - y/99); return {y, r: q.r*1.04 + .4, e:.8}; }, {pliegues:.09, np:14, fase:1, cola:.5, ruedo:true, libre:1.5, vaiven:.7, uvx:4, uvy:1.5}, M.encaje(0xFBF8F2)));
      g.add(pedreria(pc, 90, true, .22)); return g; },
    "noche-de-bulevar"(){ const g = new T.Group(), c = 0x1E2A47, m = M.saten(c, {sheenColor:new T.Color(0x8aa0d0)});
      g.add(corset(127, 99, 13.5, 11, M.corset(c), true)); g.add(cintas(127, c)); g.add(cinto(0x1A2440));
      g.add(pieza(t => ({y: lerp2(99, 0, t), r: 11 + 32 * Math.pow(t, .85), e:.82}), {pliegues:.13, np:7, fase:1.2, ruedo:true, libre:1.4, frunce:.04, cruce:.25}, m));
      const b = new T.Group(); for(let k = 0; k < 10; k++){ const s = new T.Mesh(new T.IcosahedronGeometry(.55, 1), M.piedra()), a = k/10*Math.PI*2; s.position.set(Math.cos(a)*1.5, Math.sin(a)*1.5, 0); b.add(s); } b.add(new T.Mesh(new T.IcosahedronGeometry(.9, 2), M.piedra())); b.position.set(6, 100, 9.6); g.add(b); return g; },
    plata(){ const g = new T.Group(), m = M.lame(0xC8CBCD);
      const pc = perfilCorset(125, 99, 13, 11.5);
      g.add(corset(125, 99, 13, 11.5, m, false)); g.add(tirantes(125, m)); g.add(cinto(0xB9BCBF, 11.8));
      g.add(pieza(t => ({y: lerp2(99, 0, t), r: 11.5 + 4*Math.sin(Math.min(1,t*2.2)*Math.PI/2) + 3*t, e:.8}), {pliegues:.035, np:8, fase:.2, ruedo:true, libre:1.8, vaiven:.6, frunce:.02}, m));
      const hebilla = new T.Mesh(new T.TorusGeometry(1.6, .35, 8, 4), M.piedra()); hebilla.rotation.z = Math.PI/4; hebilla.position.set(0, 98.6, 9.6); g.add(hebilla); return g; },
    milonga(){ const g = new T.Group(), m = M.crepe(0x4B595D);
      g.add(corset(126, 99, 13.5, 11, m, false)); g.add(tirantes(126, m)); g.add(cinto(0x434F53));
      g.add(pieza(t => { const y = lerp2(99, 0, t); const r = y > 30 ? 11 + 5*Math.sin(Math.min(1,(99-y)/25)*Math.PI/2) - 3*Math.max(0,(70-y)/40) : 13 + 18*Math.pow((30-y)/30, 1.4); return {y, r: Math.max(11, r), e:.8}; }, {pliegues:.05, np:8, fase:2.2, drapeado:.22, cruce:.3, ruedo:true, libre:2, vaiven:.8}, m)); return g; }
  };
  const vest = new T.Group(), giroV = new T.Group(), perchaV = percha(); vest.add(giroV); giroV.add(perchaV);
  const cacheV = {}; let vA = null, vB = null;
  const modelo = id => { if(cacheV[id]) return cacheV[id]; const g = MODELOS[id](); g.traverse(o => { if(o.isMesh){ const tr = o.material.transparent; o.castShadow = !tr; o.receiveShadow = true; } }); return cacheV[id] = g; };
  function usarV(a, b){ if(a === vA && b === vB) return; vA = a; vB = b; giroV.children.slice(1).forEach(c => giroV.remove(c)); giroV.add(modelo(a)); if(b) giroV.add(modelo(b)); }

  const O = {bolso:bolso(), book:book(), tubos:tubos(), funda:funda(), vest};
  Object.values(O).forEach(o => mundo.add(o));
  usarV("aurora", null);
  /* opacidad por objeto */
  function mats(o, re){ if(o.userData.mats && !re) return o.userData.mats; const ms = new Set(); o.traverse(c => { if(c.material) ms.add(c.material); }); ms.forEach(m => { if(m.userData.o0 === undefined) m.userData.o0 = [m.transparent, m.opacity]; }); o.userData.mats = [...ms]; return o.userData.mats; }
  function opac(o, a){ o.visible = a > .01; if(!o.visible) return; mats(o).forEach(m => { const [tr, op] = m.userData.o0, t = tr || a < .995; if(m.transparent !== t){ m.transparent = t; m.needsUpdate = true; } m.opacity = op * a; m.depthWrite = !tr && a > .6; }); }
  const v3 = new T.Vector3();
  function proyectar(x, y, z){ v3.set(x, y, z); mundo.localToWorld(v3); v3.project(cam); return [(v3.x+1)/2*innerWidth, (1-v3.y)/2*innerHeight]; }
  let tam = [0,0];
  function render(c, t){
    const vw = innerWidth, vh = innerHeight;
    if(tam[0] !== vw || tam[1] !== vh){ tam = [vw, vh]; ren.setPixelRatio(Math.min(1.75, devicePixelRatio || 1)); ren.setSize(vw, vh, false); cam.aspect = vw/vh; cam.fov = 2*Math.atan((vh/2)/1900)*180/Math.PI; cam.position.set(0,0,1900); cam.lookAt(0,0,0); cam.updateProjectionMatrix(); }
    mundo.position.set(c.cx - vw/2, vh/2 - c.cy, 0);
    const k = c.s * U; mundo.scale.set(k, k, k);
    mundo.rotation.set(-c.rx*Math.PI/180, c.ry*Math.PI/180, 0);
    O.bolso.position.set(c.bx, -c.by, c.bz); opac(O.bolso, c.bo);
    O.bolso.userData.tapa.rotation.x = -c.lid * 1.95;
    O.book.position.set(c.kx, 0, c.kz); O.book.rotation.y = c.kry*Math.PI/180; opac(O.book, c.ko);
    O.tubos.position.set(c.tx, 0, c.tz); opac(O.tubos, c.to);
    O.funda.position.set(c.fx, -c.fy, c.fz); O.funda.scale.setScalar(c.fs); opac(O.funda, c.fo);
    if(O.funda.visible) O.funda.userData.abrir(c.door, t/1000, c.pl || 0);
    const fl = reducido ? 0 : c.flota, bob = Math.sin(t/900)*2.2*fl;
    vest.position.set(c.vx, -c.vy + bob, c.vz); vest.scale.setScalar(c.vs);
    if(c.fo > .01){ const f = Math.min(1, c.fo*1.5), sal = Math.min(1, c.sal*1.6), k = 1 - (1 - (.46 + .54*sal))*f, kz = 1 - (1 - (.035 + .965*sal))*f; vest.scale.x *= k; vest.scale.z *= kz; }
    vest.rotation.z = Math.sin(t/1300)*.024*fl;
    /* inercia de la tela: la falda se queda atrás cuando gira y se abre con la velocidad */
    const dt = Math.max(.008, Math.min(.06, (t - (render.t0 || t))/1000 || .016)); render.t0 = t;
    const w = ((c.ang - (render.a0 ?? c.ang)) / dt), sv = ((c.sal - (render.s0 ?? c.sal)) / dt); render.a0 = c.ang; render.s0 = c.sal;
    render.w = (render.w || 0) + (w - (render.w || 0))*.08; render.sv = (render.sv || 0) + (sv - (render.sv || 0))*.1;
    DIN.tw = reducido ? 0 : Math.max(-.7, Math.min(.7, -render.w*Math.PI/180*.09));
    DIN.fl = reducido ? 0 : Math.min(.22, Math.abs(render.w)*.0007 + Math.max(0, render.sv)*.08);
    let info = null;
    if(c.vo > .01){
      const u = Math.max(0, (c.ang + 90)/180), k = Math.round(u), d = u - k, W = .22;
      let a = ORDEN_V[Math.floor(u) % ORDEN_V.length], b = null, tb = 0;
      if(k >= 1 && Math.abs(d) < W){ a = ORDEN_V[(k-1) % ORDEN_V.length]; b = ORDEN_V[k % ORDEN_V.length]; tb = (d + W)/(2*W); tb = tb*tb*(3 - 2*tb); }
      if(b === a) b = null;
      usarV(a, b); giroV.rotation.y = c.ang*Math.PI/180;
      const amp = reducido ? 0 : .55 + .45*fl, tt = t/1000; giroV.traverse(o => { if(o.isMesh && o.userData.perfil) mover(o, tt, amp); });
      opac(perchaV, c.vo); opac(modelo(a), c.vo*(b ? 1 - tb : 1)); if(b) opac(modelo(b), c.vo*tb);
      /* el que entra crece apenas desde la cintura, el que sale se encoge */
      modelo(a).scale.set(1, 1, 1); if(b){ const e = .9 + .1*tb; modelo(b).scale.set(e, 1, e); modelo(a).scale.set(1 - .08*tb, 1, 1 - .08*tb); }
      info = {id: b && tb > .5 ? b : a, o: b ? Math.abs(tb - .5)*2 : 1};
    } else { opac(perchaV, 0); giroV.children.slice(1).forEach(g => opac(g, 0)); }
    vest.visible = c.vo > .01;
    E3.info = info ? {...info, pos: proyectar(c.vx + 44, -c.vy + 86, 0), bajo: proyectar(c.vx, -c.vy - 2, 0), flota: c.flota, vo: c.vo * (1 - Math.min(1, c.fo*2))} : null;
    ren.render(esc, cam);
  }
  Object.assign(E3, {ok:true, cv, render, proyectar});
})();