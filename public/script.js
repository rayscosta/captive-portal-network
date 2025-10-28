// Captive Portal - Client-side interactions

// Adiciona feedback visual nos botões de login
document.querySelectorAll('.login-btn').forEach(btn => {
  btn.addEventListener('click', function(e) {
    // Adiciona classe de loading
    this.style.pointerEvents = 'none';
    
    // Remove após 3 segundos como fallback
    setTimeout(() => {
      this.style.pointerEvents = 'auto';
    }, 3000);
  });
});

// Detecta se é mobile para otimizar a experiência
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
  document.body.style.padding = '10px';
}
