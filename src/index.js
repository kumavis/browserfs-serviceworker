if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
  .then(reg => {
      console.log('Service Worker registered:', reg);
  }).catch(error => {
      console.log('Registration failed:', error);
  });
}