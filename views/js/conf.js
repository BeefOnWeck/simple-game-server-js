(function() {

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

  function startMessage() {
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

  let startButton = document.getElementById('start-btn');
  startButton.onclick = startMessage();



})();