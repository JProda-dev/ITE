let DB={players:[],results:[],app:{}};
const labels={classic:"Adivina Pokémon",silhouette:"Silueta",zoom:"Zoom / Carta",description:"Descripción"};
const today=new Date().toISOString().slice(0,10);
document.querySelector("#date").value=today;
document.querySelector("#historyMonth").value=today.slice(0,7);
document.querySelector("#generation").innerHTML=Array.from({length:9},(_,i)=>`<option value="${i+1}">Generación ${i+1}</option>`).join("");

function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function score(r){return r.solved?Math.max(0,(DB.app.pointsPerSolvedCategory||100)-Math.max(0,r.attempts-1)*(DB.app.attemptPenalty||8)):0}
function monthName(m){return new Intl.DateTimeFormat("es-ES",{month:"long",year:"numeric"}).format(new Date(m+"-01T12:00:00"))}
function toast(msg){const t=document.querySelector("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
async function load(){DB=await fetch("/api/db").then(r=>r.json()); renderAll()}
function go(id){document.querySelectorAll(".section").forEach(x=>x.classList.toggle("active",x.id===id));document.querySelectorAll(".nav button").forEach(x=>x.classList.toggle("active",x.dataset.view===id))}
document.querySelectorAll(".nav button").forEach(b=>b.onclick=()=>go(b.dataset.view));

function months(){const vals=[...new Set(DB.results.map(r=>r.date.slice(0,7)))].sort().reverse();const cur=today.slice(0,7);if(!vals.includes(cur))vals.unshift(cur);return vals}
function renderAll(){
  const opts=DB.players.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("");
  document.querySelector("#playerId").innerHTML=opts;
  document.querySelector("#historyPlayer").innerHTML='<option value="">Todos los jugadores</option>'+opts;
  const ms=months(), cm=document.querySelector("#chartMonth"), old=cm.value;
  cm.innerHTML=ms.map(m=>`<option value="${m}">${monthName(m)}</option>`).join("");if(ms.includes(old))cm.value=old;
  document.querySelector("#kPlayers").textContent=DB.players.length;
  document.querySelector("#kGames").textContent=DB.results.length;
  const mres=DB.results.filter(r=>r.date.startsWith(today.slice(0,7)));
  document.querySelector("#kMonthGames").textContent=`${mres.length} este mes`;
  document.querySelector("#kAvgPoints").textContent=DB.results.length?Math.round(DB.results.reduce((a,r)=>a+score(r),0)/DB.results.length):0;
  document.querySelector("#kAvgAttempts").textContent=DB.results.length?(DB.results.reduce((a,r)=>a+r.attempts,0)/DB.results.length).toFixed(1):"0.0";
  renderPlayers();renderDashboard();renderHistory();updateLiveScore();
}
function renderPlayers(){
  document.querySelector("#playerCount").textContent=`${DB.players.length} jugadores`;
  document.querySelector("#playerList").innerHTML=DB.players.length?DB.players.map(p=>{
    const rs=DB.results.filter(r=>r.playerId===p.id), pts=rs.reduce((a,r)=>a+score(r),0);
    return `<div class="player" style="padding:11px 0;border-bottom:1px solid var(--line)"><div class="avatar">${esc(p.avatar)}</div><div style="flex:1"><b>${esc(p.name)}</b><div style="color:var(--muted);font-size:12px">${rs.length} partidas</div></div><strong>${pts} pts</strong></div>`
  }).join(""):'<div class="empty">Todavía no hay jugadores.</div>'
}
function renderDashboard(){
  const m=document.querySelector("#chartMonth").value||today.slice(0,7), rs=DB.results.filter(r=>r.date.startsWith(m));
  document.querySelector("#rankingMonth").textContent=monthName(m);
  const ranking=DB.players.map(p=>{const pr=rs.filter(r=>r.playerId===p.id),pts=pr.reduce((a,r)=>a+score(r),0);return {p,pts,avg:pr.length?pts/pr.length:0}}).sort((a,b)=>b.pts-a.pts);
  document.querySelector("#rankingBody").innerHTML=ranking.map((x,i)=>`<tr><td class="rank">${i+1}</td><td><div class="player"><div class="avatar">${esc(x.p.avatar)}</div>${esc(x.p.name)}</div></td><td><b>${x.pts}</b></td><td>${Math.round(x.avg)}</td></tr>`).join("");
  const cats=Object.keys(labels);
  document.querySelector("#categoryCards").innerHTML=cats.map(c=>{const cr=rs.filter(r=>r.category===c),avg=cr.length?cr.reduce((a,r)=>a+r.attempts,0)/cr.length:0,pts=cr.reduce((a,r)=>a+score(r),0);return `<div class="card cat"><p>${labels[c]}</p><strong>${pts} pts</strong><div style="margin-top:12px"><span class="pill">${avg.toFixed(1)} intentos de media</span></div></div>`}).join("");
  drawBar("categoryChart",cats.map(c=>labels[c]),cats.map(c=>rs.filter(r=>r.category===c).reduce((a,r)=>a+score(r),0)));
  const monthAsc=months().slice().sort();
  drawLine("trendChart",monthAsc.map(m=>m.slice(5)+"/"+m.slice(2,4)),monthAsc.map(m=>DB.results.filter(r=>r.date.startsWith(m)).reduce((a,r)=>a+score(r),0)));
  const gens=Array.from({length:9},(_,i)=>i+1);
  drawBar("generationChart",gens.map(g=>"Gen "+g),gens.map(g=>DB.results.filter(r=>r.generation===g).length));
}
function setupCanvas(id){
  const c=document.querySelector("#"+id),dpr=devicePixelRatio||1,w=c.clientWidth,h=c.clientHeight;c.width=w*dpr;c.height=h*dpr;const x=c.getContext("2d");x.scale(dpr,dpr);x.clearRect(0,0,w,h);return {x,w,h}
}
function drawBar(id,labelsX,data){
  const {x,w,h}=setupCanvas(id),pad={l:42,r:14,t:15,b:42},max=Math.max(...data,1),cw=w-pad.l-pad.r,ch=h-pad.t-pad.b,bw=cw/data.length*.56;
  x.strokeStyle="#26324c";x.fillStyle="#8e9ab6";x.font="11px system-ui";x.textAlign="right";
  for(let i=0;i<=4;i++){const y=pad.t+ch*i/4;x.beginPath();x.moveTo(pad.l,y);x.lineTo(w-pad.r,y);x.stroke();x.fillText(Math.round(max*(1-i/4)),pad.l-7,y+4)}
  data.forEach((v,i)=>{const bx=pad.l+cw*(i+.5)/data.length-bw/2,bh=ch*v/max,grad=x.createLinearGradient(0,pad.t,0,h-pad.b);grad.addColorStop(0,"#ffcb05");grad.addColorStop(1,"#2a75bb");x.fillStyle=grad;x.beginPath();x.roundRect(bx,pad.t+ch-bh,bw,bh,7);x.fill();x.fillStyle="#8e9ab6";x.textAlign="center";x.fillText(labelsX[i],bx+bw/2,h-17)})
}
function drawLine(id,labelsX,data){
  const {x,w,h}=setupCanvas(id),pad={l:42,r:18,t:20,b:38},max=Math.max(...data,1),cw=w-pad.l-pad.r,ch=h-pad.t-pad.b;
  x.strokeStyle="#26324c";for(let i=0;i<=4;i++){const y=pad.t+ch*i/4;x.beginPath();x.moveTo(pad.l,y);x.lineTo(w-pad.r,y);x.stroke()}
  if(data.length){x.beginPath();data.forEach((v,i)=>{const px=pad.l+(data.length===1?cw/2:cw*i/(data.length-1)),py=pad.t+ch-ch*v/max;i?x.lineTo(px,py):x.moveTo(px,py)});x.strokeStyle="#ffcb05";x.lineWidth=3;x.stroke()}
  x.fillStyle="#8e9ab6";x.font="11px system-ui";x.textAlign="center";labelsX.forEach((l,i)=>x.fillText(l,pad.l+(labelsX.length===1?cw/2:cw*i/(labelsX.length-1)),h-14))
}
function renderHistory(){
  const m=document.querySelector("#historyMonth").value,p=document.querySelector("#historyPlayer").value,c=document.querySelector("#historyCategory").value;
  const rs=DB.results.filter(r=>(!m||r.date.startsWith(m))&&(!p||r.playerId===p)&&(!c||r.category===c)).sort((a,b)=>b.date.localeCompare(a.date));
  document.querySelector("#historyBody").innerHTML=rs.length?rs.map(r=>{const p=DB.players.find(x=>x.id===r.playerId);return `<tr><td>${r.date}</td><td>${esc(p?.name||"—")}</td><td>${labels[r.category]}</td><td>${r.attempts}</td><td>${r.generation}</td><td><b>${score(r)}</b></td><td><button class="danger" onclick="removeResult('${r.id}')">Eliminar</button></td></tr>`}).join(""):'<tr><td colspan="7" class="empty">Sin resultados para estos filtros.</td></tr>'
}
async function removeResult(id){if(!confirm("¿Eliminar este resultado?"))return;await fetch("/api/results/"+encodeURIComponent(id),{method:"DELETE"});toast("Resultado eliminado");load()}
function updateLiveScore(){const attempts=Number(document.querySelector("#attempts").value||1),solved=document.querySelector("#solved").checked;document.querySelector("#liveScore").textContent=(solved?Math.max(0,100-(attempts-1)*8):0)+" pts"}
document.querySelector("#attempts").oninput=updateLiveScore;document.querySelector("#solved").onchange=updateLiveScore;
document.querySelector("#chartMonth").onchange=renderDashboard;
["historyMonth","historyPlayer","historyCategory"].forEach(id=>document.querySelector("#"+id).onchange=renderHistory);
window.addEventListener("resize",()=>{clearTimeout(window._rz);window._rz=setTimeout(renderDashboard,120)});
document.querySelector("#playerForm").onsubmit=async e=>{e.preventDefault();const r=await fetch("/api/players",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:document.querySelector("#playerName").value})});const d=await r.json();if(!r.ok)return toast(d.error||"No se pudo guardar");e.target.reset();toast("Jugador añadido");await load()};
document.querySelector("#resultForm").onsubmit=async e=>{e.preventDefault();const payload={date:date.value,playerId:playerId.value,category:category.value,attempts:Number(attempts.value),generation:Number(generation.value),solved:solved.checked};const r=await fetch("/api/results",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const d=await r.json();if(!r.ok)return toast(d.error||"No se pudo guardar");toast("Resultado guardado");await load();go("dashboard")};
load();
