'use strict';

chrome.action.onClicked.addListener(() => {
  chrome.storage.local.get({
    mode: 'window'
  }, async prefs => {
    if (prefs.mode === 'tab') {
      chrome.tabs.create({
        url: 'data/window/index.html?mode=tab'
      });
    }
    else {
      const win = await chrome.windows.getCurrent();

      chrome.storage.local.get({
        'window.width': 400,
        'window.height': 600,
        'window.left': win.left + Math.round((win.width - 400) / 2),
        'window.top': win.top + Math.round((win.height - 600) / 2)
      }, prefs => {
        chrome.windows.create({
          url: '/data/window/index.html?mode=window',
          width: prefs['window.width'],
          height: prefs['window.height'],
          left: prefs['window.left'],
          top: prefs['window.top'],
          type: 'popup'
        });
      });
    }
  });
});

const startup = () => chrome.storage.local.get({
  mode: 'popup'
}, prefs => {
  chrome.contextMenus.create({
    title: 'Open in Popup',
    id: 'popup',
    contexts: ['action'],
    type: 'radio',
    checked: prefs.mode === 'popup'
  });
  chrome.action.setPopup({
    popup: prefs.mode === 'popup' ? 'data/window/index.html?mode=popup' : ''
  });
});
chrome.runtime.onInstalled.addListener(startup);
chrome.runtime.onStartup.addListener(startup);

chrome.contextMenus.onClicked.addListener(info => chrome.storage.local.set({
  mode: info.menuItemId
}));

chrome.storage.onChanged.addListener(prefs => {
  if (prefs.mode) {
    chrome.action.setPopup({
      popup: prefs.mode.newValue === 'popup' ? 'data/window/index.html?mode=popup' : ''
    });
  }
});

chrome.runtime.onMessage.addListener(
  function (message, callback) {
    if (message == "changeColor") {
      chrome.tabs.executeScript({
        code: 'document.body.style.backgroundColor="orange"'
      });
    }
  });

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (request.Message === "hello") {
        const product = request.product;
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: displayProduct,
          args: [product],
        });
      }
      return true;
    });
  }
);

function displayProduct(productNum) {
  alert(productNum);
  navigator.clipboard.writeText(productNum);
  window.addEventListener('DOMContentLoaded', (event) => {
    const list = document.getElementsByClassName("example")[0];
    list.getElementsByClassName("child")[0].innerHTML = "Milk";
});

  
}

