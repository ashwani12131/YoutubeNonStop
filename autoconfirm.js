var ynsTag = "[Youtube NonStop] ";
var clickTimeThreshold = 3000;
var lastClickTime = new Date().getTime();
var lastVideo = '';
var timeStartedVideo = 0;
var extraTime = 0;

$(document).click(function() {
  lastClickTime = new Date().getTime();
});

function hasPoppedAfterTimeThreshold(){
  var currTime = new Date().getTime();
  if(currTime - lastClickTime <= clickTimeThreshold){
    lastClickTime = new Date().getTime();
    return false;
  }
  return true;
}

function tryClickPaperDialog(){
  var paperDialog = $('ytd-popup-container').find('paper-dialog');
  if(paperDialog.length){
    if(paperDialog.css('display') != 'none'){
      if(!hasPoppedAfterTimeThreshold()){
        return;
      }
      if(paperDialog.find('#confirm-button').length){
        if(document.hidden){
          checkForTimeStamp("replace");
        }
        else{
          paperDialog.find('#confirm-button').click();
          console.debug(ynsTag + "Confirmed watching in dialog!");
        }
      }
    }
  }
}

function checkForTimeStamp(operation){
  var url = window.location.origin + window.location.pathname;
  var foundTimestamp = false;
  window.location.search.split("&").forEach(function(curr, index){
    if(index === 0){
      curr = curr.split("?")[1];
    }
    var splits = curr.split("=");
    if(splits[0] === "t"){
      foundTimestamp = true;
      if(operation === "get"){
        extraTime = parseInt(splits[1]);
      }
      else if(operation === "replace"){
        url += "&t=" + Math.floor((new Date() - timeStartedVideo) / 1000 + extraTime);
      }
    }
    else if(operation === "replace"){
      if(index === 0){
        url += "?";
      }
      url += "&"+ curr;
    }
  });
  if(operation === "replace"){
    if(!foundTimestamp){
      url += "&t=" + Math.floor((new Date() - timeStartedVideo) / 1000 + extraTime);
    }
    console.debug(ynsTag + "Cannot confirm watching because tab is hidden, reloading as " + url);
    window.location.href = url;
  }
}

window.onload=function(){
  if (typeof(Worker) !== "undefined") {

    var response = `var ynsIntervalTimer = 1000;

    setInterval(whipWorker, ynsIntervalTimer);
    postMessage("Monitoring YouTube for confirmation popup...");

    function whipWorker(){
      postMessage("whip");
    }`;

    var blob;
    try {
        blob = new Blob([response], {type: 'application/javascript'});
    } catch (e) { // Backwards-compatibility
        blob = new BlobBuilder();
        blob.append(response);
        blob = blob.getBlob();
    }

    var worker = new Worker(URL.createObjectURL(blob));

      worker.onmessage = function(e){
        if(e.data === "whip"){
          if(window.location.pathname === "/watch"){
            if(lastVideo !== window.location.href){
              extraTime = 0;
              checkForTimeStamp("get");
              lastVideo = window.location.href;
              timeStartedVideo = new Date();
            }
            tryClickPaperDialog();
          }
        }
        else{
          console.log(ynsTag + e.data);
        }
      };
  }
  else {
      console.error(ynsTag + "Sorry, your browser doesn't support Web Workers! :/");
  }
}
