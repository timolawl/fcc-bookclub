!function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a="function"==typeof require&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}for(var i="function"==typeof require&&require,o=0;o<r.length;o++)s(r[o]);return s}({1:[function(require,module,exports){"use strict";function checkForm(path){function validateInput(){var pw=void 0,pwConfirm=void 0;submitBtn.disabled=!0,Array.from(inputs).every(function(input){return input.value.match(input.getAttribute("pattern"))})&&("signup"===path?(pw=form.querySelector(".form__input--password"),pwConfirm=form.querySelector(".form__input--confirm"),pw.value===pwConfirm.value?(pw.style.outline="initial",pwConfirm.style.outline="initial",submitBtn.disabled=!1):(pw.style.outline="1px solid red",pwConfirm.style.outline="1px solid red")):submitBtn.disabled=!1)}var form=document.querySelector("form"),inputs=document.getElementsByClassName("form__input"),submitBtn=document.querySelector('input[type="submit"]');submitBtn.disabled=!0,form.onkeyup=validateInput,form.onclick=validateInput}function playSplashPageAnimation(index){var words=["ideas","adventure","inspiration","books","swap"],el=document.querySelector(".transition--"+words[index]);el.classList.remove("is-invisible"),el.classList.remove("move-down-fade-in"),index||(el.classList.add("move-down-fade-out"),playSplashPageAnimation(index+1)),index===words.length-1&&(el.classList.add("translate--post"),document.querySelector(".banner__title--pre").classList.add("translate--pre"),setTimeout(function(){document.querySelector(".transition--books").lastChild.classList.add("is-invisible")},10)),el.addEventListener("transitionend",function handleEvent(e){el.classList.contains("move-down-fade-out")?(playSplashPageAnimation(index+1),el.removeEventListener("transitionend",handleEvent)):"opacity"===e.propertyName&&(index<words.length-2?el.classList.add("move-down-fade-out"):"books"===words[index]&&(playSplashPageAnimation(index+1),el.removeEventListener("transitionend",handleEvent)))})}function displayPreview(data,source){function createBook(){socket.emit("CREATE.book",bookObject),document.querySelector(".preview__submit").classList.add("is-not-displayed")}var bookObject={},requestSection=void 0,currentStep=null;if("external-query"===source){var json=data;console.log("external query"),console.log(json.items[0]),bookObject.title=json.items[0].volumeInfo.title,bookObject.author=json.items[0].volumeInfo.authors,bookObject.description=json.items[0].volumeInfo.description,bookObject.thumbnail=checkProperty(json.items[0],"volumeInfo.imageLinks.thumbnail"),bookObject.link=json.items[0].volumeInfo.canonicalVolumeLink,json.items[0].volumeInfo.industryIdentifiers.forEach(function(id){"ISBN_10"===id.type?bookObject.ISBN_10=id.identifier:"ISBN_13"===id.type&&(bookObject.ISBN_13=id.identifier)}),document.querySelector(".preview__submit").classList.remove("is-not-displayed"),document.querySelector(".preview__submit").onclick=createBook}else bookObject.title=data.title,bookObject.author=data.author,bookObject.description=data.description,bookObject.link=data.link,"internal-query"===source?document.querySelector(".preview__submit")&&document.querySelector(".preview__submit").classList.add("is-not-displayed"):"internal-request"===source&&(document.querySelector(".request__section--one .request__step-number").classList.contains("request__step-number--incomplete")?(requestSection=document.querySelector(".request__section--one"),currentStep="one",console.log("previewing step one!")):document.querySelector(".request__section--two .request__step-number").classList.contains("request__step-number--incomplete")?(requestSection=document.querySelector(".request__section--two"),currentStep="two",console.log("previewing step two!")):console.log("something went wrong.."),requestSection.querySelector(".preview__submit").addEventListener("click",function(e){requestSection.querySelector(".selection--title").textContent=data.title,requestSection.querySelector(".selection--author").textContent=parseAuthorArray(data.author),requestSection.querySelector(".request__selection__book-image .book__image").src=data.thumbnail,requestSection.querySelector(".wrapper--request__selection").classList.remove("is-not-displayed"),requestSection.querySelector(".request__step-number").classList.remove("request__step-number--incomplete"),requestSection.querySelector(".request__step-number").classList.add("request__step-number--complete"),"one"===currentStep?(requestSection.querySelector(".Request").classList.add("is-not-displayed"),document.querySelector(".request__section--two").classList.remove("is-not-displayed"),document.querySelector("form").elements.requestId.value=data._id):"two"===currentStep&&(requestSection.querySelector(".Offer").classList.add("is-not-displayed"),document.querySelector(".request__section--three").classList.remove("is-not-displayed"),document.querySelector("form").elements.offerId.value=data._id)}));requestSection||(requestSection=document),requestSection.querySelector(".preview__title").textContent=bookObject.title,requestSection.querySelector(".preview__link").href=bookObject.link,requestSection.querySelector(".preview__close").addEventListener("click",function(){requestSection.querySelector(".wrapper--preview").classList.add("is-not-displayed")}),requestSection.querySelector(".preview__author").textContent=parseAuthorArray(bookObject.author),requestSection.querySelector(".preview__description").textContent=bookObject.description,requestSection.querySelector(".wrapper--preview").classList.remove("is-not-displayed")}function displayBook(book,queryEvent,requestSection){var fragment=new DocumentFragment,newImg=document.createElement("img");newImg.classList.add("book__image"),newImg.src=book.thumbnail;var newDiv=document.createElement("div");newDiv.classList.add("book"),newDiv.classList.add("data-id="+book._id),newDiv.appendChild(newImg),newDiv.addEventListener("click",function(e){console.log(book),socket.emit("READ.book",{bookId:book._id})}),fragment.appendChild(newDiv),queryEvent?requestSection?prependChild(requestSection.querySelector(".bookshelf--query"),fragment):prependChild(document.querySelector(".bookshelf--query"),fragment):requestSection?prependChild(requestSection.querySelector(".bookshelf--complete"),fragment):prependChild(document.querySelector(".bookshelf--complete"),fragment)}function renderQuery(data,requestStep){document.querySelector(".bookshelf--complete").classList.add("is-not-displayed");var requestSection=void 0,bookshelfQuery=void 0,bookshelfComplete=void 0,wrapperQuery=void 0;for("step-one"===requestStep?requestSection=document.querySelector(".request__section--one"):"step-two"===requestStep?(console.log("rendering query for step two"),requestSection=document.querySelector(".request__section--two")):requestSection=document,bookshelfQuery=requestSection.querySelector(".bookshelf--query"),bookshelfComplete=requestSection.querySelector(".bookshelf--complete"),wrapperQuery=requestSection.querySelector(".wrapper--query");bookshelfQuery.hasChildNodes();)bookshelfQuery.removeChild(bookshelfQuery.lastChild);if(requestSection.querySelector(".query__description__query-string").textContent=data.query,requestSection.querySelector(".query__close").addEventListener("click",function(){bookshelfComplete.classList.remove("is-not-displayed"),wrapperQuery.classList.add("is-not-displayed"),bookshelfQuery.classList.add("is-not-displayed")}),bookshelfComplete.classList.add("is-not-displayed"),wrapperQuery.classList.remove("is-not-displayed"),bookshelfQuery.classList.remove("is-not-displayed"),data.books.length)for(var i=0;i<data.books.length;i++)displayBook(data.books[i],!0,requestSection);else{var newDiv=document.createElement("div");newDiv.textContent="No results match the query.",newDiv.classList.add("no-result"),requestSection.querySelector(".bookshelf--query").appendChild(newDiv)}}function parseAuthorArray(authorsArray){var arrClone=void 0;if(!Array.isArray(authorsArray))return authorsArray;arrClone=Array.prototype.slice.call(authorsArray);var authorsLength=arrClone.length;return authorsLength>2?(arrClone[arrClone.length-1]="and "+arrClone[arrClone.length-1],arrClone.join(", ")):authorsLength>1?arrClone.join(" and "):arrClone[0]}function checkProperty(object,pathToKey){var keyDepth=pathToKey.split(".").length,currentKey=pathToKey.split(".")[0];return object.hasOwnProperty(currentKey)?keyDepth>1?checkProperty(object[currentKey],pathToKey.split(".").slice(1).join(".")):object[pathToKey]:"http://placehold.it/128x200"}function prependChild(parent,newFirstChild){parent.insertBefore(newFirstChild,parent.firstChild)}var socket=io();window.onload=function(){location.pathname.match(/^\/$/)?socket.emit("change room",{room:location.pathname}):socket.emit("change room",{room:location.pathname.toLowerCase().slice(1)}),location.pathname.match(/^\/$/)&&setTimeout(function(){playSplashPageAnimation(0)},1500),location.pathname.match(/^\/(?:signup|login)\/?$/i)&&(document.querySelector("form").reset(),checkForm(location.pathname.toLowerCase().slice(1))),location.pathname.match(/^\/allbookshelves\/?$/i)&&(socket.on("CREATE.book.render",function(data){displayBook(data.book,!1)}),socket.emit("READ.bookshelves.all",{}),socket.on("READ.book.render",function(data){displayPreview(data.book,"internal-query")}),socket.on("READ.bookshelves.all.render",function(data){for(var i=0;i<data.books.length;i++)displayBook(data.books[i],!1)}),socket.on("UPDATE.bookshelves.render",function(data){}),document.querySelector(".search__bar__submit").addEventListener("click",function(e){var userInput=document.querySelector(".search__bar__input--allbookshelves").value;socket.emit("READ.bookshelves.query",{search:userInput.replace(/\$/g,"")})}),socket.on("READ.bookshelves.query.render",function(data){renderQuery(data)})),location.pathname.match(/^\/mybookshelf\/?$/i)&&(socket.on("CREATE.book.render",function(data){displayBook(data.book,!1)}),socket.emit("READ.bookshelf.all",{}),socket.on("READ.book.render",function(data){displayPreview(data.book,"internal-query")}),socket.on("READ.bookshelf.all.render",function(data){for(var i=0;i<data.books.length;i++)displayBook(data.books[i],!1)}),socket.on("UPDATE.bookshelf.render",function(data){}),document.querySelector(".search__bar__submit").addEventListener("click",function(e){var selectOption=document.querySelector(".search__bar__option").value,userInput=document.querySelector(".search__bar__input--mybookshelf").value;if("add"===selectOption){var queryURL="https://www.googleapis.com/books/v1/volumes?q="+userInput,encodedURL=encodeURI(queryURL),fetchHeaders={method:"GET",headers:{accept:"application/json"}};fetch(encodedURL,fetchHeaders).then(function(res){return res.json()}).then(function(json){json.totalItems?displayPreview(json,"external-query"):console.log("There are no books found with the given search criteria.")})}else"find"===selectOption&&socket.emit("READ.bookshelf.query",{search:userInput.replace(/\$/g,"")})}),socket.on("READ.bookshelf.query.render",function(data){renderQuery(data)})),location.pathname.match(/^\/request\/?$/i)&&(socket.on("READ.book.render",function(data){displayPreview(data.book,"internal-request")}),document.querySelector(".request__section--one .search__bar__submit").addEventListener("click",function(e){var userInput=document.querySelector(".request__section--one .search__bar__input").value;socket.emit("READ.bookshelves.query",{search:userInput.replace(/\$/g,""),request:!0})}),socket.on("READ.bookshelves.query.render",function(data){renderQuery(data,"step-one")}),document.querySelector(".request__section--two .search__bar__submit").addEventListener("click",function(e){var userInput=document.querySelector(".request__section--two .search__bar__input").value;socket.emit("READ.bookshelf.query",{search:userInput.replace(/\$/g,"")})}),socket.on("READ.bookshelf.query.render",function(data){renderQuery(data,"step-two")})),location.pathname.match(/^\/pending\/?$/i)&&(socket.emit("READ.transactions",{}),socket.on("READ.transactions.render",function(data){}))}},{}]},{},[1]);
//# sourceMappingURL=post.bundle.js.map
