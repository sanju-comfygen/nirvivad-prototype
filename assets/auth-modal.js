/* Shared customer authentication for the website and console. */
(()=>{
'use strict';
const J=window.NirvivadJourney,escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let step='mobile',mobile='',destination='',previousFocus;
const dialog=document.createElement('dialog');dialog.className='customer-auth-modal';dialog.setAttribute('aria-labelledby','auth-title');document.body.append(dialog);
function render(){
 let content;
 if(step==='mobile')content=`<h2 id="auth-title">Continue with your mobile</h2><p>Enter your number to log in or join Nirvivad. We’ll send one verification code.</p><form id="mobile-form"><label>Mobile number<input name="mobile" type="tel" inputmode="numeric" autocomplete="tel" required minlength="10" maxlength="18" value="${escape(mobile)}"></label><button class="button" type="submit">Send verification code</button></form>`;
 else if(step==='otp')content=`<h2 id="auth-title">Verify your number</h2><p>Enter the six-digit code for ${escape(mobile)}.</p><form id="otp-form"><label>Verification code<input name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" required></label><button class="button" type="submit">Verify mobile</button></form><p class="auth-demo">Demo code: <strong>123456</strong>. No SMS is sent.</p><button type="button" data-auth-action="resend">Resend code</button><button type="button" data-auth-action="back">Change number</button>`;
 else content=`<h2 id="auth-title">Set up your profile</h2><p>Choose a role now or start as Buyer / Investor. Add other roles later.</p><form id="profile-form"><label>Full name<input name="name" autocomplete="name" minlength="2" maxlength="100" required></label><label>Email (optional)<input name="email" type="email" autocomplete="email" maxlength="160"></label><label>Starting role<select name="role"><option value="">Buyer / Investor (default)</option>${Object.entries(J.roleDefinitions).map(([key,r])=>`<option value="${key}">${escape(r.label)}</option>`).join('')}</select></label><button class="button" type="submit">Create account</button></form>`;
 dialog.innerHTML=`<button type="button" class="auth-close" data-auth-action="close" aria-label="Close authentication">×</button><a class="auth-brand" href="${location.pathname.includes('/user/')?'../index.html':'#home'}">Nirvivad</a>${content}<div id="auth-error" role="alert" hidden></div>`;
 if(dialog.open)dialog.querySelector('input')?.focus();
}
function open(options={}){previousFocus=document.activeElement;destination=options.destination||'';step=J.current()&&!J.current().name?'profile':'mobile';mobile='';render();if(!dialog.open)dialog.showModal();dialog.querySelector('input')?.focus()}
function finish(){dialog.close();window.dispatchEvent(new Event('nirvivad-auth-changed'));if(destination)location.href=destination}
dialog.addEventListener('close',()=>{previousFocus?.focus();window.dispatchEvent(new Event('nirvivad-auth-closed'))});
dialog.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;try{if(button.dataset.authAction==='close')dialog.close();if(button.dataset.authAction==='back'){step='mobile';render()}if(button.dataset.authAction==='resend'){J.startOtp(mobile);render()}}catch(error){showError(error)}});
function showError(error){const box=dialog.querySelector('#auth-error');box.textContent=error.message;box.hidden=false}
dialog.addEventListener('submit',event=>{event.preventDefault();event.stopPropagation();const form=event.target,data=Object.fromEntries(new FormData(form));try{if(form.id==='mobile-form'){mobile=J.startOtp(data.mobile).mobile;step='otp';render()}else if(form.id==='otp-form'){const user=J.verifyOtp(data.code);if(!user.name){step='profile';render()}else{if(!user.roles.length)J.addRole('buyer');finish()}}else if(form.id==='profile-form'){J.profile(data);J.addRole(data.role||'buyer');finish()}}catch(error){showError(error)}});
document.addEventListener('click',event=>{const link=event.target.closest('a[href]');if(!link)return;const url=new URL(link.href,location.href);if(url.origin!==location.origin||!url.pathname.includes('/user/')||J.current()?.name)return;event.preventDefault();open({destination:url.href})});
window.NirvivadAuth={open,close:()=>dialog.close()};
})();
