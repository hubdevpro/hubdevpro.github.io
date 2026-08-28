var HDP = {};

(function(){
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

/* boot sequence */
(function(){
  var boot = document.getElementById('boot');
  if (!boot) return;
  var bar = document.getElementById('boot-bar');
  var pct = document.getElementById('boot-pct');
  var line = document.getElementById('boot-line');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    boot.classList.add('hide'); return;
  }
  var msgs = ['INITIALIZING SYSTEM...','LOADING INTEGRATION GRAPH...','ESTABLISHING SECURE LINK...','READY.'];
  var p = 0;
  var t = setInterval(function(){
    p += 4 + Math.random()*10;
    if (p >= 100){ p = 100; clearInterval(t); }
    bar.style.width = p + '%';
    pct.textContent = Math.floor(p) + '%';
    line.textContent = msgs[Math.min(msgs.length-1, Math.floor((p/100)*(msgs.length-1)))];
    if (p >= 100){
      setTimeout(function(){ boot.classList.add('hide'); }, 250);
    }
  }, 90);
})();

/* count-up stats */
(function(){
  var nums = document.querySelectorAll('.stat .num');
  if (!nums.length) return;
  var seen = new WeakSet();
  var io2 = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (!e.isIntersecting || seen.has(e.target)) return;
      seen.add(e.target);
      var el = e.target, target = parseInt(el.dataset.target,10), suffix = el.dataset.suffix || '';
      var start = performance.now(), dur = 1200;
      function step(now){
        var pr = Math.min(1,(now-start)/dur);
        var eased = 1-Math.pow(1-pr,3);
        el.textContent = Math.round(target*eased) + suffix;
        if (pr<1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, {threshold:0.4});
  nums.forEach(function(el){ io2.observe(el); });
})();

/* scroll reveal */
(function(){
  var reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if (e.isIntersecting) e.target.classList.add('in'); });
  }, {threshold:0.12});
  reveals.forEach(function(el){ io.observe(el); });
})();

/* custom cursor */
(function(){
  if (window.matchMedia('(hover:none)').matches) return;
  var dot = document.getElementById('cursor-dot');
  var ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;
  var rx=0, ry=0, mx=0, my=0;
  window.addEventListener('mousemove', function(e){
    mx=e.clientX; my=e.clientY;
    dot.style.left=mx+'px'; dot.style.top=my+'px';
  });
  document.addEventListener('mousedown', function(){ document.body.classList.add('press'); });
  document.addEventListener('mouseup', function(){ document.body.classList.remove('press'); });
  function loop(){
    rx += (mx-rx)*0.18; ry += (my-ry)*0.18;
    ring.style.left=rx+'px'; ring.style.top=ry+'px';
    requestAnimationFrame(loop);
  }
  loop();
})();

/* terminal typing line — reusable, id-driven */
HDP.termType = function(elId, lines){
  var el = document.getElementById(elId);
  if (!el) return;
  var li=0, ci=0, deleting=false;
  function tick(){
    var full = lines[li];
    if (!deleting){
      ci++;
      el.textContent = full.slice(0,ci);
      if (ci>=full.length){ deleting=true; setTimeout(tick,1400); return; }
    } else {
      ci--;
      el.textContent = full.slice(0,ci);
      if (ci<=0){ deleting=false; li=(li+1)%lines.length; }
    }
    setTimeout(tick, deleting?18:32);
  }
  tick();
};

/* ambient background network */
(function(){
  var canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W, H, DPR, nodes = [];

  function resize(){
    W = window.innerWidth; H = window.innerHeight;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    seed();
  }
  function seed(){
    var count = Math.max(16, Math.min(34, Math.round((W*H)/38000)));
    nodes = [];
    for (var i=0;i<count;i++){
      nodes.push({x:Math.random()*W, y:Math.random()*H, vx:(Math.random()-0.5)*0.12, vy:(Math.random()-0.5)*0.12, r:1+Math.random()*1.3});
    }
  }
  var pulses = [];
  function spawnPulse(){
    if (nodes.length<2) return;
    var a=nodes[Math.floor(Math.random()*nodes.length)], b=nodes[Math.floor(Math.random()*nodes.length)];
    if (a===b) return;
    var d=Math.hypot(a.x-b.x,a.y-b.y);
    if (d>240) return;
    pulses.push({a:a,b:b,t:0});
  }
  var linkDist = 170;
  function draw(){
    ctx.clearRect(0,0,W,H);
    for (var i=0;i<nodes.length;i++){
      var n=nodes[i]; n.x+=n.vx; n.y+=n.vy;
      if(n.x<0||n.x>W)n.vx*=-1; if(n.y<0||n.y>H)n.vy*=-1;
    }
    ctx.lineWidth=1;
    for (var i=0;i<nodes.length;i++){
      for (var j=i+1;j<nodes.length;j++){
        var a=nodes[i], b=nodes[j], dx=a.x-b.x, dy=a.y-b.y, dist=Math.sqrt(dx*dx+dy*dy);
        if (dist<linkDist){
          ctx.strokeStyle='rgba(245,194,107,'+((1-dist/linkDist)*0.12)+')';
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      }
    }
    for (var p=pulses.length-1;p>=0;p--){
      var pu=pulses[p]; pu.t+=0.01;
      if (pu.t>=1){ pulses.splice(p,1); continue; }
      var x=pu.a.x+(pu.b.x-pu.a.x)*pu.t, y=pu.a.y+(pu.b.y-pu.a.y)*pu.t;
      var glow=Math.sin(pu.t*Math.PI);
      ctx.beginPath(); ctx.fillStyle='rgba(255,122,89,'+(0.5*glow+0.1)+')'; ctx.arc(x,y,2,0,Math.PI*2); ctx.fill();
    }
    for (var i=0;i<nodes.length;i++){
      var n=nodes[i];
      ctx.beginPath(); ctx.fillStyle='rgba(231,237,247,0.35)'; ctx.arc(n.x,n.y,n.r,0,Math.PI*2); ctx.fill();
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  }
  window.addEventListener('resize', resize);
  resize(); draw();
  if (!reduceMotion) setInterval(spawnPulse, 380);
})();

/* hero integration diagram: centerLabel hub -> connected services */
HDP.heroDiagram = function(canvasId, centerLabel, services){
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W,H,DPR,center,ring=[];

  function resize(){
    var box = canvas.parentElement.getBoundingClientRect();
    W = box.width - 44; H = 340;
    DPR = Math.min(window.devicePixelRatio||1,2);
    canvas.width=W*DPR; canvas.height=H*DPR;
    canvas.style.width=W+'px'; canvas.style.height=H+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    center = {x:W/2, y:H/2};
    var radius = Math.min(W,H)/2 - 44;
    ring = services.map(function(label,i){
      var angle = (i/services.length)*Math.PI*2 - Math.PI/2;
      return {
        label:label,
        x:center.x+Math.cos(angle)*radius,
        y:center.y+Math.sin(angle)*radius,
        phase: Math.random()
      };
    });
  }

  var t = 0;
  function draw(){
    ctx.clearRect(0,0,W,H);

    ring.forEach(function(node){
      ctx.strokeStyle='rgba(245,194,107,0.16)';
      ctx.lineWidth=1;
      ctx.beginPath();
      ctx.moveTo(center.x,center.y);
      ctx.lineTo(node.x,node.y);
      ctx.stroke();

      var p = (t*0.35 + node.phase) % 1;
      var x = center.x + (node.x-center.x)*p;
      var y = center.y + (node.y-center.y)*p;
      var glow = Math.sin(p*Math.PI);
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,122,89,'+(0.75*glow+0.1)+')';
      ctx.arc(x,y,2.6,0,Math.PI*2);
      ctx.fill();
    });

    ring.forEach(function(node){
      ctx.beginPath();
      ctx.fillStyle='#0a1424';
      ctx.strokeStyle='rgba(245,194,107,0.55)';
      ctx.lineWidth=1.4;
      ctx.arc(node.x,node.y,4.5,0,Math.PI*2);
      ctx.fill(); ctx.stroke();

      ctx.font='11px "JetBrains Mono", monospace';
      ctx.fillStyle='rgba(238,242,251,0.8)';
      var tw = ctx.measureText(node.label).width;
      var lx = node.x - tw/2;
      var ly = node.y + (node.y>center.y ? 20 : -12);
      ctx.fillText(node.label, lx, ly);
    });

    var pulse = 26 + Math.sin(t*0.06)*4;
    var grad = ctx.createRadialGradient(center.x,center.y,4,center.x,center.y,pulse+14);
    grad.addColorStop(0,'rgba(255,122,89,0.55)');
    grad.addColorStop(1,'rgba(255,122,89,0)');
    ctx.beginPath(); ctx.fillStyle=grad; ctx.arc(center.x,center.y,pulse+14,0,Math.PI*2); ctx.fill();

    ctx.beginPath();
    ctx.fillStyle='#ff7a59';
    ctx.arc(center.x,center.y,7,0,Math.PI*2);
    ctx.fill();
    ctx.font='bold 11px "JetBrains Mono", monospace';
    ctx.fillStyle='#eef2fb';
    var hw = ctx.measureText(centerLabel).width;
    ctx.fillText(centerLabel, center.x-hw/2, center.y+24);

    t++;
    if (!reduceMotion) requestAnimationFrame(draw);
  }
  window.addEventListener('resize', resize);
  resize(); draw();
};
