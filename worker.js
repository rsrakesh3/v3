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
    title: 'Open in Window',
    id: 'window',
    contexts: ['browser_action'],
    type: 'radio',
    checked: prefs.mode === 'window'
  });
  chrome.contextMenus.create({
    title: 'Open in Tab',
    id: 'tab',
    contexts: ['browser_action'],
    type: 'radio',
    checked: prefs.mode === 'tab'
  });
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
  var baseElement = document.getElementById('framedadmin');
  var contWindow = baseElement ? baseElement.contentWindow : null;

  var giftRegistryElement = contWindow != null && contWindow.document.getElementsByName("frm_actions")[0];
  var stockBufferElement = contWindow != null && contWindow.document.getElementById('oSearch');
  var productElement = contWindow != null && contWindow.document.getElementsByName("name")[0];
  var inventoryAdjustmentElement = document.getElementById("P80_BARCODE");

  // working, gift registry
  if (baseElement != null && contWindow != null && giftRegistryElement != null) {
    document.getElementById('framedadmin').contentWindow.document.getElementsByName("frm_actions")[0].contentWindow.document.getElementById("product").value = product;
  }

  //working, stock buffer managment
  if (baseElement != null && contWindow != null && stockBufferElement != null) {
    document.getElementById('framedadmin').contentWindow.document.getElementById('oSearch').value = product;
  }

  //working, product page
  if (baseElement != null && contWindow != null && productElement != null) {
    document.getElementById('framedadmin').contentWindow.document.getElementsByName("name")[0].value = product;
  }

  //working SIM Inventory adjustment entry
  if (inventoryAdjustmentElement != null) {
    document.getElementById("P80_BARCODE").value = product;
  }
}


