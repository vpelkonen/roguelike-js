/*==={ REPOSITORY }===*/
/* Handles usage of object templates found in repository files. */
// A repository has a name and a constructor, The constructor is used toc reate items in the repository.
Game.Repository = function(name, ctor){
	this._name = name;
	this._templates = {};
	this._ctor = ctor;
}

// Define a new named template
Game.Repository.prototype.define = function(name, template){
	this._templates[name] = template;
}

// Create an object based on a template.
Game.Repository.prototype.create = function(name){
	// Make sure name matches a template
	var template = this._templates[name];
	if (!template){
		throw new Error("No template named '"+ name +"' in repository '"+ this._name +"'");
	}
	return new this._ctor(template);
}

Game.Repository.prototype.createRandom = function(){
	// Pick random key
	return this.create(Object.keys(this._templates).random());
}