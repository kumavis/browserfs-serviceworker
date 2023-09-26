const serviceWorkerReadyP = navigator.serviceWorker.register('./sw-bundle.js')
  .then(reg => {
    console.log('Service Worker registered:', reg);
  }).catch(error => {
    console.log('Registration failed:', error);
  });


main();


async function main() {
  await serviceWorkerReadyP;
  // add iframe to subdomain
  const childPage = document.createElement('iframe')
  const url = new URL(window.location.href)
  url.hostname = `xyz.${url.hostname}`
  url.pathname = ``
  childPage.src = url.href
  document.body.appendChild(childPage);
}