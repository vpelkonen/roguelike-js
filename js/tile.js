/*==={ TILES }===*/
Game.Tile = function(properties){
	properties = properties || {};
	// Call the Glyph constructor with our properties
	Game.Glyph.call(this, properties);
	this._isWalkable = properties['isWalkable'] || false; // false by default
	this._isDiggable = properties['isDiggable'] || false; // false by default
	this._blocksLight = (properties['blocksLight'] !== undefined) ? properties['blocksLight'] : true; // true by default
}
// Make tiles inherit all the functionality from glyphs
Game.Tile.extend(Game.Glyph);

// Standard getters
Game.Tile.prototype.isWalkable = function(){
	return this._isWalkable;	
}
Game.Tile.prototype.isDiggable = function(){
	return this._isDiggable;
}
Game.Tile.prototype.isBlockingLight = function(){
	return this._blocksLight;
}

Game.Tile.nullTile = new Game.Tile(); // an empty tile
Game.Tile.floorTile = new Game.Tile({
	character:'.',
	foreground:'white',
	isWalkable: true,
	blocksLight: false
});
Game.Tile.wallTile = new Game.Tile({
	character: '#',
	foreground: 'goldenrod',
	isDiggable: true
});
Game.Tile.stairsUpTile = new Game.Tile({
	character:'<',
	foreground: 'white',
	isWalkable: true,
	blocksLight: false
});
Game.Tile.stairsDownTile = new Game.Tile({
	character:'>',
	foreground: 'white',
	isWalkable: true,
	blocksLight: false
});
Game.getNeighborPositions = function(x,y){
	var tiles = [];
	// Generate all possible offsets: -1, 0, 1
	for (var dX = -1; dX < 2; dX++){
		for (var dY = -1; dY < 2; dY++){
			// Make sure it isn't the same tile
			if(dX == 0 && dY == 0){
				continue;
			}
			tiles.push({x: x + dX, y: y + dY});
		}
	}
	return tiles.randomize();
}
