// Reparent the same introduction node on narrow screens; never clone interactive workbenches.
export function reorderWorkspaceProfile({workspace,chord,profile,anchor},mobile){
 if(mobile){if(profile.parentNode!==workspace){workspace.insertBefore(profile,chord.nextSibling);}profile.classList.add('mobile-profile-panel');}
 else{if(profile.parentNode!==anchor.parentNode||profile.previousSibling!==anchor)anchor.parentNode.insertBefore(profile,anchor.nextSibling);profile.classList.remove('mobile-profile-panel');}
}
export function startResponsiveWorkspaces(doc=document,win=window){
 const media=win.matchMedia('(max-width: 1000px)'),records=new Map();
 if(!doc.querySelector('[data-responsive-workspace-style]')){const link=doc.createElement('link');link.rel='stylesheet';link.href=new URL('./responsive-workspace.css',import.meta.url).href;link.dataset.responsiveWorkspaceStyle='true';doc.head.append(link);}
 function scan(){for(const [ws]of records)if(!ws.isConnected)records.delete(ws);
  for(const workspace of doc.querySelectorAll('.workspace')){if(records.has(workspace))continue;const chord=[...workspace.children].find(el=>el.classList.contains('chord-panel')),instrument=[...workspace.children].find(el=>el.classList.contains('panel')&&!el.classList.contains('chord-panel')),profile=instrument?.querySelector('.pipa-profile');if(!chord||!profile)continue;const anchor=doc.createComment('instrument introduction desktop position');profile.parentNode.insertBefore(anchor,profile);const record={workspace,chord,profile,anchor};records.set(workspace,record);reorderWorkspaceProfile(record,media.matches);}
 }
 function resize(){for(const record of records.values())if(record.workspace.isConnected)reorderWorkspaceProfile(record,media.matches);}
 scan();media.addEventListener('change',resize);const observer=new win.MutationObserver(scan),planned=doc.querySelector('#planned-view');if(planned)observer.observe(planned,{childList:true});
 return {dispose(){observer.disconnect();media.removeEventListener('change',resize);for(const record of records.values())if(record.workspace.isConnected)reorderWorkspaceProfile(record,false);records.clear();}};
}
