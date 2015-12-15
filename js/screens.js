// Create JSON to hold game screens
Game.Screen = {};

//// START SCREEN
Game.Screen.startScreen = {
	// Props
	// Functions
	enter: function (){ trace("Entered start screen."); },
	exit: function (){ trace("Exited start screen."); },
	render: function(display){
		// Render our prompt to the screen
		display.drawText(1,1, "%c{yellow}Javascript Roguelike, yeah!");
		display.drawText(1,2, "Press Enter to start!");
		display.drawText(1,3, "(Use Keypad 1-9 to move, dig and kill.)");
	},
	handleInput: function(inputType, inputData){
		// When Enter is pressed, go to the play screen
		if (inputType === 'keydown'){
			if (inputData.keyCode === ROT.VK_RETURN){
				Game.switchScreen(Game.Screen.playScreen);
			}
		}
	}
};



//// PLAY SCREEN
Game.Screen.playScreen = {
	_map: null,
	_player: null,
	_gameEnded: false,
	_subScreen: null,
	enter: function (){
		// Create a map based on our size parameters
        var width = 100;
        var height = 48;
        var depth = 6;
        // Create our map from the tiles and player
        var tiles = new Game.Builder(width, height, depth).getTiles();
        this._player = new Game.Entity(Game.PlayerTemplate);
        this._map = new Game.Map(tiles, this._player);
        //this._map = new Game.Map(map, this._player);
        // Start the map's engine
        this._map.getEngine().start();
	},
	exit: function (){ trace("Exited play screen."); },
	setSubScreen:function(subScreen){
		this._subScreen = subScreen;
		Game.refresh();
	},
	render: function(display){
		// Render subscreen if there is one
		if(this._subScreen){
			this._subScreen.render(display);
			return;
		}
		var screenWidth = Game.getScreenWidth();
		var screenHeight = Game.getScreenHeight();
		var topLeftX = Math.max(0, this._player.getX() - (screenWidth / 2));
		topLeftX = Math.min(topLeftX, this._map.getWidth() - screenWidth);
		var topLeftY = Math.max(0, this._player.getY() - (screenHeight / 2));
		topLeftY = Math.min(topLeftY, this._map.getHeight() - screenHeight);
		// This object will keep track of all visible map cells
		var visibleCells = {};
		var map = this._map;
		var currentDepth = this._player.getZ();
		// Find all visible cells and update the object
		this._map.getFov(this._player.getZ()).compute(
			this._player.getX(), this._player.getY(),
			this._player.getSightRadius(),
			function(x, y, radius, visibility){
				visibleCells[x + ',' + y] = true;
				// Mark cell as explored
				map.setExplored(x,y,currentDepth,true);
			});
		// Render explored map cells
		for(var x = topLeftX; x < topLeftX + screenWidth; x++){
			for (var y = topLeftY; y < topLeftY + screenHeight; y++){
				if(map.isExplored(x,y,currentDepth)){
					var glyph = this._map.getTile(x,y, currentDepth);
					var foreground = glyph.getForeground();
					// If in FOV, check for entities or items
					if (visibleCells[x + ',' + y]){
						var items = map.getItemsAt(x,y, currentDepth);
						// Render topmost item
						if (items){
							glyph = items[items.length -1];
						}
						if(map.getEntityAt(x,y,currentDepth)){
							glyph = map.getEntityAt(x,y, currentDepth);
						}
						foreground = glyph.getForeground();
					} else{
						// Tile was previously explored, but is not visible
						foreground = 'darkGray';
					}
				display.draw(
						x - topLeftX,
						y - topLeftY,
						glyph.getChar(),
						foreground,
						glyph.getBackground()
					);
				}
			}
		}

		/*===== !!! MOVE TO ANOTHER PLACE LATER =====*/
		// Get the messages in the player's queue and render them
		var messages = this._player.getMessage();
		var messageY = 0;
		for(var i = 0; i < messages.length; i++){
			// Draw each message, adding the number of lines
			messageY += display.drawText(0,messageY,'%c{white}%b{midnightblue}' + messages[i])
		}
		// Render player HP
		var stats = '%c{white}%b{midnightblue}';
		stats += vsprintf('HP:%d/%d ', [this._player.getHp(), this._player.getMaxHp()]);
		display.drawText(1, screenHeight, stats);

		/*===========================================*/

	},
	handleInput: function(inputType, inputData){
		// If game over, enter will bring to losing screen
		if(this._gameEnded){
			if(inputType === 'keydown' && inputData.keyCode === ROT.VK_RETURN){
				Game.switchScreen(Game.Screen.loseScreen);
			} 
			return;
		}
		// Handle subscreen input if there is one
		if (this._subScreen){
			this._subScreen.handleInput(inputType, inputData);
			return;
		}
		if (inputType === 'keydown'){
			if(inputData.keyCode === ROT.VK_NUMPAD8){
				this.move(0,-1,0); // move up
			} else if(inputData.keyCode === ROT.VK_NUMPAD9){
				this.move(1,-1,0); // move up-right
			} else if(inputData.keyCode === ROT.VK_NUMPAD6){
				this.move(1,0,0); // move right
			} else if(inputData.keyCode === ROT.VK_NUMPAD3){
				this.move(1,1,0); // move down-right
			} else if(inputData.keyCode === ROT.VK_NUMPAD2){
				this.move(0,1,0); // move down
			} else if(inputData.keyCode === ROT.VK_NUMPAD1){
				this.move(-1,1,0); // move down-left
			} else if(inputData.keyCode === ROT.VK_NUMPAD4){
				this.move(-1,0,0); // move left
			} else if(inputData.keyCode === ROT.VK_NUMPAD7){
				this.move(-1,-1,0); // move up-left
			} else if(inputData.keyCode === ROT.VK_I){
				if(this._player.getItems().filter(function(x){ return x; }).length === 0) {
					// If no items...
					Game.sendMessage(this._player, "You have nothing to drop!");
					Game.refresh();
				} else{
					// Show drop screen
					Game.Screen.dropScreen.setup(this._player, this._player.getItems());
					this.setSubScreen(Game.Screen.dropScreen);
				}
				return;
			} else if (inputData.keyCode === ROT.VK_COMMA){
				var items = this._map.getItemsAt(this._player.getX(), this._player.getY(), this._player.getZ());
				// If no items, show message
				if(!items){
					Game.sendMessage(this._player, "There is nothing to pick up.");
				} else if(items.length === 1){
					// Try to pick up if only one item
					var item = items[0];
					if(this._player.pickupItems([0])){
						Game.sendMessage(this._player, "You pick up %s.", [item.describeA()]);
					} else {
						Game.sendMessage(this._player, "Your inventory is full! Nothing was picked up.");
					}
				} else{
					// Show pickup screen if there are items
					Game.Screen.pickupScreen.setup(this._player, items);
					this.setSubScreen(Game.Screen.pickupScreen);
					return;
				}
			}
			else{
				// Not a valid key
				return;
			}
			// Unlock the engine
			this._map.getEngine().unlock();
		}
		else if(inputType === 'keypress'){
			var keyChar = String.fromCharCode(inputData.charCode);
			if(keyChar === '>'){
				this.move(0,0,1);
			} else if(keyChar === '<'){
				this.move(0,0,-1);
			} else{
				// Not a valid key
				return;
			}
			// Unlock the engine
			this._map.getEngine().unlock();
		}
	},
	move: function(dX, dY, dZ){
		var newX = this._player.getX() + dX;
		var newY = this._player.getY() + dY;
		var newZ = this._player.getZ() + dZ;
		// Try to move to the new cell
		this._player.tryMove(newX, newY, newZ, this._map);
	},
	setGameEnded: function(gameEnded){
		this._gameEnded = gameEnded;
	}
};

Game.Screen.winScreen = {
	enter: function (){ trace("Entered win screen."); },
	exit: function (){ trace("Exited win screen."); },
	render: function(display){
		for (var i = 0; i < 22; i++) {
			// Generate random background colors
			var r = Math.round(Math.random() * 255);
			var g = Math.round(Math.random() * 255);
			var b = Math.round(Math.random() * 255);
			var background = ROT.Color.toRGB([r,g,b]);
			display.drawText(2, i+1, "%b{"+ background +"}You win!");
		}
	},
	handleInput: function(inputType, inputData){
		if (inputType === 'keydown'){
			if(inputData.keyCode === ROT.VK_RETURN){
				Game.switchScreen(Game.Screen.playScreen);
			}
		}
	}
};

Game.Screen.loseScreen = {
    enter: function () {    trace("Entered lose screen."); },
    exit: function () { trace("Exited lose screen."); },
    render: function(display) {
        // Render our prompt to the screen
        for (var i = 0; i < 22; i++) {
            display.drawText(2, i + 1, "%b{red}You lose! :(");
        }
    }
};

/* Subscreen handling */
Game.Screen.ItemListScreen = function(template){
	this._caption = template['caption'];
	this._okFunction = template['ok'];
	this._canSelectItem = template['canSelect'];
	this._canSelectMultipleItems = template['canSelectMultipleItems'];
}
Game.Screen.ItemListScreen.prototype.setup = function(player, items){
	this._player = player;
	this._items = items;
	this._selectedIndices = {};
}
Game.Screen.ItemListScreen.prototype.render = function(display){
	var letters = 'abcdefghijklmnopqrstuvwxyz';
	display.drawText(0,0,this._caption);
	var row = 0;
	for (var i=0; i < this._items.length; i++){
		// Render item
		if(this._items[i]){
			var letter = letters.substring(i,i+1);
			// Show a '+' when selected, '-' when unselected
			var selectionState = (this._canSelectItem && this._canSelectMultipleItems && this._selectedIndices[i]) ? '+' : '-';
			display.drawText(0,2+row, letter + ' ' + selectionState + ' ' + this._items[i].describe());
			row++;
		}
	}
}
Game.Screen.ItemListScreen.prototype.executeOkFunction = function(){
	var selectedItems = {};
	for(var key in this._selectedIndices){
		selectedItems[key] = this._items[key];
	}
	// Switch back to play screen
	Game.Screen.playScreen.setSubScreen(undefined);
	// Call the OK function and end player's turn if true
	if (this._okFunction(selectedItems)){
		this._player.getMap().getEngine().unlock();
	}
}
Game.Screen.ItemListScreen.prototype.handleInput = function(inputType, inputData){
	if (inputType === 'keydown'){
		// Cancel if pressed ESC, or Enter and there are no chosen items or choosable items
		if (inputData.keyCode === ROT.VK_ESCAPE || (inputData.keyCode === ROT.VK_RETURN && (!this._canSelectItem || Object.keys(this._selectedIndices).length === 0 ))){
			Game.Screen.playScreen.setSubScreen(undefined);
		} else if (inputData.keyCode === ROT.VK_RETURN){
			this.executeOkFunction();
		} else if(this._canSelectItem && inputData.keyCode >= ROT.VK_A && inputData.keyCode <= ROT.VK_Z){
			// Letter --> choose item
			var index = inputData.keyCode - ROT.VK_A;
			if(this._items[index]){
				// Multiple selection enabled --> toggle selection
				if (this._canSelectMultipleItems){
					if(this._selectedIndices[index]){
						delete this._selectedIndices[index];
					} else{
						this._selectedIndices[index] = true;
					}
					Game.refresh();
				} else{
					this._selectedIndices[index] = true;
					this.executeOkFunction();
				}
			}
		}
	}
}

Game.Screen.inventoryScreen = new Game.Screen.ItemListScreen({
	caption:'Inventory',
	canSelect: false
});

Game.Screen.pickupScreen = new Game.Screen.ItemListScreen({
	caption:'Choose the items to pick up:',
	canSelect: true,
	canSelectMultipleItems: true,
	ok: function(selectedItems){
		// Try to pick all chosen items
		if(!this._player.pickupItems(Object.keys(selectedItems))){
			Game.sendMessage(this._player, "Your inventory is full! Not all items were picked up.");
		}
		return true;
	}
});

Game.Screen.dropScreen = new Game.Screen.ItemListScreen({
	caption:'Choose the item to drop:',
	canSelect: true,
	canSelectMultipleItems: false,
	ok: function(selectedItems){
		// Drop selected item
		this._player.dropItem(Object.keys(selectedItems)[0]);
		return true;
	}
});