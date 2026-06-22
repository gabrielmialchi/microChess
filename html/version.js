// Versão do jogo — fonte única de verdade.
// Alterar APENAS esta constante; todas as ocorrências na UI são atualizadas
// automaticamente via os <span class="js-app-version"></span> no index.html.
const GAME_VERSION = '1.2.0';

(function applyVersion() {
  function render() {
    document.querySelectorAll('.js-app-version').forEach(function (el) {
      el.textContent = 'v' + GAME_VERSION;
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
