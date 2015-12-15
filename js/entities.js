/*==={ ENTITIES }===*/
// Entities build up all the individual and grouped items, characters, creatures, map features and such.
// Entities consist of a 'template' and a number of 'mixins', which are modules that are added to templates.


/*==={ MIXINS }===*/
// Create our Mixins namespace
Game.Mixins = {};

// Field of vision attribute
Game.Mixins.Sight = {
	name:'Sight',
	groupName: 'Sight',
	init: function(template){
		this._sightRadius = template['sightRadius'] || 5;
	},
	getSightRadius: function(){
		return this._sightRadius;
	}
}

// Wandering mover
Game.Mixins.WanderActor = {
	name:'WanderActor',
	groupName:'Actor',
	act: function(){
		// Flip coin to determine if moving by 1 in the positive or negative direction
        var moveOffset = (Math.round(Math.random()) === 1) ? 1 : -1;
        // Flip coin to determine if moving in x direction or y direction
        if (Math.round(Math.random()) === 1) {
            this.tryMove(this.getX() + moveOffset, this.getY(), this.getZ());
        } else {
            this.tryMove(this.getX(), this.getY() + moveOffset, this.getZ());
        }
	}
}

// Simple Attacker
Game.Mixins.Attacker = {
	name:'Attacker',
	groupName: 'Attacker',
	init: function(template){
		this._attackValue = template['attackValue'] || 1;
	},
	getAttackValue: function(){ return this._attackValue; },
	attack: function(target){
		// If target is Destructible, calculate damage
		if(target.hasMixin('Destructible')){
			var attack = this.getAttackValue();
			var defense = target.getDefenseValue();
			var max = Math.max(0, attack - defense);
			var damage = 1 + Math.floor(Math.random() * max);
			Game.sendMessage(this, 'You strike the %s for %d damage!', [target.getName(), damage]);
			Game.sendMessage(target, 'The %s strikes you for %d damage!', [this.getName(), damage]);
			target.takeDamage(this, damage);

		}
	}
}
// Destructible
Game.Mixins.Destructible = {
	name:'Destructible',
	init: function(template){
		// Use stats marked in template
		this._maxHp = template['maxHp'] || 10;
		this._hp = template['hp'] || this._maxHp;
		this._defenseValue = template['defenseValue'] || 0;
	},
	getHp: function(){ return this._hp; },
	getMaxHp: function(){ return this._maxHp; },
	getDefenseValue: function(){ return this._defenseValue; },
	takeDamage: function(attacker, damage){
		this._hp -= damage;
		if (this._hp <= 0){
			Game.sendMessage(attacker, 'You kill the %s!', [this.getName()]);
			// Check if the player died, and if so call their act method to prompt the user
			if (this.hasMixin(Game.Mixins.PlayerActor)){
				this.act();
			} else{
				this.getMap().removeEntity(this);
			}
		}
	}
}

Game.Mixins.InventoryHolder = {
	name:'InventoryHolder',
	init: function(template) {
		// TODO: make inventory size reasonable
		var inventorySlots = template['inventorySlots'] || 10;
		this._items = new Array(inventorySlots);
	},
	getItems: function(){
		return this._items;
	},
	getItem: function(i){
		return this._items[i];
	},
	addItem: function(item){
		// Find a slot, if available
		for (var i=0; i < this._items.length; i++){
			if(!this._items[i]){
				this._items[i] = item;
				return true;
			}
		}
		return false;
	},
	removeItem: function(i){
		this._items[i] = null;
	},
	canAddItem: function(){
		for(var i=0; i < this._items.length; i++){
			if(!this._items[i]){
				return true;
			}
		}
		return false;
	},
	pickupItems: function(indices){
		var mapItems = this._map.getItemsAt(this.getX(), this.getY(), this.getZ());
		var added = 0;
		for(var i=0; i < indices.length; i++){
			if(this.addItem(mapItems[indices[i] - added])){
				mapItems.splice(indices[i] - added, 1);
				added++;
			} else{
				// Inventory full
				break;
			}
		}
		// Update map items
		this._map.setItemsAt(this.getX(), this.getY(), this.getZ(), mapItems);
		// Return true only if we added all items
		return added === indices.length;
	},
	dropItem: function(i){
		if(this._items[i]){
			if(this._map){
				this._map.addItem(this.getX(), this.getY(), this.getZ(), this._items[i]);
			}
			this.removeItem(i);
		}
	}
}

// Main player's actor mixin
Game.Mixins.PlayerActor = {
	name:'PlayerActor',
	groupName:'Actor',
	act: function(){
		if(this.getHp() < 1){
			Game.Screen.playScreen.setGameEnded(true);
			// Send the last thought...
			Game.sendMessage(this,"Everything turns dark and you feel consciousness slip from your mind's grasp. In one heavy sigh you let out your last breath... Press [Enter] to continue.");
		}
		// Re-render the screen
		Game.refresh();
		// Lock the engine and wait asynchronously for the player to press a key
		this.getMap().getEngine().lock();
		// Clear the message queue
		this.clearMessages();
	}
}


// Fungus's actor mixin
Game.Mixins.FungusActor = {
	name: 'FungusActor',
	groupName: 'Actor',
	init: function(){
		this._growthsRemaining = 5;
	},
	act: function(){
		// Check if the fungus tries to breed this turn
		if (this._growthsRemaining > 0){
			if (Math.random() <= 0.02){
				// Generate the coordinates of a random adjacent square by generating an offset between [-1,0,1] for both the x and y directions. To do this, we generate a number from 0-2 and then subtract 1.
				var xOffset = Math.floor(Math.random() * 3) -1;
				var yOffset = Math.floor(Math.random() * 3) -1;
				// Make sure not to spawn on the same tile as the spawner
				if (xOffset != 0 || yOffset != 0){
					// Check if the location is empty, and spawn
					if (this.getMap().isEmptyFloor(	this.getX() + xOffset,
													this.getY() + yOffset,
													this.getZ()) ){
						var entity = Game.EntityRepository.create('fungus');
						entity.setPosition(this.getX() + xOffset, this.getY() + yOffset, this.getZ());
						this.getMap().addEntity(entity);
						this._growthsRemaining--;
						// Send a message nearby
						Game.sendMessageNearby(this.getMap(), entity.getX(), entity.getY(), entity.getZ(), 'The fungus is spreading!');
					}
				}
			}
		}
	}
}

Game.Mixins.MessageRecipient = {
	name: 'MessageRecipient',
	init: function(template){
		this._messages = [];
	},
	receiveMessage: function(message){
		this._messages.push(message);
	},
	getMessage: function(message){
		return this._messages;
	},
	clearMessages: function(){
		this._messages = [];
	}
}

Game.sendMessage = function(recipient, message, args){
	// Make sure the recipient can receive the message before doing any work
	if (recipient.hasMixin(Game.Mixins.MessageRecipient)){
		// If args were passed, format the message
		if(args){
			message = vsprintf(message, args);
		}
		recipient.receiveMessage(message);
	}
}

Game.sendMessageNearby = function(map, centerX, centerY, centerZ, message, args){
	// If args were passed, format the message
	if(args){
		message = vsprintf(message, args);
	}
	// Get nearby entities
	var entities = map.getEntitiesWithinRadius(centerX, centerY, centerZ, 5);
	// Iterate through nearby entities, sending the message if they have the recipient mixin
	for (var i = 0; i < entities.length; i++){
		if(entities[i].hasMixin(Game.Mixins.MessageRecipient)){
			entities[i].receiveMessage(message);
		}
	}
};


/*==={ TEMPLATES }===*/
// Player
Game.PlayerTemplate = {
	name: 'you',
	character: '@',
	foreground: 'red',
	maxHp: 10,
	attackValue: 3,
	defenseValue: 1,
	sightRadius: 6,
	inventorySlots: 22,
	mixins: [	Game.Mixins.PlayerActor,
				Game.Mixins.Attacker, Game.Mixins.Destructible,
				Game.Mixins.Sight, Game.Mixins.MessageRecipient,
				Game.Mixins.InventoryHolder]
};

// Central entity repository
Game.EntityRepository = new Game.Repository('entities', Game.Entity);

Game.EntityRepository.define('fungus', {
	name: 'fungus',
	character: 'd',
	foreground: 'white',
	maxHp: 5,
	mixins: [Game.Mixins.FungusActor, Game.Mixins.Destructible]
});

Game.EntityRepository.define('bat', {
	name:'bat',
	character:'B',
	foreground:'white',
	maxHp:5,
	attackValue:4,
	mixins:[Game.Mixins.WanderActor, Game.Mixins.Attacker,
			Game.Mixins.Destructible]
});

Game.EntityRepository.define('newt', {
	name:'newt',
	character:':',
	foreground:'yellow',
	maxHp:3,
	attackValue:2,
	mixins:[Game.Mixins.WanderActor, Game.Mixins.Attacker,
			Game.Mixins.Destructible]
});