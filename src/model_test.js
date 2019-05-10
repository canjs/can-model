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

QUnit.module('can-model', {
	beforeEach: function(assert) {}
});

QUnit.test('shadowed id', function(assert) {
	var MyModel = Model.extend({
		id: 'foo'
	}, {
		foo: function () {
			return this.attr('foo');
		}
	});
	var newModel = new MyModel({});
	assert.ok(newModel.isNew(), 'new model is isNew');
	var oldModel = new MyModel({
		foo: 'bar'
	});
	assert.ok(!oldModel.isNew(), 'old model is not new');
	assert.equal(oldModel.foo(), 'bar', 'method can coexist with attribute');
});
QUnit.test('findAll deferred', function(assert) {
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
	var done = assert.async();
	var people = Person.findAll({});
	people.then(function (people) {
		assert.equal(people.length, 1, 'we got a person back');
		assert.equal(people[0].name, 'Justin', 'Got a name back');
		assert.equal(people[0].constructor.shortName, 'Person', 'got a class back');
		done();
	});
});
QUnit.test('findAll rejects non-array (#384)', function(assert) {
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
	var done = assert.async();
	Person.findAll({})
		.then(function () {
			assert.ok(false, 'This should not succeed');
			done();
		}, function (err) {
			assert.ok(err instanceof Error, 'Got an error');
			assert.equal(err.message, 'Could not get any raw data while converting using .models');
			done();
		});
});

QUnit.test('findAll deferred reject', function(assert) {
    var ready = assert.async();
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
			assert.ok(false, 'This deferred should be rejected');
		}, function () {
			assert.ok(true, 'The deferred is rejected');
		});
		people_resolve.then(function () {
			assert.ok(true, 'This deferred is resolved');
		});
		people_resolve.catch(function () {
			assert.ok(false, 'The deferred should be resolved');
		});
		ready();
	}, 200);
});
if (window.jQuery) {
	QUnit.test('findAll abort', function(assert) {
        var ready = assert.async();
        assert.expect(4);
        var df;
        var Person = Model('Person', {
			findAll: function (params, success, error) {
				var reject;
				var df = new Promise(function(_, rej) { reject = rej; });
				df.then(function () {
					assert.ok(!params.abort, 'not aborted');
				}, function () {
					assert.ok(params.abort, 'aborted');
				});
				df.abort = reject;
				return df;
			}
		}, {});
        Person.findAll({
			abort: false
		})
			.start(function () {
				assert.ok(true, 'resolved');
			});
        var resolveDf = df;
        var abortPromise = Person.findAll({
			abort: true
		})
			.fail(function () {
				assert.ok(true, 'failed');
			});
        setTimeout(function () {
			resolveDf.resolve();
			abortPromise.abort();
			ready();
		}, 200);
    });
}
QUnit.test('findOne deferred', function(assert) {
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
	var done = assert.async();
	var person = Person.findOne({});
	person.then(function (person) {
		assert.equal(person.name, 'Justin', 'Got a name back');
		assert.equal(person.constructor.shortName, 'Person', 'got a class back');
		done();
	});
});
QUnit.test('save deferred', function(assert) {
	var Person = Model.extend('Person', {
		create: function (attrs, success, error) {
			return Promise.resolve({id : 5}); //fixturize;
		}
	}, {});
	var person = new Person({
		name: 'Justin'
	}),
		personD = person.save();
	var done = assert.async();
	personD.then(function (person) {
		done();
		assert.equal(person.id, 5, 'we got an id');
	});
});
QUnit.test('update deferred', function(assert) {
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
	var done = assert.async();
	personD.then(function (person) {
		done();
		assert.equal(person.thing, 'er', 'we got updated');
	});
});
QUnit.test('destroy deferred', function(assert) {
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
	var done = assert.async();
	personD.then(function (person) {
		done();
		assert.equal(person.thing, 'er', 'we got destroyed');
	});
});
QUnit.test('models', function(assert) {
	var Person = Model('Person', {
		prettyName: function () {
			return 'Mr. ' + this.name;
		}
	});
	var people = Person.models([{
		id: 1,
		name: 'Justin'
	}]);
	assert.equal(people[0].prettyName(), 'Mr. Justin', 'wraps wrapping works');
});
QUnit.test('.models with custom id', function(assert) {
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
	assert.equal(results.length, 2, 'Got two items back');
	assert.equal(results[0].name, 'Justin', 'First name right');
	assert.equal(results[1].name, 'Brian', 'Second name right');
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
 done();
 })
 var now = new Date();
 model.attr('name',"Brian");
 var done = assert.async();
 })*/
QUnit.test('binding', 2, function(assert) {
	var Person = Model('Person');
	var inst = new Person({
		foo: 'bar'
	});
	inst.bind('foo', function (ev, val) {
		assert.ok(true, 'updated');
		assert.equal(val, 'baz', 'values match');
	});
	inst.attr('foo', 'baz');
});
QUnit.test('auto methods', function(assert) {
	//turn off fixtures
	fixture.on = false;
	var School = Model.extend('Jquery_Model_Models_School', {
		findAll: __dirname+'/test/{type}.json',
		findOne: __dirname+'/test/{id}.json',
		create: 'GET ' + __dirname+'/test/create.json',
		update: 'GET ' + __dirname+'/test/update{id}.json'
	}, {});
	var done = assert.async();
	School.findAll({
		type: 'schools'
	}, function (schools) {
		assert.ok(schools, 'findAll Got some data back');
		//TODO fix can-construct's eval statement so it can allow dots in names.
		//equal(schools[0].constructor.shortName, 'School', 'there are schools');
		School.findOne({
			id: '4'
		}, function (school) {
			assert.ok(school, 'findOne Got some data back');
			//equal(school.constructor.shortName, 'School', 'a single school');
			new School({
				name: 'Highland'
			})
				.save(function (school) {
					assert.equal(school.name, 'Highland', 'create gets the right name');
					school.attr({
						name: 'LHS'
					})
						.save(function () {
							done();
							assert.equal(school.name, 'LHS', 'create gets the right name');
							fixture.on = true;
						});
				});
		});
	});
});
QUnit.test('isNew', function(assert) {
	var Person = Model('Person');
	var p = new Person();
	assert.ok(p.isNew(), 'nothing provided is new');
	var p2 = new Person({
		id: null
	});
	assert.ok(p2.isNew(), 'null id is new');
	var p3 = new Person({
		id: 0
	});
	assert.ok(!p3.isNew(), '0 is not new');
});
QUnit.test('findAll string', function(assert) {
	fixture.on = false;
	var TestThing = Model('Test_Thing', {
		findAll: __dirname+'/test/findAll.json' + ''
	}, {});
	var done = assert.async();
	TestThing.findAll({}, function (things) {
		assert.equal(things.length, 1, 'got an array');
		assert.equal(things[0].id, 1, 'an array of things');
		done();
		fixture.on = true;
	});
});

QUnit.test('Model events', function(assert) {
	assert.expect(12);
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
	var done = assert.async();
	TestEvent.bind('created', function (ev, passedItem) {
		assert.ok(this === TestEvent, 'got model');
		assert.ok(passedItem === item, 'got instance');
		assert.equal(++order, 1, 'order');
		passedItem.save();
	})
		.bind('updated', function (ev, passedItem) {
			assert.equal(++order, 2, 'order');
			assert.ok(this === TestEvent, 'got model');
			assert.ok(passedItem === item, 'got instance');
			passedItem.destroy();
		})
		.bind('destroyed', function (ev, passedItem) {
			assert.equal(++order, 3, 'order');
			assert.ok(this === TestEvent, 'got model');
			assert.ok(passedItem === item, 'got instance');
			done();
		});
	item = new TestEvent();
	item.bind('created', function () {
		assert.ok(true, 'created');
	})
		.bind('updated', function () {
			assert.ok(true, 'updated');
		})
		.bind('destroyed', function () {
			assert.ok(true, 'destroyed');
		});
	item.save();
});

QUnit.test('removeAttr test', function(assert) {
	var Person = Model('Person');
	var person = new Person({
		foo: 'bar'
	});
	assert.equal(person.foo, 'bar', 'property set');
	person.removeAttr('foo');
	assert.equal(person.foo, undefined, 'property removed');
	var attrs = person.attr();
	assert.equal(attrs.foo, undefined, 'attrs removed');
});
QUnit.test('save error args', function(assert) {
	var Foo = Model.extend('Testin_Models_Foo', {
		create: '/testinmodelsfoos.json'
	}, {});
	var st = '{"type": "unauthorized"}';
	fixture('/testinmodelsfoos.json', function (request, response) {
		response(401, st);
	});
	var done = assert.async();
	new Foo({})
		.save(function () {
			assert.ok(false, 'success should not be called');
			done();
		}, function (error) {
			assert.ok(true, 'error called');
			assert.ok(error.type, 'unauthorized');
			done();
		});
});
QUnit.test('object definitions', function(assert) {
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
	var done = assert.async();
	ObjectDef.findOne({
		id: 5
	}, function () {
		done();
	});
	var done = assert.async();
	// Do find all, pass some attrs
	ObjectDef.findAll({
		start: 0,
		count: 10,
		myflag: 1
	}, function (data) {
		done();
		assert.equal(data[0].myflag, 1, 'my flag set');
	});
	var done = assert.async();
	// Do find all with slightly different attrs than before,
	// and notice when leaving one out the other is still there
	ObjectDef.findAll({
		start: 0,
		count: 10
	}, function (data) {
		done();
		assert.equal(data[0].myflag, undefined, 'my flag is undefined');
	});
});
// TODO when() deferreds like the fixture is using now do
//   not support abort()
QUnit.skip('aborting create update and destroy', function () {
	var done = assert.async();
	var delay = fixture.delay;
	fixture.delay = 1000;
	fixture('POST /abort', function () {
		assert.ok(false, 'we should not be calling the fixture');
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
			assert.ok(false, 'success create');
			done();
		}, function () {
			assert.ok(true, 'create error called');
			deferred = new Abortion({
				name: 'foo',
				id: 5
			})
				.save(function () {
					assert.ok(false, 'save called');
					done();
				}, function () {
					assert.ok(true, 'error called in update');
					deferred = new Abortion({
						name: 'foo',
						id: 5
					})
						.destroy(function () {}, function () {
							assert.ok(true, 'destroy error called');
							fixture.delay = delay;
							done();
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
QUnit.test('store binding', function(assert) {
	var Storage = Model('Storage');
	var s = new Storage({
		id: 1,
		thing: {
			foo: 'bar'
		}
	});
	assert.ok(!Storage.store[1], 'not stored');
	var func = function () {};
	s.bind('foo', func);
	assert.ok(Storage.store[1], 'stored');
	s.unbind('foo', func);
	assert.ok(!Storage.store[1], 'not stored');
	var s2 = new Storage({});
	s2.bind('foo', func);
	s2.attr('id', 5);
	assert.ok(Storage.store[5], 'stored');
	s2.unbind('foo', func);
	assert.ok(!Storage.store[5], 'not stored');
});
QUnit.test('store ajax binding', function(assert) {
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
	var done = assert.async();
	Promise.all([Guy.findOne({
		id: 1
	}), Guy.findAll()])
		.then(function (pack) {
			var guyRes = pack[0],
					guysRes2 = pack[1];
			assert.equal(guyRes.id, 1, 'got a guy id 1 back');
			assert.equal(guysRes2[0].id, 1, 'got guys w/ id 1 back');
			assert.ok(guyRes === guysRes2[0], 'guys are the same');
			// check the store is empty
			setTimeout(function () {
				var id;
				done();
				for (id in Guy.store) {
					assert.ok(false, 'there should be nothing in the store');
				}
			}, 1);
		});
});
QUnit.test('store instance updates', function(assert) {
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
	var done = assert.async();
	Guy.findAll({}, function (guys) {
		done();
		guys[0].bind('updated', function () {});
		assert.ok(Guy.store[1], 'instance stored');
		assert.equal(Guy.store[1].updateCount, 0, 'updateCount is 0');
		assert.equal(Guy.store[1].nested.count, 0, 'nested.count is 0');
	});
	Guy.findAll({}, function (guys) {
		assert.equal(Guy.store[1].updateCount, 1, 'updateCount is 1');
		assert.equal(Guy.store[1].nested.count, 1, 'nested.count is 1');
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
var done = assert.async();
Guy.findAll({}, function(guys){
	done();
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
QUnit.test('templated destroy', function(assert) {
	var MyModel = Model.extend({
		destroy: '/destroyplace/{id}'
	}, {});
	fixture('/destroyplace/{id}', function (original) {
		assert.ok(true, 'fixture called');
		assert.equal(original.url, '/destroyplace/5', 'urls match');
		return {};
	});
	var done = assert.async();
	new MyModel({
		id: 5
	})
		.destroy(function () {
			done();
		});
	fixture('/product/{id}', function (original) {
		assert.equal(original.data.id, 9001, 'Changed ID is correctly set.');
		done();
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
	var done = assert.async();
});
QUnit.test('extended templated destroy', function(assert) {
	var MyModel = Model({
		destroy: '/destroyplace/{attr1}/{attr2}/{id}'
	}, {});
	fixture('/destroyplace/{attr1}/{attr2}/{id}', function (original) {
		assert.ok(true, 'fixture called');
		assert.equal(original.url, '/destroyplace/foo/bar/5', 'urls match');
		return {};
	});
	var done = assert.async();
	new MyModel({
		id: 5,
		attr1: 'foo',
		attr2: 'bar'
	})
		.destroy(function () {
			done();
		});
	fixture('/product/{attr3}/{id}', function (original) {
		assert.equal(original.data.id, 9001, 'Changed ID is correctly set.');
		done();
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
	var done = assert.async();
});
QUnit.test('overwrite makeFindAll', function(assert) {
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
	var done = assert.async();
	count = 0;
	Food.findOne({
		id: 1
	}, function (food) {
		count = 1;
		assert.ok(true, 'empty findOne called back');
		food.bind('name', function () {
			assert.ok(true, 'name changed');
			assert.equal(count, 2, 'after last find one');
			assert.equal(this.name, 'ice water');
			done();
		});
		Food.findOne({
			id: 1
		}, function (food2) {
			count = 2;
			assert.ok(food2 === food, 'same instances');
			assert.equal(food2.name, 'hot dog');
		});
	});
});
QUnit.test('inheriting unique model names', function(assert) {
	var Foo = Model.extend({});
	var Bar = Model.extend({});
	assert.ok(Foo.fullName !== Bar.fullName, 'fullNames not the same');
});
QUnit.test('model list attr', function(assert) {
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
	assert.equal(list1.length, 0, 'Initial empty list has length of 0');
	list1.attr(list2);
	assert.equal(list1.length, 2, 'Merging using attr yields length of 2');
});
QUnit.test('destroying a model impact the right list', function(assert) {
    var ready = assert.async();
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
    assert.equal(people.length, 2, 'Initial Person.List has length of 2');
    assert.equal(orgs.length, 2, 'Initial Organisation.List has length of 2');
    orgs[0].destroy();
    setTimeout(function() {
		assert.equal(people.length, 2, 'After destroying orgs[0] Person.List has length of 2');
		assert.equal(orgs.length, 1, 'After destroying orgs[0] Organisation.List has length of 1');
		ready();
	}, 10);
});
QUnit.test('uses attr with isNew', function(assert) {
	// TODO this does not seem to be consistent expect(2);
	var old = ObservationRecorder.add;
	ObservationRecorder.add = function (object, attribute) {
		if (attribute === 'id') {
			assert.ok(true, 'used attr');
		}
	};
	var m = new Model({
		id: 4
	});
	m.isNew();
	ObservationRecorder.add = old;
});
QUnit.test('extends defaults by calling base method', function(assert) {
	var M1 = Model.extend({
		defaults: {
			foo: 'bar'
		}
	}, {});
	var M2 = M1({});
	assert.equal(M2.defaults.foo, 'bar');
});
QUnit.test('.models updates existing list if passed', 4, function(assert) {
	var MyModel = Model.extend({});
	var list = MyModel.models([{
		id: 1,
		name: 'first'
	}, {
		id: 2,
		name: 'second'
	}]);
	list.bind('add', function (ev, newData) {
		assert.equal(newData.length, 3, 'Got all new items at once');
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
	assert.equal(list, newList, 'Lists are the same');
	assert.equal(newList.attr('length'), 3, 'List has new items');
	assert.equal(list[0].name, 'third', 'New item is the first one');
});
QUnit.test('calling destroy with unsaved model triggers destroyed event (#181)', function(assert) {
	var MyModel = Model.extend({}, {}),
		newModel = new MyModel(),
		list = new MyModel.List(),
		deferred;
	// you must bind to a list for this feature
	list.bind('length', function () {});
	list.push(newModel);
	assert.equal(list.attr('length'), 1, 'List length as expected');
	deferred = newModel.destroy();
	assert.ok(deferred, '.destroy returned a Deferred');
	deferred.then(function (data) {
		assert.equal(list.attr('length'), 0, 'Unsaved model removed from list');
		assert.ok(data === newModel, 'Resolved with destroyed model as described in docs');
	});
});
QUnit.test('model removeAttr (#245)', function(assert) {
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
	assert.equal(model.attr('name'), 'text updated', 'attribute updated');
	assert.equal(model.attr('index'), 2, 'Index attribute still remains');
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
	assert.equal(model.attr('name'), 'text updated', 'attribute updated');
	assert.deepEqual(model.attr(), {
		id: 0,
		name: 'text updated'
	}, 'Index attribute got removed');
});
QUnit.test('.model on create and update (#301)', function(assert) {
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
	var done = assert.async();

	MyModel.bind('created', function (ev, created) {
		done();
		assert.deepEqual(created.attr(), {
			id: 1,
			name: 'Dishes'
		}, '.model works for create');
	})
		.bind('updated', function (ev, updated) {
			done();
			assert.deepEqual(updated.attr(), {
				id: 1,
				name: 'Laundry',
				updatedAt: updateTime
			}, '.model works for update');
		});
	var instance = new MyModel({
		name: 'Dishes'
	}),
		saveD = instance.save();
	var done = assert.async();
	saveD.then(function () {
		instance.attr('name', 'Laundry')
			.save();
	});
});
QUnit.test('List params uses findAll', function(assert) {
	var done = assert.async();
	fixture('/things', function (request) {
		assert.equal(request.data.param, 'value', 'params passed');
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
		assert.equal(items[0].name, 'Thing One', 'items added');
		done();
	});
});

QUnit.test('destroy not calling callback for new instances (#403)', function(assert) {
	var Recipe = Model.extend({}, {});
	assert.expect(1);
	var done = assert.async();
	new Recipe({
		name: 'mow grass'
	})
		.destroy(function (recipe) {
			assert.ok(true, 'Destroy called');
			done();
		});
});

QUnit.test('.model should always serialize Observes (#444)', function(assert) {
	var ConceptualDuck = Model.extend({
		defaults: {
			sayeth: 'Abstractly \'quack\''
		}
	}, {});
	var ObserveableDuck = Map({}, {});
	assert.equal('quack', ConceptualDuck.model(new ObserveableDuck({
			sayeth: 'quack'
		}))
		.sayeth);
});

QUnit.test('string configurable model and models functions (#128)', function(assert) {
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
	assert.deepEqual(strangers.attr(), [{
		id: 1,
		name: 'one'
	}, {
		id: 2,
		name: 'two'
	}]);
});

QUnit.test('create deferred does not resolve to the same instance', function(assert) {
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
	var done = assert.async();
	def.then(function (todo) {
		assert.ok(todo === t, 'same instance');
		done();
		assert.ok(Todo.store[5] === t, 'instance put in store');
		t.unbind('name', handler);
	});
});

QUnit.test("Model#save should not replace attributes with their default values (#560)", function(assert) {

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

	var done = assert.async();

	personD.then(function (person) {
		done();
		assert.equal(person.name, "Justin", "Model name attribute value is preserved after save");

	});
});

QUnit.test(".parseModel as function on create and update (#560)", function(assert) {
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

	var done = assert.async();
	MyModel.bind('created', function (ev, created) {
		done();
		assert.deepEqual(created.attr(), {
			id: 1,
			name: 'Dishes',
			aDefault: "bar"
		}, '.model works for create');
	})
		.bind('updated', function (ev, updated) {
			done();
			assert.deepEqual(updated.attr(), {
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

	var done = assert.async();
	saveD.then(function () {
		instance.attr('name', 'Laundry');
		instance.removeAttr("aDefault");
		instance.save();
	});

});

QUnit.test(".parseModel as string on create and update (#560)", function(assert) {
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

	var done = assert.async();
	MyModel.bind('created', function (ev, created) {
		done();
		assert.deepEqual(created.attr(), {
			id: 1,
			name: 'Dishes',
			aDefault: "bar"
		}, '.model works for create');
	})
		.bind('updated', function (ev, updated) {
			done();
			assert.deepEqual(updated.attr(), {
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

	var done = assert.async();
	saveD.then(function () {
		instance.attr('name', 'Laundry');
		instance.removeAttr("aDefault");
		instance.save();
	});

});

QUnit.test("parseModels and findAll", function(assert) {

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

			// only check this if jQuery because its deferreds can resolve with multiple args
			if (window.jQuery) {
				assert.ok(xhr, "xhr object provided");
			}
			assert.deepEqual(array, raw, "got passed raw data");
			return {
				data: raw,
				count: 1000
			};
		}
	}, {});

	var done = assert.async();

	MyModel.findAll({}, function (models) {
		assert.equal(models.count, 1000);
		done();
	});

});

QUnit.test("parseModels and parseModel and findAll", function(assert) {

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

	var done = assert.async();

	MyModel.findAll({}, function (models) {
		assert.deepEqual(models.attr(), [{
			id: 1,
			name: "first"
		}], "correct models returned");
		done();
	});

});

QUnit.test("findAll rejects when parseModels returns non-array data #1662", function(assert) {
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

	var done = assert.async();

	MyModel.findAll({})
		.then(function(){
			assert.ok(false, 'This should not succeed');
			done();
		}, function(err){
			assert.ok(err instanceof Error, 'Got an error');
			assert.equal(err.message, 'Could not get any raw data while converting using .models');
			done();
		});
});

QUnit.test("Nested lists", function(assert) {
	var Teacher = Model.extend({});
	var teacher = new Teacher();
	teacher.attr("locations", [{id: 1, name: "Chicago"}, {id: 2, name: "LA"}]);
	assert.ok(!(teacher.attr('locations') instanceof Teacher.List), 'nested list is not an instance of Teacher.List');
	assert.ok(!(teacher.attr('locations')[0] instanceof Teacher), 'nested map is not an instance of Teacher');
});

QUnit.test("#501 - resource definition - create", function(assert) {
	fixture("/foods", function() {
		return [];
	});

	var FoodModel = Model.extend({
		resource: "/foods"
	}, {});

	var done = assert.async();
	var steak = new FoodModel({name: "steak"});
	steak.save(function(food) {
		assert.equal(food.name, "steak", "create created the correct model");
		done();
	});
});

QUnit.test("#501 - resource definition - findAll", function(assert) {
	fixture("/drinks", function() {
		return [{
			id: 1,
			name: "coke"
		}];
	});

	var DrinkModel = Model.extend({
		resource: "/drinks"
	}, {});

	var done = assert.async();
	DrinkModel.findAll({}, function(drinks) {
		assert.deepEqual(drinks.attr(), [{
			id: 1,
			name: "coke"
		}], "findAll returned the correct models");
		done();
	});
});

QUnit.test("#501 - resource definition - findOne", function(assert) {
	fixture("GET /clothes/{id}", function() {
		return [{
			id: 1,
			name: "pants"
		}];
	});

	var ClothingModel = Model.extend({
		resource: "/clothes"
	}, {});

	var done = assert.async();
	ClothingModel.findOne({id: 1}, function(item) {
		assert.equal(item[0].name, "pants", "findOne returned the correct model");
		done();
	});
});

QUnit.test("#501 - resource definition - remove trailing slash(es)", function(assert) {
	fixture("POST /foods", function() {
		return [];
	});

	var FoodModel = Model.extend({
		resource: "/foods//////"
	}, {});

	var done = assert.async();
	var steak = new FoodModel({name: "steak"});
	steak.save(function(food) {
		assert.equal(food.name, "steak", "removed trailing '/' and created the correct model");
		done();
	});
});

QUnit.test("model list destroy after calling replace", function(assert) {
	assert.expect(2);
	var map = new Model({name: "map1"});
	var map2 = new Model({name: "map2"});
	var list = new Model.List([map, map2]);
	list.bind('destroyed', function(ev){
		assert.ok(true, 'trigger destroyed');
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

	assert.equal(List.Map, My.Model, "list's Map points to My.Model");

});

QUnit.test("providing parseModels works", function(assert) {
	var MyModel = Model.extend({
		parseModel: "modelData"
	},{});

	var data = MyModel.parseModel({modelData: {id: 1}});
	assert.equal(data.id,1, "correctly used parseModel");
});

QUnit.test('#1089 - resource definition - inheritance', function(assert) {
	fixture('GET /things/{id}', function() {
		return { id: 0, name: 'foo' };
	});

	var Base = Model.extend();
	var Thing = Base.extend({
		resource: '/things'
	}, {});

	var done = assert.async();
	Thing.findOne({ id: 0 }, function(thing) {
		assert.equal(thing.name, 'foo', 'found model in inherited model');
		done();
	}, function(e, msg) {
		assert.ok(false, msg);
		done();
	});
});

QUnit.test('#1089 - resource definition - CRUD overrides', function(assert) {
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

	var done = assert.async();
	Promise.all([alldfd, onedfd, postdfd])
	.then(function(pack) {
		var things = pack[0],
				thing = pack[1],
				newthing = pack[2];
		assert.equal(things.length, 1, 'findAll override called');
		assert.equal(thing.name, 'foo', 'resource findOne called');
		assert.equal(newthing.id, 1, 'post override called with function');

		newthing.save(function(res) {
			assert.ok(res.updated, 'put override called with object');
			done();
		});
	})
	.catch(function() {
		assert.ok(false, 'override request failed');
		done();
	});
});

QUnit.test("findAll not called if List constructor argument is deferred (#1074)", function(assert) {
	var count = 0;
	var Foo = Model.extend({
		findAll: function() {
			count++;
			return Promise.resolve();
		}
	}, {});
	new Foo.List(Foo.findAll());
	assert.equal(count, 1, "findAll called only once.");
});

QUnit.test("static methods do not get overwritten with resource property set (#1309)", function(assert) {
	var Base = Model.extend({
		resource: '/path',
		findOne: function() {
			var dfd = Promise.resolve({
				text: 'Base findAll'
			});
			return dfd;
		}
	}, {});

	var done = assert.async();

	Base.findOne({}).then(function(model) {
		assert.ok(model instanceof Base);
		assert.deepEqual(model.attr(), {
			text: 'Base findAll'
		});
		done();
	}, function() {
		assert.ok(false, 'Failed handler should not be called.');
	});
});

QUnit.test("parseModels does not get overwritten if already implemented in base class (#1246, #1272)", 5, function(assert) {
	var Base = Model.extend({
		findOne: function() {
			var dfd = Promise.resolve({
				text: 'Base findOne'
			});
			return dfd;
		},
		parseModel: function(attributes) {
			assert.deepEqual(attributes, {
				text: 'Base findOne'
			}, 'parseModel called');
			attributes.parsed = true;
			return attributes;
		}
	}, {});
	var Extended = Base.extend({}, {});

	var done = assert.async();

	Extended.findOne({}).then(function(model) {
		assert.ok(model instanceof Base);
		assert.ok(model instanceof Extended);
		assert.deepEqual(model.attr(), {
			text: 'Base findOne',
			parsed: true
		});
		done();
	}, function() {
		assert.ok(false, 'Failed handler should not be called.');
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
		assert.equal(model.attr('text'), 'Third findOne', 'correct findOne used');
	});
});

QUnit.test("Models with no id (undefined or null) are not placed in store (#1358)", function(assert) {
	var MyStandardModel = Model.extend({});
	var MyCustomModel = Model.extend({id:"ID"}, {});

	var myID = null;
	var instanceNull = new MyStandardModel ({id:myID});
	var instanceUndefined = new MyStandardModel ({});
	var instanceCustom = new MyCustomModel({ID:myID});


	instanceNull.bind('change', function(){});
	instanceUndefined.bind('change', function(){});
	instanceCustom.bind('change', function(){});


	assert.ok(typeof MyStandardModel.store[instanceNull.id] === "undefined", "Model should not be added to store when id is null");
	assert.ok(typeof MyStandardModel.store[instanceUndefined.id] === "undefined", "Model should not be added to store when id is undefined");
	assert.ok(typeof MyCustomModel.store[instanceCustom[instanceCustom.constructor.id]] === "undefined", "Model should not be added to store when id is null");

});

QUnit.test("Models should be removed from store when instance.removeAttr('id') is called", function(assert) {
	var Task = Model.extend({},{});
	var t1 = new Task({id: 1, name: "MyTask"});

	t1.bind('change', function(){});
	assert.ok(Task.store[t1.id].name === "MyTask", "Model should be in store");

	t1.removeAttr("id");
	assert.ok(typeof Task.store[t1.id] === "undefined", "Model should be removed from store when `id` is removed");

});

QUnit.test("uses def.fail if model uses jquery deferred", function(assert) {
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
			assert.ok(true, '_clean should be called');
		}
	}, {});

	Thing.findOne({});
});

QUnit.test("set custom ajax function (#62)", function(assert) {
	fixture('GET /todos', function () {
		return [{id: 1}];
	});
	var Todo = Model.extend({
		findAll: "GET /todos",
		ajax: function(settings) {
			assert.ok(true,"custom ajax called");
			assert.equal( settings.url , "/todos", "url looks right");
			// Return the promise otherwise it throws an error
			// "Cannot read property 'then' of undefined"
			return Promise.resolve();
		}
	}, {});
	Todo.findAll();
});
