export let isUnloading = false;
window.addEventListener("beforeunload", () => {
    isUnloading = true;
});
