onload = () => {
  let enableproxy = document.querySelector('#enableproxy')
  enableproxy.addEventListener('click', (e) => {
    chrome.runtime.sendMessage({ type: 'enableproxy' })
  })
  let changeproxy = document.querySelector('#changeproxy')
  changeproxy.addEventListener('click', (e) => {
    chrome.runtime.sendMessage({ type: 'changeproxy' })
  })
  let clearproxy = document.querySelector('#clearproxy')
  clearproxy.addEventListener('click', (e) => {
    chrome.runtime.sendMessage({ type: 'clearproxy' })
  })
  let clearcookies = document.querySelector('#clearcookies')
  clearcookies.addEventListener('click', (e) => {
    chrome.runtime.sendMessage({ type: 'clearcookies' })
  })
  let clearservicetype = document.querySelector('#clearservicetype')
  clearservicetype.addEventListener('click', (e) => {
    chrome.runtime.sendMessage({ type: 'clearservicetype' })
  })

  let uaSelect = document.querySelector('#user-agent-select')
  let setUaCaptcha = (value) => {
    chrome.storage.local.set({
      ua: {
        value: value
      }
    }, () => {
      if (chrome.runtime.lastError) console.log(chrome.runtime.lastError)
    })
  }
  uaSelect.addEventListener('change', () => {
    setUaCaptcha(uaSelect.value)
  })

  let captchaSelect = document.querySelector('#captcha-select')
  let setStorageCaptcha = (value) => {
    chrome.storage.local.set({
      captcha: {
        value: +value
      }
    }, () => {
      if (chrome.runtime.lastError) console.log(chrome.runtime.lastError)
    })
  }
  captchaSelect.addEventListener('change', () => {
    setStorageCaptcha(captchaSelect.value)
  })

  let delayInput = document.querySelector('#delay')
  let setStorageDelay = (ms) => {
    chrome.storage.local.set({
      delay: {
        value: ms
      }
    }, () => {
      if (chrome.runtime.lastError) console.log(chrome.runtime.lastError)
    })
  }
  delayInput.addEventListener('blur', () => {
    setStorageDelay(delayInput.value)
  })

  let camouflageCheckbox = document.querySelector('#camouflage')
  let setStorageCamouflage = (enabled) => {
    chrome.storage.local.set({
      camouflage: {
        value: enabled
      }
    }, () => {
      if (chrome.runtime.lastError) console.log(chrome.runtime.lastError)
    })
  }
  camouflageCheckbox.addEventListener('change', () => {
    if (camouflageCheckbox.checked) {
      setStorageCamouflage(true)
    } else {
      setStorageCamouflage(false)
    }
  })

  chrome.storage.local.get(null, db => {
    try {
      captchaSelect.value = db.captcha.value
      uaSelect.value = db.ua.value
      delayInput.value = db.delay.value
      if (db.camouflage.value) {
        camouflageCheckbox.checked = true
      }
    } catch (e) {
      console.log(e)
    }
  })

}
