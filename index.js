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
    return typeof value === this.name.toLowerCase();
}

function isInstanceOf(value) {
    return value instanceof this;
}

function isWritable(def, name) {
    var desc = Object.getOwnPropertyDescriptor(def, name).value;
    return desc.set !== undefined || desc.writable;
}

function property(key, def) {
    var prop = Object.getOwnPropertyDescriptor(def, key),
        check = prop.value;

    if (check && check.type) prop = check, check = check.type;

    if ((check === null || check === undefined) || !prop.writable || prop.get || prop.set) return prop;
    if (/^number|string|boolean$/.test(typeof check) || isPlainFunction(check))
        return {
            writable: false,
            value: check
        };

    if (check instanceof RegExp) {
        check = check.test.bind(check), check.__type = format('value matching "%s"', prop.value);
    }

    if (check.name === undefined || /^(Boolean|Number|String|RegExp|Array|Object|Date)$/.test(check.name)) {
        if (/^Boolean|Number|String$/.test(check.name)) check = isTypeOf.bind(check);
        else check = isInstanceOf.bind(check);
        check.__type = prop.value.name || prop.value + '';
    }

    check.__name = key;

    return {
        get: function() {
            var value = this.__meta__(key);
            return value !== undefined ? value : prop.value;
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

                if (typeof spr === 'function') spr.apply(this, arguments);

                for (var key in props) {
                    if (args[key] === undefined) {
                        if (!isWritable(props, key) || def[key].required === false) continue;
                    }

                    this[key] = args[key];
                }

                Object.freeze(this);
            };

        ctor.prototype = Object.create(spr.prototype || {}, props);
        return ctor;
    },
    create: function(def) {
        return module.exports.extend({}, def);
    }
};
