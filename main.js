class ClipliiPlayer {
    constructor(selector, options = {}) {
        this.container = document.querySelector(selector);
        this.options = {
            autoplay: options.autoplay || false,
            muted: options.muted || false,
            volume: options.volume || 1,
            controls: options.controls !== false,
            poster: options.poster || '',
            source: options.source || '',
            title: options.title || '',
            ...options
        };
        
        this.initialize();
    }

    initialize() {
        this.createPlayerStructure();
        this.attachEventListeners();
        this.initializeHotkeys();
        
        // Load last known volume from localStorage
        const savedVolume = localStorage.getItem('clipliiPlayer_volume');
        if (savedVolume !== null) {
            this.video.volume = parseFloat(savedVolume);
            this.volumeSlider.value = parseFloat(savedVolume) * 100;
        }
    }

    createPlayerStructure() {
        this.container.classList.add('cliplii-player');
        
        // Create video element
        this.video = document.createElement('video');
        this.video.classList.add('cliplii-video');
        if (this.options.poster) this.video.poster = this.options.poster;
        if (this.options.source) this.video.src = this.options.source;
        if (this.options.autoplay) this.video.autoplay = true;
        if (this.options.muted) this.video.muted = true;
        this.video.volume = this.options.volume;

        // Create controls container
        this.controls = document.createElement('div');
        this.controls.classList.add('cliplii-controls');

        // Create progress bar
        this.progressBar = document.createElement('div');
        this.progressBar.classList.add('cliplii-progress');
        this.progressFilled = document.createElement('div');
        this.progressFilled.classList.add('cliplii-progress-filled');
        this.progressBar.appendChild(this.progressFilled);

        // Create control buttons
        this.controlsBottom = document.createElement('div');
        this.controlsBottom.classList.add('cliplii-controls-bottom');

        // Play/Pause button
        this.playButton = document.createElement('button');
        this.playButton.classList.add('cliplii-button', 'cliplii-play');
        this.playButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';

        // Volume control
        this.volumeControl = document.createElement('div');
        this.volumeControl.classList.add('cliplii-volume-control');
        this.volumeButton = document.createElement('button');
        this.volumeButton.classList.add('cliplii-button', 'cliplii-volume');
        this.volumeButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>';
        
        this.volumeSlider = document.createElement('input');
        this.volumeSlider.type = 'range';
        this.volumeSlider.min = '0';
        this.volumeSlider.max = '100';
        this.volumeSlider.value = this.video.volume * 100;
        this.volumeSlider.classList.add('cliplii-volume-slider');

        // Time display
        this.timeDisplay = document.createElement('div');
        this.timeDisplay.classList.add('cliplii-time');
        this.timeDisplay.textContent = '0:00 / 0:00';

        // Fullscreen button
        this.fullscreenButton = document.createElement('button');
        this.fullscreenButton.classList.add('cliplii-button', 'cliplii-fullscreen');
        this.fullscreenButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>';

        // Assemble controls
        this.volumeControl.appendChild(this.volumeButton);
        this.volumeControl.appendChild(this.volumeSlider);
        
        this.controlsBottom.appendChild(this.playButton);
        this.controlsBottom.appendChild(this.volumeControl);
        this.controlsBottom.appendChild(this.timeDisplay);
        this.controlsBottom.appendChild(this.fullscreenButton);

        this.controls.appendChild(this.progressBar);
        this.controls.appendChild(this.controlsBottom);

        // Add title bar
        if (this.options.title) {
            this.titleBar = document.createElement('div');
            this.titleBar.classList.add('cliplii-title');
            this.titleBar.textContent = this.options.title;
            this.container.appendChild(this.titleBar);
        }

        // Assemble player
        this.container.appendChild(this.video);
        this.container.appendChild(this.controls);
    }

    attachEventListeners() {
        // Play/Pause
        this.playButton.addEventListener('click', () => this.togglePlay());
        this.video.addEventListener('click', () => this.togglePlay());

        // Update play button
        this.video.addEventListener('play', () => {
            this.playButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
        });
        this.video.addEventListener('pause', () => {
            this.playButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
        });

        // Progress bar
        this.video.addEventListener('timeupdate', () => this.updateProgress());
        this.progressBar.addEventListener('click', (e) => this.scrub(e));
        this.progressBar.addEventListener('mousemove', (e) => this.scrub(e));

        // Volume control
        this.volumeSlider.addEventListener('input', () => {
            const volume = this.volumeSlider.value / 100;
            this.video.volume = volume;
            localStorage.setItem('clipliiPlayer_volume', volume);
            this.updateVolumeIcon(volume);
        });

        this.volumeButton.addEventListener('click', () => {
            this.video.muted = !this.video.muted;
            this.updateVolumeIcon(this.video.muted ? 0 : this.video.volume);
        });

        // Fullscreen
        this.fullscreenButton.addEventListener('click', () => this.toggleFullscreen());

        // Time display
        this.video.addEventListener('timeupdate', () => this.updateTimeDisplay());
        this.video.addEventListener('loadedmetadata', () => this.updateTimeDisplay());
    }

    initializeHotkeys() {
        document.addEventListener('keydown', (e) => {
            if (!this.container.contains(document.activeElement)) return;

            switch(e.key.toLowerCase()) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    this.togglePlay();
                    break;
                case 'f':
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
                case 'm':
                    e.preventDefault();
                    this.video.muted = !this.video.muted;
                    break;
                case 'arrowleft':
                    e.preventDefault();
                    this.video.currentTime -= 5;
                    break;
                case 'arrowright':
                    e.preventDefault();
                    this.video.currentTime += 5;
                    break;
                case 'arrowup':
                    e.preventDefault();
                    this.video.volume = Math.min(1, this.video.volume + 0.1);
                    this.volumeSlider.value = this.video.volume * 100;
                    break;
                case 'arrowdown':
                    e.preventDefault();
                    this.video.volume = Math.max(0, this.video.volume - 0.1);
                    this.volumeSlider.value = this.video.volume * 100;
                    break;
            }
        });
    }

    togglePlay() {
        if (this.video.paused) {
            this.video.play();
        } else {
            this.video.pause();
        }
    }

    updateProgress() {
        const percent = (this.video.currentTime / this.video.duration) * 100;
        this.progressFilled.style.flexBasis = `${percent}%`;
    }

    scrub(e) {
        if (e.buttons !== 1) return;
        const scrubTime = (e.offsetX / this.progressBar.offsetWidth) * this.video.duration;
        this.video.currentTime = scrubTime;
    }

    updateTimeDisplay() {
        const current = formatTime(this.video.currentTime);
        const duration = formatTime(this.video.duration);
        this.timeDisplay.textContent = `${current} / ${duration}`;
    }

    updateVolumeIcon(volume) {
        let icon;
        if (volume === 0 || this.video.muted) {
            icon = '<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';
        } else if (volume < 0.5) {
            icon = '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>';
        } else {
            icon = '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
        }
        this.volumeButton.innerHTML = icon;
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.container.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}
