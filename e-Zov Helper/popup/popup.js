onload = () => {
  let clearcityid = document.querySelector('#clearcityid')
  clearcityid.addEventListener('click', (e) => {
    chrome.runtime.sendMessage({ type: 'clearcityid' })
  })

  let clearlogin = document.querySelector('#clearlogin')
  clearlogin.addEventListener('click', (e) => {
    chrome.runtime.sendMessage({ type: 'clearlogin' })
  })

  let clearcookies = document.querySelector('#clearcookies')
  clearcookies.addEventListener('click', (e) => {
    chrome.runtime.sendMessage({ type: 'clearcookies' })
  })

  let clearproxy = document.querySelector('#clearproxy')
  clearproxy.addEventListener('click', (e) => {
    chrome.runtime.sendMessage({ type: 'clearproxy' })
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

  chrome.storage.local.get(null, db => {
    try {
      delayInput.value = db.delay.value
    } catch (e) {
      console.log(e)
    }
  })
}
