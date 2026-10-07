'use strict';
/* Shared browser-local inbox for the public website and Administration prototype. */
(() => {
  const key='nirvivad-contact-enquiries-v1';
  const topics=['List a property','Explore a property','Membership plans','Join as a professional','General enquiry'];
  const statuses=['new','in_progress','closed'];
  const clone=value=>JSON.parse(JSON.stringify(value));
  const clean=(value,max)=>String(value??'').trim().slice(0,max);
  const mobileKey=value=>{const digits=String(value??'').replace(/\D/g,'');return digits.length===12&&digits.startsWith('91')?digits.slice(2):digits};
  function read(){
    const raw=localStorage.getItem(key);
    if(!raw)return {version:1,records:[]};
    let data;try{data=JSON.parse(raw)}catch{throw Error('Contact inbox data could not be read. No changes were made.')}
    if(data?.version!==1||!Array.isArray(data.records))throw Error('Contact inbox data uses an unsupported format. No changes were made.');
    return data;
  }
  function write(data){try{localStorage.setItem(key,JSON.stringify(data))}catch{throw Error('Your browser could not save the enquiry. Please try again after checking available storage.')}}
  function submit(input){
    const name=clean(input.name,100),email=clean(input.email,160).toLowerCase(),mobile=mobileKey(input.mobile||input.phone),topic=clean(input.topic,80),message=clean(input.message,3000);
    if(name.length<2)throw Error('Enter your full name.');
    if(!/^\d{10,15}$/.test(mobile))throw Error('Enter a valid 10–15 digit mobile number.');
    if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Enter a valid email address or leave it blank.');
    if(!topics.includes(topic))throw Error('Choose what you need help with.');
    if(message.length<10)throw Error('Enter a message of at least 10 characters.');
    if(input.consent!==true)throw Error('Please confirm the privacy information before submitting.');
    const data=read();const submittedAt=new Date().toISOString();
    const id='CONTACT-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,7).toUpperCase();
    const record={id,name,email,mobile,topic,message,status:'new',submittedAt,updatedAt:submittedAt,history:[{at:submittedAt,type:'submitted',status:'new'}]};
    data.records.unshift(record);write(data);return clone(record);
  }
  function list(){return clone(read().records).sort((a,b)=>b.submittedAt.localeCompare(a.submittedAt))}
  function mine(account){if(!account?.id||!account.mobile)throw Error('Verify your mobile number to view contact enquiries.');const key=mobileKey(account.mobile);return list().filter(item=>key&&mobileKey(item.mobile||item.phone)===key)}
  function get(id){const record=read().records.find(item=>item.id===id);return record?clone(record):null}
  function updateStatus(id,status,actor){
    if(!statuses.includes(status))throw Error('Choose a valid contact enquiry status.');
    if(!actor||!['superadmin','subadmin','employee'].includes(actor.role)||actor.active!==true)throw Error('Staff access required.');
    const data=read(),record=data.records.find(item=>item.id===id);if(!record)throw Error('Contact enquiry not found.');
    if(record.status!==status){const at=new Date().toISOString();record.status=status;record.updatedAt=at;record.history.push({at,type:'status_changed',status,actorId:actor.id,actorRole:actor.role});write(data)}
    return clone(record);
  }
  window.NirvivadContact={storageKey:key,topics,statuses,submit,list,mine,get,updateStatus};
})();
