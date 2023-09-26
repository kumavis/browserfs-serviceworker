const serviceWorkerReadyP = navigator.serviceWorker.register('/sw-bundle.js')
  .then(reg => {
    console.log('Service Worker registered:', reg);
  }).catch(error => {
    console.log('Registration failed:', error);
  });


main();


async function main() {
  await serviceWorkerReadyP;
  const childPage = document.createElement('iframe')
  childPage.src = '//xyz.localhost:9966/'
  document.body.appendChild(childPage);
}