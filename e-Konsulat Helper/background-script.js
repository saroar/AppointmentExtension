let ekonsulatUrl = `.e-konsulat.gov.pl`;
let ekonsulatProtocol = `https://`;
let ekonsulatFullUrl = ekonsulatProtocol + ekonsulatUrl;
let settings = {
  apiCaptchaValue: 1,
  ua: ``,
  camouflage: `true`,
  delay: 0
}
//*
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (`delay` in changes) {
    settings.delay = changes[`delay`].newValue.value
  }
  if (`captcha` in changes) {
    settings.apiCaptchaValue = changes[`captcha`].newValue.value
  }
  if (`ua` in changes) {
    settings.ua = changes[`ua`].newValue.value
  }
  if (`camouflage` in changes) {
    settings.camouflage = changes[`camouflage`].newValue.value
  }
})
//*
let sound = document.createElement(`audio`)
sound.src = chrome.extension.getURL(`sound.mp3`)
document.body.appendChild(sound)
//*
const play = () => document.querySelector(`audio`).play();
//*
const consoleLog = (text, method = 1) => {
  let date = new Date().toISOString().split(`T`);
  let info = `${date[0]} ${date[1].slice(0, -1)} - ${text}`;
  switch (method) {
    case 1:
      console.log(info);
      break;
    case 2:
      console.info(info);
      break;
    case 3:
      console.error(info);
      break;
    default:
      console.log(info);
  }
}
//*
const showMessage = (title, message) => {
  chrome.notifications.create(null, {
    type: `basic`,
    iconUrl: chrome.extension.getURL(`icons/icon.svg`),
    title,
    message
  }, () => {
    if (chrome.runtime.lastError) consoleLog(chrome.runtime.lastError, 3);
  })
}
//*
const setStorage = (obj) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(
      obj, () => {
        if (!chrome.runtime.lastError) {
          resolve(obj);
        } else {
          consoleLog(chrome.runtime.lastError, 3);
          reject(chrome.runtime.lastError);
        }
      })
  })
}
//*
setStorage({ captcha: { value: 1 }, delay: { value: 0 }, camouflage: { value: true }, ua: { value: `` } })
  .then((obj) => consoleLog(`Added to storage initial parameters: ${JSON.stringify(obj)}`))
//*
const removeCookie = (url, name) => {
  return new Promise((resolve, reject) => {
    chrome.cookies.remove({ url, name }, (details) => {
      if (details) {
        resolve(details.name);
      } else {
        reject(details.name);
      }
    })
  })
}
//*
const enumCookies = (cookies, protocol) => {
  return new Promise((resolve, reject) => {
    let i = 0;
    cookies.forEach((item, index) => {
      if (![`eKonsulatCookiesPolicyClosed`, `IDWersjeJezykowe`].includes(item.name)) {
        removeCookie(protocol + item.domain + item.path, item.name)
          .then((name) => {
            consoleLog(`Deleted cookie name ${name}`);
            i++;
            if ((index + 1) === cookies.length) {
              resolve(i);
            }
          })
          .catch((name) => {
            consoleLog(`Error deleting cookie ${name}`);
            reject(index);
          })
      }
    })
    resolve(0);
  })
}
//*
const clearCookies = (domain, protocol = ekonsulatProtocol) => {
  return new Promise((resolve, reject) => {
    chrome.cookies.getAll({ domain }, (cookies) => {
      if (cookies.length) {
        enumCookies(cookies, protocol)
          .then((count) => {
            consoleLog(`Deleted ${count} ${count < 2 ? `cookie` : `cookies`}`);
            resolve(count);
          })
          .catch((count) => {
            consoleLog(`Deleted ${count} ${count < 2 ? `cookie` : `cookies`} (not all)`);
            reject(count);
          })
      } else {
        consoleLog(`Deleted 0 cookie`);
        resolve(0);
      }
    })
  })
}
//*
const clearServiceType = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove([`servicetype`, `datetext`, `notermstext`], () => {
      if (!chrome.runtime.lastError) {
        consoleLog(`Type of service cleared`);
        showMessage(`Extension`, `Type of service cleared`);
        resolve(`Type of service cleared`);
      } else {
        consoleLog(chrome.runtime.lastError, 3);
        reject(chrome.runtime.lastError);
      }
    });
  })
}
//*
const checkBrowser = () => {
  return new Promise((resolve, reject) => {
    let isFirefox = typeof InstallTrigger !== `undefined`;
    let isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);;
    if (isFirefox) {
      consoleLog(`Browser definition result: Firefox`);
      resolve(`Firefox`);
    }
    else if (isChrome) {
      consoleLog(`Browser definition result: Chrome`);
      resolve(`Chrome`);
    }
    else {
      consoleLog(`Browser definition result: Other`);
      resolve(`Other`);
    }
    reject();
  })
}
//*
const setProxy = (ip, port, scheme = `http`) => {
  return checkBrowser()
    .then((browser) => {
      return new Promise((resolve, reject) => {
        function Config(ip, port, scheme, browser) {
          if (browser === `Firefox`) {
            this.proxyType = `manual`,
              this.passthrough = `localhost, 127.0.0.1, 192.168.9.175`
            if (scheme === `http`) {
              this.http = `${scheme}://${ip}:${port}`,
                this.httpProxyAll = true
            } else if (scheme === `socks4`) {
              this.socks = `${ip}:${port}`,
                this.socksVersion = 4
            } else if (scheme === `socks5`) {
              this.socks = `${ip}:${port}`,
                this.socksVersion = 5
            }
          } else if (browser === `Chrome`) {
            this.mode = `fixed_servers`,
              this.rules = {
                singleProxy: {
                  scheme: scheme,
                  host: ip,
                  port: parseInt(port)
                },
                bypassList: [`localhost`, `127.0.0.1`, `10.0.1.3`]
              }
          } else {
            reject({});
          }
        }
        let config = new Config(ip, port, scheme, browser);
        resolve(config);
      })
    })
    .then((config) => {
      return new Promise((resolve, reject) => {
        chrome.proxy.settings.set({ value: config }, () => {
          chrome.storage.local.get(null, db => {
            if (!db.proxy) db.proxy = []
            if (db.proxy.indexOf(ip) === -1) db.proxy.push(ip)
            chrome.storage.local.set(db)
          });
          if (!chrome.runtime.lastError) {
            consoleLog(`Set proxy: ${ip}:${port}`);
            showMessage(`Extension`, `Set proxy: ${ip}:${port}`)
            resolve(ip);
          } else {
            consoleLog(chrome.runtime.lastError, 3);
            reject(chrome.runtime.lastError);
          }
        })
      })
    })
}
//*
const clearProxy = () => {
  return checkBrowser()
    .then((browser) => {
      return new Promise((resolve, reject) => {
        function Config(browser) {
          if (browser === `Firefox`) {
            this.proxyType = `none`
          } else if (browser === `Chrome`) {
            this.mode = `direct`
          } else {
            reject({});
          }
        }
        let config = new Config(browser);
        resolve(config);
      })
    })
    .then((config) => {
      return new Promise((resolve, reject) => {
        chrome.proxy.settings.set({ value: config }, () => {
          chrome.storage.local.remove([`proxy`, `proxyList`], () => {
            if (!chrome.runtime.lastError) {
              consoleLog(`Proxy settings are cleared`);
              showMessage(`Extension`, `Proxy settings are cleared`);
              resolve(`Proxy settings are cleared`);
            } else {
              consoleLog(chrome.runtime.lastError, 3);
              reject(chrome.runtime.lastError);
            }
          });
        })
      })
    })
}
//*
const initProxy = () => {
  return new Promise((resolve, reject) => {
    fetch(chrome.extension.getURL(`proxy.txt`), { mode: `cors` })
      .then(d => {
        d.text().then(text => {
          let proxyList = text.match(/\d+\.\d+\.\d+\.\d+:\d+/g)
          proxyList = proxyList ? proxyList.map(e => {
            e = e.split(`:`)
            return { ip: e[0], port: e[1] }
          }) : []
          setStorage({ proxyList });
          consoleLog(`Added ${proxyList.length} ${proxyList.length < 2 ? `proxy` : `proxies`}`);
          resolve(proxyList.length);
        })
      })
  })
}
//*
const getProxy = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(null, db => {
      if (db.proxyList) {
        if (db.proxyList.length) {
          if (db.proxy) {
            if (db.proxyList.length === db.proxy.length) {
              clearProxy()
                .then(() => getProxy())
            } else {
              let proxyList = db.proxyList.filter(e => db.proxy.indexOf(e.ip) === -1);
              let curProxy = proxyList.shift();
              setProxy(curProxy.ip, curProxy.port)
                .then((ip) => resolve(ip));
            }
          } else {
            let curProxy = db.proxyList.shift();
            setProxy(curProxy.ip, curProxy.port)
              .then((ip) => resolve(ip));
          }
        } else {
          reject(`Error adding proxy`);
        }
      }
      else {
        consoleLog(`Proxy usage not included`);
        resolve(`Proxy usage not included`);
        // initProxy()
        //   .then(() => getProxy())
      }
    })
  })
}
//*
chrome.webRequest.onBeforeRequest.addListener((details) => {
  if (settings.camouflage) {
    resources = [`Tlo_MASTER_R.gif`]
    for (let resource of resources) {
      if (details.url.includes(resource)) {
        return { redirectUrl: chrome.runtime.getURL(`resources/${resource}`) }
      }
    }
  }
}, {
  urls: [
    `${ekonsulatProtocol}*${ekonsulatUrl}/*`
  ],
  types: [`image`]
}, [`blocking`])
//*
let proxyLogin = ``, proxyPassword = ``
//*
chrome.webRequest.onAuthRequired.addListener(
  (details, asyncCallback) => {
    asyncCallback({ authCredentials: { username: proxyLogin, password: proxyPassword } })
  },
  { urls: [`<all_urls>`] },
  [`asyncBlocking`]
)
//*
const networkFilters = {
  urls: [
    `${ekonsulatProtocol}*${ekonsulatUrl}/*`
  ],
  types: [`main_frame`]
}

chrome.webRequest.onCompleted.addListener((details) => {
  badUrls = [`e-konsulat.gov.pl/value/a`, `e-konsulat.gov.pl/value/b`, `e-konsulat.gov.pl/rate/a`, `e-konsulat.gov.pl/Bledy/Bledy.aspx`]
  for (let badUrl of badUrls) {
    if (details.url.includes(badUrl)) {
      clearCookies(ekonsulatUrl)
        .then(() => getProxy()
          .then(() => {
            chrome.tabs.executeScript(details.tabId, { code: `;(() => { window.history.go(-1); })();` }, () => {
              consoleLog(`Go back history`);
              showMessage(`Extension`, `Error: ` + details.url);
            })
            // chrome.tabs.goBack(details.tabId, () => { showMessage(`Extension`, `Error: ` + details.url) });
          }))
    }
  }
}, networkFilters)

const clearingBlock = (tabId, tabUrl, tabTitle) => {
  clearCookies(ekonsulatUrl)
    .then(() => {
      getProxy()
        .then(() => {
          chrome.tabs.update(tabId, { url: tabUrl }, () => {
            resolve(`Reload tab №${tabId}`);
            consoleLog(`Reload tab №${tabId}, with error: ${tabTitle}, URL: ${tabUrl}`);
            showMessage(`Extension`, `Reload tab №${tabId}, with error: ${tabTitle}, URL: ${tabUrl}`);
          })
        })
    })
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === `ready`) {
    sendResponse(settings.delay)
    let url = new URL(sender.url)
    let locationParams = new URLSearchParams(url.search)
    if (url.hostname.includes(`.e-konsulat.gov.pl`)) {
      switch (url.pathname) {
        case `/Uslugi/RejestracjaTerminu.aspx`:
          let params = [`132`, `211`, `212`]
          if (params.includes(locationParams.get(`IDPlacowki`))) {
            chrome.cookies.set({
              path: `/`,
              name: `IDWersjeJezykowe`,
              url: sender.url,
              value: `2`,
              secure: true
            })
          }
          break
        case `/`:
        case `/Informacyjne/Placowka.aspx`:
        case `/Wiza/FormularzWiza.aspx`:
        case `/Wiza/Podsumowanie.aspx`:
          break
        default:
      }
    }
    if (sender.tab.title === `Unauthorized Request Blocked`) {
      clearingBlock(sender.tab.id, sender.tab.url, sender.tab.title);
    }
  }
  else if (request.type === `sound`) {
    play()
  }
  else if (request.type === `clearcookies`) {
    clearCookies(ekonsulatUrl)
  }
  else if (request.type === `captcha`) {
    chrome.tabs.executeScript(sender.tab.id, { code: `;(() => { document.querySelector('input[type="submit"]').click() })();` });
  }
  else if (request.type === `enableproxy`) {
    initProxy()
      .then(() => getProxy())
  }
  else if (request.type === `changeproxy`) {
    getProxy()
  }
  else if (request.type === `clearproxy`) {
    clearProxy();
  }
  else if (request.type === `clearservicetype`) {
    clearServiceType()
  }
  else if (request.type === `api-captcha`) {
    console.log(request.base64);
    switch (settings.apiCaptchaValue) {
      case 1: {
        axios.post(`http://localhost:4000/ml`, {
          'access_token': `RUBNGUZ2021`,
          'pngbase64': request.base64
        })
          .then(d => {
            if (`answer` in d.data) {
              let code = d.data['answer'].toString();
              sendResponse(code);
            }
          })
          .catch(sendResponse);
        return true;
      }
    }
  }
  return false
})