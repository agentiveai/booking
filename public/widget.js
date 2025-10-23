/**
 * Booking Platform - Embeddable Widget Script
 * Version: 1.0.0
 *
 * Usage:
 *
 * 1. Inline Embed:
 *    <div id="booking-widget" data-provider-id="USER_ID"></div>
 *    <script src="https://yourdomain.com/widget.js"></script>
 *
 * 2. Popup Button:
 *    <button data-booking-popup="USER_ID">Book Now</button>
 *    <script src="https://yourdomain.com/widget.js"></script>
 *
 * 3. Floating Button:
 *    <script src="https://yourdomain.com/widget.js" data-provider-id="USER_ID" data-float="true"></script>
 */

(function() {
  'use strict';

  // Configuration
  const WIDGET_BASE_URL = window.location.origin; // Will be your production domain
  const IFRAME_STYLES = {
    border: 'none',
    width: '100%',
    minHeight: '500px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  };

  // Utility: Apply styles to element
  function applyStyles(element, styles) {
    Object.keys(styles).forEach(key => {
      element.style[key] = styles[key];
    });
  }

  // Create iframe
  function createIframe(providerId) {
    const iframe = document.createElement('iframe');
    iframe.src = `${WIDGET_BASE_URL}/embed/${providerId}`;
    iframe.title = 'Booking Widget';
    iframe.setAttribute('loading', 'lazy');
    applyStyles(iframe, IFRAME_STYLES);

    // Auto-resize iframe based on content
    window.addEventListener('message', function(event) {
      if (event.data.type === 'BOOKING_WIDGET_RESIZE') {
        iframe.style.height = event.data.height + 'px';
      }

      // Handle navigation (open booking page)
      if (event.data.type === 'BOOKING_WIDGET_NAVIGATE') {
        window.open(event.data.url, '_blank');
      }
    });

    return iframe;
  }

  // 1. INLINE EMBED
  function initInlineEmbeds() {
    const containers = document.querySelectorAll('[id^="booking-widget"]');

    containers.forEach(container => {
      const providerId = container.getAttribute('data-provider-id');
      if (!providerId) {
        console.error('Booking Widget: data-provider-id is required');
        return;
      }

      const iframe = createIframe(providerId);
      container.appendChild(iframe);
    });
  }

  // 2. POPUP MODAL
  function initPopupButtons() {
    const buttons = document.querySelectorAll('[data-booking-popup]');

    buttons.forEach(button => {
      const providerId = button.getAttribute('data-booking-popup');
      if (!providerId) return;

      button.addEventListener('click', function(e) {
        e.preventDefault();
        openPopupModal(providerId);
      });

      // Style button if not already styled
      if (!button.style.cursor) {
        button.style.cursor = 'pointer';
      }
    });
  }

  function openPopupModal(providerId) {
    // Create modal overlay
    const overlay = document.createElement('div');
    applyStyles(overlay, {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      zIndex: '999999',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      animation: 'fadeIn 0.2s ease-out'
    });

    // Create modal content
    const modal = document.createElement('div');
    applyStyles(modal, {
      backgroundColor: 'white',
      borderRadius: '16px',
      maxWidth: '800px',
      width: '100%',
      maxHeight: '90vh',
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      animation: 'slideUp 0.3s ease-out'
    });

    // Close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Close');
    applyStyles(closeButton, {
      position: 'absolute',
      top: '12px',
      right: '12px',
      zIndex: '10',
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      border: 'none',
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      color: '#333',
      fontSize: '24px',
      lineHeight: '1',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    });

    closeButton.addEventListener('mouseenter', function() {
      this.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
    });

    closeButton.addEventListener('mouseleave', function() {
      this.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
    });

    closeButton.addEventListener('click', function() {
      document.body.removeChild(overlay);
      document.body.style.overflow = '';
    });

    // Create iframe
    const iframe = createIframe(providerId);
    iframe.style.borderRadius = '0';
    iframe.style.boxShadow = 'none';
    iframe.style.height = '80vh';

    // Assemble modal
    modal.appendChild(closeButton);
    modal.appendChild(iframe);
    overlay.appendChild(modal);

    // Close on overlay click
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        document.body.style.overflow = '';
      }
    });

    // Add to page
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
  }

  // 3. FLOATING BUTTON
  function initFloatingButton() {
    const script = document.currentScript || document.querySelector('script[src*="widget.js"]');
    if (!script) return;

    const providerId = script.getAttribute('data-provider-id');
    const isFloat = script.getAttribute('data-float') === 'true';
    const buttonText = script.getAttribute('data-button-text') || 'Book';
    const buttonColor = script.getAttribute('data-button-color') || '#0066FF';
    const position = script.getAttribute('data-position') || 'bottom-right';

    if (!isFloat || !providerId) return;

    // Create floating button
    const button = document.createElement('button');
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
      <span style="margin-left: 8px;">${buttonText}</span>
    `;

    const positions = {
      'bottom-right': { bottom: '24px', right: '24px' },
      'bottom-left': { bottom: '24px', left: '24px' },
      'top-right': { top: '24px', right: '24px' },
      'top-left': { top: '24px', left: '24px' }
    };

    applyStyles(button, {
      position: 'fixed',
      ...positions[position],
      zIndex: '999998',
      backgroundColor: buttonColor,
      color: 'white',
      border: 'none',
      borderRadius: '50px',
      padding: '14px 24px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      display: 'flex',
      alignItems: 'center',
      transition: 'all 0.3s ease',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    });

    button.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px) scale(1.05)';
      this.style.boxShadow = '0 15px 35px -5px rgba(0, 0, 0, 0.4)';
    });

    button.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
      this.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3)';
    });

    button.addEventListener('click', function() {
      openPopupModal(providerId);
    });

    document.body.appendChild(button);
  }

  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initInlineEmbeds();
      initPopupButtons();
      initFloatingButton();
    });
  } else {
    initInlineEmbeds();
    initPopupButtons();
    initFloatingButton();
  }

})();
