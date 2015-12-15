/*==={ MAP }===*/
Game.Map = function(tiles, player){
	this._tiles = tiles;
	this._depth = tiles.length;
	this._width = tiles[0].length;
	this._height = tiles[0][0].length;
	this._fov = [];
	this._entities = {};
	this._items = {};
	this._scheduler = new ROT.Scheduler.Simple();
	this._engine = new ROT.Engine(this._scheduler);
	this.setupFov();
	this._explored = new Array(this._depth);
	this._setupExploredArray();
	this.addEntityAtRandomPosition(player, 0);
	// Add 15 random enemies to each floor
	for (var z = 0; z < this._depth; z++){
		for (var i = 0; i < 15; i++){
			this.addEntityAtRandomPosition(Game.EntityRepository.createRandom(),z);
		}
	}
	// Add 10 random items to each floor
	for (var z = 0; z < this._depth; z++){
		for (var i = 0; i < 10; i++){
			this.addItemAtRandomPosition(Game.ItemRepository.createRandom(),z);
		}
	}
};

/*===[ GETTERS ]===*/
Game.Map.prototype.getDepth = function(){
	return this._width;
};
Game.Map.prototype.getWidth = function(){
	return this._width;
};
Game.Map.prototype.getHeight = function(){
	return this._height;
};

// Gets the tile for a given coordinate set
Game.Map.prototype.getTile = function(x,y,z){
	// Make sure we are inside the bounds. If we aren't, return null file
	if( x < 0 || x >= this._width ||
		y < 0 || y >= this._height ||
		z < 0 || z >= this._depth){
		return Game.Tile.nullTile;
	}
	else{
		return this._tiles[z][x][y] || Game.Tile.nullTile;
	}
};
Game.Map.prototype.getRandomFloorPosition = function(z){
	// Randomly generate a tile which is a floor and has no entity on it
	var x, y;
	do {
		x = Math.floor(Math.random()*this._width);
		y = Math.floor(Math.random()*this._height);
	} while(!this.isEmptyFloor(x,y,z));
	return {x:x, y:y, z:z};
};

Game.Map.prototype.getEngine = function(){
	return this._engine;
};
Game.Map.prototype.getEntities = function(){
	return this._entities;
};
Game.Map.prototype.getEntityAt = function(x,y,z){
	// Get entity based on position key
	return this._entities[x + ',' + y + ',' + z];
};
Game.Map.prototype.getEntitiesWithinRadius = function(centerX, centerY, centerZ, radius){
	results = [];
	// Determine bounds for radius
	var leftX = centerX - radius;
	var rightX = centerX + radius;
	var topY = centerY - radius;
	var bottomY = centerY + radius;
	// Iterate through our entities, adding any which are within the bounds
	for (var key in this._entities){
		var entity = this._entities[key];
		if (entity.getX() >= leftX && entity.getX() <= rightX &&
            entity.getY() >= topY && entity.getY() <= bottomY &&
            entity.getZ() == centerZ) {
            results.push(entity);
        }
	}
	return results;
};
Game.Map.prototype.updateEntityPosition = function(entity, oldX, oldY, oldZ){
	// Delete the old key if it is the same entity and we have old positions
	if(oldX){
		var oldKey = oldX + ',' + oldY + ',' + oldZ;
		if(this._entities[oldKey] == entity){
			delete this._entities[oldKey];
		}
	}
	// Make sure the entity's position is within bounds
	if (entity.getX() < 0 || entity.getX() >= this._width ||
		entity.getY() < 0 || entity.getY() >= this._height ||
		entity.getZ() < 0 || entity.getZ() >= this._depth){
		throw new Error('Adding entity out of bounds.');
	}
	// Sanity check to make sure there is no entity at the new position
	var key = entity.getX() + ',' + entity.getY() + ',' + entity.getZ();
	if (this._entities[key]){
		throw new Error("Tried to add an entity at an occupied position.");
	}
	// Add the entity to the table of entities
	this._entities[key] = entity;
};
Game.Map.prototype.isEmptyFloor = function(x,y,z){
	// Check if the tile is a floo and also has no entity
	return this.getTile(x,y,z) == Game.Tile.floorTile && !this.getEntityAt(x,y,z);
};
Game.Map.prototype.getFov = function(depth){
	return this._fov[depth];
};
Game.Map.prototype.getItemsAt = function(x, y, z){
	return this._items[x + ',' + y + ',' + z];
}
Game.Map.prototype.setItemsAt = function(x, y, z, items){
	var key = x + ',' + y + ',' + z;
	if(items.length === 0){
		if(this._items[key]){
			delete this._items[key];
		}
	} else{
		this.items[key] = items;
	}
}
Game.Map.prototype.addItem = function(x,y,z,item){
	// Append if items already in position
	var key = x + ',' + y + ',' + z;
	if (this._items[key]){
		this._items[key].push(item);
	} else{
		this._items[key] = [item];
	}
}
Game.Map.prototype.addItemAtRandomPosition = function(item, z){
	var position = this.getRandomFloorPosition(z);
	this.addItem(position.x, position.y, position.z, item);
}




/*===[ SETTERS ]===*/
Game.Map.prototype.dig = function(x,y,z){
	// If the tile is diggable, update it to a floor
	if(this.getTile(x,y,z).isDiggable()){
		this._tiles[z][x][y] = Game.Tile.floorTile;
	}
};
Game.Map.prototype._setupExploredArray = function(){
	// Iterate through the 3-dimensional space and add each tile as 'false' to explored matrix
	for (var z = 0; z < this._depth; z++){
		this._explored[z] = new Array(this._width);
		for (var x = 0; x < this._width; x++){
			this._explored[z][x] = new Array(this._height);
			for (var y = 0; y < this._height; y++){
				this._explored[z][x][y] = false;
			}
		}
	}
};
Game.Map.prototype.setExplored = function(x,y,z,state){
	// Only update if tile is within bounds
	if (this.getTile(x,y,z) !== Game.Tile.nullTile){
		this._explored[z][x][y] = state;
	}
};
Game.Map.prototype.isExplored = function(x,y,z){
	// Only return value if tile is within bounds
	if (this.getTile(x,y,z) !== Game.Tile.nullTile){
		return this._explored[z][x][y];
	} else{
		return false;
	}
};
Game.Map.prototype.setupFov = function(){
	var map = this;
	// Iterate through each depth level, set up field of vision
    for (var z = 0; z < this._depth; z++) {
        // We have to put the following code in it's own scope to prevent the
        // depth variable from being hoisted out of the loop.
        (function() {
            // For each depth, we need to create a callback which figures out
            // if light can pass through a given tile.
            var depth = z;
            map._fov.push(
                new ROT.FOV.DiscreteShadowcasting(function(x, y) {
                    return !map.getTile(x, y, depth).isBlockingLight();
                }, {topology: 4}));
        })();
    }
};
Game.Map.prototype.addEntity = function(entity){
	// Update the entity's map
	entity.setMap(this);
	// Update the map with entity's position
	this.updateEntityPosition(entity);
	// Check if this entity is an actor, and add them to the scheduler if positive
	if (entity.hasMixin('Actor')){
		this._scheduler.add(entity, true);
	}
};
Game.Map.prototype.addEntityAtRandomPosition = function(entity,z){
	var position = this.getRandomFloorPosition(z);
	entity.setX(position.x);
	entity.setY(position.y);
	entity.setZ(position.z);
	this.addEntity(entity);
};
Game.Map.prototype.removeEntity = function(entity){
	// Remove the entity from the map
	var key = entity.getX() + ',' + entity.getY() + ',' + entity.getZ();
	if (this._entities[key] == entity){
		delete this._entities[key];
	}
	// If the entity is an actor, remove them from the scheduler
	if (entity.hasMixin('Actor')){
		this._scheduler.remove(entity);
	}
};