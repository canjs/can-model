var MyTest;
QUnit.module('jquery/model/associations', {
	beforeEach: function(assert) {
		$.Model('MyTest.Person', {
			serialize: function () {
				return 'My name is ' + this.name;
			}
		});
		$.Model('MyTest.Loan');
		$.Model('MyTest.Issue');
		$.Model('MyTest.Customer', {
			attributes: {
				person: 'MyTest.Person.model',
				loans: 'MyTest.Loan.models',
				issues: 'MyTest.Issue.models'
			},
			update: function (id, attrs) {
				return $.ajax({
					url: '/people/' + id,
					data: attrs,
					type: 'post',
					dataType: 'json',
					fixture: function () {
						return [{
							loansAttr: attrs.loans,
							personAttr: attrs.person
						}];
					}
				});
			}
		}, {});
	}
});
QUnit.test('associations work', function(assert) {
	var c = new MyTest.Customer({
		id: 5,
		person: {
			id: 1,
			name: 'Justin'
		},
		issues: [],
		loans: [{
			amount: 1000,
			id: 2
		}, {
			amount: 19999,
			id: 3
		}]
	});
	assert.equal(c.person.name, 'Justin', 'association present');
	assert.equal(c.person.Class, MyTest.Person, 'belongs to association typed');
	assert.equal(c.issues.length, 0);
	assert.equal(c.loans.length, 2);
	assert.equal(c.loans[0].Class, MyTest.Loan);
});
QUnit.test('Model association serialize on save', function(assert) {
	var c = new MyTest.Customer({
		id: 5,
		person: {
			id: 1,
			name: 'thecountofzero'
		},
		issues: [],
		loans: []
	}),
		cSave = c.save();
	var done = assert.async();
	cSave.then(function (customer) {
		done();
		assert.equal(customer.personAttr, 'My name is thecountofzero', 'serialization works');
	});
});
QUnit.test('Model.List association serialize on save', function(assert) {
	var c = new MyTest.Customer({
		id: 5,
		person: {
			id: 1,
			name: 'thecountofzero'
		},
		issues: [],
		loans: [{
			amount: 1000,
			id: 2
		}, {
			amount: 19999,
			id: 3
		}]
	}),
		cSave = c.save();
	var done = assert.async();
	cSave.then(function (customer) {
		done();
		assert.ok(true, 'called back');
		assert.equal(customer.loansAttr.constructor, can.List, 'we get an observe list back');
	});
});
