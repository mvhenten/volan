'use strict';

function format(tpl) {
    var values = Array.prototype.slice.call(arguments, 1);
    return tpl.replace(/(%s)/g, values.shift.bind(values));
}

function isPlainFunction(value) {
    var own = Object.getOwnPropertyNames((value || {}).prototype || {});

    if (typeof value !== 'function') return false;
    if (own.length >= 2 || (own.indexOf('constructor') < 0 && own.length >= 1)) return false;

    return Object.getPrototypeOf(value.prototype) === Object.prototype;
}

function isBuiltIn(value) {
    return /^(Boolean|Number|String|RegExp|Array|Object|Date)$/.test(value.name);
}

function isTypeOf(value) {
    return typeof value === this.name.toLowerCase();
}

function isInstanceOf(value) {
    return value instanceof this;
}

function property(key, def) {
    var prop = Object.getOwnPropertyDescriptor(def, key),
        check = prop.value;

    if (!check || !prop.writable) return prop;
    if (prop.get || prop.set) return prop;
    if (/^number|string|boolean$/.test(typeof check)) return prop;
    if (!check.name && isPlainFunction(check)) return prop;

    if (check instanceof RegExp) {
        check = check.test.bind(check);
        check.__type = format('value matching "%s"', check);
    }

    if (check.name === undefined || isBuiltIn(check)) {
        var o = check;
        if (/^Boolean|Number|String$/.test(check.name)) check = isTypeOf.bind(o);
        else check = isInstanceOf.bind(o);
        check.__type = o.name || o + '';
    }

    check.__name = key;

    return {
        get: function() {
            return this.__meta__(key);
        },

        set: function(value) {
            if (check(value)) return this.__meta__(key, value);
            throw new TypeError(format('Validation failed for "%s", value "%s" is not a %s', check.__name, value, check.__type || check.name));
        }
    };
}

function properties(def) {
    var proto = {};
    for (var key in def) proto[key] = property(key, def);
    return proto;
}

var Volan = {
    extend: function(spr, def) {
        var attributes = Object.keys(def),
            ctor = function(args) {
                if (!this.__meta__) Object.defineProperty(this, '__meta__', {
                    value: function(key, value) {
                        if (value !== undefined) this[key] = value;
                        return this[key];
                    }.bind({})
                });

                if (typeof spr === 'function') spr.apply(this, arguments);

                for (var i = 0; i < attributes.length; i++) {
                    var key = attributes[i];
                    if (args && args[key] !== undefined) this[key] = args[key];
                }

                Object.freeze(this);
            };

        ctor.prototype = Object.create(spr.prototype || {}, properties(def));
        return ctor;
    },
    create: function(def) {
        return Volan.extend({}, def);
    }
};

module.exports = Volan;
