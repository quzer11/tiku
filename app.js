const chapters = QUESTION_BANK.chapters.filter(c => QUESTION_BANK.questions.some(q => q.chapter === c.id));
const all = QUESTION_BANK.questions;
let state = {chapter: chapters[0].id, index: 0, order: [], selected: new Set(), submitted: false};

function shuffle(arr){const b=[...arr];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function sameAnswer(a,b){return [...a].sort().join('|') === [...b].sort().join('|');}
function current(){return state.order[state.index];}

function setChapter(id){
  state.chapter=id;
  state.order=shuffle(all.filter(q=>q.chapter===id));
  state.index=0; state.selected=new Set(); state.submitted=false;
  renderTabs(); renderQuiz(); showQuiz();
}
function renderTabs(){
  const nav=document.getElementById('chapterTabs'); nav.innerHTML='';
  chapters.forEach(c=>{
    const b=document.createElement('button');
    b.textContent=`第${c.number}章（${c.count}题）`;
    b.title=c.title;
    b.className=c.id===state.chapter?'active':'';
    b.onclick=()=>setChapter(c.id);
    nav.appendChild(b);
  });
}
function renderQuiz(){
  const q=current(); if(!q)return;
  document.getElementById('chapterName').textContent=q.chapterTitle;
  document.getElementById('progress').textContent=`${state.index+1} / ${state.order.length}`;
  document.getElementById('typeName').textContent=`${q.type} · 本类第${q.number}题`;
  document.getElementById('stem').textContent=q.stem;
  const ops=document.getElementById('options'); ops.innerHTML='';
  q.options.forEach(o=>{
    const b=document.createElement('button');
    b.className='option'; b.dataset.label=o.label;
    b.innerHTML=`<span class="option-label">${esc(o.label)}</span><span>${esc(o.text)}</span>`;
    b.onclick=()=>toggleOption(o.label);
    ops.appendChild(b);
  });
  state.selected=new Set(); state.submitted=false;
  document.getElementById('result').className='result hidden';
  document.getElementById('result').innerHTML='';
  document.getElementById('submitBtn').disabled=false;
}
function toggleOption(label){
  if(state.submitted)return;
  const q=current();
  if(q.type==='多项选择题'){
    state.selected.has(label)?state.selected.delete(label):state.selected.add(label);
  }else{
    state.selected=new Set([label]);
  }
  document.querySelectorAll('.option').forEach(btn=>btn.classList.toggle('selected',state.selected.has(btn.dataset.label)));
}
function submitAnswer(){
  if(!state.selected.size){showResult('请先选择答案。','notice');return;}
  const q=current(); const ok=sameAnswer(state.selected,new Set(q.answer)); state.submitted=true;
  document.querySelectorAll('.option').forEach(btn=>{
    const label=btn.dataset.label;
    btn.classList.toggle('correct',q.answer.includes(label));
    btn.classList.toggle('wrong',state.selected.has(label)&&!q.answer.includes(label));
  });
  showResult(ok?`回答正确！答案：${q.answer.join('、')}`:`回答错误。正确答案：${q.answer.join('、')}`,ok?'good':'bad');
  document.getElementById('submitBtn').disabled=true;
}
function showResult(text,type){const box=document.getElementById('result');box.textContent=text;box.className=`result ${type}`;}
function clearSelection(){if(state.submitted)return;state.selected.clear();document.querySelectorAll('.option').forEach(x=>x.classList.remove('selected'));}
function next(){if(state.index<state.order.length-1){state.index++;renderQuiz();}else{state.order=shuffle(state.order);state.index=0;renderQuiz();showResult('本章已完成，已重新随机。','notice');}}
function prev(){state.index=(state.index-1+state.order.length)%state.order.length;renderQuiz();}
function showQuiz(){document.getElementById('quiz').classList.remove('hidden');document.getElementById('timeline').classList.add('hidden');document.getElementById('quizBtn').classList.add('active-action');document.getElementById('timelineBtn').classList.remove('active-action');document.getElementById('chapterTabs').classList.remove('hidden');}
function showTimeline(){document.getElementById('quiz').classList.add('hidden');document.getElementById('timeline').classList.remove('hidden');document.getElementById('quizBtn').classList.remove('active-action');document.getElementById('timelineBtn').classList.add('active-action');document.getElementById('chapterTabs').classList.add('hidden');renderTimeline();}
function renderTimeline(){
  const key=document.getElementById('timelineSearch').value.trim().toLowerCase();
  const items=QUESTION_BANK.timeline.filter(x=>!key||`${x.date}${x.title}${x.detail}${x.tags.join('')}`.toLowerCase().includes(key));
  document.getElementById('timelineList').innerHTML=items.map((x,i)=>`<article class="time-item"><div class="time-dot"></div><div class="time-date">${esc(x.date)}</div><div class="time-card"><h3>${esc(x.title)}</h3><p>${esc(x.detail)}</p><div>${x.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div></div></article>`).join('') || '<div class="empty">没有匹配的时间点。</div>';
}

document.getElementById('prevBtn').onclick=prev;
document.getElementById('nextBtn').onclick=next;
document.getElementById('submitBtn').onclick=submitAnswer;
document.getElementById('clearBtn').onclick=clearSelection;
document.getElementById('reshuffleBtn').onclick=()=>setChapter(state.chapter);
document.getElementById('quizBtn').onclick=showQuiz;
document.getElementById('timelineBtn').onclick=showTimeline;
document.getElementById('timelineSearch').oninput=renderTimeline;
document.addEventListener('keydown',e=>{
  if(document.activeElement&&['INPUT','TEXTAREA'].includes(document.activeElement.tagName))return;
  if(document.getElementById('quiz').classList.contains('hidden'))return;
  if(e.key==='ArrowRight')next(); else if(e.key==='ArrowLeft')prev();
  else if(/^[1-5]$/.test(e.key)){const btn=document.querySelectorAll('#options .option')[Number(e.key)-1];if(btn)btn.click();}
  else if(e.key==='Enter')submitAnswer();
});
setChapter(chapters[0].id);renderTimeline();
