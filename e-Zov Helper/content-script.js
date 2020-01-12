; (() => {

    const delay = () => {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ type: `delay` }, (response) => {
                response ? resolve(response) : reject()
            })
        })
    }

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

    const isIframe = () => {
        let is = false;
        try {
            is = window != window.top || document != top.document || self.location != top.location;
        } catch (e) {
            is = true;
        }
        return is
    }

    const checkDatesMonth = () => {
        try {
            let daysYear = document.querySelector('.calendarMonthLabel').textContent.replace(/\s/g, '').split('/')[1].split('-')[0];
            let days = document.querySelectorAll('.calendarMonthCell');
            let daysArray = [];
            if (days) {
                for (let i = 0; i < days.length; i++) {
                    if (days[i].children[0]) {
                        let daysProps = days[i].children[0].innerText.split('\n');
                        if (daysProps[1]) {
                            let daysSlots = daysProps[1].slice(1, -1).split('/');
                            if (daysSlots[0] === daysSlots[1]) {
                                consoleLog(`All slots are busy - ${daysSlots[0]} of ${daysSlots[1]}`);
                            } else {
                                consoleLog(`Available ${(daysSlots[1] - daysSlots[0])} slots for the date ${daysProps[0]}${daysYear}`);
                                daysArray.push(`${daysProps[0]}${daysYear}`)
                            }
                        } else {
                            consoleLog(`No reservation for the date ${daysProps[0]}${daysYear}`);
                        }
                    }
                }
            } else {
                consoleLog(`No days for reservation`);
            }
            return daysArray;
        } catch (e) {
            console.log(e);
        }
    }

    if (isIframe() && /ezov\.mzv\.sk\/e-zov\/calendar\.do/.test(location.href)) {
        try {
            chrome.storage.local.get('selectedCity', db => {
                try {
                    let callCheckDatesMonth = checkDatesMonth();
                    if (callCheckDatesMonth.length) {
                        let i = Math.floor(Math.random() * callCheckDatesMonth.length);
                        document.location.replace(`./calendarDay.do?day=${callCheckDatesMonth[i]}&timeSlotId=&calendarId=&consularPostId=${db.selectedCity.cityId}`);
                        chrome.runtime.sendMessage({ type: 'sound' });
                    } else {
                        delay()
                            .then((delay) => {
                                setTimeout(() => { document.location.replace(`./calendar.do?consularPost=${db.selectedCity.cityId}`) }, delay);
                            })
                    }
                } catch (e) {
                    console.log(e);
                }
            })
        } catch (e) {
            console.log(e);
        }
    }

    if (isIframe() && /ezov\.mzv\.sk\/e-zov\/calendarDay\.do/.test(location.href)) {
        try {
            let time = document.querySelectorAll('.calendarDayTableDateColumn');
            let slots = document.querySelectorAll('.calendarDayTableSlotsColumn');
            let freeTime = [];
            if (time.length === slots.length) {
                slots.forEach((item, index) => {
                    if (item.textContent.replace(/\s/g, '').slice(0, 1) > 0) {
                        freeTime.push({ time: time[index].textContent.replace(/\s/g, ''), slots: item.textContent.replace(/\s/g, '').slice(0, 1) })
                    }
                })
            }
            if (freeTime.length) {
                let i = Math.floor(Math.random() * freeTime.length);
                console.log(freeTime[i].time)
            }
        } catch (e) {
            console.log(e);
        }
    }

    else if (isIframe() && /ezov\.mzv\.sk\/e-zov\/consularPost\.do/.test(location.href)) {
        try {
            let selectedCity = document.getElementById('calendar.consularPost.consularPost')
            selectedCity.addEventListener('change', () => {
                chrome.storage.local.set({
                    selectedCity: {
                        cityId: selectedCity.value
                    }
                }, () => {
                    if (chrome.runtime.lastError) console.log(chrome.runtime.lastError)
                })
                document.forms[0].submit();
            })
        } catch (e) {
            console.log(e);
        }
    }

    else if (isIframe() && /ezov\.mzv\.sk\/e-zov\/dateOfVisitDecision\.do/.test(location.href)) {
        try {
            chrome.storage.local.get('selectedCity', db => {
                try {
                    if (db.selectedCity.cityId) {
                        document.location.replace(`./calendar.do?consularPost=${db.selectedCity.cityId}`);
                    } else {
                        document.location.replace('./consularPost.do');
                    }
                } catch (e) {
                    console.log(e);
                }
            })
        } catch (e) {
            console.log(e);
        }
    }

    else if (isIframe() && /ezov\.mzv\.sk\/e-zov\/login\.do/.test(location.href)) {
        try {
            let ju = document.getElementById('j_username')
            let jp = document.getElementById('j_password')
            chrome.storage.local.get('insertLogin', db => {
                try {
                    if (db.insertLogin.appCode && db.insertLogin.passNumber) {
                        ju.value = db.insertLogin.appCode;
                        jp.value = db.insertLogin.passNumber;
                        document.forms[0].submit();
                    } else {
                        ju.addEventListener('blur', () => {
                            chrome.storage.local.set({
                                insertLogin: {
                                    appCode: ju.value,
                                    passNumber: jp.value
                                }
                            }, () => {
                                if (chrome.runtime.lastError) console.log(chrome.runtime.lastError)
                            })
                        })
                        jp.addEventListener('blur', () => {
                            chrome.storage.local.set({
                                insertLogin: {
                                    appCode: ju.value,
                                    passNumber: jp.value
                                }
                            }, () => {
                                if (chrome.runtime.lastError) console.log(chrome.runtime.lastError)
                            })
                        })
                    }
                } catch (e) {
                    console.log(e);
                }
            })
        } catch (e) {
            console.log(e);
        }
    }

    else if (isIframe() && /ezov\.mzv\.sk\/e-zov\/iframe\.do/.test(location.href)) {
        try {
            document.location.replace('./dateOfVisitDecision.do')
        } catch (e) {
            console.log(e);
        }
    }

})()