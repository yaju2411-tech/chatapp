export let isUnloading = false;

window.addEventListener("beforeunload", () => {
    isUnloading = true;
    // If navigation is canceled, reset after a short delay
    setTimeout(() => {
        isUnloading = false;
    }, 100);
});

// Reset if restored from bfcache
window.addEventListener("pageshow", () => {
    isUnloading = false;
});
