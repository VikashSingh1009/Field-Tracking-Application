const captureGPS = () => new Promise((resolve) => {
    if (!navigator.geolocation){
        resolve({
            success: false,
            errorCode: 0,
            error: 'GPS not supported on this device'
        });
        return;
    }
    const isMobile = /Android|iphone|iPad|iPod/i.test(navigator.userAgent);

    navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
            success: true,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy)
        }),

        (err) => {

            const messages = {
                1: 'permission_denied',
                2: 'position_unavailable',
                3: 'timeout'
            };

            resolve({
                success: false,
                errorCode: err.code,
                error: messages[err.code] || 'unknown'
            });
        },
        {
            enableHighAccuracy: !isMobile,
            timeout: 15000,
            maximumAge: 30000
        }
    )
});