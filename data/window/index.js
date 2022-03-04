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

qrcode.on('detect', e => {
  processThis(e.data);
  if (tools.stream && tools.stream.active) {
    tools.vidoe.off();
  }
});

function processThis(productNum) {
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
};


// tab change
tabsView.addEventListener('tabs-view::change', ({ detail }) => {
  if (detail.dataset.tab === 'scan' && document.getElementById('auto-start').checked) {
    tools.vidoe.on();
  }
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

