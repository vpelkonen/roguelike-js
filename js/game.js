
var Game = {
	_display: null,
    _currentScreen: null,
    _screenWidth: 80,
    _screenHeight: 30,
	init: function(){
		// Any necessary initialization will go here
		this._display = new ROT.Display({
            width:this._screenWidth,
            height:this._screenHeight + 1
        });
        // Create a helper function for binding to an event and making it send it to the new screen
        var game = this;
        var bindEventToScreen = function(event){
            window.addEventListener(event, function(e){
                if (game._currentScreen !== null){
                    // Send the event type and data to the screen
                    game._currentScreen.handleInput(event, e);
                }
            });
        }
        // Bind keyboard input events
        bindEventToScreen('keydown');
        //bindEventToScreen('keyup');
        bindEventToScreen('keypress');
	},
	getDisplay: function(){
		return this._display;
	},
    getScreenWidth: function(){
        return this._screenWidth;
    },
    getScreenHeight: function(){
        return this._screenHeight;
    },
    switchScreen: function(screen){
        // If we had a screen before, notify it we exited
        if (this._currentScreen !== null){
            this._currentScreen.exit();
        }
        this.getDisplay().clear();
        this._currentScreen = screen;
        if (this._currentScreen){
            this._currentScreen.enter();
            this.refresh();
        }
    },
    refresh: function(){
        // Clear the screen
        this._display.clear();
        // Render the screen
        this._currentScreen.render(this._display);
    }
}

window.onload = function() {
    // Check if rot.js can work on this browser
    if (!ROT.isSupported()) {
        alert("The rot.js library isn't supported by your browser.");
    } else {
        // Initialize the game
        Game.init();
        // Add the container to our HTML page
        document.body.appendChild(Game.getDisplay().getContainer());
        // Load the start screen
        Game.switchScreen(Game.Screen.startScreen);
    }
}