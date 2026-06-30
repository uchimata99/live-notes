/*! live-notes — מנגנון הערות חי (drop-in feedback widget)
 *  הוסיפו הערות על כל עמוד, סמנו עם עט, ושלחו אותן כ-GitHub Issue
 *  שסוכן Claude Code יעבד. עצמאי לחלוטין, בלי תלות ובלי שלב בנייה.
 *
 *  שימוש:
 *    <script>window.LIVE_NOTES_CONFIG={repo:'owner/name'}</script>
 *    <script src="https://uchimata99.github.io/live-notes/live-notes.js"></script>
 *
 *  הווידג'ט רדום כברירת מחדל. כדי להפעיל אותו במכשיר שלך, היכנסו פעם אחת
 *  לכתובת עם ?notes=1 (הדגל נשמר). לכיבוי: ?notes=0. כך משתמשי הקצה לא רואים אותו.
 */
(function(){
  var C = Object.assign({
    repo:'',                 /* חובה: 'owner/name' — לאן נשלחים ה-Issues */
    label:'note',            /* תווית ה-Issue */
    title:'הערות',
    lang:'he', dir:'rtl',
    accent:'#c08bff',
    always:false,            /* true = להציג תמיד (בלי דגל) */
    storeKey:null,           /* ברירת מחדל: 'livenotes_'+repo */
    locationFn:function(){ return location.hash ? decodeURIComponent(location.hash.slice(1)) : (document.title||location.pathname); }
  }, window.LIVE_NOTES_CONFIG||{});

  /* הפעלה מותנית — שלא יוצג למשתמשי קצה */
  if(/[?&]notes=1/.test(location.search)){ try{localStorage.setItem('ln_enabled','1');}catch(e){} }
  if(/[?&]notes=0/.test(location.search)){ try{localStorage.removeItem('ln_enabled');}catch(e){} }
  var enabled = C.always || (function(){try{return localStorage.getItem('ln_enabled')==='1';}catch(e){return false;}})();
  if(!enabled) return;
  if(!C.repo){ console.warn('[live-notes] חסר repo בהגדרות (window.LIVE_NOTES_CONFIG.repo).'); return; }

  var KEY = C.storeKey || ('livenotes_'+C.repo);
  var notes = (function(){ try{return JSON.parse(localStorage.getItem(KEY))||[];}catch(e){return [];} })();
  function persist(){ try{localStorage.setItem(KEY,JSON.stringify(notes));}catch(e){} }
  function uid(){ return 'n'+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36); }
  function esc(s){ return (s==null?'':String(s)).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var SIDE = C.dir==='rtl'?'left':'right';

  var css=
  '.ln-fab{position:fixed;bottom:18px;'+SIDE+':18px;z-index:2147483000;width:54px;height:54px;border-radius:50%;border:none;cursor:pointer;background:'+C.accent+';color:#15111e;font-size:24px;box-shadow:0 8px 24px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center}'+
  '.ln-badge{position:absolute;top:-4px;'+SIDE+':-4px;background:#ff7a8a;color:#fff;font:600 12px sans-serif;min-width:20px;height:20px;border-radius:10px;display:flex;align-items:center;justify-content:center;padding:0 5px}'+
  '.ln-panel{position:fixed;bottom:84px;'+SIDE+':18px;z-index:2147483000;width:min(360px,calc(100vw - 36px));max-height:74vh;overflow:auto;background:#1b1430;color:#f5eff9;border:1px solid rgba(228,205,240,.18);border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.55);padding:14px;font-family:system-ui,Heebo,sans-serif;direction:'+C.dir+'}'+
  '.ln-hidden{display:none!important}'+
  '.ln-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}.ln-h b{font-size:17px}'+
  '.ln-x{background:none;border:none;color:#c4b6d6;font-size:20px;cursor:pointer;line-height:1}'+
  '.ln-loc{font-size:12px;color:#9b8fb0;margin:0 0 8px;word-break:break-word}'+
  '.ln-ta{width:100%;box-sizing:border-box;background:#120d1d;color:#f5eff9;border:1px solid rgba(228,205,240,.18);border-radius:10px;padding:9px;font:inherit;font-size:14px;resize:vertical;min-height:54px}'+
  '.ln-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}'+
  '.ln-btn{border:none;border-radius:10px;padding:9px 13px;font:inherit;font-size:14px;font-weight:600;cursor:pointer}'+
  '.ln-pri{background:'+C.accent+';color:#15111e}.ln-gho{background:transparent;border:1px solid rgba(228,205,240,.22);color:#f5eff9}'+
  '.ln-list{margin-top:12px;display:flex;flex-direction:column;gap:8px}'+
  '.ln-item{background:#120d1d;border:1px solid rgba(228,205,240,.12);border-radius:10px;padding:9px}'+
  '.ln-il{font-size:11px;color:#9b8fb0;margin-bottom:4px;word-break:break-word}.ln-it{font-size:14px;white-space:pre-wrap;word-break:break-word}'+
  '.ln-ia{display:flex;gap:12px;margin-top:6px}.ln-ia button{background:none;border:none;color:#9b8fb0;font-size:12px;cursor:pointer;padding:0}'+
  '.ln-empty{color:#9b8fb0;font-size:13px;text-align:center;padding:10px}'+
  '.ln-mark{display:block;margin-top:6px;max-width:100%;border-radius:8px;border:1px solid rgba(228,205,240,.18);background:#fff;cursor:zoom-in}'+
  '.ln-toast{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483002;background:#1b1430;color:#fff;padding:8px 15px;border-radius:999px;font:600 13px system-ui,Heebo,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.45)}'+
  '.ln-pending{background:rgba(255,90,138,.12);border:1px solid rgba(255,90,138,.4);color:#ffd0db;border-radius:9px;padding:7px 9px;font-size:12.5px;margin-bottom:8px}'+
  '.ln-link{background:none;border:none;color:#ff9ab0;cursor:pointer;font:inherit;text-decoration:underline;padding:0}'+
  '.ln-hint{font-size:12px;color:#9b8fb0;margin-top:10px;line-height:1.55}'+
  '.ln-pen-wrap{position:fixed;inset:0;z-index:2147482000}.ln-pen{position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:crosshair}'+
  '.ln-pen-bar{position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:2147483001;display:flex;gap:8px;background:#1b1430;border:1px solid rgba(228,205,240,.2);border-radius:999px;padding:6px 10px}';
  var st=document.createElement('style'); st.textContent=css; (document.head||document.documentElement).appendChild(st);

  var extTrigger=null;
  function el(tag,cls,html){ var e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; }
  var fab=el('button','ln-fab',null); fab.title=C.title; fab.innerHTML='📝<span class="ln-badge ln-hidden"></span>';
  var panel=el('div','ln-panel ln-hidden',null);
  var penWrap=el('div','ln-pen-wrap ln-hidden',null);
  var canvas=el('canvas','ln-pen',null); penWrap.appendChild(canvas);
  var penBar=el('div','ln-pen-bar ln-hidden','<button class="ln-btn ln-gho" data-a="penClear">נקה</button><button class="ln-btn ln-pri" data-a="penOff">סיום סימון</button>');
  var toast=el('div','ln-toast ln-hidden',null);
  function showToast(t){ toast.textContent=t; toast.classList.remove('ln-hidden'); }
  function hideToast(){ toast.classList.add('ln-hidden'); }
  /* טריגר חיצוני: כפתור בתוך הדף (ליד ההמבורגר) — נוסף על הכפתור הצף,
     שנשאר גלוי תמיד כך שגם בגלילה אפשר להגיע אליו (לא "נבלע") */
  function wireTrigger(){
    extTrigger = document.querySelector('[data-ln-trigger]');
    if(extTrigger){
      extTrigger.addEventListener('click',function(ev){ ev.preventDefault(); panel.classList.contains('ln-hidden')?open():close(); });
    }
  }
  function mount(){ document.body.appendChild(fab); document.body.appendChild(panel); document.body.appendChild(penWrap); document.body.appendChild(penBar); document.body.appendChild(toast); wireTrigger(); badge(); }

  /* ----- צילום מסך (html2canvas, נטען לפי דרישה) ----- */
  var capturing=false;
  function loadH2C(){ return new Promise(function(res,rej){
    if(window.html2canvas) return res(window.html2canvas);
    var s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload=function(){ res(window.html2canvas); };
    s.onerror=function(){ rej(new Error('html2canvas load failed')); };
    (document.head||document.documentElement).appendChild(s);
  }); }
  /* מצלם את אזור התצוגה הנוכחי. keepPen=true משאיר את סימון העט בתמונה. מסתיר את ממשק הווידג'ט מהצילום. */
  function captureScreen(opts){
    opts=opts||{};
    if(capturing) return Promise.resolve(null);
    capturing=true; showToast('📷 מצלם מסך…');
    var fabHidden=fab.classList.contains('ln-hidden');
    fab.classList.add('ln-hidden'); panel.classList.add('ln-hidden'); penBar.classList.add('ln-hidden');
    if(extTrigger) extTrigger.style.visibility='hidden';
    function restore(){ if(!fabHidden)fab.classList.remove('ln-hidden'); if(extTrigger)extTrigger.style.visibility=''; hideToast(); capturing=false; }
    return loadH2C().then(function(h2c){
      var sc=Math.min(1, 1000/Math.max(innerWidth,1));
      return h2c(document.body,{ backgroundColor:'#ffffff', scale:sc, useCORS:true, logging:false,
        x:window.scrollX, y:window.scrollY, width:innerWidth, height:innerHeight,
        ignoreElements:function(node){ return node===panel||node===fab||node===penBar||node===toast||node===extTrigger||(!opts.keepPen&&node===penWrap); } });
    }).then(function(cv){ restore(); try{ return cv.toDataURL('image/jpeg',0.72); }catch(e){ return null; } })
      .catch(function(){ restore(); return null; });
  }
  function dl(href,name){ var a=document.createElement('a'); a.href=href; a.download=name; document.body.appendChild(a); a.click(); setTimeout(function(){a.remove();},0); }

  /* ----- עט ----- */
  var ctx,drawing=false,hasDrawn=false,pendingMark=null;
  function sizeCanvas(){ canvas.width=innerWidth; canvas.height=innerHeight; ctx=canvas.getContext('2d'); ctx.strokeStyle='#ff5a8a'; ctx.lineWidth=3.5; ctx.lineCap='round'; ctx.lineJoin='round'; }
  function penOn(){ sizeCanvas(); hasDrawn=false; pendingMark=null; canvas.style.pointerEvents='auto'; penWrap.classList.remove('ln-hidden'); penBar.classList.remove('ln-hidden'); panel.classList.add('ln-hidden'); }
  /* סיום סימון: מצלם את המסך עם הסימון, שומר כתמונה תלויה ופותח הערה לשיוך */
  function penOff(){
    penBar.classList.add('ln-hidden');
    if(!hasDrawn){ penWrap.classList.add('ln-hidden'); return; }
    canvas.style.pointerEvents='none';
    captureScreen({keepPen:true}).then(function(img){
      try{ pendingMark = img || canvas.toDataURL('image/jpeg',0.72); }catch(e){ pendingMark=null; }
      penClear(); penWrap.classList.add('ln-hidden'); open();
    });
  }
  function doShot(){ if(capturing)return; captureScreen().then(function(img){ if(img)pendingMark=img; else alert('לא הצלחתי לצלם מסך כאן. נסי שוב, או צלמי צילום מסך מהמכשיר.'); open(); }); }
  function penClear(){ if(ctx)ctx.clearRect(0,0,canvas.width,canvas.height); hasDrawn=false; }
  function penDiscard(){ penClear(); pendingMark=null; penWrap.classList.add('ln-hidden'); }
  canvas.addEventListener('pointerdown',function(e){ drawing=true; ctx.beginPath(); ctx.moveTo(e.clientX,e.clientY); e.preventDefault(); });
  canvas.addEventListener('pointermove',function(e){ if(!drawing)return; ctx.lineTo(e.clientX,e.clientY); ctx.stroke(); hasDrawn=true; });
  window.addEventListener('pointerup',function(){ drawing=false; });

  /* ----- הערות ----- */
  function badge(){
    var b=fab.querySelector('.ln-badge');
    if(notes.length){ b.classList.remove('ln-hidden'); b.textContent=notes.length; } else b.classList.add('ln-hidden');
    if(extTrigger){ extTrigger.setAttribute('data-ln-count', notes.length||''); }
  }
  function exportText(){ var t='הערות — '+C.repo+'\n========================\n\n'; var k=0; notes.forEach(function(n){ var line='['+(n.loc||'')+']\n• '+n.text; if(n.markUrl){ line+='\n  📷 צילום מסך: '+n.markUrl; } else if(n.mark){ k++; line+='\n  📷 (צילום מצורף — גררי לכאן את הקובץ note-'+k+'.jpg)'; } t+=line+'\n\n'; }); return t; }
  function render(){
    var items = notes.length ? notes.map(function(n){
      return '<div class="ln-item"><div class="ln-il">'+esc(n.loc)+(n.mark?' · 📷 צילום מצורף':'')+'</div><div class="ln-it">'+esc(n.text)+'</div>'+
        (n.mark?'<img class="ln-mark" src="'+n.mark+'" alt="צילום מסך" data-a="zoom" data-id="'+n.id+'">':'')+
        '<div class="ln-ia"><button data-a="edit" data-id="'+n.id+'">✎ ערוך</button>'+(n.mark?'<button data-a="save" data-id="'+n.id+'">⬇️ שמור תמונה</button>':'')+'<button data-a="del" data-id="'+n.id+'">🗑️ מחק</button></div></div>';
    }).join('') : '<div class="ln-empty">אין עדיין הערות. כתבי הערה ולחצי «הוסף».</div>';
    var send = notes.length ? '<div class="ln-row"><button class="ln-btn ln-pri" data-a="send">📤 שלח</button><button class="ln-btn ln-gho" data-a="copy">העתק</button><button class="ln-btn ln-gho" data-a="clear">מחק הכול</button></div>' : '';
    panel.innerHTML =
      '<div class="ln-h"><b>'+esc(C.title)+'</b><button class="ln-x" data-a="close">✕</button></div>'+
      '<div class="ln-loc">מיקום: '+esc(C.locationFn())+'</div>'+
      (pendingMark?'<div class="ln-pending">📷 צילום המסך מוכן — כתבי הערה והוא ישויך אליה. <button data-a="penDiscard" class="ln-link">בטל צילום</button></div>':'')+
      '<textarea class="ln-ta" id="ln-input" placeholder="'+(pendingMark?'הסבירי על מה שצילמת…':'מה לתקן כאן?')+'"></textarea>'+
      '<div class="ln-row"><button class="ln-btn ln-pri" data-a="add">＋ הוסף הערה</button><button class="ln-btn ln-gho" data-a="pen">🖊️ עט + צילום</button><button class="ln-btn ln-gho" data-a="shot">📷 צלם מסך</button></div>'+
      '<div class="ln-list">'+items+'</div>'+send+
      '<div class="ln-hint">«עט + צילום» = סמני על המסך ולחצי «סיום סימון». «צלם מסך» = צילום של המסך הנוכחי. «שלח» פותח Issue — אם את מחוברת, הצילומים עולים אוטומטית; אחרת יורדים למכשיר לגרירה. ההערות נמחקות מהמכשיר אחרי השליחה.</div>';
    badge();
  }
  function open(){ render(); panel.classList.remove('ln-hidden'); }
  function close(){ panel.classList.add('ln-hidden'); }
  function addNote(){ var ta=panel.querySelector('#ln-input'); var v=(ta&&ta.value||'').trim(); if(!v)return;
    var n={id:uid(),loc:C.locationFn(),text:v,ts:Date.now()};
    if(pendingMark){ n.mark=pendingMark; pendingMark=null; penClear(); penWrap.classList.add('ln-hidden'); }
    notes.push(n); persist(); render(); }
  function editNote(id){ var n=notes.filter(function(x){return x.id===id;})[0]; if(!n)return; var v=prompt('עריכת הערה:',n.text); if(v==null)return; n.text=v.trim(); persist(); render(); }
  function delNote(id){ notes=notes.filter(function(x){return x.id!==id;}); persist(); render(); }
  function clearAll(){ if(confirm('למחוק את כל ההערות?')){ notes=[]; persist(); render(); } }
  function copyAll(){ var t=exportText(); if(navigator.clipboard)navigator.clipboard.writeText(t).catch(function(){}); alert('ההערות הועתקו.'); }
  function saveImg(id){ var n=notes.filter(function(x){return x.id===id;})[0]; if(n&&n.mark)dl(n.mark,'note-'+id+'.jpg'); }
  function zoomImg(id){ var n=notes.filter(function(x){return x.id===id;})[0]; if(n&&n.mark){ var w=window.open('','_blank'); if(w)w.document.write('<img src="'+n.mark+'" style="max-width:100%">'); } }
  function send(){
    if(!notes.length){ alert('אין הערות לשליחה.'); return; }
    var title='הערות — '+new Date().toLocaleDateString(C.lang==='he'?'he-IL':undefined);
    var pend=notes.filter(function(n){return n.mark&&!n.markUrl;});
    /* פותחים חלון ריק בתוך מחוות הלחיצה כדי שלא ייחסם אחרי await של ההעלאה */
    var win=null; try{ win=window.open('about:blank','_blank'); }catch(e){}
    function finish(){
      var url='https://github.com/'+C.repo+'/issues/new?labels='+encodeURIComponent(C.label)+'&title='+encodeURIComponent(title)+'&body='+encodeURIComponent(exportText());
      if(win){ try{ win.location=url; }catch(e){ window.open(url,'_blank','noopener'); } } else { window.open(url,'_blank','noopener'); }
      /* רק צילומים שלא עלו אוטומטית — מורידים למכשיר לגרירה ידנית */
      var failed=notes.filter(function(n){return n.mark&&!n.markUrl;});
      failed.forEach(function(n,i){ dl(n.mark,'note-'+(i+1)+'.jpg'); });
      var nf=failed.length;
      notes=[]; persist(); render();
      if(nf) setTimeout(function(){ alert(nf+' צילומים לא עלו אוטומטית (אולי לא מחוברת) — הורדו למכשיר; גררי אותם ל-Issue.'); }, 250);
    }
    if(C.uploadImage && pend.length){
      showToast('☁️ מעלה צילומים…');
      Promise.all(pend.map(function(n,i){
        return Promise.resolve().then(function(){ return C.uploadImage(n.mark,'note-'+Date.now()+'-'+i+'.jpg'); })
          .then(function(res){ if(res&&res.url){ n.markUrl=res.url; n.markId=res.id; } })
          .catch(function(){});
      })).then(function(){ hideToast(); finish(); }, function(){ hideToast(); finish(); });
    } else { finish(); }
  }
  fab.addEventListener('click',function(){ panel.classList.contains('ln-hidden')?open():close(); });
  panel.addEventListener('click',function(e){ var b=e.target.closest('[data-a]'); if(!b)return; var a=b.getAttribute('data-a'),id=b.getAttribute('data-id');
    ({add:addNote,close:close,pen:penOn,shot:doShot,penDiscard:function(){penDiscard();render();},edit:function(){editNote(id);},del:function(){delNote(id);},save:function(){saveImg(id);},zoom:function(){zoomImg(id);},clear:clearAll,copy:copyAll,send:send}[a]||function(){})(); });
  penBar.addEventListener('click',function(e){ var b=e.target.closest('[data-a]'); if(!b)return; ({penClear:penClear,penOff:penOff}[b.getAttribute('data-a')]||function(){})(); });

  /* ממשק חיצוני — כדי שכפתור בדף (ליד ההמבורגר) יוכל לפתוח/לסגור */
  window.LiveNotes = {
    open:open, close:close,
    toggle:function(){ panel.classList.contains('ln-hidden')?open():close(); },
    pen:penOn, shot:doShot, count:function(){ return notes.length; }
  };

  if(document.body) mount(); else document.addEventListener('DOMContentLoaded',mount);
})();
