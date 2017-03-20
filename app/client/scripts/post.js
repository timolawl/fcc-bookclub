'use strict';

// socket io -- the cdnjs script is in the HTML template above this script file
var socket = io();

window.onload = function () {


  var logStatus = document.querySelector('.mainbox__log-button').textContent;

  var logoBtn = document.querySelector('.bn-logo--link').addEventListener('click', e => {
    sessionStorage.removeItem('searchLocation');
    location.href = '/';
  });

  var searchInput;

  // if a search of a previous session has been completed..
  if (sessionStorage.getItem('searchLocation')) {
    searchInput = sessionStorage.getItem('searchLocation');
  }
  else searchInput = '';

  if (searchInput) {
    document.querySelector('.mainbox__search--input').value = searchInput;
    // move items to top
    toggleView(searchInput.length, false, logStatus);
        // generate results
    conductSearch(searchInput);
  }


  // show modal on clicking the log in button
  Array.prototype.forEach.call(document.querySelectorAll('.mainbox__log-button'), el => el.addEventListener('click', () => {
    if (logStatus === 'Log In') {
      document.querySelector('.overlay').classList.remove('visibility--hide');
      document.querySelector('.modal').classList.remove('display--hide');
    }
    else if (logStatus === 'Log Out') {
      sessionStorage.removeItem('searchLocation');
      document.querySelector('.mainbox__search--input').value = '';
      
      //basically conductSearch in reverse
      document.querySelector('.bar-list').classList.add('visibility--hide');
      document.querySelector('footer').classList.add('footer--unsearched');
      if (document.querySelector('.mainbox').classList.contains('mainbox--top')) {
        toggleView(0, true, logStatus); // passing a length of 0
      }
      location.href = '/logout'; 
    }
  }));

  // on submit, reveal results and unfix the display of footer
  document.querySelector('.mainbox__search').addEventListener('click', e => {
    searchInput = document.querySelector('.mainbox__search--input').value;
    // on submit button press and with content in input box:
    if (e.target.classList.contains('mainbox__search--submit') && searchInput) { // submit button pressed with inputted content
      // emit socket
      // server side environmental variables are needed so the ajax call is better off not performed here
      conductSearch(searchInput);
    }
  });

  document.querySelector('.mainbox__search').addEventListener('keyup', e => {
    // on mainbox focus and enter key press with content in input box:
    searchInput = document.querySelector('.mainbox__search--input').value;
    var key = e.which || e.keyCode;
    if (key === 13 && searchInput) { // on enter key press
      conductSearch(searchInput);
    }
  });


  // when there is input, change view to have search bar at the top of the page
  document.querySelector('.mainbox__search--input').addEventListener('input', e => {
    toggleView(e.target.value.length, false, logStatus);
  });

  // When the modal close button or the overlay is clicked, exit the modal condition
  document.querySelector('.social-login__close').addEventListener('click', () => {
    document.querySelector('.overlay').classList.add('visibility--hide');
    document.querySelector('.modal').classList.add('display--hide');
  });
  
  document.querySelector('.overlay').addEventListener('click', () => {
    document.querySelector('.overlay').classList.add('visibility--hide');
    document.querySelector('.modal').classList.add('display--hide');
  });

};


function conductSearch (searchValue) {
  // remove previous results
  if (document.querySelector('.masonry-element')) {
    let bars = document.querySelector('.bar-list');
    bars.style = 'position: relative';
    document.querySelector('footer').classList.add('footer--unsearched');

    while (bars.firstChild) {
      bars.removeChild(bars.firstChild);
    }
  }
  // show cog loader while loading...
  document.querySelector('.bar-list__loader').classList.remove('display--hide');
  // send request to server to send request to yelp API
  socket.emit('bar search', { location: searchValue });
  // store the most recent search location in sessionStorage
  sessionStorage.setItem('searchLocation', searchValue);


}

function toggleView (inputLength, logoutAction, logStatus) {
  // if there is content and the top display is not already displayed, then toggle
  // or if there is no content and regular display is not already displayed, then toggle
  if ((inputLength && !document.querySelector('.mainbox').classList.contains('mainbox--top')) || logoutAction) {
    document.querySelector('.mainbox').classList.toggle('mainbox--top'); // move mainbox to top
    document.querySelector('.mainbox__search').classList.toggle('mainbox__search--top'); // left-aign search input
    document.querySelector('.mainbox__title-row').classList.toggle('display--hide');
    document.querySelector('.mainbox__title-row--top').classList.toggle('display--hide');
    document.querySelector('.mainbox__subtitle-row').classList.toggle('display--hide');
    document.querySelector('.mainbox__log-row').classList.toggle('display--hide');
    document.querySelector('.mainbox__log-row--top').classList.toggle('display--hide');
    
    if (logStatus === 'Log Out') {
      document.querySelector('.mainbox__login-details--top').classList.toggle('display--hide');
    }
    
  }
}

socket.on('bar results', function (data) {
  const yelpReviews = data.reviews;
  let listings = document.createDocumentFragment();
  listings.className = 'visibility--hide';
  let masonrySizer = document.createElement('div');
  masonrySizer.className = 'masonry-element--sizer';
  listings.appendChild(masonrySizer);
  for (let listingNumber = 0; listingNumber < yelpReviews.length; listingNumber++) {
    createListing(yelpReviews[listingNumber], listings);
  }

  let images = listings.querySelectorAll('.img-fluid');

  imagesLoaded(images, () => { // after all images have been loaded on the fragment

    document.querySelector('.bar-list__loader').classList.add('display--hide');
    document.querySelector('.bar-list').appendChild(listings); // append the fragment
    Array.prototype.forEach.call(document.querySelectorAll('.going-button'), el => {
      el.addEventListener('click', e => {
        // check login status
        // not logged in
        if (document.querySelector('.mainbox__log-button').textContent === 'Log In') {
          // show modal
          document.querySelector('.overlay').classList.remove('visibility--hide');
          document.querySelector('.modal').classList.remove('display--hide');
          // save the 'going' choice..?

        }
        // logged in
        else {
          let event = e.target;
          while (!event.classList.contains('button')) {
            event = event.parentNode;
          }
          let barID = event.parentNode.querySelector('h6').classList[0];
          // already going, but clicked to decide to not go
          let goingCount = event.querySelector('.going-badge');
          if (event.classList.contains('bar__attending')) {
            event.classList.remove('bar__attending');
            goingCount.textContent = parseInt(goingCount.textContent) - 1;
            socket.emit('remove attendance', { bar: barID });
          }
          // if not going, but clicked to go
          else {
            event.classList.add('bar__attending');
            goingCount.textContent = parseInt(goingCount.textContent) + 1;
            socket.emit('add attendance', { bar: barID });
          }
        }
        // check if already counted if logged in
        // if counted and logged in, remove count and update db
        // if not counted and logged in, add to count and update db
      });
    });
    // start masonry
    var msnry = new Masonry(document.querySelector('.bar-list'), {
      itemSelector: '.masonry-element',
      columnWidth: '.masonry-element--sizer',
      percentPosition: true
    });

    document.querySelector('footer').classList.remove('footer--unsearched');
  });
});

function createListing (business, listings) {
  let widthContainer = document.createElement('div');
  widthContainer.className = 'masonry-element'; // column medium-4 large-4';
  listings.appendChild(widthContainer);
  let card = document.createElement('div');
  card.className = 'card';
  widthContainer.appendChild(card);
  let cardSection = document.createElement('div');
  cardSection.className = 'card-section text-center';
  card.appendChild(cardSection);
  let img = document.createElement('img');
  img.className = 'img-fluid img-thumbnail mx-auto d-block';
  img.src = business.image_url;
  cardSection.appendChild(img);
  let barTitle = document.createElement('h6');
  barTitle.className = business.id;
  let barLink = document.createElement('a');
  barLink.className = 'bar__title';
  barLink.href = business.url;
  barLink.textContent = business.name;
  barTitle.appendChild(barLink);
  cardSection.appendChild(barTitle);
  let barReview = document.createElement('p');
  barReview.className = 'card-text text-justify';
  barReview.textContent = business.excerpt;
  cardSection.appendChild(barReview);
  let goingButton = document.createElement('button');
  goingButton.className = 'button secondary going-button';
  if (business.attending) {
    goingButton.classList.add('bar__attending');
  }
  goingButton.setAttribute('type', 'button');
  cardSection.appendChild(goingButton);
  let goingCount = document.createElement('span');
  goingCount.className = 'badge primary going-badge';
  goingCount.textContent = business.guestCount || '0';
  goingButton.appendChild(goingCount);
  let goingText = document.createElement('span');
  goingText.className = 'bar__going--text';
  goingText.textContent = 'Going';
  goingButton.appendChild(goingText);
}

socket.on('update', function (data) {
  // if the bar can be found, then update the bar
  Array.prototype.forEach.call(document.querySelectorAll('h6'), el => {
    if (el.className === data.bar.name) {
      el.parentNode.querySelector('.going-badge').textContent = data.bar.guestCount;
    }
  });
});
