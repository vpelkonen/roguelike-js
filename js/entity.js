Game.Entity = function(properties){
	properties = properties || {};
	// Call the glyph's constructor with our set of properties
	Game.Glyph.call(this, properties);
	// Instantiate any properties from the passed object
	this._name = properties['name'] || '';
	this._x = properties['x'] || 0;
	this._y = properties['y'] || 0;
	this._z = properties['z'] || 0;
	this._map = null;
	// Create an object which will keep track what mixins we have attached to this entity based on the name property
	this._attachedMixins = {};
	// Create a similar object for groups
	this._attachedMixinGroups = {};
	// Setup the object's mixins
	var mixins = properties['mixins'] || [];
	for(var i = 0; i < mixins.length; i++){
		// Copy all properties from mixins, except name or init
		// Make sure not to override a property that already exists
		for (var key in mixins[i]){
			if (key != 'init' && key != 'name' && !this.hasOwnProperty(key)){
				this[key] = mixins[i][key];
			}
		}
		// Add the name of this mixin to our attached mixins
		this._attachedMixins[mixins[i].name] = true;
		// If a group name is present, add it
		if(mixins[i].groupName){
			this._attachedMixinGroups[mixins[i].groupName] = true;
		}
		// Finally call the init function if there is one
		if (mixins[i].init){
			mixins[i].init.call(this, properties);
		}
	}
}

// Make entities inherit all the functionality from glyphs
Game.Entity.extend(Game.Glyph);

Game.Entity.prototype.setName = function(name) {
	this._name = name;
};
Game.Entity.prototype.setX = function(x) {
	this._x = x;
};
Game.Entity.prototype.setY = function(y) {
	this._y = y;
};
Game.Entity.prototype.setZ = function(z) {
	this._z = z;
};
Game.Entity.prototype.setMap = function(map) {
	this._map = map;
};
Game.Entity.prototype.getName = function() {
	return this._name;
};
Game.Entity.prototype.getX = function() {
	return this._x;
};
Game.Entity.prototype.getY = function() {
	return this._y;
};
Game.Entity.prototype.getZ = function() {
	return this._z;
};
Game.Entity.prototype.getMap = function() {
	return this._map;
};
Game.Entity.prototype.hasMixin = function(obj){
	// Allow passing the mixin itself or he name as a string
	if(typeof obj === 'object'){
		return this._attachedMixins[obj.name];
	}
	else{
		return this._attachedMixins[obj] || this._attachedMixinGroups[obj];
	}
}

Game.Entity.prototype.setPosition = function(x, y, z){
	var oldX = this._x;
	var oldY = this._y;
	var oldZ = this._z;
	// Update position
	this._x = x;
	this._y = y;
	this._z = z;
	// If the entity is on a map, notify the map that it has moved
	if(this._map){
		this._map.updateEntityPosition(this, oldX, oldY, oldZ);
	}
}

Game.Entity.prototype.tryMove = function(x,y,z,map){
	var map = this.getMap();
	// Must use starting Z
	var tile = map.getTile(x, y, this.getZ());
	var target = map.getEntityAt(x, y, this.getZ());
	// If Z-level changed, check if we're on a stair
	if (z < this.getZ()){
		if (tile != Game.Tile.stairsUpTile){
			Game.sendMessage(this, "You can't go up there!");
		} else{
			Game.sendMessage(this, "You ascend to level %d!", [z+1]);
			this.setPosition(x,y,z);
		}
	} else if (z > this.getZ()){
		if (tile != Game.Tile.stairsDownTile){
			Game.sendMessage(this, "You can't go down there!");
		} else{
			Game.sendMessage(this, "You descend to level %d!", [z+1]);
			this.setPosition(x,y,z);
		}
	}
	// If an entity was present at the tile...
	else if(target){
		// Attack if the entity is an attacker, and either is Player or target's a player
		if (this.hasMixin('Attacker') &&
			(this.hasMixin(Game.EntityMixins.PlayerActor) ||
			 target.hasMixin(Game.EntityMixins.PlayerActor) )) {
			this.attack(target);
			return true;
		}
		// Do nothing when there's a target but can't move there
		return false;
	}
	// Check if we can walk on the tile, and walk into it if positive
	else if(tile.isWalkable()){
		this.setPosition(x,y,z);
		// Notify if there are items
		var items = this.getMap().getItemsAt(x,y,z);
		if(items){
			if (items.length === 1){
				Game.sendMessage(this, "You see %s.", [items[0].describeA()]);
			} else{
				Game.sendMessage(this, "There are several objects here.");
			}
		}
		return true;
	} // Check if the tile is diggable, and dig if positive
	else if(tile.isDiggable()){
		// Dig only if player
		if(this.hasMixin(Game.EntityMixins.PlayerActor)){
			map.dig(x,y,z);
			return true;
		}
		// Can't dig, can't move
		return false;
	}
	return false;
}