'use strict';

function format(tpl) {
    var values = Array.prototype.slice.call(arguments, 1);
    return tpl.replace(/(%s)/g, values.shift.bind(values));
}

function isPlainFunction(value) {
    var own = Object.getOwnPropertyNames((value || {}).prototype || {});
    if (typeof value !== 'function' || value.name) return false;
    return own.length === 1 && own[0] === 'constructor';
}

function isTypeOf(value) {
    /* jshint -W040 */
    return typeof value === this.name.toLowerCase();
}

function isInstanceOf(value) {
    /* jshint -W040 */
    return value instanceof this;
}

function isWritable(def, name) {
    var desc = Object.getOwnPropertyDescriptor(def, name).value;
    return desc.set !== undefined || desc.writable;
}

function getterSetter(name, check, type, defVal) {
    return {
        get: function() {
            var value = this.__meta__(name);
            return value !== undefined ? value : defVal;
        },

        set: function(value) {
            if (check(value)) return this.__meta__(name, value);
            throw new TypeError(format('Validation failed for "%s", value "%s" is not a %s', name, value, type));
        }
    };
}

function property(key, def) {
    var prop = Object.getOwnPropertyDescriptor(def, key),
        check = prop.value;

    if (check && check.type) check = (prop = check, check.type);

    if ((check === null || check === undefined) || !prop.writable || prop.get || prop.set) return prop;

    if (/^number|string|boolean$/.test(typeof check) || isPlainFunction(check))
        return {
            writable: false,
            value: check
        };

    if (check instanceof RegExp)
        return getterSetter(key, check.test.bind(check), format('value matching "%s"', prop.value), prop.value);

    if (/^(Boolean|Number|String|RegExp|Array|Object|Date)$/.test(check.name))
        return getterSetter(key, isTypeOf.bind(check), prop.value.name || prop.value + '', prop.value);

    if (check.name === '')
        return getterSetter(key, isInstanceOf.bind(check), prop.value.name || prop.value + '', prop.value);

    return getterSetter(key, check, check.name, prop.value);
}

function properties(def) {
    var proto = {};
    for (var key in def) proto[key] = property(key, def);
    return proto;
}

module.exports = {
    extend: function(spr, def) {
        var props = properties(def),
            ctor = function(args) {
                args = args || {};

                if (!this.__meta__) Object.defineProperty(this, '__meta__', {
                    value: function(key, value) {
                        if (value !== undefined) this[key] = value;
                        return this[key];
                    }.bind({})
                });

                if (typeof spr === 'function') {
                    Object.defineProperty(this, '__super', {
                        value: spr
                    });
                    spr.apply(this, arguments);
                }

                for (var key in props) {
                    if (args[key] === undefined) {
                        if (!isWritable(props, key) || def[key].required === false) continue;
                    }

                    this[key] = args[key];
                }

                Object.freeze(this);
            };

        ctor.prototype = Object.create(spr.prototype || {}, props);
        ctor.__super = spr;

        return ctor;
    },
    create: function(def) {
        return module.exports.extend({}, def);
    }
};
