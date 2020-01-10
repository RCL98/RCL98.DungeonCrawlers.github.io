document.getElementById('startGame').onclick = function() {
		   var iframe = document.createElement('iframe');
		   var container = document.getElementById('gameContainer');
		   iframe.id = "gameBox";
		   iframe.src = 'game.html';
		   container.appendChild(iframe);
		   this.style.display = "none";
		};
		
		document.onkeydown = function(evt) {
			evt = evt || window.event;
			var isEscape = false;
			if ("key" in evt) {
				isEscape = (evt.key === "Escape" || evt.key === "Esc");
			} else {
				isEscape = (evt.keyCode === 27);
			}
			if (isEscape) {
				var iframe = document.getElementById("gameBox");
				if (iframe != null) {
					iframe.parentNode.removeChild(iframe);
					var playButton = document.getElementById("startGame");
					playButton.style.display = "inline";
				}
			}
		};