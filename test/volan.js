'use strict';

var assert = require('assert'),
    _ = require('lodash'),
    Faker = require('Faker'),
    Volan = require('../');

var Point = Volan.create({
    x: Number,
    y: Number
});

suite('Volan constructors and tests', function() {
    test('REGRESSION: getters must not be triggerd in create', function() {
        var Thing = Volan.create({
            get cantouchthis() {
                throw new Error('Can\'t touch this');
            }
        });

        var ok = new Thing({
            test: 1
        });

        assert.throws(function() {
            var test = new Thing({
                cantouchthis: 1
            });
        }, /TypeError: Cannot set property cantouchthis/)
    });


    test('Example from the readme: point', function() {
        var Point = Volan.create({
            x: null,
            y: null
        });

        var ax = _.random(0, 99),
            ay = _.random(0, 99),
            bx = _.random(0, 99),
            by = _.random(0, 99);

        var a = new Point({
            x: ax,
            y: ay
        });
        var b = new Point({
            x: bx,
            y: by
        });

        assert.equal(a.x, ax);
        assert.equal(a.y, ay);

        assert.equal(b.x, bx);
        assert.equal(b.y, by);
    });


    test('Instantiate Volan objects', function() {
        _.times(100, function() {
            var x = _.random(-999, 999),
                y = _.random(-999, 999);

            var p = new Point({
                x: x,
                y: y
            });

            assert.equal(p.x, x, 'Constructor has set the expected value');
            assert.equal(p.y, y, 'Constructor has set the expected value');

            assert.throws(function() {
                p.x = Faker.Lorem.words();
            }, /Validation failed .+ not a Number/);

            assert.throws(function() {
                var p = new Point({
                    x: Faker.Lorem.words(),
                    y: y
                });
                assert.ok(!p);
            }, /Validation failed .+ not a Number/);
        });
    });

    test('With native method allowed', function() {
        _.times(100, function() {
            var words = Faker.Lorem.words().join(' ');

            var Thing = Volan.create({
                name: words,

                sayHello: function() {
                    return this.name + ' says "hello"';
                }
            });

            var thing = new Thing();

            assert.equal(thing.name, words);
            assert.equal(thing.sayHello(), thing.name + ' says "hello"');
        });
    });
    test('With native getters allowed', function() {
        _.times(100, function() {
            var first = Faker.Name.firstName();
            var last = Faker.Name.lastName();

            var Person = Volan.create({
                first: String,
                last: String,

                get name() {
                    return [this.last, this.first].join(', ');
                }
            });

            var john = new Person({
                first: first,
                last: last
            });

            assert.equal(john.name, [last, first].join(', '));

        });
    });

    test('With native default value allowed', function() {
        _.times(100, function() {
            // words or empty string
            var words = Faker.Lorem.words().slice(0, _.random(10)).join(' ');

            var Thing = Volan.create({
                name: words,
            });

            var thing = new Thing();

            assert.equal(thing.name, words);

        });
    });

    test('With custom type isa', function() {
        _.times(100, function() {
            var value = _.random(-999, 999);

            var Thing = Volan.create({
                count: function PositiveInt(value) {
                    return (typeof value == 'number') && value >= 0;
                },
            });

            var thing = new Thing({
                count: 42
            });

            thing.count = 82;

            if (value < 0) {
                assert.throws(function() {

                    thing.count = value;
                }, /TypeError: Validation failed for "count", value ".+" is not a PositiveInt/);
            } else {
                thing.count = value;
                assert.equal(thing.count, value);
            }
        });
    });

    test('Volan extends plain js', function() {
        var Parent = function(args) {
            this._thing = args;
        };

        Parent.prototype = {
            get thing() {
                return this._thing;
            }
        };

        var Child = Volan.extend(Parent, {
            name: String
        });

        _.times(100, function() {
            var words = Faker.Lorem.words().join(' '),
                args = {
                    name: words
                };

            var parent = new Parent(args),
                child = new Child(args);

            assert.deepEqual(parent.thing, args);
            assert.deepEqual(child.thing, args);
        });
    });

    test('Volan extends plain js vanilla', function() {
        var Parent = function(args) {
            this._thing = args;
        };

        Parent.prototype = {
            get thing() {
                return this._thing;
            }
        };

        var Child = Volan.extend(Parent, {
            name: String
        });


        _.times(100, function() {
            var words = Faker.Lorem.words().join(' '),
                args = {
                    name: words
                };

            var parent = new Parent(args),
                child = new Child(args);

            assert.deepEqual(parent.thing, args);
            assert.deepEqual(child.thing, args);
        });
    });

    test('Volan handles simple declarations', function() {
        var Any = Volan.create({
            any: null
        });

        var a = new Any({
            any: 42
        });

        assert.equal(a.any, 42);
    });

    test('Example code from the readme: extending point', function() {
        var Point3D = Volan.extend(Point, {
            z: Number,
        });

        var point = new Point3D({
            x: 1,
            y: 2,
            z: 4
        });

        assert.equal(point.x, 1);
        assert.equal(point.z, 4);
        assert.equal(point.y, 2);
    });

    test('RegExp is handled as a type', function() {
        var Whole = Volan.create({
            num: /^\d+$/
        });

        var w = new Whole({
            num: 1
        });

        assert.throws(function() {
            var w = new Whole({
                num: 1.2
            });
        }, /a value matching/)
    })

    test('Attributes are required by default', function() {
        var Thing = Volan.create({
            num: Number
        });
        assert.throws(function() {
            var x = new Thing();
        }, /TypeError: Validation failed for "num", value "undefined" is not a Number/)
    })

    test('Attributes may be not required', function() {
        var Thing = Volan.create({
            num: {
                type: /\d+/,
                value: 42,
                writable: true,
                required: false
            }
        });

        var x = new Thing();

        assert.equal(x.num, 42);

        var y = new Thing({
            num: 99
        });

        assert.equal(y.num, 99);

    })

});
