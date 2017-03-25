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
function addOption (btnCounter) {
    // need a way of keeping track of the count.
    // either way, I just add to the end of the last count, even if sparse
    const button = document.createElement('button');
    button.className = 'form__button--delete';
    button.id = `option-${btnCounter}`; // es6 template literal
    button.type = 'button';
    button.textContent = 'X';

    const input = document.createElement('input');
    input.className = 'form__input form__input--options';
    input.setAttribute('type', 'text');
    input.setAttribute('name', 'options');
    input.setAttribute('placeholder', 'New Option');
    input.setAttribute('pattern', '^[a-zA-Z0-9\$@#&\*\+\-][a-zA-Z0-9\$@#&%\*\+\'\"_/, \.?!-]{0,200}$');

    const div = document.createElement('div');
    div.className = 'form__options--option';

    div.appendChild(input)
    div.appendChild(button);

    document.querySelector('.form__options').appendChild(div);
}

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

  if (location.pathname.match(/^\/poll\/[0-9a-f-]+$/))
    socket.emit('change room', { room: location.pathname.slice(6) }); // the nonce itself

  if (location.pathname.match(/^\/(?:signup|login|reset|createpoll|mybooks)\/?/i))
    socket.emit('leave room', { path: location.pathname.toLowerCase().slice(1) });

/****************/    

    if (location.pathname.match(/^\/$/)) {
      console.log('home page');
      playSplashPageAnimation();
    }

    if (location.pathname.match(/^\/mypolls$/)) {
      socket.emit('list my polls', {});
      
      socket.on('populate my polls', function (data) {
        let parentNode = document.querySelector('.polls');

        for (let i = 0; i < data.titles.length; i++) {
          let newDiv = document.createElement('div');
          newDiv.className = 'poll__element--text';
          let newSpan = document.createElement('span');
          newDiv.textContent = data.titles[i];
          newDiv.appendChild(newSpan);
          let newLink = document.createElement('a');
          newLink.className = 'poll__element--link';
          newLink.href = location.protocol + '//' + location.host + '/poll/' + data.permalinks[i];
          newLink.appendChild(newDiv);
          parentNode.appendChild(newLink);
        }
      });

    }

    if (location.pathname.match(/^\/createpoll\/?/i)) { // why does this have only 1 slash?

        let buttonCounter = 3; // initial setting since there's already 2 initially.

        document.querySelector('.form').addEventListener('click', e => {

            if (e && e.target.id.match(/^option-\d+$/)) {
                let target = document.getElementById(e.target.id).parentNode;
                target.parentNode.removeChild(target);
            }

            // create function
            if (e && e.target.id === 'option-create') {
                e.preventDefault(); // apparently this is needed for preventing the 'requirement' popup.
                addOption(buttonCounter);
                buttonCounter++; // increment after
            }
        }); // event delegation
    }
    

    if (location.pathname.match(/^\/(?:signup|login|reset|createpoll)\/?/i)) {
      // clear out form
      document.querySelector('form').reset();
      // gray out submit button until everything is filled in.
      checkForm(location.pathname.toLowerCase().slice(1));
    }

    if (location.pathname.match(/^\/poll\/[0-9a-f-]+$/)) {
      // button click (general):
      Array.prototype.forEach.call(document.querySelectorAll('.created-poll__option'), el => el.addEventListener('click', e => {
        switch (e.target.classList[e.target.classList.length-1]) {
          case 'created-poll__option--vote':
            displayModal('vote');
            break;
          case 'created-poll__option--new-option':
            displayModal('new-option');
            break;
          case 'created-poll__option--share':
            displayModal('share');
            break;
          case 'created-poll__option--delete':
            displayModal('delete');
            break;
          default:
            console.log('uh oh...something went wrong.');
            break;
        }
      }));

      // better to set up socket io rooms and have the updates broadcast only to those in the same room or to have it such that broadcasts regardless of room but only those in the room will it have any effect? Rooming seems more organized.
      

      // on vote submit, pass along the selected option and with socket io update the db
      // emit the event so that it updates...
      // eventlistener for form submissions:
      if (document.querySelector('.modal__form--vote')) { // if these elements exist, then..
        let el_vote = document.querySelector('.modal__form--vote'); 
        el_vote.addEventListener('submit', e => {
		  e.preventDefault();
		  socket.emit('add vote', { vote: el_vote.firstChild.value, path: location.pathname.slice(6) });
        });
      }
      if (document.querySelector('.modal__form--new-option')) {
      	let el_option = document.querySelector('.modal__form--new-option');
		el_option.addEventListener('submit', e => {
		  e.preventDefault();
		  socket.emit('add option', { option: el_option.firstChild.value, path: location.pathname.slice(6) });
		});
      }
              
      // draw the chart
      var ctx = document.querySelector('.created-poll__poll--canvas');
      var myChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: optionText,
          datasets: [{
            data: voteCount,
            backgroundColor: [
			  '#8DD3C7',
			  '#FFFFB3',
			  '#BEBADA',
			  '#FB8072',
			  '#80B1D3',
			  '#FDB462',
			  '#B3DE69',
			  '#FCCDE5',
			  '#D9D9D9',
			  '#BC80BD',
			  '#CCEBC5',
			  '#FFED6F'
            ]
          }]
        },
        options: {
          title: {
            display: false,
            fontSize: 14,
            text: pollTitle
          },
          legend: {
            display: true,
            position: 'bottom'
          },
          tooltips: {
            xPadding: 10
          }
        }
      
      });
      
      socket.on('update poll', function (data) {
        // on update, check if individual has voted yet or not
        socket.emit('vote check', { path: location.pathname.slice(6) });

        optionText = data.pollOptions.map(x => x.optionText);
        voteCount = data.pollOptions.map(x => x.voteCount);
        myChart.data.datasets[0].data = voteCount;
        myChart.data.labels = optionText;
        myChart.update();
       // console.log('updating poll..');
      });

      socket.on('voted', function (data) {
        document.querySelector('.created-poll__option--vote').textContent = 'Voted';
        document.querySelector('.created-poll__option--vote').disabled = true;
        document.querySelector('.created-poll__option--new-option').disabled = true;
      });

      
      //  Chart.defaults.global.elements.arc.backgroundColor = 'rgba(0,0,0,0.3)';
     //   Chart.defaults.global.elements.arc.borderColor = 'lightgray'; //'rgba(0,0,0,0.5)';
       // Chart.defaults.global.elements.arc.borderWidth = 2;
       // Chart.defaults.global.layout.padding = 5;
      //
      // Retrieve the data from the server (socket.io or ajax)
      // HOWEVER, do not populate the chart js labels or title
      // populate the title and labels separately because chart js combines styling
      // and placement of the labels and title with the chart itself, making it hard
      // to keep the chart size the same, etc.
      // if more than 12 just repeat the colors yolo.

      // title simply assign as such:
      document.querySelector('.created-poll__title').textContent = pollTitle;
      
      // populate vote options once; will need to revisit later for the new option part
      if (document.querySelector('.created-poll__option--vote')) {     
        document.querySelector('.modal__vote--dropdown-li:nth-child(2)').textContent = optionText[0];
        document.querySelector('.modal__vote--dropdown-li:nth-child(3)').textContent = optionText[1];
            // add any additional options remaining:
            
        for (let i = 2; i < optionText.length; i++) {
          let nextOption = document.createElement('option');
          nextOption.classList.add('modal__vote--dropdown-li');
          nextOption.textContent = optionText[i];
          document.querySelector('.modal__vote--dropdown-ul').appendChild(nextOption);
        }
      }
    }
};

function displayModal (option) {
  // dim the background
  document.querySelector('.modal__overlay').classList.remove('visibility--hide');

  let closeOptions = Array.from(document.querySelectorAll('.modal__close'));
  closeOptions.push.call(closeOptions, document.querySelector('.modal__overlay'));
  if (document.querySelector('.modal__delete--no')) // if it exists
    closeOptions.push.call(closeOptions, document.querySelector('.modal__delete--no'));
  closeOptions.push.apply(closeOptions, Array.from(document.querySelectorAll('.modal__submit')));

  // close button closes modal and relights background
  closeOptions.forEach(e => e.addEventListener('click', event => {
    document.querySelector('.modal__overlay').classList.add('visibility--hide');
    Array.prototype.forEach.call(document.querySelectorAll('.modal'), e => e.classList.add('visibility--hide'));
    // rehide the flash message on modal close
    if (document.querySelector('.modal--share'))
      document.querySelector('.modal__flash-message').classList.add('display--hide');
  }));

  switch (option) {
    case 'vote':
      // dynamically set up the vote modal (populate the options with the actual options)
      // we know that there are at the very least two options, so populate those first
      // would this make it too slow as it's always dynamic? really minor tbh
      document.querySelector('.modal--vote').classList.remove('visibility--hide');
      break;
    case 'new-option':
      document.querySelector('.modal__form--new-option').reset(); // put reset at open
      document.querySelector('.modal--new-option').classList.remove('visibility--hide');
      break;
    case 'share':
      // show the sharing modal
      document.querySelector('.modal--share').classList.remove('visibility--hide');
      document.querySelector('.modal__share--link-box').select();
      // make the clipboard copy the link // may need clipboard js
      document.querySelector('.modal__share--clipboard-button').addEventListener('click', copyPollLink); // copies current selection to clipboard
      break;
    case 'delete':
      document.querySelector('.modal--delete-poll').classList.remove('visibility--hide');
      break;
    default:
      console.log('wat');
      break;
  }
} 


function copyPollLink () {
// select all to get ready to copy
  document.querySelector('.modal__share--link-box').select();
// copy the selection
  document.execCommand('copy');

  document.querySelector('.modal__flash-message').classList.remove('display--hide')

}

function playSplashPageAnimation () {
  let words = ['ideas', 'adventure', 'inspiration', 'books', 'swap'];
  let spacing = [175, 175, 125];

  for (let i = 0; i < words.length; i++) {
    console.log('in the for loop ' + i);
    setTimeout(() => {
      console.log('the set timeout ' + i);
      console.log('words[i] = ' + words[i]);
      let el = document.querySelector('.transition--' + words[i]);
      el.classList.remove('is-invisible');
      el.classList.remove('move-down-fade-in');
      if (words[i] !== 'books' && words[i] !== 'swap') {
        setTimeout(() => {
          el.classList.add('move-down-fade-out');
          setTimeout(() => {
            el.classList.add('is-not-displayed');
          }, 1500);
        }, 1500);
      }
      else if (words[i] === 'books') {
        setTimeout(() => {
          el.lastChild.classList.add('is-invisible');
        }, 1560);
      }
      if (words[i] === 'swap') {
        console.log('testo');
        setTimeout(() => {
          el.classList.add('translate--post');
          document.querySelector('.banner__title--pre').classList.add('translate--pre');
        }, 100);
      }
      // el.classList.add('move-down-fade-out');
    }, i * 1500);
  }

  /*
  // while there are still words on in the array, set up the next replacement
  while (words[index]) {
    let fragment = new DocumentFragment();

    let newDiv = document.createElement('div');
    newDiv.classList.add('banner__image');

    let newImg = document.createElement('img');
    newImg.classList.add('banner__image--book');
    newImg.src = '/static/img/book' + (index + 2);

    newDiv.appendChild(newImg);

    let newTitle = document.createElement('div');
    newTitle.className = 'banner__title banner__title--post';
    newTitle.textContent = words[index];

  }
  */
}
