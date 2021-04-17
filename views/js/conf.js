// [IIFE](https://developer.mozilla.org/en-US/docs/Glossary/IIFE)
(function() {

  // Get handles for the status span elements
  var nameSpan = document.getElementById('name')
  var phaseSpan = document.getElementById('phase');
  var roundSpan = document.getElementById('round');
  var playerSpan = document.getElementById('player');

  // Define an async polling function
  var sleep = time => new Promise(resolve => setTimeout(resolve, time));
  var poll = (promiseFn, time) => promiseFn().then(
    sleep(time).then(() => poll(promiseFn, time)));

  // Asynchronously update the game status every 5 seconds
  poll(() => 
    new Promise(() => {
      fetch('http://localhost:3000/status').then(response => {
        return response.json();
      }).then(data => {
        // Update displayed game name
        while( nameSpan.firstChild ) {
          nameSpan.removeChild( nameSpan.firstChild );
        }
        nameSpan.appendChild( document.createTextNode(data.name));

        // Update displayed game phase
        while( phaseSpan.firstChild ) {
          phaseSpan.removeChild( phaseSpan.firstChild );
        }
        phaseSpan.appendChild( document.createTextNode(data.phase));

        // Update displayed game round
        while( roundSpan.firstChild ) {
          roundSpan.removeChild( roundSpan.firstChild );
        }
        roundSpan.appendChild( document.createTextNode(data.round));
        
        // Update displayed player turn
        while( playerSpan.firstChild ) {
          playerSpan.removeChild( playerSpan.firstChild );
        }
        playerSpan.appendChild( document.createTextNode(data.activePlayer));
      });
    }), 5000);

  // Get handles for the two screens in the modal window
  let modalScreen1 = document.getElementById('ms1'); // game selection
  let modalScreen2 = document.getElementById('ms2'); // game configuration

  // Event listener for selecting a game in modalScreen1.
  // When a game is selected:
  // 1. Get the index of the selected game
  // 2. Hide the first modal screen (for selecting games)
  // 3. Show the second modal screen (for configuring the selected game)
  var selectedGameIndex = null;
  function selectGame(element) {
    selectedGameIndex = parseInt(element.id.match(/\d+$/), 10);
    console.log(selectedGameIndex);
    modalScreen1.classList.add('hidden');
    modalScreen2.classList.remove('hidden');
  }

  // Each game in modalScreen1 is wrapped in a 'game-box' div element.
  // Add `selectGame()` as a 'click' event listener to each one.
  var gameBoxes = document.getElementsByClassName('game-box');
  for (let i = 0; i < gameBoxes.length; i++) {
    gameBoxes[i].addEventListener('click', function() {
      selectGame(gameBoxes[i])
    }, false);
  }
  
  // Hide screen 2 on page load
  modalScreen2.classList.add('hidden');

  // Pressing the start button does the following:
  //  1. Sends a POST request to the server to start the game
  //  2. Closes the modal window (implemented via class="data-micromodal-close")
  //  3. Resets the modal screen visibility
  let startButton = document.getElementById('start-btn');
  startButton.onclick = function() {
    console.log('Starting game!');

    // Before POSTing we need to get the configuration entered in modalScreen2
    const idToSelect = 'configuration_' + selectedGameIndex;
    const numChildElements = document.getElementById(idToSelect).childElementCount;
    let configElements = document.getElementById(idToSelect).children;
    let conf = {};
    for (let ce = 0; ce < numChildElements; ce++) {
      let configNameArray = configElements[ce].id.split('_');
      configNameArray.shift();
      let configName = configNameArray.join();
      if (configElements[ce].childElementCount == 1) {
        conf[configName] = configElements[ce].children[0].value;
      } else {
        let values = [];
        for (let ve = 0; ve < configElements[ce].childElementCount; ve++) {
          values[ve] = configElements[ce].children[ve].value;
        }
        conf[configName] = values;
      }
    }
    console.log(conf);

    // Then get the name of the selected game
    const nameDiv = document.getElementById(idToSelect).previousElementSibling;
    gameName = nameDiv.innerHTML.trim();

    // POST server to have game start
    fetch('http://localhost:3000/start', { // TODO: Parameterize this (env var)
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        selectedGame: gameName, // NOTE: Selected game is hard-coded
        configuration: conf
      })
    }).then(() => {
      modalScreen1.classList.remove('hidden');
      modalScreen2.classList.add('hidden');
    });
  }

  // Closing the modal window resets the modal screen visibility
  var buttonElements = document.getElementsByClassName('modal__btn');
  Array.from(buttonElements).forEach((el) => {
    el.onclick = function() {
      modalScreen1.classList.remove('hidden');
      modalScreen2.classList.add('hidden');
    }
  });

})();