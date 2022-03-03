chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(request.message);
        if (request.message === "hello"){
            console.log(request.greeting);
        chrome.tabs.executeScript({
            code: 'alert("Hi")'
          });
        }
        return false;  

    }
    
  );

  