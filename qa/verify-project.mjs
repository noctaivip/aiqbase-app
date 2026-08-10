import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const readJson=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const files=['content/questions.json','content/vocabulary.json','content/person-types.json'];
const q=files.flatMap(readJson);
const fail=[];
const modes=['practical','thinking','erudition','vocabulary','person_type'];
const ids=new Set(), texts=new Set(), objectives=new Set();
for(const x of q){
 if(!x.id||ids.has(x.id)) fail.push(`duplicate/missing id: ${x.id}`); else ids.add(x.id);
 const t=String(x.question||'').trim().toLowerCase(); if(!t||texts.has(t)) fail.push(`duplicate/missing question: ${x.id}`); else texts.add(t);
 const o=String(x.learningObjective||'').trim(); if(!o||objectives.has(o)) fail.push(`duplicate/missing objective: ${x.id}`); else objectives.add(o);
 if(!Array.isArray(x.options)||x.options.length!==4||new Set(x.options.map(String)).size!==4) fail.push(`invalid options: ${x.id}`);
 if(!Number.isInteger(x.answer)||x.answer<0||x.answer>3) fail.push(`invalid answer: ${x.id}`);
 if(!['Recall','Understanding','Application','Analysis'].includes(x.cognitiveLevel)) fail.push(`invalid cognitiveLevel: ${x.id}`);
 if(!['Foundation','Developing','Advanced'].includes(x.academicDifficulty)) fail.push(`invalid academicDifficulty: ${x.id}`);
 if(!x.verificationStatus) fail.push(`missing verificationStatus: ${x.id}`);
}
if(q.length!==2500) fail.push(`question count ${q.length} != 2500`);
for(const m of modes){const c=q.filter(x=>x.mode===m).length;if(c!==500) fail.push(`${m}: ${c} != 500`)}
for(const h of ['index.html','app_preview.html']){
 const s=fs.readFileSync(path.join(root,h),'utf8');
 const forbiddenPhrases=['AI считает, что','AI подбирает темы','AI построит личный отчёт','AI будет подбирать','AI анализирует первые ответы','AI сохранил результат','персональная память AI','+0 IQ','Digital Twin','AI Growth Loop','IQ Score'];
 for(const forbidden of forbiddenPhrases) if(s.includes(forbidden)) fail.push(`${h}: forbidden phrase ${forbidden}`);
 // Reject unsupported user-facing claims that AI performs ordinary deterministic learning logic.
 // This deliberately targets Russian action verbs while allowing legitimate labels such as "AIQBase".
 const pseudoAiPatterns=[
  /\bAI\s+(?:анализирует|проанализирует|подбирает|подберёт|подстраивает|подстроит|сохраняет|сохранил|сохранит|строит|построит|считает|рассчитает|определяет|определит|рекомендует|порекомендует|формирует|сформирует|прогнозирует|спрогнозирует)\b/giu,
  /\bИИ\s+(?:анализирует|проанализирует|подбирает|подберёт|подстраивает|подстроит|сохраняет|сохранил|сохранит|строит|построит|считает|рассчитает|определяет|определит|рекомендует|порекомендует|формирует|сформирует|прогнозирует|спрогнозирует)\b/giu
 ];
 for(const pattern of pseudoAiPatterns){
  const matches=[...s.matchAll(pattern)].map(m=>m[0]);
  if(matches.length) fail.push(`${h}: unsupported pseudo-AI claim(s): ${[...new Set(matches)].join(', ')}`);
 }
 if(!s.includes('id="nextBtn"')) fail.push(`${h}: nextBtn missing`);
}

// v13.3: strict parity between external content and embedded offline fallback.
function extractEmbedded(html,varName){
 const start=`const ${varName}=`; const i=html.indexOf(start); if(i<0) throw new Error(`missing ${varName}`);
 const a=html.indexOf('[',i+start.length); let depth=0,inStr=false,esc=false;
 for(let j=a;j<html.length;j++){ const c=html[j]; if(inStr){if(esc)esc=false;else if(c==='\\')esc=true;else if(c==='"')inStr=false;continue;} if(c==='"'){inStr=true;continue;} if(c==='[')depth++; else if(c===']'&&--depth===0)return JSON.parse(html.slice(a,j+1)); }
 throw new Error(`unterminated ${varName}`);
}
const external=q;
for(const h of ['index.html','app_preview.html']){
 const hs=fs.readFileSync(path.join(root,h),'utf8');
 const embedded=[...extractEmbedded(hs,'AIQ_EMBEDDED_CORE'),...extractEmbedded(hs,'AIQ_EMBEDDED_VOCABULARY'),...extractEmbedded(hs,'AIQ_EMBEDDED_PERSON_TYPES')];
 if(embedded.length!==external.length) fail.push(`${h}: embedded count ${embedded.length} != external ${external.length}`);
 const extMap=new Map(external.map(x=>[x.id,JSON.stringify(x)]));
 for(const x of embedded){ if(!extMap.has(x.id)) fail.push(`${h}: embedded unknown id ${x.id}`); else if(extMap.get(x.id)!==JSON.stringify(x)) fail.push(`${h}: embedded mismatch ${x.id}`); }
}

if(fail.length){console.error('AIQBase QA FAILED\n'+fail.join('\n'));process.exit(1)}
console.log(`AIQBase QA PASS: ${q.length} questions; ${ids.size} unique IDs; ${objectives.size} unique objectives; 5×500 modes.`);
