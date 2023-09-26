import { promisify } from 'util';
import { configure, BFSRequire } from 'browserfs';

self.addEventListener('install', event => {
  self.skipWaiting();
});

console.log('hi from service worker')
const systemReady = prepareSystem()

// event listener must be setup synchronously
const pathPrefix = '/fs/';
self.addEventListener('fetch', event => {
  console.log('sw saw fetch', event.request.url)
  const url = new URL(event.request.url)
  if (url.pathname.startsWith(pathPrefix)) {
    // respond with the matching file in fs
    let relativeUrl = url.pathname.substring(pathPrefix.length);
    console.log('reading from fs', relativeUrl)
    event.respondWith((async function () {
      const { fs } = await systemReady
      try {
        const fileContent = await fs.promises.readFile(relativeUrl)
        return new Response(fileContent)
      } catch (err) {
        return new Response('Not Found', { status: 404, statusText: 'Not Found' })
      }
    })())
  } else {
    console.log('fallback to network')
    // For other requests, try to fetch from the network
    event.respondWith(fetch(event.request));
  }
});

async function prepareSystem () {
  // you can also add a callback as the last parameter instead of using promises
  await new Promise((resolve, reject) => configure({
    fs: 'MountableFileSystem',
    options: {
      '/tmp': { fs: 'InMemory' },
      '/data': { fs: 'IndexedDB', options: {} },
    }
  }, (err) => { if (err) reject(err); else resolve(); }));
  const fs = BFSRequire('fs');
  fs.promises = {
    readFile: promisify(fs.readFile),
    writeFile: promisify(fs.writeFile),
  }

  // Now, you can write code like this:

  await fs.promises.writeFile('/test.txt', 'Cool, I can do this in the root!')
  await fs.promises.readFile('/test.txt')
  
  await fs.promises.writeFile('/data/test.txt', 'Cool, I can do this in indexeddb!')
  await fs.promises.readFile('/data/test.txt')
  
  console.log('fixtures ready')

  return { fs }
}
