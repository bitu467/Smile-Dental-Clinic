function initBeforeAfterSlider(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const slider = container.querySelector('.slider-handle');
    const foregroundImg = container.querySelector('.foreground-img');

    if (!slider || !foregroundImg) return;

    let isDragging = false;

    // Mouse Events
    slider.addEventListener('mousedown', startDrag);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('mousemove', moveSlider);

    // Touch Events
    slider.addEventListener('touchstart', startDrag);
    window.addEventListener('touchend', stopDrag);
    window.addEventListener('touchmove', moveSlider);

    function startDrag(e) {
        isDragging = true;
    }

    function stopDrag() {
        isDragging = false;
    }

    function moveSlider(e) {
        if (!isDragging) return;

        let clientX;
        if (e.type.startsWith('touch')) {
            clientX = e.touches[0].clientX;
        } else {
            clientX = e.clientX;
        }

        const rect = container.getBoundingClientRect();
        let x = clientX - rect.left;

        if (x < 0) x = 0;
        if (x > rect.width) x = rect.width;

        const percentage = (x / rect.width) * 100;

        slider.style.left = percentage + '%';
        foregroundImg.style.width = percentage + '%';
    }
}

// Auto-init on load
document.addEventListener('DOMContentLoaded', () => {
    initBeforeAfterSlider('smileSlider');
});
