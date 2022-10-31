'use strict';


const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');



class workout {
   
#date = new Date();
id = (Date.now() + '').slice(-10);

constructor(coords, distance, duration) {
    this.coords = coords;//[lat,lng]
    this.distance = distance;//in km
    this.duration = duration;// in min

    // prettier-ignore
     this.months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
}



}

class Running extends workout {

    type = 'running';
    description = `running on ${this.months[new Date().getMonth()]} ${new Date().getDate()}`
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcpace();
    }

    calcpace() {
        // min/km
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends workout {

    type = 'cycling';
    description = `cycling on ${this.months[new Date().getMonth()]} ${new Date().getDate()}`
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calSpeed();
    }

    calSpeed() {
        // km/hr
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}


///////////////////////////////////////////////////
//APPLICATION ARCHITECTURE
class App {

    #map
    #mapZoomLevel=14;
    #mapevent
    #workouts = [];

    constructor() {
        this._getPosition();

        form.addEventListener('submit', this._newWorkout.bind(this));

        inputType.addEventListener('change', this._toggleElevationField.bind(this));
   
        containerWorkouts.addEventListener('click',this._moveToPopup.bind(this));
         
        //fetching data from local storage
        this._getLocalStorage();
       
    }

    _getPosition() {

        // using geolocation API
        navigator.geolocation.getCurrentPosition(this._loadmap.bind(this), function () {
            console.log("not able to get location :-(")
        })

    }

    _loadmap(position) {

        // console.log(position);
        const { latitude, longitude } = position.coords;

        // creating location url for google maps
        // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

        const coordinates = [latitude, longitude];

        //displaying map
        this.#map = L.map('map').setView(coordinates, this.#mapZoomLevel);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);


        this.#map.on('click', this._showform.bind(this));

        this.#workouts.forEach(work=>this._renderWorkoutPopup(work));
    }

    _showform(mape) {

        // display the input form when map is clicked 

        this.#mapevent = mape;
        form.classList.remove('hidden');
        inputDistance.focus();

    }

    _toggleElevationField() {

        // toggling input form according to the input type
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');

    }

    _newWorkout(e) {
         
        e.preventDefault();
      
        form.classList.add('hidden');

        //helper functions
        const validInput = (...elements) => elements.every(ele => Number.isFinite(ele));
        const allPositive = (...elements) => elements.every(ele => ele > 0);

        //accept inputs from form
        const type = inputType.value;
        const distance = +inputDuration.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapevent.latlng;

        let workout;
        // if workout cycling create cycling object

        if (type === 'cycling') {

            const elevation = +inputElevation.value;
            // check for valid inputs
            if (!validInput(distance, duration, elevation) || !allPositive(distance, duration)) return alert('inputs must be a positive number');

            workout = new Cycling([lat, lng], distance, duration, elevation);

         
            //add object to workout array
            this.#workouts.push(workout);
        }


        //if workout running  create running object
        if (type === 'running') {

            const cadence = +inputCadence.value;

            if (!validInput(distance, duration, cadence) || !allPositive(distance, duration, cadence)) return alert('inputs must be a positive number');

            workout = new Running([lat, lng], distance, duration, cadence);

            //add object to workout array
            this.#workouts.push(workout);

        }



        // display popup for that workout on map

       

        inputElevation.value = inputCadence.value = inputDuration.value = inputDistance.value = '';

        // display popup on the map when input is given by user 
        this._renderWorkoutPopup(workout);

        // display workout on the list
        this._renderWorkout(workout);
         
       //store workout in local storage
       this._setLocalStorage(); 
    }

    _renderWorkoutPopup(workout) {

        L.marker(workout.coords).addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`,
            })).setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
            .openPopup();
    }


    _renderWorkout(workout) {

        let html =
            `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
        `;

        if (workout.type === 'running') {
            html +=
                `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
            `
        }

        if (workout.type === 'cycling') {
            html +=
                `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li> 
            `
        }

        form.insertAdjacentHTML('afterend', html);

    }

    _moveToPopup(e){
        const workoutEl=e.target.closest('.workout');

        if(!workoutEl) return;

        const workout= this.#workouts.find(work=>work.id===workoutEl.dataset.id);

        this.#map.setView(workout.coords,this.#mapZoomLevel);
    }

    _setLocalStorage(){

        localStorage.setItem('workouts',JSON.stringify(this.#workouts));
    }

    _getLocalStorage(){
       
        const data=JSON.parse(localStorage.getItem('workouts'));

        if(!data)return ;

        this.#workouts=data;

        this.#workouts.forEach(work=>this._renderWorkout(work));
    }

    // for resetting the application
    Reset(){
        localStorage.removeItem('workouts');
        location.reload();
    }
}

const app = new App;
///////////////////////////////////////////////////////////
