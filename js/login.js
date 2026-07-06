// Standalone login/register/OTP handler for login.html
(function () {
  const $ = sel => document.querySelector(sel);

  const socialGoogle = $('#social-google');
  const otpPhone = $('#otp-phone');
  const sendOtpBtn = $('#send-otp-btn');
  const otpStep = $('#otp-step');
  const otpCode = $('#otp-code');
  const verifyOtpBtn = $('#verify-otp-btn');

  // lightweight toast for non-blocking feedback
  function showToast(msg) {
    try {
      let container = document.getElementById('login-toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'login-toast-container';
        container.style.position = 'fixed';
        container.style.right = '20px';
        container.style.bottom = '20px';
        container.style.zIndex = 9999;
        document.body.appendChild(container);
      }
      const t = document.createElement('div');
      t.textContent = msg;
      t.style.cssText = 'background:#222;color:#fff;padding:10px 14px;border-radius:10px;margin-top:8px;box-shadow:0 8px 24px rgba(0,0,0,0.2);font-weight:600;';
      container.appendChild(t);
      setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 300ms'; setTimeout(() => t.remove(), 350); }, 2200);
    } catch (e) { console.log('toast', msg); }
  }

  function setAuthToken(token) {
    if (token) localStorage.setItem('nova_token', token);
    else localStorage.removeItem('nova_token');
  }
  function setAuthUser(user) {
    if (user) localStorage.setItem('nova_user', JSON.stringify(user));
    else localStorage.removeItem('nova_user');
  }


  if (socialGoogle) socialGoogle.addEventListener('click', (e) => {
    e.preventDefault();
    const googleUrl = 'https://accounts.google.com/signin/v2/identifier?service=mail';
    window.open(googleUrl, '_blank', 'noopener');
    showToast('Opening Google sign-in');
  });


  let pendingPhone = null;
  if (sendOtpBtn) sendOtpBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const phone = otpPhone.value && otpPhone.value.trim(); if (!phone) { showToast('Enter phone'); return; }
    try {
      const res = await fetch('/api/auth/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Could not send OTP');
      pendingPhone = phone;
      if (otpStep) otpStep.classList.add('show');
      showToast('OTP sent (test-mode). Check console for code.');
      console.log('OTP', data.code);
      // focus code input if available
      const codeInput = document.querySelector('#otp-code'); if (codeInput) codeInput.focus();
    } catch (err) { console.error(err); showToast(err.message || 'Send OTP failed'); }
  });

  if (verifyOtpBtn) verifyOtpBtn.addEventListener('click', async (e) => {
    e.preventDefault(); const code = otpCode.value && otpCode.value.trim(); if (!pendingPhone || !code) { showToast('Enter code'); return; }
    try {
      const res = await fetch('/api/auth/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: pendingPhone, code }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Invalid code');
      setAuthToken(data.token); setAuthUser(data.user); showToast('Signed in'); location.href = '/';
    } catch (err) { console.error(err); showToast(err.message || 'Verify OTP failed'); }
  });
})();
