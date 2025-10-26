/* Sandbox footer module (self-contained)
   Usage: include <script src="footer.js"></script> in `client.html` and call AxiosFooter.init()
*/
(function (global) {
  // No language column in the new footer layout; sections replaced as requested

  function createStyles() {
    if (document.getElementById('axios-footer-styles')) return;
    const style = document.createElement('style');
    style.id = 'axios-footer-styles';
    style.textContent = `
.axios-footer {
  /* Make footer background stretch edge-to-edge regardless of container */
  width: 100vw;
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  color: #e0e0e0;
  padding: 80px 40px 30px;
  overflow: hidden;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}
.axios-footer::before {
  /* Top animated gradient removed per request (kept empty to preserve layout if referenced) */
  display: none;
}
.axios-footer::after {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  animation: pulse 8s ease-in-out infinite;
}
@keyframes gradientShift {
  0%, 100% { background-position: 0% 0%; }
  50% { background-position: 100% 0%; }
}
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.2); opacity: 0.5; }
}
.footer-content {
  /* Keep inner content centered while background is full-bleed */
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  position: relative;
  z-index: 1;
}
.footer-columns {
  display: grid;
  /* Four equal columns for PRODUCT / COMPANY / RESOURCES / LEGAL */
  grid-template-columns: repeat(4, 1fr);
  gap: 40px;
  margin-bottom: 40px;
}
.footer-column h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  position: relative;
  padding-bottom: 10px;
  text-align: center; /* center the section heading above its links */
}
.footer-column h3::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
}
.footer-column ul { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; justify-items: center; }
.footer-column.single-column ul { grid-template-columns: 1fr; }
.footer-column ul li a { color: #b8b8b8; text-decoration: none; transition: all 0.3s ease; display: flex; align-items: center; font-size: 14px; padding: 8px 0; position: relative; }
.footer-column ul li a:hover { color: #ffffff; padding-left: 8px; }
.footer-column ul li a:hover::before { opacity: 1; transform: translateX(0); }
.footer-bottom { padding-top: 40px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 25px; }
.footer-links { display: flex; gap: 30px; flex-wrap: wrap; align-items: center; }
.footer-links a { color: #999; text-decoration: none; font-size: 13px; transition: all 0.3s ease; padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); }
.footer-links a:hover { color: #667eea; border-color: #667eea; background: rgba(102,126,234,0.1); transform: translateY(-2px); }
@media (max-width:1024px) { .footer-columns { grid-template-columns: 1fr 1fr; gap: 40px; } .footer-column ul { grid-template-columns: 1fr; } }
@media (max-width:768px) { .axios-footer { padding: 50px 20px 20px; } .footer-columns { grid-template-columns: 1fr; gap: 35px; } .footer-bottom { flex-direction: column; text-align: center; gap: 20px; } .footer-links { flex-direction: column; gap: 15px; } }
`;
    document.head.appendChild(style);
  }

  function createFooterHTML() {
    return `
      <div class="footer-content">
        <div class="footer-columns">
          <div class="footer-column">
            <h3>PRODUCT</h3>
            <ul>
              <li><a href="#">Features</a></li>
              <li><a href="#">Pricing</a></li>
              <li><a href="#">Updates</a></li>
              <li><a href="#">Demo</a></li>
            </ul>
          </div>
          <div class="footer-column">
            <h3>COMPANY</h3>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press Kit</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
          <div class="footer-column">
            <h3>RESOURCES</h3>
            <ul>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Documentation</a></li>
              <li><a href="#">Support</a></li>
              <li><a href="#">Community</a></li>
            </ul>
          </div>
          <div class="footer-column">
            <h3>LEGAL</h3>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Security</a></li>
              <li><a href="#">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <div class="copyright">
            <p>This Website: Copyright © 2020–present John Jakob 'Jake' Sarjeant. Used by permission.</p>
            <p>The Axios Project: Copyright © 2014–present Matt Zabriskie and contributors</p>
          </div>
          <div class="footer-links">
            <a href="https://github.com/axios/axios-docs" target="_blank" rel="noopener">View this site on GitHub</a>
            <a href="https://github.com/axios/axios/blob/master/LICENSE" target="_blank" rel="noopener">Licensed under the MIT License</a>
          </div>
        </div>
      </div>
    `;
  }

  function handleLanguageChange(langCode) {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('lang', langCode);
    window.history.pushState({}, '', newUrl);
    document.dispatchEvent(new CustomEvent('languageChange', { detail: { language: langCode } }));
  }

  function trackExternalLink(url) {
    document.dispatchEvent(new CustomEvent('externalLinkClick', { detail: { url } }));
  }

  // populateLanguages removed — sections replaced by PRODUCT/COMPANY/RESOURCES/LEGAL

  function setupExternalLinks(container) {
    container.querySelectorAll('a[target="_blank"]').forEach(a => {
      a.addEventListener('click', () => trackExternalLink(a.href));
    });
  }

  return global.AxiosFooter = {
    init: function (target = document.body) {
      createStyles();
      const footer = document.createElement('footer');
      footer.className = 'axios-footer';
      footer.innerHTML = createFooterHTML();
      setupExternalLinks(footer);
      target.appendChild(footer);
      return { element: footer, setLanguage: handleLanguageChange, trackLink: trackExternalLink };
    }
  };
})(window);
