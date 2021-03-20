(function() {

  // Get the two screens for the modal window
  let modalScreen1 = document.getElementById('ms1');
  let modalScreen2 = document.getElementById('ms2');
  modalScreen2.classList.add('hidden');

  // Add event listener to first screen
  modalScreen1.onclick = function() {
    modalScreen1.classList.add('hidden');
    modalScreen2.classList.remove('hidden');
  };

})();