if ("serviceWorker" in navigator && "PushManager" in window) {
    console.log("Service Worker and Push is supported");

    navigator.serviceWorker.register("sw.js")
        .then(function(swReg) {
            console.log("Service Worker is registered", swReg);

            swRegistration = swReg;
        })
        .catch(function(error) {
            console.error("Service Worker Error", error);
        });
} else {
    console.warn("Push messaging is not supported");
    pushButton.textContent = "Push Not Supported";
}

function initialiseUI() {
    pushButton.addEventListener("click", function() {
        pushButton.disabled = true;
        if (isSubscribed) {
            // TODO: Unsubscribe user
        } else {
            subscribeUser();
        }
    });

    // Set the initial subscription value
    swRegistration.pushManager.getSubscription()
        .then(function(subscription) {
            isSubscribed = !(subscription === null);

            updateSubscriptionOnServer(subscription);

            if (isSubscribed) {
                console.log("User IS subscribed.");
            } else {
                console.log("User is NOT subscribed.");
            }

            updateBtn();
        });
}

function updateBtn() {
    if (Notification.permission === 'denied') {
        pushButton.textContent = 'Push Messaging Blocked.';
        pushButton.disabled = true;
        updateSubscriptionOnServer(null);
        return;
    }

    if (isSubscribed) {
        pushButton.textContent = 'Disable Push Messaging';
    } else {
        pushButton.textContent = 'Enable Push Messaging';
    }

    pushButton.disabled = false;
}

navigator.serviceWorker.register("sw.js")
    .then(function(swReg) {
        console.log("Service Worker is registered", swReg);

        swRegistration = swReg;
        initialiseUI();
    });

function subscribeUser() {
    const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
    swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
    })
        .then(function(subscription) {
            console.log("User is subscribed.");

            updateSubscriptionOnServer(subscription);

            isSubscribed = true;

            updateBtn();
        })
        .catch(function(err) {
            console.log("Failed to subscribe the user: ", err);
            updateBtn();
        });
}

const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
swRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey
})
    .then(function(subscription) {
        console.log("User is subscribed.");

        updateSubscriptionOnServer(subscription);

        isSubscribed = true;

        updateBtn();

    })
    .catch(function(err) {
        console.log("Failed to subscribe the user: ", err);
        updateBtn();
    });

function updateSubscriptionOnServer(subscription) {
    // TODO: Send subscription to application server

    const subscriptionJson = document.querySelector(".js-subscription-json");
    const subscriptionDetails =
        document.querySelector(".js-subscription-details");

    if (subscription) {
        subscriptionJson.textContent = JSON.stringify(subscription);
        subscriptionDetails.classList.remove("is-invisible");
    } else {
        subscriptionDetails.classList.add("is-invisible");
    }
}
