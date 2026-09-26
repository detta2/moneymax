(function(){'use strict';
function id(x){return document.getElementById(x)}
var amt=id('amount'),out=id('out'),rateLine=id('rateLine'),
swap=id('swap'),cv=id('cv'),tip=id('tip'),tbody=id('tbody'),err=id('err'),
stext=id('statusText'),dot=id('dot'),cPrice=id('chartPrice'),cChange=id('chartChange'),
cTitle=id('chartTitle'),tblBase=id('tblBase'),amtCur=id('amtCur'),
fromBtn=id('fromBtn'),toBtn=id('toBtn'),fromPop=id('fromPop'),toPop=id('toPop'),
fromItems=id('fromItems'),toItems=id('toItems'),fromSearch=id('fromSearch'),toSearch=id('toSearch'),
fromCode=id('fromCode'),toCode=id('toCode'),fromName=id('toName')?id('fromName'):null,
toName=id('toName'),toast=id('toast');

/* ---------- i18n ---------- */
var LANG='id';
var STR={
 id:{conv:'Konverter',subAmount:'Masukkan jumlah, lalu pilih mata uangnya',clear:'Bersihkan jumlah',
  amtA:'Jumlah mata uang yang ingin dikonversi',fromA:'Pilih mata uang asal',toA:'Pilih mata uang tujuan',
  search:'Cari mata uang…',res:'Hasil Konversi',copy:'⧉ Salin',copyA:'Salin hasil konversi',copyOk:'Disalin',
  noRes:'Belum ada hasil',chartSub:'Pergerakan kurs historis',
  tbl:'Kurs Populer',tblSub:'Kurs tengah real-time · 1',tblC:'Mata Uang',tblR:'Kurs',tblC24:'Perubahan 24H',
  loading:'Memuat kurs live…',sync:'Menyinkronkan grafik…',live:'Live · diperbarui',refresh:'Refresh berikutnya',
  fail:'Gagal memuat kurs: ',retry:'. Mencoba lagi…',nodata:'Data belum tersedia',
  swapA:'Tukar mata uang asal dan tujuan',swapT:'Tukar posisi (S)',
  crypto:'Crypto',metal:'Logam',rangeLbl:'Rentang waktu',rangeA:'Rentang waktu grafik',
  t1:'100% Gratis',t1s:'Tanpa akun, tanpa biaya, tanpa batas konversi',
  t2:'Real-Time',t2s:'Kurs diperbarui otomatis setiap 60 detik',
  t3:'Privasi Aman',t3s:'Tanpa cookie pelacak, tanpa penyimpanan data',
  t4:'Grafik Historis',t4s:'Pantau pergerakan kurs 7–90 hari',
  foot1:'160+ fiat · 10 crypto · emas & perak · auto-refresh 60 detik',
  foot2:'Kebijakan Privasi',foot3:'Ketentuan Layanan',foot4:'Disclaimer',
  heroT:'Konversi Mata Uang,',heroE:'Crypto & Emas',
  heroP:'160+ mata uang dunia, 10 crypto, emas & perak — kurs live, grafik historis, auto-refresh 60 detik.',
  langBtn:'English'},
 en:{conv:'Converter',subAmount:'Enter the amount, then pick the currencies',clear:'Clear amount',
  amtA:'Amount to convert',fromA:'Choose source currency',toA:'Choose target currency',
  search:'Search currency…',res:'Conversion Result',copy:'⧉ Copy',copyA:'Copy conversion result',copyOk:'Copied',
  noRes:'No result yet',chartSub:'Historical rate movement',
  tbl:'Popular Rates',tblSub:'Real-time mid rate · 1',tblC:'Currency',tblR:'Rate',tblC24:'24H Change',
  loading:'Loading live rates…',sync:'Syncing chart…',live:'Live · updated',refresh:'Next refresh in',
  fail:'Failed to load rates: ',retry:'. Retrying…',nodata:'Data not available yet',
  swapA:'Swap source and target currency',swapT:'Swap position (S)',
  crypto:'Crypto',metal:'Metal',rangeLbl:'Time range',rangeA:'Chart time range',
  t1:'100% Free',t1s:'No account, no fees, unlimited conversions',
  t2:'Real-Time',t2s:'Rates auto-update every 60 seconds',
  t3:'Privacy Safe',t3s:'No tracking cookies, no data stored',
  t4:'Historical Charts',t4s:'Track rate movement over 7–90 days',
  foot1:'160+ fiat · 10 cryptos · gold & silver · auto-refresh every 60s',
  foot2:'Privacy Policy',foot3:'Terms of Service',foot4:'Disclaimer',
  heroT:'Convert Currency,',heroE:'Crypto & Gold',
  heroP:'160+ world currencies, 10 cryptos, gold & silver — live rates, historical charts, auto-refresh every 60s.',
  langBtn:'Bahasa Indonesia'}
};
function T(k){var v=(STR[LANG]||STR.id)[k];return v===undefined?k:v}
var busy=false;
function applyLang(){
 document.documentElement.lang=LANG;
 document.body.classList.toggle('lang-en',LANG==='en');
 document.body.classList.toggle('lang-id',LANG!=='en');
 var h2=id('heroT'),he=id('heroE'),hp=id('heroP');
 if(h2)h2.textContent=T('heroT');if(he)he.textContent=T('heroE');if(hp)hp.textContent=T('heroP');
 if(id('cardTitle'))id('cardTitle').textContent=T('conv');
 if(id('cardSub'))id('cardSub').textContent=T('subAmount');
 amt.setAttribute('aria-label',T('amtA'));
 id('clr').setAttribute('aria-label',T('clear'));
 id('clr').setAttribute('title',T('clear'));
 fromSearch.placeholder=T('search');toSearch.placeholder=T('search');
 fromBtn.setAttribute('aria-label',T('fromA'));
 toBtn.setAttribute('aria-label',T('toA'));
 swap.setAttribute('aria-label',T('swapA'));swap.setAttribute('title',T('swapT'));
 id('resLbl').textContent=T('res');
 id('copy').textContent=T('copy');id('copy').setAttribute('aria-label',T('copyA'));
 id('chartSub').textContent=T('chartSub');
 id('tblTitle').textContent=T('tbl');id('tblSub').innerHTML=T('tblSub')+' <b id="tblBase">'+tblBase.textContent+'</b> =';
 id('thC').textContent=T('tblC');id('thR').textContent=T('tblR');id('th24').textContent=T('tblC24');
 id('rangeLbl').textContent=T('rangeLbl');
 id('range').setAttribute('aria-label',T('rangeA'));
 var tr={trust1:'t1',trust1s:'t1s',trust2:'t2',trust2s:'t2s',trust3:'t3',trust3s:'t3s',trust4:'t4',trust4s:'t4s'};
 var els=document.querySelectorAll('[data-i]'),i;
 for(i=0;i<els.length;i++){var k=els[i].getAttribute('data-i');
 if(tr[k])els[i].textContent=T(tr[k])}
 var f1=id('foot1');if(f1)f1.textContent=T('foot1');
 ['foot2','foot3','foot4'].forEach(function(k){var e=id(k);if(e)e.textContent=T(k)});
 var lb=id('langBtn');if(lb)lb.textContent=T('langBtn');
 renderTable();
}
function setLang(l){LANG=(l==='en')?'en':'id';applyLang();renderItemsAll();saveLang();
 if(!loading)loadHist();
}
function saveLang(){try{localStorage.setItem('moneymax.lang',LANG)}catch(e){}}
function loadLang(){try{var l=localStorage.getItem('moneymax.lang');if(l==='en'||l==='id')LANG=l}catch(e){}}
function bindLang(){var b=id('langBtn');if(b)b.addEventListener('click',function(){setLang(LANG==='id'?'en':'id')})}


var N={'USD':'Dolar AS','EUR':'Euro','IDR':'Rupiah','JPY':'Yen Jepang','GBP':'Pound Inggris','AUD':'Dolar Australia','CAD':'Dolar Kanada','CHF':'Franc Swiss','CNY':'Yuan Cina','SGD':'Dolar Singapura','MYR':'Ringgit','THB':'Baht','KRW':'Won Korsel','HKD':'Dolar Hong Kong','INR':'Rupee India','AED':'Dirham','SAR':'Riyal','NZD':'Dolar Selandia','SEK':'Krona Swedia','NOK':'Krone Norwegia','DKK':'Krone Denmark','RUB':'Rubel Rusia','CZK':'Koruna','PLN':'Zloty','TRY':'Lira Turki','BRL':'Real Brazil','MXN':'Peso Meksiko','ZAR':'Rand Afrika','PHP':'Peso Filipina','VND':'Dong Vietnam','PKR':'Rupee Pakistan','BDT':'Taka','NGN':'Naira','EGP':'Pound Mesir','KES':'Shilling Kenya','MAD':'Dirham Maroko','HUF':'Forint','RON':'Leu Rumania','BGN':'Lev Bulgaria','HRK':'Kuna','ISK':'Krona Islandia','ILS':'Shekel','JOD':'Dinar Yordania','KWD':'Dinar Kuwait','QAR':'Riyal Qatar','OMR':'Rial Oman','BHD':'Dinar Bahrain','LKR':'Rupee Sri Lanka','NPR':'Rupee Nepal','MMK':'Kyat','KHR':'Riel','LAK':'Kip','TWD':'Dolar Taiwan','BTC':'Bitcoin','ETH':'Ethereum','SOL':'Solana','BNB':'BNB','XRP':'XRP','DOGE':'Dogecoin','USDT':'Tether USD','TRX':'TRON','ADA':'Cardano','LINK':'Chainlink','XAU':'Emas (per tr oz)','XAG':'Perak (per tr oz)'};
var NE={'USD':'US Dollar','EUR':'Euro','IDR':'Rupiah','JPY':'Japanese Yen','GBP':'British Pound','AUD':'Australian Dollar','CAD':'Canadian Dollar','CHF':'Swiss Franc','CNY':'Chinese Yuan','SGD':'Singapore Dollar','MYR':'Malaysian Ringgit','THB':'Thai Baht','KRW':'South Korean Won','HKD':'Hong Kong Dollar','INR':'Indian Rupee','AED':'UAE Dirham','SAR':'Saudi Riyal','NZD':'New Zealand Dollar','SEK':'Swedish Krona','NOK':'Norwegian Krone','DKK':'Danish Krone','RUB':'Russian Ruble','CZK':'Czech Koruna','PLN':'Polish Zloty','TRY':'Turkish Lira','BRL':'Brazilian Real','MXN':'Mexican Peso','ZAR':'South African Rand','PHP':'Philippine Peso','VND':'Vietnamese Dong','PKR':'Pakistani Rupee','BDT':'Bangladeshi Taka','NGN':'Nigerian Naira','EGP':'Egyptian Pound','KES':'Kenyan Shilling','MAD':'Moroccan Dirham','HUF':'Hungarian Forint','RON':'Romanian Leu','BGN':'Bulgarian Lev','HRK':'Croatian Kuna','ISK':'Icelandic Krona','ILS':'Israeli Shekel','JOD':'Jordanian Dinar','KWD':'Kuwaiti Dinar','QAR':'Qatari Riyal','OMR':'Omani Rial','BHD':'Bahraini Dinar','LKR':'Sri Lankan Rupee','NPR':'Nepalese Rupee','MMK':'Myanmar Kyat','KHR':'Cambodian Riel','LAK':'Lao Kip','TWD':'Taiwan Dollar','BTC':'Bitcoin','ETH':'Ethereum','SOL':'Solana','BNB':'BNB','XRP':'XRP','DOGE':'Dogecoin','USDT':'Tether USD','TRX':'TRON','ADA':'Cardano','LINK':'Chainlink','XAU':'Gold (per troy oz)','XAG':'Silver (per troy oz)'};
function nm(c){return LANG==='en'?(NE[c]||N[c]||c):(N[c]||c)}
var P=['USD','EUR','IDR','JPY','GBP','AUD','CAD','CHF','CNY','SGD','MYR','THB','KRW','HKD','INR','AED','SAR','NZD','SEK','NOK','DKK','RUB','CZK','PLN','TRY','BRL','MXN','ZAR','PHP','VND','PKR','BDT','NGN','EGP','KES','MAD','HUF','RON','BGN','HRK','ISK','ILS','JOD','KWD','QAR','OMR','BHD','LKR','NPR','MMK','KHR','LAK','TWD','BTC','ETH','SOL','BNB','XRP','DOGE','USDT','TRX','ADA','LINK','XAU','XAG'];
var CRYPTO=['BTC','ETH','SOL','BNB','XRP','DOGE','USDT','TRX','ADA','LINK'],METAL=['XAU','XAG'];
var rates={},days=30,hist=[],prev={},loading=true,fromCur='USD',toCur='IDR',hover=-1,errT=null,timer=null,toastT=null;

function fmt(n,d){if(!isFinite(n))return'—';d=d||2;
var dd=Math.abs(n)>=1000?2:(Math.abs(n)>=1?4:6);
return n.toLocaleString(LANG==='en'?'en-US':'id-ID',{minimumFractionDigits:Math.min(d,dd),maximumFractionDigits:dd})}
function esc(s){return String(s).replace(/[&<>\"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function flag(c){return '<span class="flag">'+iconFor(c)+'</span>'}
function showToast(m){toast.textContent=m;toast.classList.add('show');clearTimeout(toastT);
toastT=setTimeout(function(){toast.classList.remove('show')},1800)}
function showErr(m){err.textContent=m;err.classList.add('show');clearTimeout(errT);
errT=setTimeout(function(){err.classList.remove('show')},4500)}

/* ---------- Searchable currency picker ---------- */
var NAMES=P.map(function(c){return {code:c,name:nm(c),sortKey:c}}).sort(function(a,b){return a.code<b.code?-1:1});
function renderItemsAll(){renderItems(fromItems,fromSearch,fromCur);renderItems(toItems,toSearch,toCur)}
function renderItems(box,input,cur){
  var q=input.value.trim().toUpperCase();
  var list=NAMES.filter(function(x){
    if(!q)return true;
    return x.code.indexOf(q)===0||x.name.toUpperCase().indexOf(q)>-1;
  });
  if(!list.length){box.innerHTML='<div class="ccy-empty">'+T('nodata')+': '+esc(input.value)+'</div>';return}
  box.innerHTML=list.map(function(x){
    return '<button class="ccy-item'+(x.code===cur?' sel':'')+'" data-c="'+x.code+'" role="option" aria-selected="'+(x.code===cur)+'">'+
    flag(x.code)+'<span class="code">'+x.code+'</span><span class="nm">'+esc(x.name)+'</span></button>';
  }).join('');
  var rows=box.querySelectorAll('.ccy-item'),i;
  for(i=0;i<rows.length;i++)rows[i].addEventListener('click',function(){
    var c=this.dataset.c;
    if(input===fromSearch){fromCur=c;fromCode.textContent=c;fromName.textContent=nm(c);rates={};loading=true;loadRates()}
    else{toCur=c;toCode.textContent=c;toName.textContent=nm(c);convert();loadHist()}
    closeAll();saveState();
  });
}
function openPop(pop,btn,box,input,cur){closeAll();pop.classList.add('open');btn.setAttribute('aria-expanded','true');
  input.value='';renderItems(box,input,cur);setTimeout(function(){input.focus()},0)}
function closeAll(){fromPop.classList.remove('open');toPop.classList.remove('open');
fromBtn.setAttribute('aria-expanded','false');toBtn.setAttribute('aria-expanded','false')}
fromBtn.addEventListener('click',function(){openPop(fromPop,fromBtn,fromItems,fromSearch,fromCur)});
toBtn.addEventListener('click',function(){openPop(toPop,toBtn,toItems,toSearch,toCur)});
fromSearch.addEventListener('input',function(){renderItems(fromItems,fromSearch,fromCur)});
toSearch.addEventListener('input',function(){renderItems(toItems,toSearch,toCur)});
document.addEventListener('mousedown',function(e){
  if(!e.target.closest('.ccy'))closeAll()});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){closeAll();return}
  if(e.key.toLowerCase()==='s'&&!/input|select|textarea/i.test((e.target.tagName||''))&&!e.metaKey&&!e.ctrlKey&&!e.altKey){doSwap();e.preventDefault()}
});

/* ---------- Persist last pair ---------- */
function saveState(){try{localStorage.setItem('moneymax.pair',JSON.stringify({f:fromCur,t:toCur}))}catch(e){}}
function loadState(){try{var s=JSON.parse(localStorage.getItem('moneymax.pair')||'null');
  if(s){if(N[s.f])fromCur=s.f;if(N[s.t])toCur=s.t;
  fromCode.textContent=fromCur;toCode.textContent=toCur;
  fromName.textContent=nm(fromCur);toName.textContent=nm(toCur)}}catch(e){}}

function convert(){if(loading||!rates[toCur]){out.textContent='—';return}
var a=parseFloat(amt.value)||0,r=rates[toCur];
out.textContent=fmt(a*r,2);amtCur.textContent=fromCur;
var ch=prev[toCur]!==undefined?((r-prev[toCur])/prev[toCur]*100):null;
rateLine.innerHTML='1 '+fromCur+' = <b style="color:var(--acc)">'+fmt(r,4)+'</b> '+toCur+' · 1 '+toCur+' = '+fmt(1/r,4)+' '+fromCur+
(ch!==null?' <span class="chip '+(ch>=0?'up':'down')+'">'+(ch>=0?'▲':'▼')+' '+Math.abs(ch).toFixed(2)+'% 24H</span>':'');
tblBase.textContent=fromCur;cTitle.textContent=fromCur+' → '+toCur}

function isAsset(c){return CRYPTO.indexOf(c)>-1||METAL.indexOf(c)>-1}
function renderTable(){var row=function(c){var r=rates[c];if(!r)return'';
var p=prev[c],ch=p?(r-p)/p*100:null,ar=ch===null?'—':(ch>=0?'▲':'▼');
var tag=isAsset(c)?(METAL.indexOf(c)>-1?' <span class="tg metal">'+T('metal')+'</span>':' <span class="tg crypto">'+T('crypto')+'</span>'):'';
return '<tr data-c="'+c+'"><td>'+flag(c)+'<span class="nm">'+c+'</span> <span class="cd">'+esc(nm(c))+tag+'</span></td>'+
'<td class="vl">'+fmt(r,4)+'</td><td class="vl" style="color:'+(ch===null?'var(--muted)':(ch>=0?'var(--up)':'var(--down)'))+'">'+ar+' '+(ch===null?'':Math.abs(ch).toFixed(2)+'%')+'</td></tr>'};
var rows=P.filter(function(c){return rates[c]&&c!==fromCur});
rows.sort(function(a,b){var A=isAsset(a)?0:1,B=isAsset(b)?0:1;return A-B});
tbody.innerHTML=rows.map(row).join('')||
'<tr><td colspan="3" style="color:var(--muted);text-align:center;padding:18px">'+T('nodata')+'</td></tr>';
var rows=tbody.querySelectorAll('tr[data-c]'),i;
for(i=0;i<rows.length;i++)rows[i].addEventListener('click',function(){
toCur=this.dataset.c;toCode.textContent=toCur;toName.textContent=nm(toCur);
convert();loadHist();saveState();window.scrollTo({top:0,behavior:'smooth'})})}

function draw(){var ctx=cv.getContext('2d'),dpr=window.devicePixelRatio||1,W=cv.clientWidth,H=cv.clientHeight;
cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
if(!hist.length){ctx.fillStyle='rgba(5,150,105,.55)';ctx.font='13px sans-serif';ctx.textAlign='center';
ctx.fillText('Memuat data grafik…',W/2,H/2);return}
var pL=54,pR=14,pT=16,pB=26,iW=W-pL-pR,iH=H-pT-pB,mn=Infinity,mx=-Infinity,i,v;
for(i=0;i<hist.length;i++){v=hist[i].rate;if(v<mn)mn=v;if(v>mx)mx=v}
if(mn===mx){mn*=0.998;mx*=1.002}
function X(k){return pL+(hist.length===1?iW/2:k*iW/(hist.length-1))}
function Y(val){return pT+iH-((val-mn)/(mx-mn))*iH}
ctx.strokeStyle='rgba(4,120,87,.13)';ctx.lineWidth=1;ctx.fillStyle='rgba(91,122,110,.75)';
ctx.font='10.5px sans-serif';ctx.textAlign='right';
for(var g=0;g<=4;g++){v=mn+(mx-mn)*g/4;var y=Y(v);
ctx.beginPath();ctx.moveTo(pL,y);ctx.lineTo(W-pR,y);ctx.stroke();ctx.fillText(fmt(v,2),pL-8,y+3.5)}
ctx.textAlign='center';var step=Math.max(1,Math.ceil(hist.length/6));
for(i=0;i<hist.length;i++){if(i%step===0||i===hist.length-1){var d=new Date(hist[i].date);
ctx.fillText(d.toLocaleDateString('id-ID',{day:'numeric',month:'short'}),X(i),H-8)}}
var gr=ctx.createLinearGradient(0,pT,0,pT+iH);
gr.addColorStop(0,'rgba(5,150,105,.30)');gr.addColorStop(.5,'rgba(5,150,105,.10)');gr.addColorStop(1,'rgba(201,151,27,0)');
ctx.beginPath();ctx.moveTo(X(0),Y(hist[0].rate));
for(i=1;i<hist.length;i++)ctx.lineTo(X(i),Y(hist[i].rate));
ctx.lineTo(X(hist.length-1),pT+iH);ctx.lineTo(X(0),pT+iH);ctx.closePath();ctx.fillStyle=gr;ctx.fill();
ctx.beginPath();ctx.moveTo(X(0),Y(hist[0].rate));
for(i=1;i<hist.length;i++)ctx.lineTo(X(i),Y(hist[i].rate));
var up=hist[hist.length-1].rate>=hist[0].rate,lg=ctx.createLinearGradient(pL,0,W-pR,0);
lg.addColorStop(0,up?'#059669':'#dc2626');lg.addColorStop(1,up?'#c9971b':'#f87171');
ctx.strokeStyle=lg;ctx.lineWidth=2.4;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();
var li=hist.length-1,lx=X(li),ly=Y(hist[li].rate);
ctx.beginPath();ctx.arc(lx,ly,9,0,7);ctx.fillStyle=up?'rgba(5,150,105,.25)':'rgba(220,38,38,.25)';ctx.fill();
ctx.beginPath();ctx.arc(lx,ly,5,0,7);ctx.fillStyle=up?'#059669':'#dc2626';ctx.fill();
if(hover>=0&&hover<hist.length){var hx=X(hover),hy=Y(hist[hover].rate);
ctx.setLineDash([4,4]);ctx.strokeStyle='rgba(4,120,87,.45)';ctx.lineWidth=1;
ctx.beginPath();ctx.moveTo(hx,pT);ctx.lineTo(hx,pT+iH);ctx.stroke();ctx.setLineDash([]);
ctx.beginPath();ctx.arc(hx,hy,11,0,7);ctx.fillStyle='rgba(5,150,105,.18)';ctx.fill();
ctx.beginPath();ctx.arc(hx,hy,5.5,0,7);ctx.fillStyle='#c9971b';ctx.fill()}
var ch=(hist[li].rate-hist[0].rate)/hist[0].rate*100;
cPrice.textContent=fmt(hist[li].rate,4);
cChange.textContent=(ch>=0?'▲ +':'▼ ')+ch.toFixed(2)+'%';
cChange.className='chart-change '+(ch>=0?'up':'down')}

function pos(e){var r=cv.getBoundingClientRect();var x;
if(e.touches&&e.touches.length)x=e.touches[0].clientX-r.left;else x=e.clientX-r.left;
return {x:x,r:r,y:(e.touches&&e.touches.length?e.touches[0].clientY:e.clientY)-r.top}}
function hoverAt(e){if(!hist.length)return;
var p=pos(e),pL=54,pR=14,iW=p.r.width-pL-pR;
hover=Math.round((p.x-pL)/iW*(hist.length-1));
if(hover<0)hover=0;if(hover>hist.length-1)hover=hist.length-1;
draw();var d=hist[hover];
tip.innerHTML='<b>'+fmt(d.rate,4)+'</b> '+toCur+'<br><span>'+d.date+'</span>';
tip.style.left=p.x+'px';tip.style.top=p.y+'px';tip.style.opacity=1}
cv.addEventListener('mousemove',hoverAt);
cv.addEventListener('touchstart',function(e){hoverAt(e);e.preventDefault()},{passive:false});
cv.addEventListener('touchmove',function(e){hoverAt(e);e.preventDefault()},{passive:false});
cv.addEventListener('mouseleave',function(){hover=-1;tip.style.opacity=0;draw()});
cv.addEventListener('touchend',function(){hover=-1;tip.style.opacity=0;draw()});

function loadHist(){var u='/api/history?base='+fromCur+'&target='+toCur+'&days='+days;
busy=true;stext.textContent=T('sync');dot.classList.add('sync');
fetch(u).then(function(r){return r.json()}).then(function(d){
hist=d.points||[];draw()}).catch(function(){hist=[];draw()}).finally(function(){
busy=false;stext.textContent=T('live')+' '+fromCur+'/'+toCur;dot.classList.remove('sync')})}

var refreshIn=60;
function loadRates(){busy=true;stext.textContent=T('loading');dot.classList.add('sync');
fetch('/api/rates?base='+fromCur).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()})
.then(function(d){rates=d.rates||{};prev=d.prev||{};loading=false;
convert();renderTable();loadHist();refreshIn=60;
stext.textContent=T('live')+' '+new Date().toLocaleTimeString(LANG==='en'?'en-US':'id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit'})})
.catch(function(e){loading=false;busy=false;showErr(T('fail')+e.message+T('retry'))})
.finally(function(){dot.classList.remove('sync')})}
function tick(){refreshIn--;if(refreshIn<=0){loadRates();return}
if(!busy)stext.textContent=T('refresh')+' '+refreshIn+'s';}
setInterval(tick,1000);

function doSwap(){var t=fromCur;fromCur=toCur;toCur=t;
fromCode.textContent=fromCur;toCode.textContent=toCur;
fromName.textContent=nm(fromCur);toName.textContent=nm(toCur);
rates={};loading=true;loadRates();saveState();showToast(fromCur+' ⇄ '+toCur)}
swap.addEventListener('click',doSwap);

amt.addEventListener('input',convert);
id('clr').addEventListener('click',function(){amt.value='';convert()});
id('copy').addEventListener('click',function(){
var t2=out.textContent;if(t2==='—'){showToast(T('noRes'));return}
var done=function(){showToast(T('copyOk')+': '+t2+' '+toCur)};
if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t2+' '+toCur).then(done).catch(done)}
else{var ta=document.createElement('textarea');ta.value=t2+' '+toCur;document.body.appendChild(ta);ta.select();
try{document.execCommand('copy')}catch(e){}ta.remove();done()}});
var rb=id('range').querySelectorAll('button'),i;
for(i=0;i<rb.length;i++)rb[i].addEventListener('click',function(){
days=+this.dataset.d;
for(var j=0;j<rb.length;j++){rb[j].classList.remove('on');rb[j].setAttribute('aria-pressed','false')}
this.classList.add('on');this.setAttribute('aria-pressed','true');loadHist()});
window.addEventListener('resize',function(){clearTimeout(timer);timer=setTimeout(draw,150)});

loadState();loadLang();applyLang();bindLang();loadRates();
})();
