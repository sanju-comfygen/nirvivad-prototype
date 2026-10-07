'use strict';
/* Rebuild the 7 Oct 2026 team walkthrough from an isolated browser profile. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {spawn,spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),out=__dirname,slidesDir=path.join(out,'slides'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'nirvivad-walkthrough-2026-10-07-'));
fs.mkdirSync(slidesDir,{recursive:true});
const chromePath=process.env.CHROME_BIN||'/usr/bin/google-chrome';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let chrome,ws,origin,seq=0;const pending=new Map();
const uploads={full:'Nirvivad_Full_Prototype_Walkthrough_2026-10-07.webm',quick:'Nirvivad_Prototype_Walkthrough_2026-10-07.webm'};
const server=http.createServer((req,res)=>{
 if(req.method==='POST'&&req.url.startsWith('/walkthrough-upload/')){const kind=req.url.split('/').pop();if(!uploads[kind]){res.writeHead(400);return res.end('Bad upload');}const dest=fs.createWriteStream(path.join(out,uploads[kind]));req.pipe(dest);dest.on('finish',()=>{res.writeHead(200,{'Content-Type':'text/plain'});res.end('saved')});return}
 let file;try{file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname))}catch{res.writeHead(400);return res.end()}
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 fs.readFile(file,(err,body)=>{if(err){res.writeHead(404);return res.end()}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'})[path.extname(file)]||'application/octet-stream');res.end(body)});
});
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))})}
async function evaluate(fn,arg=null){const result=await send('Runtime.evaluate',{expression:`(${fn.toString()})(${JSON.stringify(arg)})`,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||JSON.stringify(result.exceptionDetails));return result.result.value}
async function until(fn,label){for(let i=0;i<130;i++){try{if(await evaluate(fn))return}catch{}await wait(80)}throw Error('Timed out: '+label)}
async function go(url,ready){await send('Page.navigate',{url:origin+url});await until(ready,'page '+url);await wait(200)}
async function shot(name,scrollSelector){if(scrollSelector)await evaluate(selector=>{const el=document.querySelector(selector);if(!el)throw Error('Missing screenshot target '+selector);el.scrollIntoView({block:'start'});},scrollSelector);else await evaluate(()=>scrollTo({top:0,behavior:'instant'}));await wait(240);const image=await send('Page.captureScreenshot',{format:'png'});const file=path.join(tmp,name+'.png');fs.writeFileSync(file,Buffer.from(image.data,'base64'));return file}
const deck=[];async function add(title,note,route,ready,scroll){await go(route,ready);const name=String(deck.length+1).padStart(2,'0');const file=await shot(name,scroll);deck.push({title,note,screenshot:file});console.log('CAPTURE '+name+' '+title)}
async function asCustomer(mobile){await evaluate(number=>{const J=NirvivadJourney;J.logout();J.startOtp(number);J.verifyOtp('123456')},mobile)}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;
 chrome=spawn(chromePath,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(tmp,'chrome'),'about:blank'],{stdio:'ignore'});
 const activePort=path.join(tmp,'chrome','DevToolsActivePort');for(let i=0;i<100&&!fs.existsSync(activePort);i++)await wait(100);if(!fs.existsSync(activePort))throw Error('Chrome did not start');const port=fs.readFileSync(activePort,'utf8').split('\n')[0];
 const tabs=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
 ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(!m.id)return;const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}});
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1600,height:900,deviceScaleFactor:1,mobile:false});
 await go('/admin/',()=>!!window.NirvivadJourney&&!!window.AdminStore);
 const ids=await evaluate(()=>{
  const J=NirvivadJourney,sa={id:'user-1',role:'superadmin',active:true},sub={id:'user-2',role:'subadmin',managerId:'user-1',active:true},emp={id:'user-3',role:'employee',managerId:'user-2',active:true};
  const staff=[sa,sub,emp];const aadhaar='123456789010',pan='ABCDE1234F';
  function customer(mobile,name,role){J.logout();J.startOtp(mobile);J.verifyOtp('123456');J.profile({name,email:mobile+'@example.test'});J.addRole(role);J.submitRoleKyc(role,{aadhaar,pan});return J.current()}
  for(const [id,role] of [['USR-DEMO-LAWYER','lawyer'],['USR-DEMO-CA','ca'],['USR-DEMO-BROKER','broker'],['USR-DEMO-ARBITRATOR','arbitrator'],['USR-DEMO-BUILDER','builder']])J.reviewProfessional(sa,id,role,'approved');
  const partner=J.activatePartner(sa,{mobile:'9000000303',name:'Demo NV Channel Partner',email:'partner@example.test',aadhaar,pan});
  const secondLawyer=customer('9000000304','Demo Second Lawyer','lawyer');J.submitProfessional('lawyer',{registrationNumber:'BAR-DEMO-SECOND',authority:'Sample State Bar Council',qualification:'LL.B.',enrolmentDocument:'sample-enrolment.pdf',practiceDocument:'sample-practice.pdf'});J.reviewProfessional(sa,secondLawyer.id,'lawyer','approved');
  const owner=customer('9000000300','Demo Property Owner','owner');const property=J.property({title:'Pune title dispute property',category:'Residential',landType:'',buildingType:'Bungalow',state:'Maharashtra',location:'Pune',locality:'Baner',area:'4200',unit:'Square Foot',ownershipType:'Single Ownership',disputeType:'Title Dispute',description:'Sample property for client walkthrough'},null,true);
  J.adminUpdate(sa,'property',property.id,{subAdminId:sub.id},staff);J.adminUpdate(sub,'property',property.id,{employeeId:emp.id,status:'under_review',remark:'Review title chain and ownership evidence.'},staff);
  const request=J.requestPropertyItems(emp,property.id,{fieldIds:['legalOwnerNames'],documentTypeIds:['registrationDeed'],message:'Please provide legal owner names and the sample deed.'});
  J.respondPropertyItems(property.id,request.id,{fields:{legalOwnerNames:'Sample Owner'},documents:{registrationDeed:{name:'sample-deed.pdf',type:'application/pdf',size:16,contentDataUrl:'data:application/pdf;base64,JVBERi0xLjQK'}},message:'Sample records attached.'});
  J.adminUpdate(emp,'property',property.id,{status:'eligible_for_deal',update:'Property eligibility confirmed. Please choose a plan.'},staff);
  J.requestSubscription(property.id,'plan-1');J.ownerDetails(property.id,{fullAddress:'Sample address, Baner, Pune, Maharashtra',survey:'SAMPLE-42',facts:'Illustrative title dispute chronology for review.',documents:['Sample title record']});
  J.adminUpdate(sa,'property',property.id,{status:'published'},staff);
  const lawyer1='USR-DEMO-LAWYER',broker='USR-DEMO-BROKER';const documentId=J.adminDetail(sa,'property',property.id).documents[0].id;
  const firstLawyer=J.assignProfessional(emp,property.id,'lawyer',lawyer1,{fieldIds:['title','ownershipType','disputeType'],documentIds:[documentId],taskNote:'Review title and ownership evidence.'});
  J.assignProfessional(emp,property.id,'lawyer',secondLawyer.id,{fieldIds:['title','category'],taskNote:'Independent legal view of the same property.'});
  J.assignProfessional(emp,property.id,'broker',broker,{fieldIds:['title','location','area'],taskNote:'Provide market and location observations.'});
  J.assignProfessional(emp,property.id,'partner',partner.id,{fieldIds:['title','location'],taskNote:'Provide approved transaction context.'});
  J.assignProfessional(emp,property.id,'arbitrator','USR-DEMO-ARBITRATOR',{fieldIds:['title','disputeType'],taskNote:'Review arbitration pathway if relevant.'});
  J.assignProfessional(emp,property.id,'builder','USR-DEMO-BUILDER',{fieldIds:['title','location'],taskNote:'Respond to the sample project information request.'});
  function login(mobile){J.logout();J.startOtp(mobile);J.verifyOtp('123456')}
  login('9000000191');J.submitProfessionalReport('lawyer',property.id,{ownershipTitle:'Title chain needs clarification.',legalRisks:'Medium title risk from an earlier transfer.',recommendation:'Request a certified deed copy.',attachment:{name:'sample-legal-report.pdf',type:'application/pdf',size:16,contentDataUrl:'data:application/pdf;base64,JVBERi0xLjQK'}},firstLawyer.id);
  login('9000000193');J.submitProfessionalReport('broker',property.id,{marketObservations:'The locality shows steady demand.',localityInputs:'Baner location assessment.',recommendation:'Check current market comparables.',attachment:{name:'sample-market-note.pdf',type:'application/pdf',size:16,contentDataUrl:'data:application/pdf;base64,JVBERi0xLjQK'}});
  login('9000000303');J.submitProfessionalReport('partner',property.id,{marketObservations:'Partner observed a similar transaction.',transactionNotes:'Illustrative approved activity only.',recommendation:'Share selected market input with finance review.',attachment:{name:'sample-partner-note.pdf',type:'application/pdf',size:16,contentDataUrl:'data:application/pdf;base64,JVBERi0xLjQK'}});
  const secondRound=J.assignProfessional(emp,property.id,'lawyer',lawyer1,{fieldIds:['category','location'],reportShares:[{reportId:'broker:'+broker,fieldIds:['marketObservations'],includeAttachment:true}],remarkIndexes:['0'],taskNote:'Follow-up: review new market context and the original title conclusion.'});
  login('9000000191');J.submitProfessionalReport('lawyer',property.id,{legalRisks:'Risk remains, but new context narrows the issue.',recommendation:'Continue subject to title clarification.'},secondRound.id);
  J.assignProfessional(emp,property.id,'ca','USR-DEMO-CA',{fieldIds:['title','area'],reportShares:[{reportId:'lawyer:'+lawyer1+':round:2',fieldIds:['legalRisks'],includeAttachment:false},{reportId:'partner:'+partner.id,fieldIds:['marketObservations'],includeAttachment:true}],taskNote:'Review valuation and tax impacts using selected reports.'});
  login('9000000192');J.submitProfessionalReport('ca',property.id,{valuationObservations:'Indicative value requires current comparable sales.',taxLiabilities:'Tax record review pending.',recommendation:'Request updated valuation evidence.'});
  login('9000000194');J.submitProfessionalReport('arbitrator',property.id,{arbitrationStatus:'Not yet referred.',observations:'Arbitration may be an optional pathway.',recommendation:'Confirm the dispute clause.'});
  login('9000000195');J.submitProfessionalReport('builder',property.id,{projectDetails:'Sample project details supplied.',supportingDocuments:'sample-project-credential.pdf',recommendation:'Project response submitted.'});
  const buyer=customer('9000000302','Demo Buyer Investor','buyer');const enquiry=J.enquiry({propertyId:'NV-DEMO-101',interestType:'Invest',requirement:'Residential investment',range:'INR 1-2 crore',message:'Please share the next steps for this opportunity.'});
  J.adminUpdate(sa,'enquiry',enquiry.id,{subAdminId:sub.id},staff);J.adminUpdate(sub,'enquiry',enquiry.id,{employeeId:emp.id,status:'assigned',remark:'Keep Owner contact private.'},staff);
  const firstMarket=J.assignMarketEnquiry(emp,enquiry.id,'broker',broker,{fieldIds:['propertyId','category','location'],taskNote:'Provide first market assessment.'});
  J.assignMarketEnquiry(emp,enquiry.id,'partner',partner.id,{fieldIds:['propertyId','location'],taskNote:'Provide approved partner market context.'});
  login('9000000193');J.submitMarketEnquiryUpdate('broker',enquiry.id,{notes:'Initial market demand is steady in this location.',nextAction:'Employee to review buyer enquiry.'},firstMarket.id);
  const secondMarket=J.assignMarketEnquiry(emp,enquiry.id,'broker',broker,{fieldIds:['propertyId','location','range'],taskNote:'Follow-up after new partner information.'});
  J.submitMarketEnquiryUpdate('broker',enquiry.id,{notes:'Updated market view supports a follow-up discussion.',nextAction:'Send to Employee.'},secondMarket.id);
  login('9000000303');J.submitMarketEnquiryUpdate('partner',enquiry.id,{notes:'Partner provided a controlled transaction update.',nextAction:'Employee to compare inputs.'});
  J.logout();return {propertyId:property.id,enquiryId:enquiry.id,firstLawyer:firstLawyer.id,secondLawyer:secondLawyer.id,secondRound:secondRound.id,firstMarket:firstMarket.id,secondMarket:secondMarket.id,partnerId:partner.id};
 });
 fs.writeFileSync(path.join(tmp,'demo-ids.json'),JSON.stringify(ids,null,2));
 await until(()=>!!localStorage.getItem(AdminStore.storageKey),'administration initialization');
 await evaluate(async()=>{await AdminStore.login('sa@nirvivad.example','Nirvivad@123')});
 const adminReady=()=>!!document.querySelector('.admin-shell main h1');const userReady=()=>!!document.querySelector('.user-main h1');
 await add('Administration overview','The administration side holds complete records, team queues and role approvals.','/admin/#overview',adminReady);
 await add('Customer accounts and roles','One account can hold several roles. Super Admin reviews professional profiles and activates NV Channel Partners.','/admin/#customers',adminReady);
 await asCustomer('9000000300');await add('Property Owner dashboard','The Owner sees their own property, progress and only customer-facing actions.','/user/#owner',userReady);
 await add('Property Owner progress','Requested information, KYC and subscription milestones remain visible without internal findings.','/user/#owner-detail?id='+ids.propertyId,userReady);
 await add('Property review: full record','Administration can inspect the submitted property, Owner contact, KYC and property documents.','/admin/#request?kind=property&id='+ids.propertyId+'&tab=details',adminReady);
 await add('Property review: requests','Employee review selects missing FRD fields and documents, with response history and status controls.','/admin/#request?kind=property&id='+ids.propertyId+'&tab=actions',adminReady);
 await add('Multiple legal reviewers','One property can have two Lawyers with independent scoped assignments and reports.','/admin/#request?kind=property&id='+ids.propertyId+'&tab=professionals',adminReady,'.professional-assignment-form[data-role="lawyer"]');
 await add('Report-section sharing','The team chooses individual report findings, team notes and an optional attachment for each recipient.','/admin/#request?kind=property&id='+ids.propertyId+'&tab=professionals',adminReady,'.professional-assignment-form[data-role="ca"] .report-share-option');
 await asCustomer('9000000191');await add('Lawyer dashboard: two rounds','The same Lawyer receives a new round after submitting the first report; the earlier round stays read-only.','/user/#lawyer',userReady);
 await add('Lawyer follow-up review','Round 2 shows new selected information and only the Broker report content explicitly shared.','/user/#professional-case?role=lawyer&id='+ids.propertyId+'&assignment='+ids.secondRound,userReady);
 await add('Lawyer previous-round history','Earlier assignment details and the original submitted report remain available for context.','/user/#professional-case?role=lawyer&id='+ids.propertyId+'&assignment='+ids.secondRound,userReady,'.shared-report');
 await asCustomer('9000000304');await add('Independent second Lawyer','Another Lawyer can review the same property without receiving the first Lawyer’s private assignment.','/user/#professional-case?role=lawyer&id='+ids.propertyId,userReady);
 await asCustomer('9000000192');await add('CA: selected findings only','The CA sees selected Lawyer and Partner report sections, with only the attachment explicitly allowed.','/user/#professional-case?role=ca&id='+ids.propertyId,userReady);
 await asCustomer('9000000193');await add('Broker property support','The Broker sees only selected property details and submits market or site observations.','/user/#professional-case?role=broker&id='+ids.propertyId,userReady);
 await asCustomer('9000000303');await add('NV Channel Partner support','The admin-activated Partner sees assigned work and submits controlled transaction input.','/user/#professional-case?role=partner&id='+ids.propertyId,userReady);
 await asCustomer('9000000194');await add('Arbitrator matter','The Arbitrator reviews permitted dispute details and submits observations or an order.','/user/#professional-case?role=arbitrator&id='+ids.propertyId,userReady);
 await asCustomer('9000000195');await add('Builder / Developer response','The Builder responds only on a related project or property assignment.','/user/#professional-case?role=builder&id='+ids.propertyId,userReady);
 await add('Property activity trail','Every assignment, report, information request, document and status change remains in Administration history.','/admin/#request?kind=property&id='+ids.propertyId+'&tab=activity',adminReady);
 await asCustomer('9000000302');await add('Buyer / Investor opportunities','Buyers see approved, anonymised property summaries and submit interest through Nirvivad.','/user/#browse',userReady);
 await add('Buyer enquiry status','The Buyer sees their own enquiry and approved updates, without Owner or professional records.','/user/#buyer-detail?id='+ids.enquiryId,userReady);
 await add('Admin buyer enquiry','The team assigns, reviews and responds to Buyer interest in a separate enquiry workspace.','/admin/#request?kind=enquiry&id='+ids.enquiryId+'&tab=details',adminReady);
 await add('Market support on an enquiry','Broker and NV Partner assignments share only selected enquiry fields; contacts remain hidden.','/admin/#request?kind=enquiry&id='+ids.enquiryId+'&tab=market',adminReady);
 await asCustomer('9000000193');await add('Broker enquiry: follow-up round','A new Broker assignment after a submitted update creates Round 2, preserving the earlier response.','/user/#market-enquiry?role=broker&id='+ids.enquiryId+'&assignment='+ids.secondMarket,userReady);
 await add('Enquiry activity trail','The Buyer and team actions, market assignments, updates and follow-up rounds are audited.','/admin/#request?kind=enquiry&id='+ids.enquiryId+'&tab=activity',adminReady);
 await evaluate(()=>{const enquiry=NirvivadContact.submit({name:'Demo Buyer Investor',mobile:'9000000302',topic:'General enquiry',message:'Please contact me about the next steps for this property.',consent:true});NirvivadContact.updateStatus(enquiry.id,'in_progress',{id:'user-1',role:'superadmin',active:true})});
 await asCustomer('9000000302');await add('Contact Us: linked to mobile','Contact Us requires mobile; the verified customer sees their message and team status. Administration manages the inbox.','/user/#contact-enquiries',userReady);
 fs.writeFileSync(path.join(tmp,'deck.json'),JSON.stringify(deck,null,2));
 const render=spawnSync('python3',[path.join(out,'render_2026_10_07.py'),path.join(tmp,'deck.json'),slidesDir,out],{encoding:'utf8'});if(render.status!==0)throw Error('Slide render failed: '+render.stderr+'\n'+render.stdout);console.log(render.stdout.trim());
 const slides=fs.readdirSync(slidesDir).filter(n=>/^slide-\d+\.png$/.test(n)).sort();
 async function record(kind,selected,durationMs){const result=await evaluate(async({kind,selected,durationMs})=>{const imgs=await Promise.all(selected.map(async name=>{const img=new Image();img.src='/Recordings/2026-10-07/video-frames/'+name;await img.decode();return img}));const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1000;const ctx=canvas.getContext('2d');const stream=canvas.captureStream(10);const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm';const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:10000000});const chunks=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};const done=new Promise(resolve=>recorder.onstop=resolve);recorder.start();for(const img of imgs){const started=performance.now();do{ctx.drawImage(img,0,0,1600,1000);const progress=Math.min(1,(performance.now()-started)/durationMs);ctx.fillStyle='#24a5a2';ctx.fillRect(0,993,1600*progress,7);await new Promise(r=>setTimeout(r,100))}while(performance.now()-started<durationMs)}recorder.stop();await done;stream.getTracks().forEach(track=>track.stop());const blob=new Blob(chunks,{type:'video/webm'});const response=await fetch('/walkthrough-upload/'+kind,{method:'POST',body:blob});if(!response.ok)throw Error('Upload failed '+response.status);return {bytes:blob.size,mime,slides:selected.length,width:canvas.width,height:canvas.height}}, {kind,selected,durationMs});console.log('VIDEO '+kind+' '+JSON.stringify(result))}
 await record('full',slides,6200);
 const quickIndexes=[0,1,2,4,6,7,9,12,18,20,22,23,25];await record('quick',quickIndexes.map(i=>slides[i]).filter(Boolean),4900);
 fs.rmSync(path.join(out,'video-frames'),{recursive:true,force:true});
 console.log('BUILD COMPLETE '+out);
})().catch(err=>{console.error(err);process.exitCode=1}).finally(()=>{if(ws)ws.close();if(chrome)chrome.kill();server.close();setTimeout(()=>process.exit(process.exitCode||0),500)});
