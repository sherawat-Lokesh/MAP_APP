'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  #clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    //prettier-ignore
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]}${this.date.getDate()}`;
  }
  _click() {
    this.#clicks++;
  }
}
class running extends workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this._setDescription();
    this.calcPace();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace; //min/km
  }
}
class cycling extends workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed; //km/h
  }
}

class App {
  #map;
  #mapZoom = 10;
  #mapEvent;
  #workout = [];
  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    //prettier-ignore
    containerWorkouts.addEventListener('click',this._moveToPopup.bind(this));
    this._getLocalStorage();
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('loaction not found!');
        }
      );
    }
  }

  _loadMap(position) {
    // console.log(position);
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoom);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
    this.#workout.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapEvents) {
    this.#mapEvent = mapEvents;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    //prettier-ignore
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value ='';
    form.style.display = 'none';
    form.classList.add('hidden');
    //prettier-ignore
    setTimeout(() => form.style.display = 'grid', 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    const validateInput = (...input) =>
      input.every(val => Number.isFinite(val));

    const allPositive = (...input) => input.every(val => val >= 0);

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !validateInput(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Input number is not positive');

      workout = new running([lat, lng], distance, duration, cadence);
    }
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validateInput(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Input number is not positive');

      workout = new cycling([lat, lng], distance, duration, elevation);
    }
    //add new object to workout array
    this.#workout.push(workout);
    // reneder workout on map marker
    this._renderWorkoutMarker(workout);
    // render workout on list
    this._renderWorkout(workout);
    //hide form and clear all inuts
    this._hideForm();
    //set local storage to all workout
    this._setLocalStorage();
  }
  _renderWorkoutMarker(workout) {
    //prettier-ignore

    L.marker(workout.coords).addTo(this.#map).bindPopup(L.popup({
          maxWidth: 200,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })).setPopupContent(`${workout.type === 'running' ? '🏃🏻‍♂️' : '🚴🏻'}${workout.description}`).openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details"
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃🏻‍♂️' : '🚴🏻'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    if (workout.type === 'running')
      html += `<div class="workout__details">
                      <span class="workout__icon">⚡️</span>
                      <span class="workout__value">${workout.pace}</span>
                      <span class="workout__unit">min/km</span>
                    </div>
                    <div class="workout__details">
                      <span class="workout__icon">🦶🏼</span>
                      <span class="workout__value">${workout.cadence}</span>
                      <span class="workout__unit">spm</span>
                    </div>
                    </li>`;

    if (workout.type === 'cycling')
      html += `
                      <div class="workout__details">
                      <span class="workout__icon">⚡️</span>
                      <span class="workout__value">${workout.speed.toFixed(
                        1
                      )}</span>
                      <span class="workout__unit">km/h</span>
                    </div>
                    <div class="workout__details">
                      <span class="workout__icon">⛰</span>
                      <span class="workout__value">${
                        workout.elevationGain
                      }</span>
                      <span class="workout__unit">m</span>
                    </div>
                  </li>`;
    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup(e) {
    const popElement = e.target.closest('.workout');
    if (!popElement) return;

    const workout = this.#workout.find(
      work => work.id === popElement.dataset.id
    );
    this.#map.setView(workout.coords, this.#mapZoom, {
      animate: true,
      pan: { duration: 1 },
    });
    // workout._click();   =>//// it will not wrok after we get data from localstroage because in local storage data is string then we convert it back to array and then get data so some methods we used as chaining will not work
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workout));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;
    this.#workout = data;
    this.#workout.forEach(work => {
      this._renderWorkout(work);
    });
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}
const app = new App();
