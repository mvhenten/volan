## Post Modern Objects in Javascript
### _Or how to stop using ES3 Objects_

Ok, well, first i'd like to explain the term "Post Modern". I've borrowed this term from a Perl framework called Moose, which in turn draws inspiration from a new programming language called Perl 6. That still doesn't explain the term "Post Modern". So here I go:

## Postmodernism

1. a late 20th-century style and concept in the arts, architecture, and criticism, which represents a departure from modernism and is characterized by the self-conscious use of earlier styles and conventions, a mixing of different artistic styles and media, and a general distrust of theories.

----

The third edition of ECMA-262 was published on December 1999. I think we may consider ES3 as the "Modern" version of Javascript, as we have learned to work with, grew up with, and dealth with most of the past decade. Today, ES6 is under heavy, active development, while full ES5 is becoming widely available and even mainstream with the swift dissapearance of IE8. The javascript landscape is mutating rapidly, resulting into a cambrium explosion of transpilers, compilers, frameworks, utilities and implementation. And it doesn't seem to slow down.
Therefore, I think we may have entered post-modern times in javascript development.

As we developers start building larger applications, the need to organize code, to create concise API's and enforce proper encapsulation becomes stronger. As this is the MVC meetup, I recon many of you are working with some kind of framework that tries to provide this type of structure.

While these frameworks already have put in a lot of tought into providing better encapsulation, Javascript, as a language, also has handed us a number of wonderful tools.
Let's start with a simple example of a private attribute, in this case, a simple "Counter" class.


```javascript

    function Counter(){
        var count = 0;

        this.increment = function(){
            return count++;
        }
    }

```

So far, so good, for the naïve approach. You've published your software as a wonderful library, and people start downloading and using your code massively. Over time, you receive a number of feature requests. Let's add some extra code to initialize your counter with a custom start, end, and increment, and methods to peek to the last, next and current value...


```javascript

    function Counter( start, end, increment ){
        var init = start || 0,
            current = init,
            incr  = increment || 1,
            max = end || Infinity;

        this.increment = function(){
            if( current + increment < max )
                return current += increment;

            return current;
        };

        this.getCurrent = function(){
            return current;
        };

        this.getNext = function(){
            var next = current + increment;
            return next < max ? next : current;
        };

        this.getLast = function(){
            return max - ( ( max - init ) % incr );
        };
    }

    var counter = new Counter( 10, 99, 3 );

    counter.increment(); // 13
    counter.getCurrent(); // 13
    counter.getNext(); // 16
    counter.getLast(); // 97

```

Now, our innocent little counter has become a lot bigger. Also, it's api has become a lot more complicated. It'll be hard to spot the real default values, and a programmer must remember the order of the arguments. We've attached all of our methods to the instance of the object, creating copies of these methods each time we fire up a new counter. Some of the "properties" of our object, such as the "current" values, can only be accessed by calling a "getter" function.

Also note we're mixing stuff like initializing defaults, setting up properties, with the logic of our interface. When your models or classes become bigger, this type of line noise increases incrementally and will introduce variations and bugs, adding complexity where none is desired. And we're not even checking our input here.

Also, all methods of our counter are public properties of each instance, with absolutely no protection at all, considering the following:

```javascript

    var counter = new Counter( 10, 99, 3 );

    counter.increment = 1;

    // ... later
    counter.increment();

    // TypeError: Property 'increment' of object #<Counter> is not a function

```

At first glance, this may look as it's easy to spot, but wouldn't you rather know when the wrong assignment happend instead of where your code fails due to a mutated property?

I'm going to show how to write a small "Class" system that provides better encapsulation and a clean interface, that will, eventually, reduce the amount of code you're typing.
Let's first rewrite this a little bit as ES5 using a prototype:

```javascript

'use strict';

function Counter( start, end, increment ){
    var values = {
        start: start || 0,
        current: start || 0,
        incr: increment || 1,
        max: end || Infinity,
    };

    Object.defineProperties( this, {
        __get: {
            value: function( name ){
                return values[name];
            }
        },

        __set: {
            value: function( name, value ){
                return values[name] = value;
            }
        }
    });
};

Counter.prototype = {
    get current(){
        return this.__get('current');
    },

    get max(){
        return this.__get('max');
    },

    get incr() {
        return this.__get('incr');
    },

    get start() {
        return this.__get('start');
    },

    get next() {
        var next = this.current + this.incr;
        return next < this.max ? next : this.current;
    },

    get last() {
        return this.max - ( ( this.max - this.start ) % this.incr );
    },

    get increment() {
        return function(){
            return this.__set( 'current', this.current + this.incr );
        }
    }
};

```

This will let us interact with our counter as following:

```javascript

    var counter = new Counter( 10, 99, 3 );

    counter.increment(); // 13
    counter.current; // 13
    counter.max; // 16
    counter.next; // 16
    counter.last; // 97

```

Now, I promised *less* code, not more. However, we've already achieved a number things:

* No more "getters". Just properties, and an explicit method to call for increment().
* Impossible to overwrite public members (!)
* __get and __set are properties of the instance, but they cannot be manipulated.
* Altough public properties, __get and __set should be consiered "hidden", i.e. **Don't Touch This**.

From now on, you're code will fail if you try to overwrite a public property:

```
counter.next = 13;
             ^
TypeError: Cannot set property next of #<Object> which has only a getter

```

Let's write a little helper that helps us to avoid writing the __get and __set each time:

```javascript

function define(ctor, proto) {
    var me = function() {
        var values = ctor.apply(this, arguments);

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

    me.prototype = proto;
    return me;
};

```

Now we can define our class as such:

```javascript
    var Counter = define(function(start, end, increment) {
        return {
            start: start || 0,
            current: start || 0,
            incr: increment || 1,
            max: end || Infinity,
        };
    }, {
        get current() {
            return this.__get('current');
        },

        get max() {
            return this.__get('max');
        },

        get incr() {
            return this.__get('incr');
        },

        get start() {
            return this.__get('start');
        },

        get next() {
            var next = this.current + this.incr;
            return next < this.max ? next : this.current;
        },

        get last() {
            return this.max - ((this.max - this.start) % this.incr);
        },

        get increment() {
            return function() {
                return this.__set('current', this.current + this.incr);
            }
        }
    });

```

Let's quickly focus on another piece of duplication:

```javascript

{
        get current() {
            return this.__get('current');
        },

        get max() {
            return this.__get('max');
        },

        get incr() {
            return this.__get('incr');
        },

        get start() {
            return this.__get('start');
        },
}

```

This doesn't look very nice, so let's automate it, and move that code to our `create` helper:


```javascript

function define(ctor, proto) {
    var me = function() {
        var values = ctor.apply(this, arguments),
            props = {};

        // we're using .reduce to create a _closure_ here.
        props = Object.keys( values ).reduce(function( props, key ){
            props[key] = {
                get: function(){
                    return this.__get(key);
                }
            };
            return props;
        }, props );

        props.__get = {
            value: function(name) {
                return values[name];
            }
        };

        props.__set = {
            value: function(name, value) {
                return values[name] = value;
            }
        }

        Object.defineProperties( this, props );
    };

    me.prototype = proto;

    return me;
}

```

This is already looking a shorter now. Maybe almost as short as our original ES3 implementation,
but now with some better encapsulatin'.


```javascript
    var Counter = define(function(start, end, increment) {
        return {
            start: start || 0,
            current: start || 0,
            incr: increment || 1,
            max: end || Infinity,
        };
    }, {
        get next() {
            var next = this.current + this.incr;
            return next < this.max ? next : this.current;
        },

        get last() {
            return this.max - ((this.max - this.start) % this.incr);
        },

        get increment() {
            return function() {
                return this.__set('current', this.current + this.incr);
            }
        }
    });

```

Now, let's have a look at our API. Positional arguments are nice and short, but what will
happen if we need to add more arguments? and how will our code look if we don't want to specifiy `end`? specify null? that's ugly!

Instead, let's move to a concept called *named* arguments:

```javascript
var Counter = define(function( named ) {
    named = named || {};
    return {
        start: named.start || 0,
        current: named.start || 0,
        incr: named.increment || 1,
        max: named.end || Infinity,
    };
}, {
    // ...
});
```

We can now write:

```javascript
    var counter = new Counter({ start: 10, end: 99, increment: 3 });

    counter.increment(); // 13
    counter.current; // 13
    counter.max; // 16
    counter.next; // 16
    counter.last; // 97

```


Our little `create` method defines an API where your constructor is supposed to return an object with default variables. Now,
all fine and clear, but can't this be a little _shorter_ ? Let's define our API first:


```javascript
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
```

Now, let's look at the work we need to do in our little create function:

```javascript
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
            //console.log( key, desc );
            //desc.writable = false;
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
```







