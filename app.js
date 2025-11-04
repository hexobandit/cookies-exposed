/**
 * Cookies Exposed - Shared JavaScript Functionality
 * Security awareness website for educating users about browser cookies
 */

'use strict';

// ================================
// Theme Management
// ================================

class ThemeManager {
  constructor() {
    this.storageKey = 'cookies-exposed-theme';
    this.themes = ['light', 'dark'];
    this.init();
  }

  init() {
    // Get saved theme or default to system preference
    const savedTheme = localStorage.getItem(this.storageKey);
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme = savedTheme || systemTheme;
    
    this.setTheme(theme);
    this.bindEvents();
  }

  setTheme(theme) {
    if (!this.themes.includes(theme)) {
      theme = 'light';
    }
    
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.storageKey, theme);
    
    // Update theme toggle button icon
    this.updateThemeToggleIcon(theme);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  updateThemeToggleIcon(theme) {
    const toggleButton = document.querySelector('.theme-toggle');
    if (toggleButton) {
      toggleButton.innerHTML = theme === 'dark' ? '☀️' : '🌙';
      toggleButton.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    }
  }

  bindEvents() {
    // Theme toggle button
    document.addEventListener('click', (e) => {
      if (e.target.closest('.theme-toggle')) {
        e.preventDefault();
        this.toggleTheme();
      }
    });

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(this.storageKey)) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}

// ================================
// Utility Functions
// ================================

const Utils = {
  /**
   * Sanitize text to prevent XSS
   */
  sanitizeText(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Format date for display
   */
  formatDate(date) {
    if (!date || date === 'Session') return 'Session';
    if (typeof date === 'string' && !isNaN(Date.parse(date))) {
      date = new Date(date);
    }
    if (date instanceof Date && !isNaN(date)) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return 'Invalid Date';
  },

  /**
   * Redact sensitive cookie values for display
   */
  redactCookieValue(value, showLength = 4) {
    if (!value || value.length <= showLength) {
      return value;
    }
    return value.substring(0, showLength) + '****';
  },

  /**
   * Get cookie security risk level
   */
  getCookieRiskLevel(cookie) {
    let risk = 0;
    
    // High risk factors
    if (!cookie.secure && window.location.protocol === 'https:') risk += 3;
    if (!cookie.httpOnly) risk += 2;
    if (cookie.sameSite === 'None' || !cookie.sameSite) risk += 2;
    if (cookie.domain && cookie.domain.startsWith('.')) risk += 1; // Third-party
    
    // Medium risk factors
    if (cookie.name.toLowerCase().includes('session')) risk += 1;
    if (cookie.name.toLowerCase().includes('auth')) risk += 1;
    if (cookie.name.toLowerCase().includes('token')) risk += 1;
    
    if (risk >= 6) return 'critical';
    if (risk >= 4) return 'high';
    if (risk >= 2) return 'medium';
    return 'low';
  },

  /**
   * Generate risk assessment explanation
   */
  getRiskExplanation(cookie) {
    const explanations = [];
    
    if (!cookie.secure && window.location.protocol === 'https:') {
      explanations.push('Cookie transmitted over unencrypted connections');
    }
    
    if (!cookie.httpOnly) {
      explanations.push('Accessible via JavaScript (XSS vulnerability)');
    }
    
    if (cookie.sameSite === 'None' || !cookie.sameSite) {
      explanations.push('Can be sent with cross-site requests (CSRF risk)');
    }
    
    if (cookie.domain && cookie.domain.startsWith('.')) {
      explanations.push('Third-party cookie (tracking concerns)');
    }
    
    if (cookie.name.toLowerCase().includes('session') || 
        cookie.name.toLowerCase().includes('auth') || 
        cookie.name.toLowerCase().includes('token')) {
      explanations.push('Contains authentication/session data');
    }
    
    return explanations.length > 0 ? explanations : ['Standard cookie with basic security'];
  },

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('Copied to clipboard!', 'success');
      return true;
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        this.showToast('Copied to clipboard!', 'success');
        return true;
      } catch (fallbackErr) {
        this.showToast('Failed to copy to clipboard', 'danger');
        return false;
      } finally {
        document.body.removeChild(textArea);
      }
    }
  },

  /**
   * Show toast notification
   */
  showToast(message, type = 'info', duration = 3000) {
    // Remove existing toasts
    const existing = document.querySelectorAll('.toast');
    existing.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = `toast alert alert-${type}`;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      min-width: 250px;
      max-width: 400px;
      padding: 1rem;
      border-radius: 0.5rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      transform: translateX(100%);
      transition: transform 0.3s ease-in-out;
      backdrop-filter: blur(10px);
    `;
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
    });
    
    // Auto-remove
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, duration);
  },

  /**
   * Download data as JSON file
   */
  downloadJSON(data, filename = 'cookies-analysis.json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Generate PDF report (simplified - would need a PDF library for full implementation)
   */
  generatePDFReport(data) {
    // For now, we'll create a formatted text report
    // In a real implementation, you'd use a library like jsPDF
    let report = 'COOKIE SECURITY ANALYSIS REPORT\n';
    report += '================================\n\n';
    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += `Domain: ${window.location.hostname}\n`;
    report += `Total Cookies: ${data.length}\n\n`;
    
    data.forEach((cookie, index) => {
      report += `${index + 1}. ${cookie.name}\n`;
      report += `   Value: ${this.redactCookieValue(cookie.value, 8)}\n`;
      report += `   Domain: ${cookie.domain || 'Current domain'}\n`;
      report += `   Path: ${cookie.path || '/'}\n`;
      report += `   Expires: ${this.formatDate(cookie.expires)}\n`;
      report += `   Secure: ${cookie.secure ? 'Yes' : 'No'}\n`;
      report += `   HttpOnly: ${cookie.httpOnly ? 'Yes' : 'No'}\n`;
      report += `   SameSite: ${cookie.sameSite || 'Not set'}\n`;
      report += `   Risk Level: ${this.getCookieRiskLevel(cookie).toUpperCase()}\n`;
      report += `   Security Issues:\n`;
      
      const risks = this.getRiskExplanation(cookie);
      risks.forEach(risk => {
        report += `     - ${risk}\n`;
      });
      report += '\n';
    });
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cookie-security-report.txt';
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Debounce function to limit function calls
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Smooth scroll to element
   */
  scrollToElement(elementId, offset = 0) {
    const element = document.getElementById(elementId);
    if (element) {
      const top = element.offsetTop - offset;
      window.scrollTo({
        top: top,
        behavior: 'smooth'
      });
    }
  }
};

// ================================
// Animation and Interaction Helpers
// ================================

const Animations = {
  /**
   * Fade in elements when they come into view
   */
  observeElements() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    // Observe all cards and sections
    document.querySelectorAll('.card, .section').forEach(el => {
      observer.observe(el);
    });
  },

  /**
   * Add ripple effect to buttons
   */
  addRippleEffect() {
    document.addEventListener('click', function(e) {
      const button = e.target.closest('.btn');
      if (!button) return;

      const ripple = document.createElement('span');
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
      `;

      // Add ripple keyframes if not already added
      if (!document.querySelector('#ripple-styles')) {
        const style = document.createElement('style');
        style.id = 'ripple-styles';
        style.textContent = `
          @keyframes ripple {
            to {
              transform: scale(2);
              opacity: 0;
            }
          }
        `;
        document.head.appendChild(style);
      }

      button.style.position = 'relative';
      button.style.overflow = 'hidden';
      button.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  }
};

// ================================
// Cookie Management Utilities
// ================================

const CookieManager = {
  /**
   * Parse document.cookie into structured data
   */
  parseCookies() {
    const cookies = [];
    const cookieString = document.cookie;
    
    if (!cookieString) return cookies;
    
    const pairs = cookieString.split(';');
    
    pairs.forEach(pair => {
      const [name, ...valueParts] = pair.trim().split('=');
      const value = valueParts.join('='); // Handle values that contain '='
      
      if (name) {
        const cookie = {
          name: name.trim(),
          value: value || '',
          domain: this.getCookieDomain(name.trim()),
          path: this.getCookiePath(name.trim()),
          expires: this.getCookieExpiration(name.trim()),
          secure: this.isCookieSecure(name.trim()),
          httpOnly: this.isCookieHttpOnly(name.trim()),
          sameSite: this.getCookieSameSite(name.trim())
        };
        
        cookies.push(cookie);
      }
    });
    
    return cookies;
  },

  /**
   * Get cookie domain (approximation - actual domain info not available via JS)
   */
  getCookieDomain(name) {
    // We can't get the actual domain from document.cookie
    // This would need to be enhanced with server-side data or browser API
    return window.location.hostname;
  },

  /**
   * Get cookie path (approximation)
   */
  getCookiePath(name) {
    // Default path assumption
    return '/';
  },

  /**
   * Get cookie expiration (not available via document.cookie)
   */
  getCookieExpiration(name) {
    // Can't determine expiration from document.cookie alone
    return 'Session';
  },

  /**
   * Check if cookie is secure (approximation)
   */
  isCookieSecure(name) {
    // Can't determine from document.cookie - assume based on current protocol
    return window.location.protocol === 'https:';
  },

  /**
   * Check if cookie is HttpOnly (not accessible if HttpOnly is set)
   */
  isCookieHttpOnly(name) {
    // If we can see it in document.cookie, it's not HttpOnly
    return false;
  },

  /**
   * Get SameSite attribute (not available via document.cookie)
   */
  getCookieSameSite(name) {
    // Can't determine from document.cookie alone
    return 'Lax'; // Default assumption
  },

  /**
   * Get enhanced cookie information using browser APIs where possible
   */
  async getEnhancedCookieInfo() {
    const basicCookies = this.parseCookies();
    
    // Try to get more information using browser storage APIs
    try {
      // Check for storage information
      const storageEstimate = await navigator.storage?.estimate();
      const cookieInfo = {
        cookies: basicCookies,
        storageQuota: storageEstimate?.quota,
        storageUsage: storageEstimate?.usage,
        localStorageSize: this.getStorageSize(localStorage),
        sessionStorageSize: this.getStorageSize(sessionStorage),
        indexedDBSupport: 'indexedDB' in window,
        webSQLSupport: 'openDatabase' in window
      };
      
      return cookieInfo;
    } catch (error) {
      console.warn('Enhanced cookie info unavailable:', error);
      return { cookies: basicCookies };
    }
  },

  /**
   * Calculate storage size
   */
  getStorageSize(storage) {
    try {
      let total = 0;
      for (let key in storage) {
        if (storage.hasOwnProperty(key)) {
          total += storage[key].length + key.length;
        }
      }
      return total;
    } catch (error) {
      return 0;
    }
  }
};

// ================================
// Initialize Application
// ================================

class App {
  constructor() {
    this.themeManager = null;
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.initializeComponents();
      });
    } else {
      this.initializeComponents();
    }
  }

  initializeComponents() {
    // Initialize theme management
    this.themeManager = new ThemeManager();
    
    // Initialize animations
    Animations.observeElements();
    Animations.addRippleEffect();
    
    // Initialize navigation
    this.initializeNavigation();
    
    // Initialize smooth scrolling for anchor links
    this.initializeSmoothScrolling();
    
    // Initialize external link handling
    this.initializeExternalLinks();
    
    console.log('Cookies Exposed app initialized');
  }

  initializeNavigation() {
    // Add active class to current page navigation item
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    navLinks.forEach(link => {
      const linkPath = new URL(link.href).pathname;
      if (linkPath === currentPath) {
        link.classList.add('active');
      }
    });
  }

  initializeSmoothScrolling() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (link) {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        Utils.scrollToElement(targetId, 80); // Account for fixed header
      }
    });
  }

  initializeExternalLinks() {
    // Add external link indicators and security attributes
    const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="' + window.location.hostname + '"])');
    
    externalLinks.forEach(link => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      
      // Add visual indicator
      if (!link.querySelector('.external-indicator')) {
        const indicator = document.createElement('span');
        indicator.className = 'external-indicator';
        indicator.innerHTML = ' ↗';
        indicator.style.cssText = 'font-size: 0.8em; opacity: 0.7;';
        link.appendChild(indicator);
      }
    });
  }
}

// ================================
// Error Handling
// ================================

window.addEventListener('error', (e) => {
  console.error('JavaScript error:', e.error);
  // In production, you might want to send errors to a logging service
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  // In production, you might want to send errors to a logging service
});

// ================================
// Export for module usage (if needed)
// ================================

// Make utilities available globally for other scripts
window.CookiesExposed = {
  Utils,
  CookieManager,
  Animations,
  ThemeManager
};

// Initialize the application
const app = new App();