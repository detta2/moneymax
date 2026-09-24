(function(){'use strict';
function id(x){return document.getElementById(x)}
var amt=id('amount'),fromS=id('from'),toS=id('to'),out=id('out'),rateLine=id('rateLine'),
swap=id('swap'),flip=id('flip'),cv=id('cv'),tip=id('tip'),tbody=id('tbody'),err=id('err'),
stext=id('statusText'),dot=id('dot'),cPrice=id('chartPrice'),cChange=id('chartChange'),
cTitle=id('chartTitle'),tblBase=id('tblBase'),amtCur=id('amtCur');
var F={'USD':'🇺🇸','EUR':'🇪🇺','IDR':'🇮🇩','JPY':'🇯🇵','GBP':'🇬🇧','AUD':'🇦🇺','CAD':'🇨🇦','CHF':'🇨🇭','CNY':'🇨🇳','SGD':'🇸🇬','MYR':'🇲🇾','THB':'🇹🇭','KRW':'🇰🇷','HKD':'🇭🇰','INR':'🇮🇳','AED':'🇦🇪','SAR':'🇸🇦','NZD':'🇳🇿','SEK':'🇸🇪','NOK':'🇳🇴','DKK':'🇩🇰','RUB':'🇷🇺','CZK':'🇨🇿','PLN':'🇵🇱','TRY':'🇹🇷','BRL':'🇧🇷','MXN':'🇲🇽','ZAR':'🇿🇦','PHP':'🇵🇭','VND':'🇻🇳','PKR':'🇵🇰','BDT':'🇧🇩','NGN':'🇳🇬','EGP':'🇪🇬','KES':'🇰🇪','MAD':'🇲🇦','HUF':'🇭🇺','RON':'🇷🇴','BGN':'🇧🇬','HRK':'🇭🇷','ISK':'🇮🇸','ILS':'🇮🇱','JOD':'🇯🇴','KWD':'🇰🇼','QAR':'🇶🇦','OMR':'🇴🇲','BHD':'🇧🇭','LKR':'🇱🇰','NPR':'🇳🇵','MMK':'🇲🇲','KHR':'🇰🇭','LAK':'🇱🇦','TWD':'🇹🇼'};
var N={'USD':'Dolar AS','EUR':'Euro','IDR':'Rupiah','JPY':'Yen Jepang','GBP':'Pound Inggris','AUD':'Dolar Australia','CAD':'Dolar Kanada','CHF':'Franc Swiss','CNY':'Yuan Cina','SGD':'Dolar Singapura','MYR':'Ringgit','THB':'Baht','KRW':'Won Korsel','HKD':'Dolar Hong Kong','INR':'Rupee India','AED':'Dirham','SAR':'Riyal','NZD':'Dolar Selandia','SEK':'Krona Swedia','NOK':'Krone Norwegia','DKK':'Krone Denmark','RUB':'Rubel Rusia','CZK':'Koruna','PLN':'Zloty','TRY':'Lira Turki','BRL':'Real Brazil','MXN':'Peso Meksiko','ZAR':'Rand Afrika','PHP':'Peso Filipina','VND':'Dong Vietnam','PKR':'Rupee Pakistan','BDT':'Taka','NGN':'Naira','EGP':'Pound Mesir','KES':'Shilling Kenya','MAD':'Dirham Maroko','HUF':'Forint','RON':'Leu Rumania','BGN':'Lev Bulgaria','HRK':'Kuna','ISK':'Krona Islandia','ILS':'Shekel','JOD':'Dinar Yordania','KWD':'Dinar Kuwait','QAR':'Riyal Qatar','OMR':'Rial Oman','BHD':'Dinar Bahrain','LKR':'Rupee Sri Lanka','NPR':'Rupee Nepal','MMK':'Kyat','KHR':'Riel','LAK':'Kip','TWD':'Dolar Taiwan'};
var P=['USD','EUR','IDR','JPY','GBP','AUD','CAD','CHF','CNY','SGD','MYR','THB','KRW','HKD','INR','AED','SAR','NZD','SEK','NOK','DKK','RUB','CZK','PLN','TRY','BRL','MXN','ZAR','PHP','VND','PKR','BDT','NGN','EGP','KES','MAD','HUF','RON','BGN','HRK','ISK','ILS','JOD','KWD','QAR','OMR','BHD','LKR','NPR','MMK','KHR','LAK','TWD'];
var rates={},base='USD',days=30,hist=[],prev={},loading=true,fromCur='USD',toCur='IDR',hover=-1,errT=null,timer=null;

function fmt(n,d){if(!isFinite(n))return'—';d=d||2;
var dd=Math.abs(n)>=1000?2:(Math.abs(n)>=1?4:6);
return n.toLocaleString('id-ID',{minimumFractionDigits:Math.min(d,dd),maximumFractionDigits:dd})}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function flag(c){return '<span class="flag">'+(F[c]||'🏳️')+'</span>'}
function showErr(m){err.textContent=m;err.classList.add('show');clearTimeout(errT);
errT=setTimeout(function(){err.classList.remove('show')},4500)}

function fillSel(){var l=Object.keys(rates).sort();
var o=function(c){return '<option value="'+c+'">'+c+' — '+esc(N[c]||c)+'</option>'};
fromS.innerHTML=l.map(o).join('');toS.innerHTML=l.map(o).join('');
fromS.value=fromCur;toS.value=toCur}

function convert(){if(loading||!rates[toCur]){out.textContent='—';return}
var a=parseFloat(amt.value)||0,r=rates[toCur];
out.textContent=fmt(a*r,2);amtCur.textContent=fromCur;
var ch=prev[toCur]!==undefined?((r-prev[toCur])/prev[toCur]*100):null;
rateLine.innerHTML='1 '+fromCur+' = <b style="color:var(--acc)">'+fmt(r,4)+'</b> '+toCur+' · 1 '+toCur+' = '+fmt(1/r,4)+' '+fromCur+
(ch!==null?' <span class="chip '+(ch>=0?'up':'down')+'">'+(ch>=0?'▲':'▼')+' '+Math.abs(ch).toFixed(2)+'% 24H</span>':'');
tblBase.textContent=fromCur;cTitle.textContent=fromCur+' → '+toCur}

function renderTable(){var row=function(c){var r=rates[c];if(!r)return'';
var p=prev[c],ch=p?(r-p)/p*100:null,ar=ch===null?'—':(ch>=0?'▲':'▼');
return '<tr data-c="'+c+'"><td>'+flag(c)+'<span class="nm">'+c+'</span> <span class="cd">'+esc(N[c]||'')+'</span></td>'+
'<td class="vl">'+fmt(r,4)+'</td><td class="vl" style="color:'+(ch===null?'var(--muted)':(ch>=0?'var(--up)':'var(--down)'))+'">'+ar+' '+(ch===null?'':Math.abs(ch).toFixed(2)+'%')+'</td></tr>'};
tbody.innerHTML=P.filter(function(c){return rates[c]&&c!==base}).map(row).join('')||
'<tr><td colspan="3" style="color:var(--muted);text-align:center;padding:18px">Data belum tersedia</td></tr>';
var rows=tbody.querySelectorAll('tr[data-c]'),i;
for(i=0;i<rows.length;i++)rows[i].addEventListener('click',function(){
toCur=this.dataset.c;toS.value=toCur;convert();loadHist();window.scrollTo({top:0,behavior:'smooth'})})}

function draw(){var ctx=cv.getContext('2d'),dpr=window.devicePixelRatio||1,W=cv.clientWidth,H=cv.clientHeight;
cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
if(!hist.length){ctx.fillStyle='rgba(244,247,255,.4)';ctx.font='13px sans-serif';ctx.textAlign='center';
ctx.fillText('Memuat data grafik…',W/2,H/2);return}
var pL=54,pR=14,pT=16,pB=26,iW=W-pL-pR,iH=H-pT-pB,mn=Infinity,mx=-Infinity,i,v;
for(i=0;i<hist.length;i++){v=hist[i].rate;if(v<mn)mn=v;if(v>mx)mx=v}
if(mn===mx){mn*=0.998;mx*=1.002}
function X(k){return pL+(hist.length===1?iW/2:k*iW/(hist.length-1))}
function Y(val){return pT+iH-((val-mn)/(mx-mn))*iH}
ctx.strokeStyle='rgba(255,255,255,.07)';ctx.lineWidth=1;ctx.fillStyle='rgba(244,247,255,.45)';
ctx.font='10.5px sans-serif';ctx.textAlign='right';
for(var g=0;g<=4;g++){v=mn+(mx-mn)*g/4;var y=Y(v);
ctx.beginPath();ctx.moveTo(pL,y);ctx.lineTo(W-pR,y);ctx.stroke();ctx.fillText(fmt(v,2),pL-8,y+3.5)}
ctx.textAlign='center';var step=Math.max(1,Math.ceil(hist.length/6));
for(i=0;i<hist.length;i++){if(i%step===0||i===hist.length-1){var d=new Date(hist[i].date);
ctx.fillText(d.toLocaleDateString('id-ID',{day:'numeric',month:'short'}),X(i),H-8)}}
var gr=ctx.createLinearGradient(0,pT,0,pT+iH);
gr.addColorStop(0,'rgba(110,231,255,.34)');gr.addColorStop(.5,'rgba(110,231,255,.10)');gr.addColorStop(1,'rgba(110,231,255,0)');
ctx.beginPath();ctx.moveTo(X(0),Y(hist[0].rate));
for(i=1;i<hist.length;i++)ctx.lineTo(X(i),Y(hist[i].rate));
ctx.lineTo(X(hist.length-1),pT+iH);ctx.lineTo(X(0),pT+iH);ctx.closePath();ctx.fillStyle=gr;ctx.fill();
ctx.beginPath();ctx.moveTo(X(0),Y(hist[0].rate));
for(i=1;i<hist.length;i++)ctx.lineTo(X(i),Y(hist[i].rate));
var up=hist[hist.length-1].rate>=hist[0].rate,lg=ctx.createLinearGradient(pL,0,W-pR,0);
lg.addColorStop(0,up?'#6ee7ff':'#fb7185');lg.addColorStop(1,up?'#b794ff':'#fda4af');
ctx.strokeStyle=lg;ctx.lineWidth=2.4;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();
var li=hist.length-1,lx=X(li),ly=Y(hist[li].rate);
ctx.beginPath();ctx.arc(lx,ly,9,0,7);ctx.fillStyle=up?'rgba(110,231,255,.25)':'rgba(251,113,133,.25)';ctx.fill();
ctx.beginPath();ctx.arc(lx,ly,5,0,7);ctx.fillStyle=up?'#6ee7ff':'#fb7185';ctx.fill();
if(hover>=0&&hover<hist.length){var hx=X(hover),hy=Y(hist[hover].rate);
ctx.setLineDash([4,4]);ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1;
ctx.beginPath();ctx.moveTo(hx,pT);ctx.lineTo(hx,pT+iH);ctx.stroke();ctx.setLineDash([]);
ctx.beginPath();ctx.arc(hx,hy,11,0,7);ctx.fillStyle='rgba(255,255,255,.18)';ctx.fill();
ctx.beginPath();ctx.arc(hx,hy,5.5,0,7);ctx.fillStyle='#fff';ctx.fill()}
var ch=(hist[li].rate-hist[0].rate)/hist[0].rate*100;
cPrice.textContent=fmt(hist[li].rate,4);
cChange.textContent=(ch>=0?'▲ +':'▼ ')+ch.toFixed(2)+'%';
cChange.className='chart-change '+(ch>=0?'up':'down')}

cv.addEventListener('mousemove',function(e){if(!hist.length)return;
var r=cv.getBoundingClientRect(),x=e.clientX-r.left,pL=54,pR=14,iW=r.width-pL-pR;
hover=Math.round((x-pL)/iW*(hist.length-1));
if(hover<0)hover=0;if(hover>hist.length-1)hover=hist.length-1;
draw();var p=hist[hover];
tip.innerHTML='<b>'+fmt(p.rate,4)+'</b> '+toCur+'<br><span>'+p.date+'</span>';
tip.style.left=x+'px';tip.style.top=(e.clientY-r.top)+'px';tip.style.opacity=1});
cv.addEventListener('mouseleave',function(){hover=-1;tip.style.opacity=0;draw()});

function loadHist(){var u='/api/history?base='+fromCur+'&target='+toCur+'&days='+days;
stext.textContent='Sinkron grafik…';dot.classList.add('sync');
fetch(u).then(function(r){return r.json()}).then(function(d){
hist=d.points||[];draw()}).catch(function(){hist=[];draw()}).finally(function(){
stext.textContent='Live · '+fromCur+'/'+toCur;dot.classList.remove('sync')})}

function loadRates(){stext.textContent='Memuat kurs live…';dot.classList.add('sync');
fetch('/api/rates?base='+fromCur).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()})
.then(function(d){rates=d.rates||{};prev=d.prev||{};loading=false;
fillSel();convert();renderTable();loadHist();
stext.textContent='Live · diperbarui '+new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit'})})
.catch(function(e){loading=false;showErr('Gagal memuat kurs: '+e.message+'. Mencoba lagi…')})
.finally(function(){dot.classList.remove('sync')})}

amt.addEventListener('input',convert);
fromS.addEventListener('change',function(){fromCur=fromS.value;base=fromCur;rates={};loading=true;loadRates()});
toS.addEventListener('change',function(){toCur=toS.value;convert();loadHist()});
swap.addEventListener('click',function(){var t=fromCur;fromCur=toCur;toCur=t;
fromS.value=fromCur;toS.value=toCur;base=fromCur;rates={};loading=true;loadRates()});
flip.addEventListener('click',function(){var t=fromCur;fromCur=toCur;toCur=t;
fromS.value=fromCur;toS.value=toCur;base=fromCur;rates={};loading=true;loadRates()});
id('clr').addEventListener('click',function(){amt.value='';convert()});
id('quick').innerHTML=['100','500','1000','5000','10000','100000'].map(function(v){
return '<button data-v="'+v+'">'+fmt(+v,0)+'</button>'}).join('');
var qb=id('quick').querySelectorAll('button'),i;
for(i=0;i<qb.length;i++)qb[i].addEventListener('click',function(){amt.value=this.dataset.v;convert()});
var rb=id('range').querySelectorAll('button');
for(i=0;i<rb.length;i++)rb[i].addEventListener('click',function(){
days=+this.dataset.d;for(var j=0;j<rb.length;j++)rb[j].classList.remove('on');
this.classList.add('on');loadHist()});
window.addEventListener('resize',function(){clearTimeout(timer);timer=setTimeout(draw,150)});
loadRates();
setInterval(loadRates,60000);
})();
