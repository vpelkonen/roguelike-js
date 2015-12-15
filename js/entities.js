/*==={ ENTITIES }===*/
// Entities build up all the individual and grouped items, characters, creatures, map features and such.
// Entities consist of a 'template' and a number of 'mixins', which are modules that are added to templates.
// Mixins are found in entitymixins.js

Game.PlayerTemplate = {
	name: 'you',
	character: '@',
	foreground: 'red',
	maxHp: 10,
	attackValue: 3,
	defenseValue: 1,
	sightRadius: 6,
	inventorySlots: 22,
	mixins: [	Game.EntityMixins.PlayerActor,
				Game.EntityMixins.Attacker, Game.EntityMixins.Destructible,
				Game.EntityMixins.Sight, Game.EntityMixins.MessageRecipient,
				Game.EntityMixins.InventoryHolder]
};

// Central entity repository
Game.EntityRepository = new Game.Repository('entities', Game.Entity);

Game.EntityRepository.define('fungus', {
	name: 'fungus',
	character: 'd',
	foreground: 'white',
	maxHp: 5,
	mixins: [Game.EntityMixins.FungusActor, Game.EntityMixins.Destructible]
});

Game.EntityRepository.define('bat', {
	name:'bat',
	character:'B',
	foreground:'white',
	maxHp:5,
	attackValue:4,
	mixins:[Game.EntityMixins.WanderActor, Game.EntityMixins.Attacker,
			Game.EntityMixins.Destructible]
});

Game.EntityRepository.define('newt', {
	name:'newt',
	character:':',
	foreground:'yellow',
	maxHp:3,
	attackValue:2,
	mixins:[Game.EntityMixins.WanderActor, Game.EntityMixins.Attacker,
			Game.EntityMixins.Destructible]
});