/* global Base: true */
/* global Product: true */
/* global global: true */
/* global My: true */
var Model = require("can-model");
var QUnit = require("steal-qunit");
var fixture = require("can-fixture");
var Map = require("can-map");
var List = require("can-list");
var ObservationRecorder = require("can-observation-recorder");
var Event = require("can-event-queue/map/map");
var can = require("can-namespace");
var Promise = global.Promise;
var jQuery = require("jquery");

QUnit.module('can-model', {
	setup: function () {}
});

test('shadowed id', function () {
	var MyModel = Model.extend({
		id: 'foo'
	}, {
		foo: function () {
			return this.attr('foo');
		}
	});
	var newModel = new MyModel({});
	ok(newModel.isNew(), 'new model is isNew');
	var oldModel = new MyModel({
		foo: 'bar'
	});
	ok(!oldModel.isNew(), 'old model is not new');
	equal(oldModel.foo(), 'bar', 'method can coexist with attribute');
});
test('findAll deferred', function () {
	var Person = Model('Person', {
		findAll: function (params, success, error) {
			var self = this;
			return can.ajax({
				url: __dirname+'/test/people.json',
				data: params,
				dataType: 'json'
			})
				.then(function (data) {
					return self.models(data);
				});
		}
	}, {});
	stop();
	var people = Person.findAll({});
	people.then(function (people) {
		equal(people.length, 1, 'we got a person back');
		equal(people[0].name, 'Justin', 'Got a name back');
		equal(people[0].constructor.shortName, 'Person', 'got a class back');
		start();
	});
});
test('findAll rejects non-array (#384)', function () {
	var Person = Model.extend({
		findAll: function (params, success, error) {
			var dfd = new Promise(function(resolve) {
				setTimeout(function () {
					resolve({
						stuff: {}
					});
				}, 100);
			});
			return dfd;
		}
	}, {});
	stop();
	Person.findAll({})
		.then(function () {
			ok(false, 'This should not succeed');
			start();
		}, function (err) {
			ok(err instanceof Error, 'Got an error');
			equal(err.message, 'Could not get any raw data while converting using .models');
			start();
		});
});

asyncTest('findAll deferred reject', function () {
	// This test is automatically paused
	var Person = Model('Person', {
		findAll: function (params, success, error) {
			var df = new Promise(function(resolve, reject) {
				if (params.resolve) {
					setTimeout(resolve, 100);
				} else {
					setTimeout(reject, 100);
				}
			});
			return df;
		}
	}, {});
	var people_reject = Person.findAll({
		resolve: false
	});
	var people_resolve = Person.findAll({
		resolve: true
	});
	setTimeout(function () {
		people_reject.then(function () {
			ok(false, 'This deferred should be rejected');
		}, function () {
			ok(true, 'The deferred is rejected');
		});
		people_resolve.then(function () {
			ok(true, 'This deferred is resolved');
		});
		people_resolve.catch(function () {
			ok(false, 'The deferred should be resolved');
		});
		// continue the test
		start();
	}, 200);
});
if (window.jQuery) {

	asyncTest("support callbacks", function(){
		var prev = can.Model.ajax;
		can.Model.ajax = jQuery.ajax;
		var Person = can.Model.extend({
			findOne: __dirname +"/test/person.json"
		},{});

		Person.findOne({}, function callback(instance, status, xhr){
			QUnit.ok(instance, "instance");
			QUnit.ok(status, "status");
			QUnit.ok(xhr, "xhr");
			can.Model.ajax = prev;
			QUnit.start();
		});
	});
	/*
	asyncTest('findAll abort', function () {
		expect(4);
		var df;
		var Person = Model('Person', {
			findAll: function (params, success, error) {
				var reject;
				var df = new Promise(function(_, rej) { reject = rej; });
				df.then(function () {
					ok(!params.abort, 'not aborted');
				}, function () {
					ok(params.abort, 'aborted');
				});
				df.abort = reject;
				return df;
			}
		}, {});
		Person.findAll({
			abort: false
		})
			.done(function () {
				ok(true, 'resolved');
			});
		var resolveDf = df;
		var abortPromise = Person.findAll({
			abort: true
		})
			.fail(function () {
				ok(true, 'failed');
			});
		setTimeout(function () {
			resolveDf.resolve();
			abortPromise.abort();
			// continue the test
			start();
		}, 200);
	});
	*/
}
test('findOne deferred', function () {
	var Person;
	if (window.jQuery) {
	  Person = Model('Person', {
			findOne: function (params, success, error) {
				var self = this;
				return can.ajax({
					url: __dirname+'/test/person.json',
					data: params,
					dataType: 'json'
				})
					.then(function (data) {
						return self.model(data);
					});
			}
		}, {});
	} else {
		Person = Model('Person', {
			findOne: __dirname+'/test/person.json'
		}, {});
	}
	stop();
	var person = Person.findOne({});
	person.then(function (person) {
		equal(person.name, 'Justin', 'Got a name back');
		equal(person.constructor.shortName, 'Person', 'got a class back');
		start();
	});
});
test('save deferred', function () {
	var Person = Model.extend('Person', {
		create: function (attrs, success, error) {
			return Promise.resolve({id : 5}); //fixturize;
		}
	}, {});
	var person = new Person({
		name: 'Justin'
	}),
		personD = person.save();
	stop();
	personD.then(function (person) {
		start();
		equal(person.id, 5, 'we got an id');
	});
});
test('update deferred', function () {
	var Person = Model('Person', {
		update: function (id, attrs, success, error) {
			return Promise.resolve({ thing: 'er' });
		}
	}, {});
	var person = new Person({
		name: 'Justin',
		id: 5
	}),
		personD = person.save();
	stop();
	personD.then(function (person) {
		start();
		equal(person.thing, 'er', 'we got updated');
	});
});
test('destroy deferred', function () {
	var Person = Model('Person', {
		destroy: function (id, success, error) {
			return Promise.resolve({
				thing: 'er'
			});
		}
	}, {});
	var person = new Person({
		name: 'Justin',
		id: 5
	}),
		personD = person.destroy();
	stop();
	personD.then(function (person) {
		start();
		equal(person.thing, 'er', 'we got destroyed');
	});
});
test('models', function () {
	var Person = Model('Person', {
		prettyName: function () {
			return 'Mr. ' + this.name;
		}
	});
	var people = Person.models([{
		id: 1,
		name: 'Justin'
	}]);
	equal(people[0].prettyName(), 'Mr. Justin', 'wraps wrapping works');
});
test('.models with custom id', function () {
	var CustomId = Model('CustomId', {
		findAll: __dirname+'/test/customids.json',
		id: '_id'
	}, {
		getName: function () {
			return this.name;
		}
	});
	var results = CustomId.models([{
		'_id': 1,
		'name': 'Justin'
	}, {
		'_id': 2,
		'name': 'Brian'
	}]);
	equal(results.length, 2, 'Got two items back');
	equal(results[0].name, 'Justin', 'First name right');
	equal(results[1].name, 'Brian', 'Second name right');
});
/*
 test("async setters", function(){


 Model("Test.AsyncModel",{
 setName : function(newVal, success, error){


 setTimeout(function(){
 success(newVal)
 }, 100)
 }
 });

 var model = new Test.AsyncModel({
 name : "justin"
 });
 equal(model.name, "justin","property set right away")

 //makes model think it is no longer new
 model.id = 1;

 var count = 0;

 model.bind('name', function(ev, newName){
 equal(newName, "Brian",'new name');
 equal(++count, 1, "called once");
 ok(new Date() - now > 0, "time passed")
 start();
 })
 var now = new Date();
 model.attr('name',"Brian");
 stop();
 })*/
test('binding', 2, function () {
	var Person = Model('Person');
	var inst = new Person({
		foo: 'bar'
	});
	inst.bind('foo', function (ev, val) {
		ok(true, 'updated');
		equal(val, 'baz', 'values match');
	});
	inst.attr('foo', 'baz');
});
test('auto methods', function () {
	//turn off fixtures
	fixture.on = false;
	var School = Model.extend('Jquery_Model_Models_School', {
		findAll: __dirname+'/test/{type}.json',
		findOne: __dirname+'/test/{id}.json',
		create: 'GET ' + __dirname+'/test/create.json',
		update: 'GET ' + __dirname+'/test/update{id}.json'
	}, {});
	stop();
	School.findAll({
		type: 'schools'
	}, function (schools) {
		ok(schools, 'findAll Got some data back');
		//TODO fix can-construct's eval statement so it can allow dots in names.
		//equal(schools[0].constructor.shortName, 'School', 'there are schools');
		School.findOne({
			id: '4'
		}, function (school) {
			ok(school, 'findOne Got some data back');
			//equal(school.constructor.shortName, 'School', 'a single school');
			new School({
				name: 'Highland'
			})
				.save(function (school) {
					equal(school.name, 'Highland', 'create gets the right name');
					school.attr({
						name: 'LHS'
					})
						.save(function () {
							start();
							equal(school.name, 'LHS', 'create gets the right name');
							fixture.on = true;
						});
				});
		});
	});
});
test('isNew', function () {
	var Person = Model('Person');
	var p = new Person();
	ok(p.isNew(), 'nothing provided is new');
	var p2 = new Person({
		id: null
	});
	ok(p2.isNew(), 'null id is new');
	var p3 = new Person({
		id: 0
	});
	ok(!p3.isNew(), '0 is not new');
});
test('findAll string', function () {
	fixture.on = false;
	var TestThing = Model('Test_Thing', {
		findAll: __dirname+'/test/findAll.json' + ''
	}, {});
	stop();
	TestThing.findAll({}, function (things) {
		equal(things.length, 1, 'got an array');
		equal(things[0].id, 1, 'an array of things');
		start();
		fixture.on = true;
	});
});

test('Model events', function () {
	expect(12);
	var order = 0,
		item;
	var TestEvent = Model('Test_Event', {
		create: function (attrs) {
			var def = Promise.resolve({
				id: 1
			});
			return def;
		},
		update: function (id, attrs, success) {
			var def = Promise.resolve(attrs);
			return def;
		},
		destroy: function (id, success) {
			var def = Promise.resolve({});
			return def;
		}
	}, {});
	stop();
	TestEvent.bind('created', function (ev, passedItem) {
		ok(this === TestEvent, 'got model');
		ok(passedItem === item, 'got instance');
		equal(++order, 1, 'order');
		passedItem.save();
	})
		.bind('updated', function (ev, passedItem) {
			equal(++order, 2, 'order');
			ok(this === TestEvent, 'got model');
			ok(passedItem === item, 'got instance');
			passedItem.destroy();
		})
		.bind('destroyed', function (ev, passedItem) {
			equal(++order, 3, 'order');
			ok(this === TestEvent, 'got model');
			ok(passedItem === item, 'got instance');
			start();
		});
	item = new TestEvent();
	item.bind('created', function () {
		ok(true, 'created');
	})
		.bind('updated', function () {
			ok(true, 'updated');
		})
		.bind('destroyed', function () {
			ok(true, 'destroyed');
		});
	item.save();
});

test('removeAttr test', function () {
	var Person = Model('Person');
	var person = new Person({
		foo: 'bar'
	});
	equal(person.foo, 'bar', 'property set');
	person.removeAttr('foo');
	equal(person.foo, undefined, 'property removed');
	var attrs = person.attr();
	equal(attrs.foo, undefined, 'attrs removed');
});
test('save error args', function () {
	var Foo = Model.extend('Testin_Models_Foo', {
		create: '/testinmodelsfoos.json'
	}, {});
	var st = '{"type": "unauthorized"}';
	fixture('/testinmodelsfoos.json', function (request, response) {
		response(401, st);
	});
	stop();
	new Foo({})
		.save(function () {
			ok(false, 'success should not be called');
			start();
		}, function (error) {
			ok(true, 'error called');
			ok(error.type, 'unauthorized');
			start();
		});
});
test('object definitions', function () {
	var ObjectDef = Model('ObjectDef', {
		findAll: {
			url: '/test/place',
			dataType: 'json'
		},
		findOne: {
			url: '/objectdef/{id}',
			timeout: 1000
		},
		create: {},
		update: {},
		destroy: {}
	}, {});
	fixture('GET /objectdef/{id}', function (original) {
		//TODO can-fixture doesn't return arbitrary keys anymore.
		//     Is this intended?
		//equal(original.timeout, 1000, 'timeout set');
		return {
			yes: true
		};
	});
	fixture('GET /test/place', function (original) {
		return [original.data];
	});
	stop();
	ObjectDef.findOne({
		id: 5
	}, function () {
		start();
	});
	stop();
	// Do find all, pass some attrs
	ObjectDef.findAll({
		start: 0,
		count: 10,
		myflag: 1
	}, function (data) {
		start();
		equal(data[0].myflag, 1, 'my flag set');
	});
	stop();
	// Do find all with slightly different attrs than before,
	// and notice when leaving one out the other is still there
	ObjectDef.findAll({
		start: 0,
		count: 10
	}, function (data) {
		start();
		equal(data[0].myflag, undefined, 'my flag is undefined');
	});
});
// TODO when() deferreds like the fixture is using now do
//   not support abort()
QUnit.skip('aborting create update and destroy', function () {
	stop();
	var delay = fixture.delay;
	fixture.delay = 1000;
	fixture('POST /abort', function () {
		ok(false, 'we should not be calling the fixture');
		return {};
	});
	var Abortion = Model('Abortion', {
		create: 'POST /abort',
		update: 'POST /abort',
		destroy: 'POST /abort'
	}, {});
	var deferred = new Abortion({
		name: 'foo'
	})
		.save(function () {
			ok(false, 'success create');
			start();
		}, function () {
			ok(true, 'create error called');
			deferred = new Abortion({
				name: 'foo',
				id: 5
			})
				.save(function () {
					ok(false, 'save called');
					start();
				}, function () {
					ok(true, 'error called in update');
					deferred = new Abortion({
						name: 'foo',
						id: 5
					})
						.destroy(function () {}, function () {
							ok(true, 'destroy error called');
							fixture.delay = delay;
							start();
						});
					setTimeout(function () {
						deferred.abort();
					}, 10);
				});
			setTimeout(function () {
				deferred.abort();
			}, 10);
		});
	setTimeout(function () {
		deferred.abort();
	}, 10);
});
test('store binding', function () {
	var Storage = Model('Storage');
	var s = new Storage({
		id: 1,
		thing: {
			foo: 'bar'
		}
	});
	ok(!Storage.store[1], 'not stored');
	var func = function () {};
	s.bind('foo', func);
	ok(Storage.store[1], 'stored');
	s.unbind('foo', func);
	ok(!Storage.store[1], 'not stored');
	var s2 = new Storage({});
	s2.bind('foo', func);
	s2.attr('id', 5);
	ok(Storage.store[5], 'stored');
	s2.unbind('foo', func);
	ok(!Storage.store[5], 'not stored');
});
test('store ajax binding', function () {
	var Guy = Model.extend({
		findAll: '/guys',
		findOne: '/guy/{id}'
	}, {});
	fixture('GET /guys', function () {
		return [{
			id: 1
		}];
	});
	fixture('GET /guy/{id}', function () {
		return {
			id: 1
		};
	});
	stop();
	Promise.all([Guy.findOne({
		id: 1
	}), Guy.findAll()])
		.then(function (pack) {
			var guyRes = pack[0],
					guysRes2 = pack[1];
			equal(guyRes.id, 1, 'got a guy id 1 back');
			equal(guysRes2[0].id, 1, 'got guys w/ id 1 back');
			ok(guyRes === guysRes2[0], 'guys are the same');
			// check the store is empty
			setTimeout(function () {
				var id;
				start();
				for (id in Guy.store) {
					ok(false, 'there should be nothing in the store');
				}
			}, 1);
		});
});
test('store instance updates', function () {
	var Guy, updateCount;
	Guy = Model.extend({
		findAll: 'GET /guys'
	}, {});
	updateCount = 0;
	fixture('GET /guys', function () {
		var guys = [{
			id: 1,
			updateCount: updateCount,
			nested: {
				count: updateCount
			}
		}];
		updateCount++;
		return guys;
	});
	stop();
	Guy.findAll({}, function (guys) {
		start();
		guys[0].bind('updated', function () {});
		ok(Guy.store[1], 'instance stored');
		equal(Guy.store[1].updateCount, 0, 'updateCount is 0');
		equal(Guy.store[1].nested.count, 0, 'nested.count is 0');
	});
	Guy.findAll({}, function (guys) {
		equal(Guy.store[1].updateCount, 1, 'updateCount is 1');
		equal(Guy.store[1].nested.count, 1, 'nested.count is 1');
	});
});
/*
 test("store instance update removed fields", function(){
var Guy, updateCount, remove;

Guy = Model.extend({
	findAll : 'GET /guys'
},{});
remove = false;

fixture("GET /guys", function(){
	var guys = [{id: 1, name: 'mikey', age: 35, likes: ['soccer', 'fantasy baseball', 'js', 'zelda'], dislikes: ['backbone', 'errors']}];
	if(remove) {
		delete guys[0].name;
		guys[0].likes = [];
		delete guys[0].dislikes;
	}
	remove = true;
	return guys;
});
stop();
Guy.findAll({}, function(guys){
	start();
	guys[0].bind('updated', function(){});
	ok(Guy.store[1], 'instance stored');
	equal(Guy.store[1].name, 'mikey', 'name is mikey')
	equal(Guy.store[1].likes.length, 4, 'mikey has 4 likes')
	equal(Guy.store[1].dislikes.length, 2, 'mikey has 2 dislikes')
})
Guy.findAll({}, function(guys){
	equal(Guy.store[1].name, undefined, 'name is undefined')
	equal(Guy.store[1].likes.length, 0, 'no likes')
	equal(Guy.store[1].dislikes, undefined, 'dislikes removed')
})

})
 */
test('templated destroy', function () {
	var MyModel = Model.extend({
		destroy: '/destroyplace/{id}'
	}, {});
	fixture('/destroyplace/{id}', function (original) {
		ok(true, 'fixture called');
		equal(original.url, '/destroyplace/5', 'urls match');
		return {};
	});
	stop();
	new MyModel({
		id: 5
	})
		.destroy(function () {
			start();
		});
	fixture('/product/{id}', function (original) {
		equal(original.data.id, 9001, 'Changed ID is correctly set.');
		start();
		return {};
	});
	Base = Model.extend({
		id: '_id'
	}, {});
	Product = Base({
		destroy: 'DELETE /product/{id}'
	}, {});
	new Product({
		_id: 9001
	})
		.destroy();
	stop();
});
test('extended templated destroy', function () {
	var MyModel = Model({
		destroy: '/destroyplace/{attr1}/{attr2}/{id}'
	}, {});
	fixture('/destroyplace/{attr1}/{attr2}/{id}', function (original) {
		ok(true, 'fixture called');
		equal(original.url, '/destroyplace/foo/bar/5', 'urls match');
		return {};
	});
	stop();
	new MyModel({
		id: 5,
		attr1: 'foo',
		attr2: 'bar'
	})
		.destroy(function () {
			start();
		});
	fixture('/product/{attr3}/{id}', function (original) {
		equal(original.data.id, 9001, 'Changed ID is correctly set.');
		start();
		return {};
	});
	Base = Model({
		id: '_id'
	}, {});
	Product = Base({
		destroy: 'DELETE /product/{attr3}/{id}'
	}, {});
	new Product({
		_id: 9001,
		attr3: 'great'
	})
		.destroy();
	stop();
});
test('overwrite makeFindAll', function () {
	var store = {},
		count;
	var LocalModel = Model.extend({
		makeFindOne: function (findOne) {
			return function (params, success, error) {
				var resolve, reject;
				var def = new Promise(function(res, rej) {
					resolve = res;
					reject = rej;
				}),
				data = store[params.id];
				def.then(success, error);
				// make the ajax request right away
				var findOneDeferred = findOne(params);
				if (data) {
					var instance = this.model(data);
					findOneDeferred.then(function (data) {
						instance.updated(data);
					}, function () {
						can.dispatch(instance, 'error', data);
					});
					resolve(instance);
				} else {
					findOneDeferred.then(function (data) {
						var instance = this.model(data);
						store[instance[this.id]] = data;
						resolve(instance);
					}.bind(this), function (data) {
						reject(data);
					});
				}
				return def;
			};
		}
	}, {
		updated: function (attrs) {
			Model.prototype.updated.apply(this, arguments);
			store[this[this.constructor.id]] = this.serialize();
		}
	});
	fixture('/food/{id}', function (settings) {
		return count === 0 ? {
			id: settings.data.id,
			name: 'hot dog'
		} : {
			id: settings.data.id,
			name: 'ice water'
		};
	});
	var Food = LocalModel({
		findOne: '/food/{id}'
	}, {});
	stop();
	count = 0;
	Food.findOne({
		id: 1
	}, function (food) {
		count = 1;
		ok(true, 'empty findOne called back');
		food.bind('name', function () {
			ok(true, 'name changed');
			equal(count, 2, 'after last find one');
			equal(this.name, 'ice water');
			start();
		});
		Food.findOne({
			id: 1
		}, function (food2) {
			count = 2;
			ok(food2 === food, 'same instances');
			equal(food2.name, 'hot dog');
		});
	});
});
test('inheriting unique model names', function () {
	var Foo = Model.extend({});
	var Bar = Model.extend({});
	ok(Foo.fullName !== Bar.fullName, 'fullNames not the same');
});
test('model list attr', function () {
	var Person = Model('Person', {}, {});
	var list1 = new Person.List(),
		list2 = new Person.List([
			new Person({
				id: 1
			}),
			new Person({
				id: 2
			})
		]);
	equal(list1.length, 0, 'Initial empty list has length of 0');
	list1.attr(list2);
	equal(list1.length, 2, 'Merging using attr yields length of 2');
});
asyncTest('destroying a model impact the right list', function () {
	var Person = Model('Person', {
		destroy: function (id, success) {
			var def = Promise.resolve({});
			return def;
		}
	}, {});
	var Organisation = Model('Organisation', {
		destroy: function (id, success) {
			var def = Promise.resolve({});
			return def;
		}
	}, {});
	var people = new Person.List([
		new Person({
			id: 1
		}),
		new Person({
			id: 2
		})
	]),
		orgs = new Organisation.List([
			new Organisation({
				id: 1
			}),
			new Organisation({
				id: 2
			})
		]);
	// you must be bound to the list to get this
	people.bind('length', function () {});
	orgs.bind('length', function () {});
	// set each person to have an organization
	people[0].attr('organisation', orgs[0]);
	people[1].attr('organisation', orgs[1]);
	equal(people.length, 2, 'Initial Person.List has length of 2');
	equal(orgs.length, 2, 'Initial Organisation.List has length of 2');
	orgs[0].destroy();
	setTimeout(function() {
		equal(people.length, 2, 'After destroying orgs[0] Person.List has length of 2');
		equal(orgs.length, 1, 'After destroying orgs[0] Organisation.List has length of 1');
		start();
	}, 10);
});
test('uses attr with isNew', function () {
	// TODO this does not seem to be consistent expect(2);
	var old = ObservationRecorder.add;
	ObservationRecorder.add = function (object, attribute) {
		if (attribute === 'id') {
			ok(true, 'used attr');
		}
	};
	var m = new Model({
		id: 4
	});
	m.isNew();
	ObservationRecorder.add = old;
});
test('extends defaults by calling base method', function () {
	var M1 = Model.extend({
		defaults: {
			foo: 'bar'
		}
	}, {});
	var M2 = M1({});
	equal(M2.defaults.foo, 'bar');
});
test('.models updates existing list if passed', 4, function () {
	var MyModel = Model.extend({});
	var list = MyModel.models([{
		id: 1,
		name: 'first'
	}, {
		id: 2,
		name: 'second'
	}]);
	list.bind('add', function (ev, newData) {
		equal(newData.length, 3, 'Got all new items at once');
	});
	var newList = MyModel.models([{
		id: 3,
		name: 'third'
	}, {
		id: 4,
		name: 'fourth'
	}, {
		id: 5,
		name: 'fifth'
	}], list);
	equal(list, newList, 'Lists are the same');
	equal(newList.attr('length'), 3, 'List has new items');
	equal(list[0].name, 'third', 'New item is the first one');
});
test('calling destroy with unsaved model triggers destroyed event (#181)', function () {
	var MyModel = Model.extend({}, {}),
		newModel = new MyModel(),
		list = new MyModel.List(),
		deferred;
	// you must bind to a list for this feature
	list.bind('length', function () {});
	list.push(newModel);
	equal(list.attr('length'), 1, 'List length as expected');
	deferred = newModel.destroy();
	ok(deferred, '.destroy returned a Deferred');
	deferred.then(function (data) {
		equal(list.attr('length'), 0, 'Unsaved model removed from list');
		ok(data === newModel, 'Resolved with destroyed model as described in docs');
	});
});
test('model removeAttr (#245)', function () {
	var MyModel = Model.extend({}),
		model;
	Model._reqs++;
	// pretend it is live bound
	model = MyModel.model({
		id: 0,
		index: 2,
		name: 'test'
	});
	model = MyModel.model({
		id: 0,
		name: 'text updated'
	});
	equal(model.attr('name'), 'text updated', 'attribute updated');
	equal(model.attr('index'), 2, 'Index attribute still remains');
	MyModel = Model.extend({
		removeAttr: true
	}, {});
	Model._reqs++;
	// pretend it is live bound
	model = MyModel.model({
		id: 0,
		index: 2,
		name: 'test'
	});
	model = MyModel.model({
		id: 0,
		name: 'text updated'
	});
	equal(model.attr('name'), 'text updated', 'attribute updated');
	deepEqual(model.attr(), {
		id: 0,
		name: 'text updated'
	}, 'Index attribute got removed');
});
test('.model on create and update (#301)', function () {
	var MyModel = Model.extend({
		create: 'POST /todo',
		update: 'PUT /todo',
		model: function (data) {
			return Model.model.call(this, data.item);
		}
	}, {}),
		id = 0,
		updateTime;
	fixture('POST /todo', function (original, respondWith, settings) {
		id++;
		return {
			item: can.assign(original.data, {
				id: id
			})
		};
	});
	fixture('PUT /todo', function (original, respondWith, settings) {
		updateTime = new Date()
			.getTime();
		return {
			item: {
				updatedAt: updateTime
			}
		};
	});
	stop();

	MyModel.bind('created', function (ev, created) {
		start();
		deepEqual(created.attr(), {
			id: 1,
			name: 'Dishes'
		}, '.model works for create');
	})
		.bind('updated', function (ev, updated) {
			start();
			deepEqual(updated.attr(), {
				id: 1,
				name: 'Laundry',
				updatedAt: updateTime
			}, '.model works for update');
		});
	var instance = new MyModel({
		name: 'Dishes'
	}),
		saveD = instance.save();
	stop();
	saveD.then(function () {
		instance.attr('name', 'Laundry')
			.save();
	});
});
test('List params uses findAll', function () {
	stop();
	fixture('/things', function (request) {
		equal(request.data.param, 'value', 'params passed');
		return [{
			id: 1,
			name: 'Thing One'
		}];
	});
	var MyModel = Model.extend({
		findAll: '/things'
	}, {});
	var items = new MyModel.List({
		param: 'value'
	});
	items.bind('add', function (ev, items, index) {
		equal(items[0].name, 'Thing One', 'items added');
		start();
	});
});

test('destroy not calling callback for new instances (#403)', function () {
	var Recipe = Model.extend({}, {});
	expect(1);
	stop();
	new Recipe({
		name: 'mow grass'
	})
		.destroy(function (recipe) {
			ok(true, 'Destroy called');
			start();
		});
});

test('.model should always serialize Observes (#444)', function () {
	var ConceptualDuck = Model.extend({
		defaults: {
			sayeth: 'Abstractly \'quack\''
		}
	}, {});
	var ObserveableDuck = Map({}, {});
	equal('quack', ConceptualDuck.model(new ObserveableDuck({
			sayeth: 'quack'
		}))
		.sayeth);
});

test('string configurable model and models functions (#128)', function () {
	var StrangeProp = Model.extend({
		model: 'foo',
		models: 'bar'
	}, {});
	var strangers = StrangeProp.models({
		bar: [{
			foo: {
				id: 1,
				name: 'one'
			}
		}, {
			foo: {
				id: 2,
				name: 'two'
			}
		}]
	});
	deepEqual(strangers.attr(), [{
		id: 1,
		name: 'one'
	}, {
		id: 2,
		name: 'two'
	}]);
});

test('create deferred does not resolve to the same instance', function () {
	var Todo = Model.extend({
		create: function () {
			var def = Promise.resolve({
				id: 5
			});
			return def;
		}
	}, {});
	var handler = function () {};
	var t = new Todo({
		name: 'Justin'
	});
	t.bind('name', handler);
	var def = t.save();
	stop();
	def.then(function (todo) {
		ok(todo === t, 'same instance');
		start();
		ok(Todo.store[5] === t, 'instance put in store');
		t.unbind('name', handler);
	});
});

test("Model#save should not replace attributes with their default values (#560)", function () {

	fixture("POST /person.json", function (request, response) {

		return {
			createdAt: "now"
		};
	});

	var Person = Model.extend({
		update: 'POST /person.json'
	}, {
		name: 'Example name'
	});

	var person = new Person({
		id: 5,
		name: 'Justin'
	}),
		personD = person.save();

	stop();

	personD.then(function (person) {
		start();
		equal(person.name, "Justin", "Model name attribute value is preserved after save");

	});
});

test(".parseModel as function on create and update (#560)", function () {
	var MyModel = Model.extend({
		create: 'POST /todo',
		update: 'PUT /todo',
		parseModel: function (data) {
			return data.item;
		}
	}, {
		aDefault: "foo"
	}),
		id = 0,
		updateTime;

	fixture('POST /todo', function (original, respondWith, settings) {
		id++;
		return {
			item: can.assign(original.data, {
				id: id
			})
		};
	});
	fixture('PUT /todo', function (original, respondWith, settings) {
		updateTime = new Date()
			.getTime();
		return {
			item: {
				updatedAt: updateTime
			}
		};
	});

	stop();
	MyModel.bind('created', function (ev, created) {
		start();
		deepEqual(created.attr(), {
			id: 1,
			name: 'Dishes',
			aDefault: "bar"
		}, '.model works for create');
	})
		.bind('updated', function (ev, updated) {
			start();
			deepEqual(updated.attr(), {
				id: 1,
				name: 'Laundry',
				updatedAt: updateTime
			}, '.model works for update');
		});

	var instance = new MyModel({
		name: 'Dishes',
		aDefault: "bar"
	}),
		saveD = instance.save();

	stop();
	saveD.then(function () {
		instance.attr('name', 'Laundry');
		instance.removeAttr("aDefault");
		instance.save();
	});

});

test(".parseModel as string on create and update (#560)", function () {
	var MyModel = Model.extend({
		create: 'POST /todo',
		update: 'PUT /todo',
		parseModel: "item"
	}, {
		aDefault: "foo"
	}),
		id = 0,
		updateTime;

	fixture('POST /todo', function (original, respondWith, settings) {
		id++;
		return {
			item: can.assign(original.data, {
				id: id
			})
		};
	});
	fixture('PUT /todo', function (original, respondWith, settings) {
		updateTime = new Date()
			.getTime();
		return {
			item: {
				updatedAt: updateTime
			}
		};
	});

	stop();
	MyModel.bind('created', function (ev, created) {
		start();
		deepEqual(created.attr(), {
			id: 1,
			name: 'Dishes',
			aDefault: "bar"
		}, '.model works for create');
	})
		.bind('updated', function (ev, updated) {
			start();
			deepEqual(updated.attr(), {
				id: 1,
				name: 'Laundry',
				updatedAt: updateTime
			}, '.model works for update');
		});

	var instance = new MyModel({
		name: 'Dishes',
		aDefault: "bar"
	}),
		saveD = instance.save();

	stop();
	saveD.then(function () {
		instance.attr('name', 'Laundry');
		instance.removeAttr("aDefault");
		instance.save();
	});

});

test("can create a model with a string", function(){
	var foo = new Model("abc");
	QUnit.ok(foo, "got abc");
});

test("parseModels and findAll", function () {

	var array = [{
		id: 1,
		name: "first"
	}];

	fixture("/mymodels", function () {
		return array;
	});

	var MyModel = Model.extend({
		findAll: "/mymodels",
		parseModels: function (raw, xhr) {

			deepEqual(array, raw, "got passed raw data");
			return {
				data: raw,
				count: 1000
			};
		}
	}, {});

	stop();

	MyModel.findAll({}, function (models) {
		equal(models.count, 1000);
		start();
	});

});

test("parseModels and parseModel and findAll", function () {

	fixture("/mymodels", function () {
		return {
			myModels: [{
				myModel: {
					id: 1,
					name: "first"
				}
			}]
		};
	});

	var MyModel = Model.extend({
		findAll: "/mymodels",
		parseModels: "myModels",
		parseModel: "myModel"
	}, {});

	stop();

	MyModel.findAll({}, function (models) {
		deepEqual(models.attr(), [{
			id: 1,
			name: "first"
		}], "correct models returned");
		start();
	});

});

test("findAll rejects when parseModels returns non-array data #1662", function(){
	fixture("/mymodels", function () {
		return {
			status: 'success',
			message: ''
		};
	});

	var MyModel = Model.extend({
		findAll: "/mymodels",
		parseModels: function(raw) {
			raw.data = undefined;
			return raw;
		}
	}, {});

	stop();

	MyModel.findAll({})
		.then(function(){
			ok(false, 'This should not succeed');
			start();
		}, function(err){
			ok(err instanceof Error, 'Got an error');
			equal(err.message, 'Could not get any raw data while converting using .models');
			start();
		});
});

test("Nested lists", function(){
	var Teacher = Model.extend({});
	var teacher = new Teacher();
	teacher.attr("locations", [{id: 1, name: "Chicago"}, {id: 2, name: "LA"}]);
	ok(!(teacher.attr('locations') instanceof Teacher.List), 'nested list is not an instance of Teacher.List');
	ok(!(teacher.attr('locations')[0] instanceof Teacher), 'nested map is not an instance of Teacher');
});

test("#501 - resource definition - create", function() {
	fixture("/foods", function() {
		return [];
	});

	var FoodModel = Model.extend({
		resource: "/foods"
	}, {});

	stop();
	var steak = new FoodModel({name: "steak"});
	steak.save(function(food) {
		equal(food.name, "steak", "create created the correct model");
		start();
	});
});

test("#501 - resource definition - findAll", function() {
	fixture("/drinks", function() {
		return [{
			id: 1,
			name: "coke"
		}];
	});

	var DrinkModel = Model.extend({
		resource: "/drinks"
	}, {});

	stop();
	DrinkModel.findAll({}, function(drinks) {
		deepEqual(drinks.attr(), [{
			id: 1,
			name: "coke"
		}], "findAll returned the correct models");
		start();
	});
});

test("#501 - resource definition - findOne", function() {
	fixture("GET /clothes/{id}", function() {
		return [{
			id: 1,
			name: "pants"
		}];
	});

	var ClothingModel = Model.extend({
		resource: "/clothes"
	}, {});

	stop();
	ClothingModel.findOne({id: 1}, function(item) {
		equal(item[0].name, "pants", "findOne returned the correct model");
		start();
	});
});

test("#501 - resource definition - remove trailing slash(es)", function() {
	fixture("POST /foods", function() {
		return [];
	});

	var FoodModel = Model.extend({
		resource: "/foods//////"
	}, {});

	stop();
	var steak = new FoodModel({name: "steak"});
	steak.save(function(food) {
		equal(food.name, "steak", "removed trailing '/' and created the correct model");
		start();
	});
});

test("model list destroy after calling replace", function(){
	expect(2);
	var map = new Model({name: "map1"});
	var map2 = new Model({name: "map2"});
	var list = new Model.List([map, map2]);
	list.bind('destroyed', function(ev){
		ok(true, 'trigger destroyed');
	});
	Event.dispatch.call(map, 'destroyed');
	list.replace([map2]);
	Event.dispatch.call(map2, 'destroyed');
});

// TODO fix can-construct's eval() to re-enable this test
QUnit.skip("a model defined with a fullName has findAll working (#1034)", function(){
	var MyList = List.extend();

	Model.extend("My.Model",{
		List: MyList
	},{});

	equal(List.Map, My.Model, "list's Map points to My.Model");

});

test("providing parseModels works", function(){
	var MyModel = Model.extend({
		parseModel: "modelData"
	},{});

	var data = MyModel.parseModel({modelData: {id: 1}});
	equal(data.id,1, "correctly used parseModel");
});

test('#1089 - resource definition - inheritance', function() {
	fixture('GET /things/{id}', function() {
		return { id: 0, name: 'foo' };
	});

	var Base = Model.extend();
	var Thing = Base.extend({
		resource: '/things'
	}, {});

	stop();
	Thing.findOne({ id: 0 }, function(thing) {
		equal(thing.name, 'foo', 'found model in inherited model');
		start();
	}, function(e, msg) {
		ok(false, msg);
		start();
	});
});

test('#1089 - resource definition - CRUD overrides', function() {
	fixture('GET /foos/{id}', function() {
		return { id: 0, name: 'foo' };
	});

	fixture('POST /foos', function() {
		return { id: 1 };
	});

	fixture('PUT /foos/{id}', function() {
		return { id: 1, updated: true };
	});

	fixture('GET /bars', function() {
		return [{}];
	});

	var Thing = Model.extend({
		resource: '/foos',
		findAll: 'GET /bars',
		update: {
			url: '/foos/{id}',
			type: 'PUT'
		},
		create: function() {
			return can.ajax({
				url: '/foos',
				type: 'POST'
			});
		}
	}, {});

	var alldfd = Thing.findAll(),
	onedfd = Thing.findOne({ id: 0 }),
	postdfd = new Thing().save();

	stop();
	Promise.all([alldfd, onedfd, postdfd])
	.then(function(pack) {
		var things = pack[0],
				thing = pack[1],
				newthing = pack[2];
		equal(things.length, 1, 'findAll override called');
		equal(thing.name, 'foo', 'resource findOne called');
		equal(newthing.id, 1, 'post override called with function');

		newthing.save(function(res) {
			ok(res.updated, 'put override called with object');
			start();
		});
	})
	.catch(function() {
		ok(false, 'override request failed');
		start();
	});
});

test("findAll not called if List constructor argument is deferred (#1074)", function() {
	var count = 0;
	var Foo = Model.extend({
		findAll: function() {
			count++;
			return Promise.resolve();
		}
	}, {});
	new Foo.List(Foo.findAll());
	equal(count, 1, "findAll called only once.");
});

test("static methods do not get overwritten with resource property set (#1309)", function() {
	var Base = Model.extend({
		resource: '/path',
		findOne: function() {
			var dfd = Promise.resolve({
				text: 'Base findAll'
			});
			return dfd;
		}
	}, {});

	stop();

	Base.findOne({}).then(function(model) {
		ok(model instanceof Base);
		deepEqual(model.attr(), {
			text: 'Base findAll'
		});
		start();
	}, function() {
		ok(false, 'Failed handler should not be called.');
	});
});

test("parseModels does not get overwritten if already implemented in base class (#1246, #1272)", 5, function() {
	var Base = Model.extend({
		findOne: function() {
			var dfd = Promise.resolve({
				text: 'Base findOne'
			});
			return dfd;
		},
		parseModel: function(attributes) {
			deepEqual(attributes, {
				text: 'Base findOne'
			}, 'parseModel called');
			attributes.parsed = true;
			return attributes;
		}
	}, {});
	var Extended = Base.extend({}, {});

	stop();

	Extended.findOne({}).then(function(model) {
		ok(model instanceof Base);
		ok(model instanceof Extended);
		deepEqual(model.attr(), {
			text: 'Base findOne',
			parsed: true
		});
		start();
	}, function() {
		ok(false, 'Failed handler should not be called.');
	});

	var Third = Extended.extend({
		findOne: function() {
			var dfd = Promise.resolve({
				nested: {
					text: 'Third findOne'
				}
			});
			return dfd;
		},

		parseModel: 'nested'
	}, {});

	Third.findOne({}).then(function(model) {
		equal(model.attr('text'), 'Third findOne', 'correct findOne used');
	});
});

test("Models with no id (undefined or null) are not placed in store (#1358)", function(){
	var MyStandardModel = Model.extend({});
	var MyCustomModel = Model.extend({id:"ID"}, {});

	var myID = null;
	var instanceNull = new MyStandardModel ({id:myID});
	var instanceUndefined = new MyStandardModel ({});
	var instanceCustom = new MyCustomModel({ID:myID});


	instanceNull.bind('change', function(){});
	instanceUndefined.bind('change', function(){});
	instanceCustom.bind('change', function(){});


	ok(typeof MyStandardModel.store[instanceNull.id] === "undefined", "Model should not be added to store when id is null");
	ok(typeof MyStandardModel.store[instanceUndefined.id] === "undefined", "Model should not be added to store when id is undefined");
	ok(typeof MyCustomModel.store[instanceCustom[instanceCustom.constructor.id]] === "undefined", "Model should not be added to store when id is null");

});

test("Models should be removed from store when instance.removeAttr('id') is called", function(){
	var Task = Model.extend({},{});
	var t1 = new Task({id: 1, name: "MyTask"});

	t1.bind('change', function(){});
	ok(Task.store[t1.id].name === "MyTask", "Model should be in store");

	t1.removeAttr("id");
	ok(typeof Task.store[t1.id] === "undefined", "Model should be removed from store when `id` is removed");

});

test("uses def.fail if model uses jquery deferred", function() {
	var Thing = Model.extend('Thing', {
		findOne: function (data, success, error) {
			// simulate a jquery@2 deferred that is not promise-compliant
			var dfd = {
				then: function() {
					return dfd;
				},
				fail: function(cb) {
					cb();
				}
			};
			return dfd;
		},
		_clean: function () {
			ok(true, '_clean should be called');
		}
	}, {});

	Thing.findOne({});
});

test("set custom ajax function (#62)", function(){
	fixture('GET /todos', function () {
		return [{id: 1}];
	});
	var Todo = Model.extend({
		findAll: "GET /todos",
		ajax: function(settings) {
			QUnit.ok(true,"custom ajax called");
			QUnit.equal( settings.url , "/todos", "url looks right");
			// Return the promise otherwise it throws an error
			// "Cannot read property 'then' of undefined"
			return Promise.resolve();
		}
	}, {});
	Todo.findAll();
});
