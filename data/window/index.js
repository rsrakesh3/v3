/* global QRCode */
'use strict';

const notify = (msg, revert = true) => {
  document.querySelector('[data-message]').dataset.message = msg === undefined ? notify.DEFALUT : msg;
  clearTimeout(notify.id);
  if (revert) {
    notify.id = setTimeout(() => {
      document.querySelector('[data-message]').dataset.message = notify.DEFALUT;
    }, 3000);
  }
};
notify.DEFALUT = 'Click on the "Start" button to scan.';

if (location.href.indexOf('mode=popup') !== -1) {
  document.body.classList.add('popup');
}

const tabsView = document.querySelector('tabs-view');
const canvas = document.querySelector('canvas');
const video = document.getElementById('video');
const history = document.getElementById('history');
const qrcode = new QRCode();

const prefs = {
  'history': [],
  'auto-start': false,
  'save': true,
  'max': 100
};

const hashCode = s => Array.from(s).reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0);

function changeBackgroundColor() {
  document.getElementById("searchInput").value = "Hi"
}
qrcode.on('detect', e => {
  alert(e.data);
  document.dispatchEvent(new CustomEvent('yourCustomEvent', { data: e.data }));
  //   var code = "console.log('This code will execute as a content script');";
  // chrome.tabs.executeScript({code: code});
  processThis(e.data, callbackFunction);
  if (tools.stream && tools.stream.active) {
    tools.vidoe.off();
  }
});

document.addEventListener('yourCustomEvent', function (e) {
  var data = e;
  console.log('received', data);
});

function processThis(productNum, callback) {
  console.log("Product Number: " + productNum);
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.runtime.sendMessage({ Message: "hello", product: productNum }, function (response) {
      if (!chrome.runtime.lastError) {
        console.log("Success")
      } else {
        console.log("No Response")
      }
    });
  });
  if (typeof callback == "function")
    callback();
}

function doSomething(selectedText) {
  console.log(selectedText);
}

function callbackFunction() {

  console.log(
    "Running callback function next");
}

document.addEventListener('keydown', e => tabsView.keypress(e));
const tools = {
  vidoe: {
    on() {
      navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment'
        }
      }).then(stream => {
        tools.stream = stream;
        notify('', false);
        video.srcObject = stream;
        video.style.visibility = 'visible';
        const detect = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          if (canvas.width && canvas.height) {
            tools.detect(video, canvas.width, canvas.height);
          }
        };
        tools.vidoe.id = window.setInterval(detect, 200);
        detect();
      }).catch(e => {
        notify(e.message);
      });
    },
    off() {
      window.clearInterval(tools.vidoe.id);
      try {
        for (const track of tools.stream.getTracks()) {
          track.stop();
        }
        video.style.visibility = 'hidden';
        qrcode.clean(canvas);
      }
      catch (e) { }
    }
  },
  async detect(source, width, height) {
    await qrcode.ready();
    qrcode.detect(source, width, height);
  },
  append(e, focus = true) {
    const id = 'q-' + hashCode(e.data);
    const div = document.getElementById(id);
    if (div) {
      history.insertAdjacentElement('afterbegin', div);
    }
    else {
      const urlify = content => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return content.replace(urlRegex, '<a href="$1" target=_blank>$1</a>');
      };

      const div = document.createElement('div');
      div.id = id;
      const symbol = document.createElement('span');
      symbol.textContent = 'Type: ' + e.symbol;
      const content = document.createElement('pre');
      content.innerHTML = urlify(e.data);
      div.appendChild(symbol);
      div.appendChild(content);

      if (prefs.save) {
        prefs.history.unshift({
          data: e.data,
          symbol: e.symbol
        });
        // alert(data);
        prefs.history = prefs.history.slice(0, prefs.max);
        chrome.storage.local.set({
          history: prefs.history
        });
      }
    }
    if (focus) {
      tabsView.keypress({
        metaKey: true,
        code: 'Digit2',
        key: 2
      });
    }
  }
};


// tab change
tabsView.addEventListener('tabs-view::change', ({ detail }) => {
  if (detail.dataset.tab === 'scan' && document.getElementById('auto-start').checked) {
    tools.vidoe.on();
  }
  // if (detail.dataset.tab === 'results' && tools.stream && tools.stream.active) {
  //   tools.vidoe.off();
  // }
});



// init
chrome.storage.local.get(prefs, ps => {
  Object.assign(prefs, ps);
  document.getElementById('auto-start').checked = prefs['auto-start'];
  // tabsView already loaded
  if (prefs['auto-start'] && tabsView.ready && tabsView.active().dataset.tab === 'scan') {
    tools.vidoe.on();
  }
  else {
    notify(undefined, false);
  }
  // history
  for (const e of prefs.history.reverse()) {
    tools.append(e, false);
  }
});
// prefs
document.getElementById('auto-start').addEventListener('change', e => {
  chrome.storage.local.set({
    'auto-start': e.target.checked
  });
  tools.vidoe[e.target.checked ? 'on' : 'off']();
});
// video
video.addEventListener('play', () => {
  document.getElementById('display').dataset.mode = 'video';
  document.getElementById('toggle').textContent = 'Stop';
});
video.addEventListener('suspend', () => {
  document.getElementById('display').dataset.mode = 'image';
  document.getElementById('toggle').textContent = 'Start';
  notify(undefined, false);
});
// toggle
document.getElementById('toggle').addEventListener('click', () => {
  if (tools.stream && tools.stream.active) {
    tools.vidoe.off();
  }
  else {
    tools.vidoe.on();
  }
});

function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = chrome.tabs.query(queryOptions);
  return tab;
}
