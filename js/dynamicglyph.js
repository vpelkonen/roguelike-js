/*==={ DYNAMIC GLYPH }===*/

/*
Game.DynamicGlyph = function(properties){
	properties = properties || {};
	Game.Glyph.call(this, properties);
	this._name = properties['name'] || '';
	this._attachedMixins = {};
	this._attachedMixinGroups = {};
	// Setup the objects mixins
	var mixins = properties['mixins'] || [];
	for (var i=0; i < mixins.length; i++){
		// Copy over all non-name non-init properties that won't overwrite anything
		for(var key in mixins[i]){
			if (key != 'init' && key != 'name' && !this.hasOwnProperty(key)){
				this[key] = mixins[i][key];
			}
		}
		// Add the name of this mixin to our attached mixins
		this._attachedMixinGroups[mixins[i].groupName] = true;
		// If a group name is present, add it
		if(mixins[i].groupName){
			this._attachedMixinGroups[mixins[i].groupName] = true;
		}

	}
}
*/