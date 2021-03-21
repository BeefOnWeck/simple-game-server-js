(function() {

  // Get handles for the status span elements
  var phaseSpan = document.getElementById('phase');
  var roundSpan = document.getElementById('round');
  var playerSpan = document.getElementById('player');

  // Asynchronously get the game status every 5 seconds
  var sleep = time => new Promise(resolve => setTimeout(resolve, time));
  var poll = (promiseFn, time) => promiseFn().then(
    sleep(time).then(() => poll(promiseFn, time)));
  poll(() => 
    new Promise(() => {
      fetch('http://localhost:3000/status').then(response => {
        return response.json();
      }).then(data => {
        while( phaseSpan.firstChild ) {
          phaseSpan.removeChild( phaseSpan.firstChild );
        }
        phaseSpan.appendChild( document.createTextNode(data.phase));

        while( roundSpan.firstChild ) {
          roundSpan.removeChild( roundSpan.firstChild );
        }
        roundSpan.appendChild( document.createTextNode(data.round));
        
        while( playerSpan.firstChild ) {
          playerSpan.removeChild( playerSpan.firstChild );
        }
        playerSpan.appendChild( document.createTextNode(data.activePlayer));
      });
    }), 5000);

  // Get the two screens for the modal window
  let modalScreen1 = document.getElementById('ms1');
  let modalScreen2 = document.getElementById('ms2');
  modalScreen2.classList.add('hidden');

  // Add event listener to first screen
  // When we select the screen, the second screen show sup
  modalScreen1.onclick = function() {
    modalScreen1.classList.add('hidden');
    modalScreen2.classList.remove('hidden');
  };

  let startButton = document.getElementById('start-btn');
  startButton.onclick = function() {
    console.log('Starting game!');
    fetch('http://localhost:3000/start', { // TODO: Parameterize this (env var)
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        selectedGame: 'Tic Tac Toe' // NOTE: Selected game is hard-coded
      })
    });
  }



})();