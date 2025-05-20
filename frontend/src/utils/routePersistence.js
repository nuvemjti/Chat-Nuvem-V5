/**
 * Utilitário para lidar com persistência de rotas durante navegação e recargas
 */

// Salva a rota atual no sessionStorage
export const saveCurrentRoute = () => {
  const currentPath = window.location.pathname;
  // Não salvar rotas de login ou raiz
  if (currentPath !== '/' && currentPath !== '/login') {
    console.log('[routePersistence] Salvando rota atual:', currentPath);
    sessionStorage.setItem('lastRoute', currentPath);
    // Salvar também com timestamp para debug
    sessionStorage.setItem('lastRouteSaved', `${currentPath} @ ${new Date().toISOString()}`);
  }
};

// Recupera a última rota salva
export const getLastRoute = () => {
  return sessionStorage.getItem('lastRoute');
};

// Marca que o usuário acabou de fazer login
export const setFromLogin = () => {
  sessionStorage.setItem('fromLogin', 'true');
};

// Remove a flag de login
export const clearFromLogin = () => {
  sessionStorage.removeItem('fromLogin');
};

// Navega para a última rota salva
export const navigateToLastRoute = () => {
  const lastRoute = getLastRoute();
  if (lastRoute && window.location.pathname === '/') {
    console.log('[routePersistence] Redirecionando para última rota:', lastRoute);
    
    // Usar timeout para garantir que o React Router esteja pronto
    setTimeout(() => {
      try {
        window.history.pushState({}, '', lastRoute);
        const navEvent = new PopStateEvent('popstate');
        window.dispatchEvent(navEvent);
        console.log('[routePersistence] Navegação aplicada com sucesso');
      } catch (error) {
        console.error('[routePersistence] Erro ao navegar:', error);
      }
    }, 500);
    
    return true;
  }
  return false;
};

// Inicializa os listeners para salvar rotas automaticamente
export const initRouteTracking = () => {
  // Salva a rota antes de recarregar/fechar
  const handleBeforeUnload = () => {
    saveCurrentRoute();
  };

  // Adiciona evento para salvar rota quando a URL muda
  const handleRouteChange = () => {
    saveCurrentRoute();
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('popstate', handleRouteChange);
  
  // Salva a rota inicial
  saveCurrentRoute();
  
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('popstate', handleRouteChange);
  };
};

export default {
  saveCurrentRoute,
  getLastRoute,
  setFromLogin,
  clearFromLogin,
  navigateToLastRoute,
  initRouteTracking
}; 