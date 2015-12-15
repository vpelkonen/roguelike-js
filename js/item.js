Game.Item = function(properties) {
	properties = properties || {};
	// Call the glyph's contructor with our set of properties
	Game.Glyph.call(this, properties);
	// Instantiate any properties from the passed object
	this._name = properties['name'] || '';
}
// Make items inherit all the functionality from glyphs
Game.Item.extend(Game.Glyph);

Game.Item.prototype.describe = function() {
	return this._name;
}
Game.Item.prototype.describeA = function(capitalize) {
	// Optional parameter to capitalize the a/an
	var prefixes = capitalize ? ['A','An'] : ['a', 'an'];
	var string = this.describe();
	var firstLetter = string.charAt(0).toLowerCase();
	// TODO: imperfect prefixing
	var prefix = 'aeiou'.indexOf(firstLetter) >= 0 ? 1 : 0;
	return prefixes[prefix] + ' ' + string;
}