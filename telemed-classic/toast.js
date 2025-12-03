/**
 * Sistema de Toast Notifications - Vanilla JavaScript
 * Uso: toast.success("Título", "Descrição opcional")
 */

(function() {
  'use strict';

  const TOAST_ICONS = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  let toastCounter = 0;
  let container = null;

  function getOrCreateContainer() {
    if (!container) {
      container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'false');
        document.body.appendChild(container);
      }
    }
    return container;
  }

  function createToastElement(type, title, description) {
    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;
    toast.setAttribute('role', 'alert');
    
    const icon = document.createElement('div');
    icon.className = 'toast-icon';
    icon.textContent = TOAST_ICONS[type];
    
    const content = document.createElement('div');
    content.className = 'toast-content';
    
    const titleEl = document.createElement('div');
    titleEl.className = 'toast-title';
    titleEl.textContent = title;
    content.appendChild(titleEl);
    
    if (description) {
      const descEl = document.createElement('div');
      descEl.className = 'toast-description';
      descEl.textContent = description;
      content.appendChild(descEl);
    }
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.textContent = '✕';
    closeBtn.setAttribute('aria-label', 'Fechar notificação');
    
    toast.appendChild(icon);
    toast.appendChild(content);
    toast.appendChild(closeBtn);
    
    return { toast, closeBtn };
  }

  function showToast(type, title, description, duration = 5000) {
    const id = `toast-${++toastCounter}`;
    const container = getOrCreateContainer();
    const { toast, closeBtn } = createToastElement(type, title, description);
    
    toast.id = id;
    
    function removeToast() {
      toast.classList.add('removing');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }
    
    closeBtn.addEventListener('click', removeToast);
    
    container.appendChild(toast);
    
    if (duration > 0) {
      setTimeout(removeToast, duration);
    }
    
    console.log(`🔔 Toast ${type}: ${title}`, description || '');
    
    return id;
  }

  // API pública
  window.toast = {
    success: (title, description, duration) => 
      showToast('success', title, description, duration),
    
    error: (title, description, duration) => 
      showToast('error', title, description, duration),
    
    warning: (title, description, duration) => 
      showToast('warning', title, description, duration),
    
    info: (title, description, duration) => 
      showToast('info', title, description, duration),
  };

  console.log('🔔 Sistema de Toast carregado! Use: toast.success("Título", "Descrição")');
})();
