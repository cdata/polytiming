(function() {
  'use strict';

  // Synchronously read a file packaged with the extension. The file must be
  // listed in the "web_accessible_resources" section of manifest.json
  function injectScript(localUrl) {
    let extensionUrl = chrome.extension.getURL(localUrl);
    let xhr = new XMLHttpRequest();
    let response = null;

    xhr.open('GET', extensionUrl, false);
    xhr.onload = function (e) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          response = xhr.responseText;
        } else {
          console.error(xhr.statusText);
        }
      }
    };
    xhr.onerror = function (e) {
      console.error(xhr.statusText);
    };
    xhr.send(null);

    let scriptSource = response + '\n\n//# sourceURL=' + localUrl;
    let script = document.createElement('script');
    let parent = document.body || document.head || document.documentElement;

    script.appendChild(document.createTextNode(scriptSource));
    parent.appendChild(script);
  }

  let polytimingSource = injectScript('/polytiming.js');
})();
