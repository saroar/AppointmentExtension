let ezovUrl = `ezov.mzv.sk`;
let ezovProtocol = `https://`;
let ezovFullUrl = ezovProtocol + ezovUrl;
let settings = {
    delay: 0
}
//*
chrome.storage.onChanged.addListener((changes, namespace) => {
    if ('delay' in changes) {
        settings.delay = changes['delay'].newValue.value
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
setStorage({ selectedCity: { cityId: 0 }, insertLogin: { appCode: 0, passNumber: 0 }, delay: { value: 20000 } })
    .then((obj) => consoleLog(`Added to storage initial parameters: ${JSON.stringify(obj)}`))
//*
const clearCityId = () => {
    return new Promise((resolve, reject) => {
        setStorage({ selectedCity: { cityId: 0 } })
            .then((obj) => {
                consoleLog(`City is cleared, id: ${obj.selectedCity.cityId}`);
                showMessage(`Extension`, `City is cleared`);
                resolve(obj.selectedCity);
            })
            .catch(() => reject(`Error cleaning city id`))
    })
}
//*
const clearLogin = () => {
    return new Promise((resolve, reject) => {
        setStorage({ insertLogin: { appCode: 0, passNumber: 0 } })
            .then((obj) => {
                consoleLog(`Login is cleared, application code - ${obj.insertLogin.appCode}, passport number - ${obj.insertLogin.passNumber}`);
                showMessage(`Extension`, `Login is cleared`);
                resolve(obj.insertLogin);
            })
            .catch(() => reject(`Error cleaning login`))
    })
}
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
        cookies.forEach((item, index) => {
            removeCookie(protocol + item.domain + item.path, item.name)
                .then((name) => {
                    consoleLog(`Deleted cookie name ${name}`);
                    if ((index + 1) === cookies.length) {
                        resolve(cookies.length);
                    }
                })
                .catch((name) => {
                    consoleLog(`Error deleting cookie ${name}`);
                    reject(index);
                })
        })
    })
}
//*
const clearCookies = (domain, protocol = ezovProtocol) => {
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
                            this.passthrough = `localhost, 127.0.0.1`
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
                                bypassList: [`localhost`, `127.0.0.1`]
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
            } else {
                initProxy()
                    .then(() => getProxy())
            }
        })
    })
}
//*
chrome.webRequest.onCompleted.addListener((details) => {
    if (details.statusCode === 403) {
        consoleLog(`Blocking, error ${details.statusCode}`);
        clearCookies(ezovUrl)
            .then(() => getProxy()
                .then(() => {
                    chrome.tabs.update(details.tabId, { url: `${ezovFullUrl}/*` }, () => { consoleLog(`Reload tab ${details.tabId}`) });
                }))
    }
}, {
    urls: [
        `${ezovFullUrl}/*`
    ],
    types: [`main_frame`, `sub_frame`]
})
//*
chrome.webRequest.onErrorOccurred.addListener((details) => {
    consoleLog(`You are unavailable!`);
    clearCookies(ezovUrl)
        .then(() => getProxy()
            .then(() => {
                chrome.tabs.update(details.tabId, { url: `${ezovFullUrl}/*` }, () => { consoleLog(`Reload tab ${details.tabId}`) });
            }))
}, {
    urls: [
        `${ezovFullUrl}/*`
    ],
    types: [`main_frame`, `sub_frame`]
})
//*
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === `delay`) {
        sendResponse(settings.delay);
    }
    else if (request.type === `clearlogin`) {
        clearLogin();
    }
    else if (request.type === `clearcityid`) {
        clearCityId();
    }
    else if (request.type === `clearcookies`) {
        clearCookies(ezovUrl);
    }
    else if (request.type === `clearproxy`) {
        clearProxy();
    }
    else if (request.type === `sound`) {
        play();
    }
})