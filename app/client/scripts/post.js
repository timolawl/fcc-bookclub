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

    function validateInput () {
        let unique, pw, pwConfirm;

        submitBtn.disabled = true;

        if (Array.from(inputs).every(input => input.value.match(input.getAttribute('pattern')))) {
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
    form.onkeyup = validateInput;
    form.onclick = validateInput;
}

window.onload = function () {
  // socket io logic:
  if (location.pathname.match(/^\/$/)) // if home path
    socket.emit('change room', { room: location.pathname }); // '/'

  else socket.emit('change room', { room: location.pathname.toLowerCase().slice(1) });

  /*
  if (location.pathname.match(/^\/(?:allbookshelves|mybookshelf)\/?$/i))
    socket.emit('change room', { room: location.pathname.toLowerCase().slice(1) });

  if (location.pathname.match(/^\/(?:signup|login|settings|allbookshelves|mybookshelf)\/?/i))
    socket.emit('leave room', { path: location.pathname.toLowerCase().slice(1) });
    */

  

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

  //  socket = io('/allbookshelves'); // change socket name space

    socket.on('CREATE.book.render', data => {
      // add book to the front of the book list
      displayBook(data.book, false);

    });

    socket.on('READ.book.render', data => {
      displayPreview(data.book, 'internal-query');
    });

    socket.emit('READ.bookshelves.all', {});

    
    socket.on('READ.bookshelves.all.render', data => {
      // display all books in order:
      for (let i = 0; i < data.books.length; i++) {
        displayBook(data.books[i], false);
      }
    });

    // from tranaction updates
    socket.on('UPDATE.books.render', data => {
      Array.prototype.forEach.call(document.querySelectorAll('.book'), book => {
        let bookId = book.getAttribute('data-id');
        if (bookId === data.book1 || bookId === data.book2 ) {
          book.removeChild(book.querySelector('book__lock'));
        }
      });
    });

    // socket.emit -> READ.bookshelf.query
    document.querySelector('form').addEventListener('submit', e => {
      e.preventDefault();
      let userInput = document.querySelector('.search__bar__input--allbookshelves').value;
        socket.emit('READ.bookshelves.query', { search: userInput.replace(/\$/g, '') });
    });

    // allow pressing enter to trigger submit as well when input is selected
    //document.querySelector('.search__bar__input--allowbookshelves').addEventListener(

    socket.on('READ.bookshelves.query.render', data => {
      renderQuery(data);
    });

    /*
    socket.on('CREATE.transaction.render', data => {
    });
    */

  }

/************************************************************/

  if (location.pathname.match(/^\/mybookshelf\/?$/i)) {

  //  socket = io('/mybookshelf');

    socket.on('CREATE.book.render', data => {
      displayBook(data.book, false);
    });

    socket.on('READ.book.render', data => {
      displayPreview(data.book, 'internal-query');
    });

    socket.emit('READ.bookshelf.all', {});    

    socket.on('READ.bookshelf.all.render', data => {
      for (let i = 0; i < data.books.length; i++) {
        displayBook(data.books[i], false);
      }
    });


    // from transaction updates
    socket.on('UPDATE.books.render', data => {
      Array.prototype.forEach.call(document.querySelectorAll('.book'), book => {
        let bookId = book.getAttribute('data-id');
        if (bookId === data.book1 || bookId === data.book2 ) {
          book.removeChild(book.querySelector('book__lock'));
        }
      });
    });


    // add -> CREATE.book
    // find -> READ.bookshelf.query
    document.querySelector('form').addEventListener('submit', e => {
      e.preventDefault();
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
              displayPreview(json, 'external-query');
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


    /*
    socket.on('CREATE.transaction.render', data => {
    });
    */

  }

/********************************************/

  if (location.pathname.match(/^\/request\/?$/i)) {

   // socket = io('/request');

    socket.on('READ.book.render', data => {
      displayPreview(data.book, 'internal-request');
    });


    // Step 1: query bookshelves
    // socket.emit -> READ.bookshelves.query
    document.querySelector('.request__section--one form').addEventListener('submit', e => {
      e.preventDefault();
      let userInput = document.querySelector('.request__section--one .search__bar__input').value;
      socket.emit('READ.bookshelves.query', { search: userInput.replace(/\$/g, ''), request: true }); // specify that it is from the request path, and thus will not display own books
    });

    socket.on('READ.bookshelves.query.render', data => {
      renderQuery(data, 'step-one');
    });

    // Step 2: query bookshelf
    document.querySelector('.request__section--two form').addEventListener('submit', e => {
      e.preventDefault();
      let userInput = document.querySelector('.request__section--two .search__bar__input').value;
      socket.emit('READ.bookshelf.query', { search: userInput.replace(/\$/g, ''), request: true });
    });

    socket.on('READ.bookshelf.query.render', data => {
      renderQuery(data, 'step-two');
    });

    // Step 3: confirm step
    //
    /*
    socket.on('CREATE.transaction.render', data => {
    });
    */

  


  }

/********************************************/
  
  if (location.pathname.match(/^\/pending\/?$/i)) {
    socket.emit('READ.transactions.pending', {});

    socket.on('READ.transactions.pending.render', data => {
      populateTransactions(data, 'pending');
    });

    /*
    socket.on('CREATE.transaction.render', data => {
    });
    */


    // from transaction updates
    socket.on('UPDATE.transactions.render', data => {
      let query = `'[data-id="${data.transaction}"]'`;
      if(document.querySelector(query)) {
        document.querySelector(query).parentNode.removeChild(document.querySelector(query));
      }
    });



    
    
    // when others request a book from user or when user requests a book on a different tab
    //socket.on('UPDATE.transactions.render'
  }


  if (location.pathname.match(/^\/completed\/?$/i)) {
    socket.emit('READ.transactions.complete', {});

    socket.on('READ.transactions.complete.render', data => {
      populateTransactions(data, 'completed');
    });

    /*
    socket.on('UPDATE.transactions.render', data => {
      // add the new transaction
    });
    */

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


/***************************************************/


// populate preview after a book search - what if not 'search to add'
function displayPreview (data, source) {
  let bookObject = {};

  let requestSection;
  let currentStep = null;


  // event listener function
  function createBook () {
    socket.emit('CREATE.book', bookObject);
    // cleanup - otherwise it will keep adding the first book
 //   document.querySelector('.preview__submit').removeEventListener('click', createBook);
    document.querySelector('.preview__submit').classList.add('is-not-displayed');
  }

  if (source === 'external-query') { // google api

    // remove any lingering click event listeners from multiple external searches

    let json = data;

    // problem is what happens when some fields are not available, such as thumbnail?
    // check each to prevent error message (currently only using for thumbnail)
    
    bookObject.title = json.items[0].volumeInfo.title;
    bookObject.author = json.items[0].volumeInfo.authors;
    bookObject.description = json.items[0].volumeInfo.description;

    bookObject.thumbnail = checkProperty(json.items[0], 'volumeInfo.imageLinks.thumbnail');

    //bookObject.thumbnail = json.items[0].volumeInfo.imageLinks.thumbnail;
    bookObject.link = json.items[0].volumeInfo.canonicalVolumeLink;
    json.items[0].volumeInfo.industryIdentifiers.forEach(id => {
      if (id.type === 'ISBN_10')
        bookObject.ISBN_10 = id.identifier;
      else if (id.type === 'ISBN_13')
        bookObject.ISBN_13 = id.identifier;
    });

    document.querySelector('.preview__submit').classList.remove('is-not-displayed');

    document.querySelector('.preview__submit').onclick = createBook;
  }
  else {
    // assign to bookObject so that displaying the preview works regardless of source of query
    bookObject.title = data.title;
    bookObject.author = data.author;
    bookObject.description = data.description;
    bookObject.link = data.link;

    if (source === 'internal-query') { // db search for book (non-request path)
      // remove the add button - internal source means the display preview is generated from a
      // click of one of the book images
      if (document.querySelector('.preview__submit')) {
       // document.querySelector('.preview__submit').removeEventListener('click', createBook);
        // hide the icon as well.
        document.querySelector('.preview__submit').classList.add('is-not-displayed');
      }
    }
    else if (source === 'internal-request') { // request section
      if (document.querySelector('.request__section--one .request__step-number').classList.contains('request__step-number--incomplete')) {
        requestSection = document.querySelector('.request__section--one');
        currentStep = 'one';
      }
      else if (document.querySelector('.request__section--two .request__step-number').classList.contains('request__step-number--incomplete')) {
        requestSection = document.querySelector('.request__section--two');
        currentStep = 'two';
      }
      else {
        console.log('This should never happen...');
      }

      requestSection.querySelector('.preview__submit').addEventListener('click', e => {
        // select for request
        // have it show up in the request selection
        requestSection.querySelector('.selection--title').textContent = data.title;
        requestSection.querySelector('.selection--author').textContent = parseAuthorArray(data.author);
        requestSection.querySelector('.request__selection__book-image .book__image').src = data.thumbnail;


        
       // requestSection.querySelector('.wrapper--request__selection').setAttribute('data-id', data._id);


        requestSection.querySelector('.wrapper--request__selection').classList.remove('is-not-displayed');

        requestSection.querySelector('.request__step-number').classList.remove('request__step-number--incomplete');
        requestSection.querySelector('.request__step-number').classList.add('request__step-number--complete');

        
        if (currentStep === 'one') {
          // bring up step two
          requestSection.querySelector('.Request').classList.add('is-not-displayed');
          document.querySelector('.form--swap').elements['requestId'].value = data._id;
          document.querySelector('.request__section--two').classList.remove('is-not-displayed');
          //saveBookToSwap(data, 'request'); // should only get the book id
        }
        else if (currentStep === 'two') {
          // birng up step three
          requestSection.querySelector('.Offer').classList.add('is-not-displayed');
          document.querySelector('.form--swap').elements['offerId'].value = data._id;
          document.querySelector('.request__section--three').classList.remove('is-not-displayed');

          // confirm swap
          /*
          document.querySelector('.request__button--swap').addEventListener('click', e => {
            // gather together the hidden input
            let requestId = document.querySelector('form').elements['requestId'].value;
            let offerId = document.querySelector('form').elements['offerId'].value;
            

            socket.emit('CREATE.transaction', { rId: requestId, oId: offerId });
          });
          */
          
          // take out cancel - MVP
          /*
          document.querySelector('.request__button--cancel').addEventListener('click', e => {
            // start over
            
          });
          */
        }
      });
    }
  }
  
  // if not on request page, then set variable such that the below code performs for all conditions
  if (!requestSection)
    requestSection = document;

  requestSection.querySelector('.preview__title').textContent = bookObject.title;
  requestSection.querySelector('.preview__link').href = bookObject.link;
  requestSection.querySelector('.preview__close').addEventListener('click', () => {
    requestSection.querySelector('.wrapper--preview').classList.add('is-not-displayed');
  }); 

  requestSection.querySelector('.preview__author').textContent = parseAuthorArray(bookObject.author);

  requestSection.querySelector('.preview__description').textContent = bookObject.description;

  // display the preview
  requestSection.querySelector('.wrapper--preview').classList.remove('is-not-displayed');
}

/***************************************************/


// add/display book to bookshelf/bookshelves
function displayBook (book, queryEvent, requestSection) {
  let fragment = new DocumentFragment();
  // mvp - img and data.id
  
  // book image
  let newImg = document.createElement('img');
  newImg.classList.add('book__image');
  newImg.src = book.thumbnail;


  // book container
  let newDiv = document.createElement('div');
  newDiv.classList.add('book');
  //newDiv.classList.add('data-id=' + book._id);
  newDiv.setAttribute('data-id', book._id);
  newDiv.appendChild(newImg);  // book image

  // svg lock container
  if (book.transactionLock) {
    let newImg2 = document.createElement('img');
    newImg2.classList.add('book__lock');
    newImg2.src = '/static/img/lock.svg';
    newDiv.appendChild(newImg2); // svg lock
  }



  // on click shows the preview for the book
  newDiv.addEventListener('click', e => {
    socket.emit('READ.book', { bookId: book._id });
    
  });

  fragment.appendChild(newDiv);
  if (queryEvent) {
    if (requestSection)
      prependChild(requestSection.querySelector('.bookshelf--query'), fragment);
    else prependChild(document.querySelector('.bookshelf--query'), fragment);
  }
  else {
    if (requestSection)
      prependChild(requestSection.querySelector('.bookshelf--complete'), fragment);
    else prependChild(document.querySelector('.bookshelf--complete'), fragment);
  }

}

/***************************************************/


// shows the query results
function renderQuery (data, requestStep) {
// hide the 'all' results
  document.querySelector('.bookshelf--complete').classList.add('is-not-displayed');

  let requestSection, bookshelfQuery, bookshelfComplete, wrapperQuery;

  if (requestStep === 'step-one') {
    requestSection = document.querySelector('.request__section--one');
   }
  else if (requestStep === 'step-two') {
    requestSection = document.querySelector('.request__section--two');
  }
  else requestSection = document;

  bookshelfQuery = requestSection.querySelector('.bookshelf--query');
  bookshelfComplete = requestSection.querySelector('.bookshelf--complete');
  wrapperQuery = requestSection.querySelector('.wrapper--query');

  // clear out old query results from element
  while (bookshelfQuery.hasChildNodes()) {
    bookshelfQuery.removeChild(bookshelfQuery.lastChild);
  }

  

  requestSection.querySelector('.query__description__query-string').textContent = data.query;
  requestSection.querySelector('.query__close').addEventListener('click', () => {
    bookshelfComplete.classList.remove('is-not-displayed');
    wrapperQuery.classList.add('is-not-displayed');
    bookshelfQuery.classList.add('is-not-displayed');
  });
  bookshelfComplete.classList.add('is-not-displayed');
  wrapperQuery.classList.remove('is-not-displayed');
  bookshelfQuery.classList.remove('is-not-displayed');


  if (data.books.length) { // if there exists results
    for (let i = 0; i < data.books.length; i++) {
      displayBook(data.books[i], true, requestSection);
    }
  }
  else {
    let newDiv = document.createElement('div');
    newDiv.textContent = 'No results match the query.';
    newDiv.classList.add('no-result');
    
    requestSection.querySelector('.bookshelf--query').appendChild(newDiv);
  }
}

/***************************************************/

// parses out the array to a string to display properly in various places
function parseAuthorArray (authorsArray) {

  let arrClone;

  // dont mutate original array
  if (Array.isArray(authorsArray)) {
    arrClone = Array.prototype.slice.call(authorsArray); // in case not an array;
  }
  else return authorsArray;

  let authorsLength = arrClone.length;
  if (authorsLength > 2) {
    arrClone[arrClone.length - 1] = 'and ' + arrClone[arrClone.length - 1];
    return arrClone.join(', ');
  }
  else if (authorsLength > 1) {
    return arrClone.join(' and ');
  }
  else return arrClone[0];
}

/**************************************************/


// recursively check object property existence before querying it (specifically used in looking up thumbnail currently)
function checkProperty (object, pathToKey) {
  let keyDepth = pathToKey.split('.').length;
  let currentKey = pathToKey.split('.')[0];
  // let restOfKey = ;
  
  if (object.hasOwnProperty(currentKey)) {
    if (keyDepth > 1) {
      return checkProperty(object[currentKey], pathToKey.split('.').slice(1).join('.'));
    }
    else return object[pathToKey];
  }
  else return 'https://placehold.it/128x200';
}

/***********************************************/

// prepend function
function prependChild (parent, newFirstChild) {
  parent.insertBefore(newFirstChild, parent.firstChild);
}


/***********************************************/


function populateTransactions (data, path) {

  let booksIWantFragment = new DocumentFragment(); // append to self-desired
  let booksOthersWantFragment = new DocumentFragment(); // apend to other-desired

  for (let i = 0; i < data.requestTransactions.length; i++) {
    booksIWantFragment.insertBefore(displayTransaction(data.requestTransactions[i], 'request', path), booksIWantFragment.firstChild);
  }
  for (let i = 0; i < data.offerTransactions.length; i++) {
    booksOthersWantFragment.insertBefore(displayTransaction(data.offerTransactions[i], 'offer', path), booksOthersWantFragment.firstChild);
  }

  document.querySelector('.self-desired').appendChild(booksIWantFragment);
  document.querySelector('.other-desired').appendChild(booksOthersWantFragment);

}


/***********************************************/

function displayTransaction (transaction, transactionType, path) {

  let newTradeDiv = createTradeDiv();  

  //newTradeDiv.querySelector('.trade').setAttribute('data-id', transaction._id);

  if (transactionType === 'request') {
    newTradeDiv.querySelector('.book--self-owned').firstChild.src = transaction.oBook.thumbnail;
    newTradeDiv.querySelector('.book--other-owned').firstChild.src = transaction.rBook.thumbnail;
  }
  else if (transactionType === 'offer') {
    newTradeDiv.querySelector('.book--self-owned').firstChild.src = transaction.rBook.thumbnail;
    newTradeDiv.querySelector('.book--other-owned').firstChild.src = transaction.oBook.thumbnail;
  }

  if (path === 'pending') {
    if (transactionType === 'request') {
      // set description
      newTradeDiv.querySelector('.trade__description').textContent = `You have requested to trade your copy of ${transaction.oBook.title} for another user's copy of ${transaction.rBook.title}.`;
      // set arrow 
      newTradeDiv.querySelector('.arrow').firstChild.classList.add('arrow-right');
      newTradeDiv.querySelector('.arrow').firstChild.src = '/static/img/arrow-right-pending.svg';
    }
    else if (transactionType === 'offer') {
      newTradeDiv.querySelector('.trade__description').textContent = `Another user has requested to trade their copy of ${transaction.oBook.title} for your copy of ${transaction.rBook.title}.`;
      newTradeDiv.querySelector('.arrow').firstChild.classList.add('arrow-left');
      newTradeDiv.querySelector('.arrow').firstChild.src = '/static/img/arrow-left-pending.svg';
      let tradeBtns = document.createElement('div');
      tradeBtns.classList.add('trade__buttons');
      let tradeBtnApprove = document.createElement('button');
      tradeBtnApprove.classList.add('trade__button');
      tradeBtnApprove.classList.add('trade__button--approve');
      tradeBtnApprove.textContent = 'Approve';
      let tradeBtnDecline = document.createElement('button');
      tradeBtnDecline.classList.add('trade__button');
      tradeBtnDecline.classList.add('trade__button--decline');
      tradeBtnDecline.textContent = 'Decline';
      tradeBtns.appendChild(tradeBtnApprove);
      tradeBtns.appendChild(tradeBtnDecline);
      newTradeDiv.querySelector('.trade').appendChild(tradeBtns);
      // need to set up these approve/decine buttons
      tradeBtnApprove.addEventListener('click', () => {
        // retrieve the transaction number and book ids
        // remove entire entry and move it to the complete section
        //let transaction
        socket.emit('DELETE.transaction', { _id: transaction._id, option: 'approve' });

        // 'UPDATE.books.render' - since DELETE.transaction needs to validate before updating
        //socket.emit('UPDATE.books', { // add the completed transaction to the books; remove locks
        tradeBtnApprove.parentNode.parentNode.parentNode.removeChild(tradeBtnApprove.parentNode.parentNode);
      });
      tradeBtnDecline.addEventListener('click', () => {
        socket.emit('DELETE.transaction', { _id: transaction._id, option: 'decline' });
        //socket.emit('UPDATE.books', { // remove locks
        tradeBtnDecline.parentNode.parentNode.parentNode.removeChild(tradeBtnDecline.parentNode.parentNode);
      });
    }
  }
  else if (path === 'completed') {
    if (transactionType === 'request') {
      newTradeDiv.querySelector('.trade__description').textContent = `You have traded your copy of ${transaction.oBook.title} for another user's copy of ${transaction.rBook.title}.`;
      newTradeDiv.querySelector('.arrow').firstChild.classList.add('arrow-right');
      newTradeDiv.querySelector('.arrow').firstChild.src = '/static/img/arrow-right-completed.svg';
    }
    else if (transactionType === 'offer') {
      newTradeDiv.querySelector('.trade__description').textContent = `Another user has traded their copy of ${transaction.oBook.title} for your copy of ${transaction.rBook.title}.`;
      newTradeDiv.querySelector('.arrow').firstChild.classList.add('arrow-left');
      newTradeDiv.querySelector('.arrow').firstChild.src = '/static/img/arrow-left-completed.svg';
    }
  }

  return newTradeDiv;
}


function createTradeDiv () {

  let fragment = new DocumentFragment();

  let tradeDiv = document.createElement('div');
  tradeDiv.classList.add('trade');
  fragment.appendChild(tradeDiv);

  let descDiv = document.createElement('div');
  descDiv.classList.add('trade__description');
  tradeDiv.appendChild(descDiv);

  let pictoDiv = document.createElement('div');
  pictoDiv.classList.add('trade__pictogram');
  tradeDiv.appendChild(pictoDiv);

  let bookSelfOwnedDiv = document.createElement('div');
  bookSelfOwnedDiv.classList.add('book--self-owned');
  pictoDiv.appendChild(bookSelfOwnedDiv);

  let bookSelfOwnedImg = document.createElement('img');
  bookSelfOwnedImg.classList.add('book__image');
  bookSelfOwnedDiv.appendChild(bookSelfOwnedImg);

  let arrowDiv = document.createElement('div');
  arrowDiv.classList.add('arrow');
  pictoDiv.appendChild(arrowDiv);

  let arrowImg = document.createElement('img');
  arrowDiv.appendChild(arrowImg);

  let bookOtherOwnedDiv = document.createElement('div');
  bookOtherOwnedDiv.classList.add('book--other-owned');
  pictoDiv.appendChild(bookOtherOwnedDiv);

  let bookOtherOwnedImg = document.createElement('img');
  bookOtherOwnedImg.classList.add('book__image');
  bookOtherOwnedDiv.appendChild(bookOtherOwnedImg);

  return fragment;
  

}
