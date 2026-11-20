import {mountArranger,suspendArranger} from './arranger-workbench.mjs';
import {mountBowed,suspendBowed} from './bowed-workbench.mjs?assets=bowed-audio';
import {mountPercussion,suspendPercussion} from './percussion-workbench.mjs?assets=percussion-rebound';
import {mountWind,suspendWind} from './wind-workbench.mjs';
import {mountPlucked,suspendPlucked} from './plucked-workbench.mjs';
import {instruments,families,instrumentIcon,filterInstruments} from './instrument-catalog.mjs';
export function mountInstrumentAtlas(onRoute){
 let family='all',term='';if(!document.querySelector('[data-arranger-style]')){const l=document.createElement('link');l.rel='stylesheet';l.href=new URL('./arranger.css',import.meta.url).href;l.dataset.arrangerStyle='true';document.head.append(l);}
 const home=document.querySelector('#home-view'),planned=document.querySelector('#planned-view');
 home.innerHTML=`<div class="atlas-hero"><div><span class="atlas-eyebrow">CHINESE INSTRUMENT ATLAS · 为作曲而探索</span><h1>国乐织音坊<br><em style="font-size:.48em;letter-spacing:.04em">中国民族乐器法交互学习平台</em></h1><p>从一件乐器的音位、奏法与音色，<br>找到写在谱上的下一种可能。</p><div class="atlas-availability"><i></i>四类乐器板块已开放<span>音位 · 技法 · 编配</span></div></div><div class="atlas-hero-art" aria-hidden="true"><div class="atlas-orbit"></div>${instrumentIcon('pipa')}<span>弦上有声，谱中有形。</span></div></div><section class="arranger-entry"><div><h2>国乐创编实验室</h2><p>选编制、试写短章、分轨试听 · 当前开放本地规则试作</p></div><a href="#compose">进入创编试用</a></section><div class="atlas-catalog-top"><div><span class="atlas-eyebrow">INSTRUMENT COLLECTION</span><h2>选择一件乐器</h2></div><label class="atlas-search"><span>查找乐器</span><input id="instrument-search" type="search" placeholder="名称 / 拼音，如 琵琶、pipa" aria-label="搜索乐器"></label></div><div class="atlas-filters" aria-label="乐器分类"><button data-family="all" aria-pressed="true">全部乐器 <small>${instruments.length}</small></button>${families.map(f=>`<button data-family="${f.id}" aria-pressed="false">${f.name}</button>`).join('')}</div><div id="instrument-collection" aria-live="polite"></div><p class="atlas-catalog-note">16个乐器入口已开放；中国打击乐支持13种常用器材自由组合。弹拨、吹管声部、二胡、高胡、板胡与打击乐已接入基础试听；中胡提供二胡移调音区参考。专项技法实录与动作演示持续完善。</p>`;
 function render(){const list=filterInstruments(term,family);home.querySelector('#instrument-collection').innerHTML=families.map((f,index)=>{const rows=list.filter(i=>i.family===f.id);return rows.length?`<section class="instrument-family"><div class="family-heading"><span>0${index+1}</span><h3>${f.name}</h3><small>${f.en}</small><b>${rows.length} 件</b></div><div class="instrument-grid">${rows.map(i=>`<a class="instrument-card ${i.status==='ready'?'is-ready':''}" href="#${i.id==='pipa'?'pipa/explore':'instrument/'+i.id}" aria-label="${i.name} · ${i.status==='ready'?'进入工作台':'筹备中'}"><div class="instrument-card-top"><span class="instrument-state">${i.status==='ready'?'<i></i> 已开放':'筹备中'}</span><span class="instrument-card-arrow">↗</span></div><div class="instrument-portrait">${instrumentIcon(i.id)}</div><div class="instrument-card-name"><h4>${i.name}</h4><small>${i.en}</small></div>${i.status==='ready'?'<span class="instrument-card-caption">音位 · 记谱 · 技法 · 配器</span>':'<span class="instrument-card-caption">演奏内容筹备中</span>'}</a>`).join('')}</div></section>`:'';}).join('')||'<p class="atlas-empty">没有找到这件乐器。换个名称试试，或查看全部分类。</p>';home.querySelectorAll('[data-family]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.family===family)));}
 home.addEventListener('click',e=>{const b=e.target.closest('[data-family]');if(b){family=b.dataset.family;render();}});home.querySelector('#instrument-search').addEventListener('input',e=>{term=e.target.value;render();});render();
 const route=()=>{
  const path=location.hash.slice(1)||'home';
  suspendArranger();suspendPlucked();suspendWind();suspendBowed();suspendPercussion();
  if(path==='compose'){onRoute('planned');planned.setAttribute('aria-label','国乐创编试用');mountArranger(planned);return;}
  const instrument=instruments.find(i=>path==='instrument/'+i.id);
  if(instrument?.status==='ready'){if(instrument.id==='pipa'){navigate('pipa/explore');return;}onRoute('planned',instrument);planned.setAttribute('aria-label',instrument.name+'AI工作台');if(instrument.family==='bowed')mountBowed(planned,instrument.id);else if(instrument.family==='percussion')mountPercussion(planned);else if(instrument.family==='wind')mountWind(planned,instrument.id);else mountPlucked(planned,instrument.id);return;}
  suspendPlucked();
  if(instrument){planned.innerHTML=`<div class="atlas-placeholder"><a href="#home" class="atlas-back">← 返回乐器总览</a><div class="placeholder-icon">${instrumentIcon(instrument.id)}</div><span class="atlas-eyebrow">${families.find(f=>f.id===instrument.family).name} / ${instrument.en}</span><h1>${instrument.name}</h1><span class="placeholder-state">筹备中</span><p>这个乐器板块尚未开放。</p><a href="#home" class="atlas-home-button">浏览其他乐器 →</a></div>`;onRoute('planned',instrument);}
  else if(['pipa/explore','pipa/techniques','pipa/about'].includes(path))onRoute(path.split('/')[1]);
  else onRoute('home');
 };
 function navigate(path){if(location.hash==='#'+path)route();else location.hash=path;}
 window.addEventListener('hashchange',route);route();return {navigate};
}
