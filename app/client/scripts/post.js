'use strict';

// socket io -- the cdnjs script is in the HTML template above this script file
const host = 'timolawl-bookclub.herokuapp.com';
var socket = io();
/*
if (host == location.host) {
  socket = io.connect('https://timolawl-voting.herokuapp.com:5000');
}
else socket = io.connect('//localhost:5000');
*/

function checkForm (path) {
    // on form change or on group of input change, test
    const form = document.querySelector('form');
    // need live nodelist since add/deleting:
    const inputs = document.getElementsByClassName('form__input');
    const submitBtn = document.querySelector('input[type="submit"]');
    submitBtn.disabled = true;
    //const inherentBtnColor = submitBtn.style.background;
    //submitBtn.style.background = 'gray';
    // better way would be to fade it out with a blend? overlay?

    function validateInput () {
        let unique, pw, pwConfirm;

        submitBtn.disabled = true;

        if (Array.from(inputs).every(input => input.value.match(input.getAttribute('pattern')))) {
            if (path === 'createpoll' && inputs.length >= 3) {
                unique = new Set(Array.from(inputs).map(input => input.value));
                if (inputs.length === unique.size)
                    submitBtn.disabled = false;
            }
            else if (path !== 'createpoll') {
                if (path === 'signup') {
                    pw = form.querySelector('.form__input--password');
                    pwConfirm = form.querySelector('.form__input--confirm');
                    if (pw.value === pwConfirm.value) {
                        pw.style.outline = 'initial';
                        pwConfirm.style.outline = 'initial';
                        submitBtn.disabled = false;
                    }
                    else {
                        pw.style.outline = '1px solid red';
                        pwConfirm.style.outline = '1px solid red';
                    }
                }
                else submitBtn.disabled = false;
            }
        }
    }
    form.onkeyup = validateInput;
    form.onclick = validateInput;
}

window.onload = function () {
  // socket io logic:
  if (location.pathname.match(/^\/$/)) // if home path
    socket.emit('change room', { room: location.pathname }); // '/'

  if (location.pathname.match(/^\/(?:allbookshelves|mybookshelf)\/?$/i))
    socket.emit('change room', { room: location.pathname.toLowerCase().slice(1) });

  if (location.pathname.match(/^\/(?:signup|login|settings|allbookshelves|mybookshelf)\/?/i))
    socket.emit('leave room', { path: location.pathname.toLowerCase().slice(1) });

/****************/    

  if (location.pathname.match(/^\/$/)) {
    setTimeout(() => { playSplashPageAnimation(0) }, 1500); // start from the first index of 0.
  }

  if (location.pathname.match(/^\/(?:signup|login)\/?$/i)) {
    // clear out form
    document.querySelector('form').reset();
    // gray out submit button until everything is filled in.
    checkForm(location.pathname.toLowerCase().slice(1));
  }

  if (location.pathname.match(/^\/allbookshelves\/?$/i)) {
    socket.on('CREATE.book.render', data => {
      // add book to the front of the book list
      displayBook(data.book, false);

    });

    socket.emit('READ.bookshelves.all', {});

    socket.on('READ.book.render', data => {
      displayPreview(data.book, 'internal');
    });

    socket.on('READ.bookshelves.all.render', data => {
      // display all books in order:
      for (let i = 0; i < data.books.length; i++) {
        displayBook(data.books[i], false);
      }
    });

    socket.on('UPDATE.bookshelves.render', data => {
      
    });

    // socket.emit -> READ.bookshelf.query
    document.querySelector('.search__bar__submit').addEventListener('click', e => {
      let userInput = document.querySelector('.search__bar__input--allbookshelves').value;
        socket.emit('READ.bookshelves.query', { search: userInput.replace(/\$/g, '') });
    });

    socket.on('READ.bookshelves.query.render', data => {
      renderQuery(data);
    });

  }

/************************************************************/

  if (location.pathname.match(/^\/mybookshelf\/?$/i)) {
    socket.on('CREATE.book.render', data => {
      displayBook(data.book, false);
    });

    socket.emit('READ.bookshelf.all', {});

    socket.on('READ.book.render', data => {
      displayPreview(data.book, 'internal');
    });


    socket.on('READ.bookshelf.all.render', data => {
      for (let i = 0; i < data.books.length; i++) {
        displayBook(data.books[i], false);
      }
    });

    socket.on('UPDATE.bookshelf.render', data => {
      // add newly created book to the bookshelf
      // remove old book
      
    });


    // add -> CREATE.book
    // find -> READ.bookshelf.query
    document.querySelector('.search__bar__submit').addEventListener('click', e => {
      // check the select option first
      let selectOption = document.querySelector('.search__bar__option').value;
      let userInput = document.querySelector('.search__bar__input--mybookshelf').value;
      
      if (selectOption === 'add') {
        // search using google API
        // sanitize input, then ajax -> to populate the preview section?
        let queryURL = 'https://www.googleapis.com/books/v1/volumes?q=' + userInput;
        let encodedURL = encodeURI(queryURL);
        let fetchHeaders = { method: 'GET', headers: { accept: 'application/json' } };
        fetch(encodedURL, fetchHeaders)
          .then(res => res.json())
          .then(json => {
            if (json.totalItems) // if there are items.
              displayPreview(json, 'external');
            else console.log('There are no books found with the given search criteria.');
          })          
      }
      else if (selectOption === 'find') {
        // search current bookshelf/bookshelves for the book in question via permalink?
        // to use good search, can go through google api again, but that requires keeping the
        // google generated book id (permalink?)
        // otherwise, the search has to be perfect by title or author
        // (isn't this always the case though?)
        // should this search go through the db for integrity? going through
        // client side only doesn't really work for large libraries.
        // is this where socket is used?

        // replace all instances of the dollar sign to prevent NoSQL injection attack
        socket.emit('READ.bookshelf.query', { search: userInput.replace(/\$/g, '') });
      }
    });

    socket.on('READ.bookshelf.query.render', data => {
      renderQuery(data);
    });

  }
};

/*******************************************/

// splash animation for the index page
function playSplashPageAnimation (index) {
  let words = ['ideas', 'adventure', 'inspiration', 'books', 'swap'];

  // on transition end, start new transition. no need to add delay
  let el = document.querySelector('.transition--' + words[index]);
  el.classList.remove('is-invisible');
  el.classList.remove('move-down-fade-in'); // the transition

  if (!index) { // first element -- ideas
    el.classList.add('move-down-fade-out');
    playSplashPageAnimation(index + 1); // start immediately to align w/ other transitions
  }

  if (index === words.length - 1) { // last element -- swap
    el.classList.add('translate--post');
    document.querySelector('.banner__title--pre').classList.add('translate--pre');
    setTimeout(() => { document.querySelector('.transition--books').lastChild.classList.add('is-invisible') }, 10); // timeout solution for the problem of the invisible 'Book' being removed after 'Books' invisibility is processed...
  }

  el.addEventListener('transitionend', function handleEvent(e) {
    if (el.classList.contains('move-down-fade-out')) {
      playSplashPageAnimation(index + 1);
      el.removeEventListener('transitionend', handleEvent);
    }

    // check if it's the right transition that finished
    else if (e.propertyName === 'opacity') {
      if (index < words.length - 2) {
        el.classList.add('move-down-fade-out');
      }
      else if (words[index] === 'books') { // basically if it gets here, it's 1 before the last
        playSplashPageAnimation(index + 1);
        el.removeEventListener('transitionend', handleEvent);
      }
    }
  });
}

// populate preview after a book search - what if not 'search to add'
function displayPreview (data, source) {
  let bookObject = {};

  if (source === 'external') { // google api
    let json = data;

    bookObject.title = json.items[0].volumeInfo.title;
    bookObject.author = json.items[0].volumeInfo.authors;
    bookObject.description = json.items[0].volumeInfo.description;
    bookObject.thumbnail = json.items[0].volumeInfo.imageLinks.thumbnail;
    bookObject.link = json.items[0].volumeInfo.canonicalVolumeLink;
    json.items[0].volumeInfo.industryIdentifiers.forEach(id => {
      if (id.type === 'ISBN_10')
        bookObject.ISBN_10 = id.identifier;
      else if (id.type === 'ISBN_13')
        bookObject.ISBN_13 = id.identifier;
    });


    // event listener function
    function createBook () {
      socket.emit('CREATE.book', bookObject);
      // cleanup - otherwise it will keep adding the first book
      document.querySelector('.preview__submit').removeEventListener('click', createBook);
    }

    document.querySelector('.preview__submit').classList.remove('is-not-displayed');

    document.querySelector('.preview__submit').addEventListener('click', createBook);
  }
  else if (source === 'internal') {
    // remove the add button - internal source means the display preview is generated from a
    // click of one of the book images
    if (document.querySelector('.preview__submit')) {
      document.querySelector('.preview__submit').removeEventListener('click', createBook);
      // hide the icon as well.
      document.querySelector('.preview__submit').classList.add('is-not-displayed');
    }
    

    bookObject.title = data.title;
    bookObject.author = data.author;
    bookObject.description = data.description;
    //bookObject.thumbnail = data.thumbnail; // not needed for preview
    bookObject.link = data.link;
    // ISBNs also not needed for preview
  }
  
  console.log(bookObject);
  document.querySelector('.preview__link').textContent = bookObject.title;
  document.querySelector('.preview__link').href = bookObject.link;
  let authorsLength = bookObject.author.length;
  let authorsArray = bookObject.author;
  if (authorsLength > 2) {
    let lastAuthor = 
    authorsArray[authorsArray.length - 1] = 'and ' +
      authorsArray[authorsArray.length - 1];
    document.querySelector('.preview__author').textContent = authorsArray.join(', ');;
  }
  else if (authorsLength > 1) {
    document.querySelector('.preview__author').textContent = authorsArray.join(' and ');
  }
  else document.querySelector('.preview__author').textContent = authorsArray[0];
  document.querySelector('.preview__description').textContent = bookObject.description;



  // display the preview
  document.querySelector('.wrapper--preview').classList.remove('is-not-displayed');



}

// add/display book to bookshelf/bookshelves
function displayBook (book, queryEvent) {
  let fragment = new DocumentFragment();
  // mvp - img and data.id
  let newImg = document.createElement('img');
  newImg.classList.add('book__image');
  newImg.src = book.thumbnail;

  let newDiv = document.createElement('div');
  newDiv.classList.add('book');
  newDiv.classList.add('data-id=' + book._id);
  newDiv.appendChild(newImg);

  // on click shows the preview for the book
  newDiv.addEventListener('click', e => {
    //console.log(book);
    socket.emit('READ.book', { bookId: book._id });
    
  });

  fragment.appendChild(newDiv);
  if (queryEvent) {
    document.querySelector('.bookshelf--query').appendChild(fragment);
  }
  else document.querySelector('.bookshelf--complete').appendChild(fragment);

}



function renderQuery (data) {
// hide the 'all' results
  document.querySelector('.bookshelf--complete').classList.add('is-not-displayed');

  let bookshelfQuery = document.querySelector('.bookshelf--query');
  let bookshelfComplete = document.querySelector('.bookshelf--complete');
  let wrapperQuery = document.querySelector('.wrapper--query');

  // clear out old query results from element
  while (bookshelfQuery.hasChildNodes()) {
    bookshelfQuery.removeChild(bookshelfQuery.lastChild);
  }

  console.log(data);

  document.querySelector('.query__description__query-string').textContent = data.query;
  document.querySelector('.query__close').addEventListener('click', () => {
    bookshelfComplete.classList.remove('is-not-displayed');
    wrapperQuery.classList.add('is-not-displayed');
    bookshelfQuery.classList.add('is-not-displayed');
  });
  bookshelfComplete.classList.add('is-not-displayed');
  wrapperQuery.classList.remove('is-not-displayed');
  bookshelfQuery.classList.remove('is-not-displayed');


  if (data.books.length) { // if there exists results
    for (let i = 0; i < data.books.length; i++) {
      displayBook(data.books[i], true);
    }
  }
  else {
    let newDiv = document.createElement('div');
    newDiv.textContent = 'No results match the query.';
    newDiv.classList.add('no-result');
    
    document.querySelector('.bookshelf--query').appendChild(newDiv);

   // document.querySelector('.bookshelf--no-results').classList.remove('is-not-displayed');
    // display an empty result
  }
}
