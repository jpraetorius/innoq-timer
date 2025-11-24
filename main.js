// INNOQ Timer web component powered by the light DOM
class InnoqTimerElement extends HTMLElement {
  constructor() {
    super();
    this.totalSeconds = 0;
    this.isRunning = false;
    this.intervalId = null;
    this._eventsBound = false;
    this.remainingDuration = this.secondsToDuration(0);
    this.durationFormatter = new Intl.DurationFormat(undefined, {
          style: 'digital',
          hours: '2-digit',
          minutes: '2-digit',
          seconds: '2-digit'
        });
  }

  static get observedAttributes() {
    return ['offsetinminutes'];
  }

  connectedCallback() {
    if (!this.form || !this.hourInput || !this.minuteInput) {
      return;
    }

    if (!this._eventsBound) {
      this.bindEvents();
    }

    this.applyOffsetFromAttribute();
    if (this.hourInput) {
      this.hourInput.focus();
    }
  }

  disconnectedCallback() {
    this.removeEvents();
    this.clearTimerInterval();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.isConnected || oldValue === newValue) {
      return;
    }

    if (name === 'offsetinminutes') {
      this.applyOffsetFromAttribute();
    }
  }

  get form() {
    return this.querySelector('#timer-input-form');
  }

  get hourInput() {
    return this.querySelector('#hour-input');
  }

  get minuteInput() {
    return this.querySelector('#minute-input');
  }

  get stopBtn() {
    return this.querySelector('#stop-btn');
  }

  get resetBtn() {
    return this.querySelector('#reset-btn');
  }

  get remainingTime() {
    return this.querySelector('#remaining-time');
  }

  get countdownTargetTime() {
    return this.querySelector('#countdown-target-time');
  }

  get inputSection() {
    return this.querySelector('#timer-input');
  }

  get displaySection() {
    return this.querySelector('#timer-display');
  }

  get offsetInMinutesAttribute() {
    const value = this.getAttribute('offsetinminutes');
    if (value == null) {
      return null;
    }
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  bindEvents() {
    if (!this.hourInput || !this.minuteInput || !this.form) {
      return;
    }

    this._hourInputListener = () => {
      this.updateTargetTimeDisplay();
    };
    this.hourInput.addEventListener('input', this._hourInputListener);

    this._minuteInputListener = () => {
      this.updateTargetTimeDisplay();
    };
    this.minuteInput.addEventListener('input', this._minuteInputListener);

    this._formSubmitListener = (event) => {
      event.preventDefault();
      this.handleStart();
    };
    this.form.addEventListener('submit', this._formSubmitListener);

    if (this.stopBtn) {
      this._stopClickListener = () => this.handleStop();
      this.stopBtn.addEventListener('click', this._stopClickListener);
    }

    if (this.resetBtn) {
      this._resetClickListener = () => this.handleReset();
      this.resetBtn.addEventListener('click', this._resetClickListener);
    }

    this._eventsBound = true;
  }

  removeEvents() {
    if (!this._eventsBound) {
      return;
    }

    if (this.hourInput && this._hourInputListener) {
      this.hourInput.removeEventListener('input', this._hourInputListener);
    }
    if (this.minuteInput && this._minuteInputListener) {
      this.minuteInput.removeEventListener('input', this._minuteInputListener);
    }
    if (this.form && this._formSubmitListener) {
      this.form.removeEventListener('submit', this._formSubmitListener);
    }
    if (this.stopBtn && this._stopClickListener) {
      this.stopBtn.removeEventListener('click', this._stopClickListener);
    }
    if (this.resetBtn && this._resetClickListener) {
      this.resetBtn.removeEventListener('click', this._resetClickListener);
    }

    this._hourInputListener = null;
    this._minuteInputListener = null;
    this._formSubmitListener = null;
    this._stopClickListener = null;
    this._resetClickListener = null;
    this._eventsBound = false;
  }

  secondsToDuration(totalSeconds) {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;
    return { hours, minutes, seconds };
  }

  durationToSeconds(duration) {
    if (!duration) {
      return 0;
    }
    const hours = Number(duration.hours || 0);
    const minutes = Number(duration.minutes || 0);
    const seconds = Number(duration.seconds || 0);
    return hours * 3600 + minutes * 60 + seconds;
  }

  applyOffsetFromAttribute() {
    if (this.isRunning) {
      return;
    }

    const offset = this.offsetInMinutesAttribute;
    if (offset == null) {
      return;
    }

    if (!this.hourInput || !this.minuteInput) {
      return;
    }

    const now = new Date();
    now.setMinutes(now.getMinutes() + offset);
    this.hourInput.value = now.getHours().toString().padStart(2, '0');
    this.minuteInput.value = now.getMinutes().toString().padStart(2, '0');
    this.updateTargetTimeDisplay();
  }

  getTimeValues() {
    if (!this.hourInput || !this.minuteInput) {
      return null;
    }

    const hourValue = this.hourInput.value.trim();
    const minuteValue = this.minuteInput.value.trim();

    if (!hourValue || !minuteValue) {
      return null;
    }

    const hours = parseInt(hourValue, 10);
    const minutes = parseInt(minuteValue, 10);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return null;
    }

    return { hours, minutes };
  }

  parseTimeInput() {
    const values = this.getTimeValues();
    if (!values) {
      return 0;
    }

    const { hours, minutes } = values;

    const now = new Date();
    const targetDate = new Date(now.getTime());
    targetDate.setHours(hours, minutes, 0, 0);

    // if the target time is before now, assume it is tomorrow
    if (targetDate <= now) {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    const diffInMs = targetDate.getTime() - now.getTime();
    return Math.max(0, Math.floor(diffInMs / 1000));
  }

  formatTime(duration) {
    if (!duration) {
      return '00:00';
    }

    if (this.durationFormatter) {
      return this.durationFormatter.format(duration);
    }
  }

  updateDisplay() {
    if (this.remainingTime) {
      this.remainingTime.textContent = this.formatTime(this.remainingDuration);
    }
  }

  updateTargetTimeDisplay() {
    if (!this.countdownTargetTime) {
      return;
    }

    if (this.form && !this.form.checkValidity()) {
      this.countdownTargetTime.textContent = '';
      return;
    }

    const values = this.getTimeValues();
    if (!values) {
      this.countdownTargetTime.textContent = '';
      return;
    }

    const { hours, minutes } = values;
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    this.countdownTargetTime.textContent = formattedTime;
  }

  handleStart() {
    if (!this.form || !this.form.checkValidity()) {
      return;
    }

    const totalSeconds = this.parseTimeInput();
    this.totalSeconds = totalSeconds;
    this.remainingDuration = this.secondsToDuration(totalSeconds);

    if (totalSeconds <= 0) {
      return;
    }

    this.isRunning = true;
    this.updateDisplay();
    this.updateTargetTimeDisplay();

    // switch from input display to timer display
    if (this.inputSection) {
      this.inputSection.classList.add('hidden');
    }
    if (this.displaySection) {
      this.displaySection.classList.remove('hidden');
    }
    if (this.remainingTime) {
      this.remainingTime.classList.add('running');
    }

    this.startCountdown();
  }

  handleStop() {
    this.isRunning = false;
    this.clearTimerInterval();
    this.totalSeconds = 0;
    this.remainingDuration = this.secondsToDuration(0);

    this.resetUI();
    this.applyOffsetFromAttribute();
  }

  handleReset() {
    this.isRunning = false;
    this.totalSeconds = 0;
    this.remainingDuration = this.secondsToDuration(0);
    this.clearTimerInterval();
    this.resetUI();
    this.applyOffsetFromAttribute();

    if (this.hourInput) {
      this.hourInput.focus();
    }

  }

  resetUI() {
    if (this.inputSection) {
      this.inputSection.classList.remove('hidden');
    }
    if (this.displaySection) {
      this.displaySection.classList.add('hidden');
    }
    if (this.stopBtn) {
      this.stopBtn.classList.remove('hidden');
    }
    if (this.resetBtn) {
      this.resetBtn.classList.add('hidden');
    }
    if (this.remainingTime) {
      this.remainingTime.classList.remove('running', 'finished');
    }
    if (this.hourInput) {
      this.hourInput.value = '';
    }
    if (this.minuteInput) {
      this.minuteInput.value = '';
    }
  }

  startCountdown() {
    this.clearTimerInterval();
    this.intervalId = window.setInterval(() => {
      const nextSeconds = Math.max(0, this.durationToSeconds(this.remainingDuration) - 1);
      this.remainingDuration = this.secondsToDuration(nextSeconds);
      this.updateDisplay();

      if (nextSeconds <= 0) {
        this.handleTimerComplete();
      }
    }, 1000);
  }

  clearTimerInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  handleTimerComplete() {
    this.isRunning = false;
    this.clearTimerInterval();

    if (this.stopBtn) {
      this.stopBtn.classList.add('hidden');
    }
    if (this.resetBtn) {
      this.resetBtn.classList.remove('hidden');
    }
    if (this.remainingTime) {
      this.remainingTime.classList.remove('running');
      this.remainingTime.classList.add('finished');
    }

    this.notifyComplete();
  }

  notifyComplete() {
    
  }
}

if (!customElements.get('innoq-timer')) {
  customElements.define('innoq-timer', InnoqTimerElement);
}