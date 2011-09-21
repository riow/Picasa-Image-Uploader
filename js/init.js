var PIU = {

    targetImage: {},

    progressIntervalId: null,
    
    googleUsername: '',

    options: {
        picasaIndexUrl: 'http://picasaweb.google.com/',
        picasaApiUrl: 'https://picasaweb.google.com/data/feed/api/user/'
    },

    init: function() {
        chrome.browserAction.onClicked.addListener(function(tab) {
            // show options
        });
        this.initContextMenu();
        this.initTitle();
    },


    initContextMenu: function() {
        chrome.contextMenus.create({
            "title" : "Save in Picasa",
            "type" : "normal",
            "contexts" : ["image"],
            "onclick" : function(info, tab) {
                var image = info.srcUrl;
                PIU.prepareTargetImage(image);
                PIU.process();
            }
        });
    },

    initTitle: function() {
        chrome.browserAction.setTitle({title: 'Picasa Image Uploader'})
    },
                      
    findGoogleUsername: function(callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', this.options.picasaIndexUrl, true);
        xhr.onload = function(e) {
            // brutal method to find username :)
            var pos = this.response.search('[a-zA-Z0-9.]+@gmail.com');
            if (pos < 0) {
                // XXX replace alert with popup
                alert('You are not logined');
                PIU.stopProgressBar();
                return;
            }
            var substring = this.response.substr(pos, 100);
            var atPosition = substring.indexOf('@');
            var username = substring.substr(0, atPosition);

            console.log(username);

            PIU.googleUsername = username;
            callback();
        }
        xhr.send();
    },

    sendToPicasa: function() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', PIU.targetImage.path, true);
        xhr.responseType = 'arraybuffer';

        xhr.onload = function(e) {
            if (this.status == 200) {
                console.log(this.response);
                
                var xhr = new XMLHttpRequest();    
                xhr.open('POST', PIU.options.picasaApiUrl + PIU.googleUsername + '/', true);
                xhr.setRequestHeader("Content-Type", PIU.targetImage.contentType);
    
                xhr.onload = function(e) {
                    console.log(this.status);
                    console.log(this.responseText);
                    PIU.stopProgressBar();
                };
                
                xhr.send(this.response);
            }
        };
        xhr.send();
    },

    process: function() {
        this.startProgressBar();
        // chain of callbacks started here
        this.findGoogleUsername(this.sendToPicasa);
    },

    prepareTargetImage: function (image) {
        var name = image.split('/').pop();
        var nameParts = name.split(".");
        var contentType = '';
        switch (nameParts[1]) {
            case 'png':
                contentType = 'image/png';
                break;
            case 'gif':
                contentType = 'image/gif';
                break;
            case 'bmp':
                contentType = 'image/bmp';
                break;
            default: 
                contentType = 'image/jpeg';
                break;
        }
        this.targetImage = {
            path: image,
            name: name,
            contentType: contentType
        }
    },

    startProgressBar: function() {
        var progress = 0;
        var intervalId = setInterval(function() {
            switch (progress) {
                case 0:
                    var text = '.  ';
                    progress++
                break;
                case 1:
                    var text = ' . ';
                    progress++;
                break;
                default:
                    var text = '  .';
                    progress = 0;
                break;
            }
            chrome.browserAction.setBadgeText({text: text});
        }, 500);

        this.progressIntervalId = intervalId;
    },

    stopProgressBar: function() {
        chrome.browserAction.setBadgeText({text: 'Done'});
        setTimeout(function(){
            chrome.browserAction.setBadgeText({text: ''});
        }, 2000);
        clearInterval(this.progressIntervalId);
    }

}
PIU.init();

