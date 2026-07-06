(function () {
  const $ = (sel) => document.querySelector(sel);

  const form = $('#register-form');
  const nameInput = $('#name-input');
  const emailInput = $('#email-input');
  const passwordInput = $('#password-input');
  const confirmPasswordInput = $('#confirm-password-input');
  const registerBtn = $('#register-btn');
  const errorBox = $('#register-error');

  function setError(message) {
    if (errorBox) errorBox.textContent = message;
  }

  function clearError() {
    if (errorBox) errorBox.textContent = '';
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function handleRegister(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    clearError();

    const name = nameInput?.value?.trim() || '';
    const email = emailInput?.value?.trim() || '';
    const password = passwordInput?.value || '';
    const confirmPassword = confirmPasswordInput?.value || '';

    if (!name) {
      setError('Please enter your name.');
      return;
    }
    if (!email) {
      setError('Email is required.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (registerBtn) {
      registerBtn.disabled = true;
      registerBtn.textContent = 'Creating account...';
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      localStorage.setItem('nova_token', data.token || '');
      localStorage.setItem('nova_user', JSON.stringify(data.user || { name, email }));
      window.location.href = '/login.html';
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      if (registerBtn) {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Create account';
      }
    }
  }

  [nameInput, emailInput, passwordInput, confirmPasswordInput].forEach((input) => {
    if (input) input.addEventListener('input', clearError);
  });

  if (form) form.addEventListener('submit', handleRegister);
})();
