import { promisify } from 'util';
import { configure, BFSRequire } from 'browserfs';

self.addEventListener('install', event => {
  self.skipWaiting();
});
self.addEventListener('fetch', event => {
  event.respondWith(
    handleRequest(event)
  )
});

console.log('hi from service worker')
const systemReady = prepareSystem()

// event listener must be setup synchronously
const fsServer = makeFsServer('/fs/', systemReady)
const subdomainServer = makeSubdomainServer(systemReady)

async function handleRequest (event) {
  try {
    console.log('saw fetch', event.request.url)
    const url = new URL(event.request.url)
    // serve subdomain
    if (subdomainServer.test(url)) {
      console.log('serve subdomain', event.request.url)
      return subdomainServer.serve(url);
    }
    // serve file system
    if (fsServer.test(url)) {
      console.log('serve fs', event.request.url)
      return fsServer.serve(url);
    }
    // fallback to network
    console.log('fallback to network', event.request.url)
    return fetch(event.request);
  } catch (err) {
    console.error(err)
    return new Response('Internal Server Error', { status: 500, statusText: 'Internal Server Error' })
  }
}

function makeSubdomainServer (systemReady) {
  return {
    test: (url) => {
      const subdomains = url.hostname.split('.').slice(0, -1)
      return subdomains.length > 0
    },
    serve: async (url) => {
      try {
        const subdomains = url.hostname.split('.').slice(0, -1)
        if (subdomains.length > 1) {
          throw new Error('Unknown subdomain format')
        }
        const subdomain = subdomains[0]
        const { fs } = await systemReady
        const fileUrl = `/${subdomain}/index.html`
        return serveFile(fs, fileUrl)
      } catch (err) {
        return new Response('Not Found', { status: 404, statusText: 'Not Found' })
      }
    },
  }
}

function makeFsServer (pathPrefix, systemReady) {
  return {
    test: (url) => {
      return url.pathname.startsWith(pathPrefix)
    },
    serve: async (url) => {
      const { fs } = await systemReady
      const relativeUrl = url.pathname.substring(pathPrefix.length);
      return serveFile(fs, relativeUrl)
    },
  }
}

async function serveFile (fs, path) {
  try {
    console.log('serve file', path)
    const fileContent = await fs.promises.readFile(path)
    return new Response(fileContent)
  } catch (err) {
    return new Response('Not Found', { status: 404, statusText: 'Not Found' })
  }
}

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
    mkdir: promisify(fs.mkdir),
  }

  // Now, you can write code like this:

  await fs.promises.writeFile('/test.txt', 'Cool, I can do this in the root!')
  await fs.promises.readFile('/test.txt')
  
  await fs.promises.writeFile('/data/test.txt', 'Cool, I can do this in indexeddb!')
  await fs.promises.readFile('/data/test.txt')

  await fs.promises.mkdir('/xyz/')
  await fs.promises.writeFile('/xyz/index.html', 'hello from xyz')
  await fs.promises.readFile('/xyz/index.html')
  
  console.log('fixtures ready')

  return { fs }
}
