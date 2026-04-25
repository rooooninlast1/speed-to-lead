/**
 * Speed to Lead - Embeddable Form Widget
 * Add this script to any landing page to capture leads instantly
 *
 * Usage:
 * <script src="https://your-app.com/widget/speed-to-lead-widget.js"
 *         data-form-endpoint="your-form-endpoint"
 *         data-button-text="Get Started">
 * </script>
 */

(function() {
  'use strict';

  const script = document.currentScript;
  const FORM_ENDPOINT = script.getAttribute('data-form-endpoint');
  const BUTTON_TEXT = script.getAttribute('data-button-text') || 'Get Started';
  const THEME_COLOR = script.getAttribute('data-theme-color') || '#4F46E5';
  const SUCCESS_REDIRECT = script.getAttribute('data-redirect-url');

  // Infer API base from script src, fallback to current origin
  let API_BASE = '';
  if (script.src) {
    const u = new URL(script.src);
    API_BASE = u.origin;
  }
  if (!API_BASE) API_BASE = window.location.origin;
  const API_URL = API_BASE + '/api/webhooks/submit';

  // Parse UTM parameters
  function getUTMParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
    };
  }

  // Create widget styles
  const styles = `
    .stl-widget-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 999999;
      justify-content: center;
      align-items: center;
    }
    .stl-widget-overlay.active {
      display: flex;
    }
    .stl-widget {
      background: white;
      border-radius: 12px;
      padding: 32px;
      max-width: 440px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      position: relative;
    }
    .stl-widget h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      color: #1F2937;
    }
    .stl-widget p {
      margin: 0 0 24px 0;
      color: #6B7280;
      font-size: 14px;
    }
    .stl-widget input {
      width: 100%;
      padding: 12px 16px;
      margin-bottom: 12px;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      font-size: 16px;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }
    .stl-widget input:focus {
      outline: none;
      border-color: ${THEME_COLOR};
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }
    .stl-widget .stl-submit {
      width: 100%;
      padding: 14px;
      background: ${THEME_COLOR};
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
    }
    .stl-widget .stl-submit:hover {
      opacity: 0.9;
    }
    .stl-widget .stl-submit:active {
      transform: scale(0.98);
    }
    .stl-widget .stl-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .stl-widget .stl-close {
      position: absolute;
      top: 16px;
      right: 16px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #6B7280;
    }
    .stl-widget .stl-success {
      display: none;
      text-align: center;
      padding: 20px 0;
    }
    .stl-widget .stl-success.show {
      display: block;
    }
    .stl-widget .stl-form.hide {
      display: none;
    }
    .stl-widget .stl-success-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .stl-trigger-button {
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 16px 24px;
      background: ${THEME_COLOR};
      color: white;
      border: none;
      border-radius: 50px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      transition: transform 0.2s, box-shadow 0.2s;
      z-index: 999998;
    }
    .stl-trigger-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.3);
    }
    .stl-error {
      color: #EF4444;
      font-size: 14px;
      margin-bottom: 12px;
      display: none;
    }
    .stl-error.show {
      display: block;
    }
    .stl-loading-spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: stl-spin 0.6s linear infinite;
      margin-right: 8px;
      vertical-align: middle;
    }
    @keyframes stl-spin {
      to { transform: rotate(360deg); }
    }
  `;

  // Inject styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // Create widget HTML
  const widgetHTML = `
    <div class="stl-trigger-button" id="stl-trigger">
      💬 ${BUTTON_TEXT}
    </div>
    <div class="stl-widget-overlay" id="stl-overlay">
      <div class="stl-widget">
        <button class="stl-close" id="stl-close">&times;</button>
        <div class="stl-form" id="stl-form">
          <h2>Get in Touch</h2>
          <p>Fill out the form and we'll get back to you in seconds.</p>
          <div class="stl-error" id="stl-error"></div>
          <input type="text" placeholder="First Name *" id="stl-firstName" required>
          <input type="text" placeholder="Last Name" id="stl-lastName">
          <input type="email" placeholder="Email *" id="stl-email" required>
          <input type="tel" placeholder="Phone" id="stl-phone">
          <input type="text" placeholder="Company" id="stl-company">
          <button class="stl-submit" id="stl-submit">
            Submit
          </button>
        </div>
        <div class="stl-success" id="stl-success">
          <div class="stl-success-icon">✅</div>
          <h2>Thanks!</h2>
          <p id="stl-success-message">We'll be in touch shortly.</p>
        </div>
      </div>
    </div>
  `;

  // Inject widget
  const widgetContainer = document.createElement('div');
  widgetContainer.innerHTML = widgetHTML;
  document.body.appendChild(widgetContainer);

  // Widget logic
  const trigger = document.getElementById('stl-trigger');
  const overlay = document.getElementById('stl-overlay');
  const form = document.getElementById('stl-form');
  const success = document.getElementById('stl-success');
  const errorEl = document.getElementById('stl-error');
  const submitBtn = document.getElementById('stl-submit');
  const closeBtn = document.getElementById('stl-close');
  const successMsg = document.getElementById('stl-success-message');

  trigger.addEventListener('click', () => {
    overlay.classList.add('active');
  });

  closeBtn.addEventListener('click', () => {
    overlay.classList.remove('active');
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
    }
  });

  document.getElementById('stl-submit').addEventListener('click', async () => {
    const firstName = document.getElementById('stl-firstName').value.trim();
    const email = document.getElementById('stl-email').value.trim();

    if (!firstName || !email) {
      errorEl.textContent = 'First name and email are required.';
      errorEl.classList.add('show');
      return;
    }

    errorEl.classList.remove('show');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="stl-loading-spinner"></span> Submitting...';

    const leadData = {
      email,
      firstName,
      lastName: document.getElementById('stl-lastName').value.trim(),
      phone: document.getElementById('stl-phone').value.trim(),
      company: document.getElementById('stl-company').value.trim(),
      ...getUTMParams(),
    };

    try {
      const response = await fetch(`${API_URL}/${FORM_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Page-URL': window.location.href,
        },
        body: JSON.stringify(leadData),
      });

      const result = await response.json();

      if (result.success) {
        form.classList.add('hide');
        success.classList.add('show');
        successMsg.textContent = result.message;

        if (SUCCESS_REDIRECT || result.redirectUrl) {
          setTimeout(() => {
            window.location.href = SUCCESS_REDIRECT || result.redirectUrl;
          }, 1500);
        }
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (error) {
      errorEl.textContent = 'Something went wrong. Please try again.';
      errorEl.classList.add('show');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Submit';
    }
  });
})();
