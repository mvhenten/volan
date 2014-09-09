'use strict';

function define(def) {
    var proto = Object.keys(def).reduce(function(proto, key) {
        var desc = Object.getOwnPropertyDescriptor(def, key);

        // if not writable, don't touch it
        if (!desc.writable) {
            proto[key] = desc;
            return proto;
        }

        // a method, let's protect it
        if (desc.value instanceof Function) {
            desc.writable = false;
            proto[key] = desc;
            return proto;
        }

        proto[key] = {
            get: function() {
                return this.__get(key);
            }
        };

        return proto;
    }, {});

    var me = function(named) {
        named = named || {};

        var values = Object.keys(def).reduce(function(values, key) {
            values[key] = named[key] || def[key];

            return values;
        }, {});

        Object.defineProperties(this, {
            __get: {
                value: function(name) {
                    return values[name];
                }
            },

            __set: {
                value: function(name, value) {
                    return values[name] = value;
                }
            }
        });
    };

    Object.defineProperties(me.prototype, proto);

    return me;
}

var Counter = define({
    start: 0,

    current: 0,

    incr: 1,

    max: Infinity,

    get next() {
        var next = this.current + this.incr;
        return next < this.max ? next : this.current;
    },

    get last() {
        return this.max - ((this.max - this.start) % this.incr);
    },

    increment: function() {
        return this.__set('current', this.current + this.incr);
    }
});

//var counter = new Counter({ start: 10, end: 99, incr: 3 });
//
//counter.increment(); // 13
//counter.current; // 13
//counter.max; // 16
//counter.next; // 16
//counter.last; // 97

var counter1 = new Counter({ incr: 3 });

console.log( counter1.increment() ); // 13
console.log( counter1.current ); // 13
console.log( counter1.max ); // 16
console.log( counter1.next ); // 16
console.log( counter1.last ); // 97


