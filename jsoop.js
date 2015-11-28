(function() { //remove from scope of others so we don't mess with any variables
	window.extend = function(from, to, staticMethods) {
		if (!to) { //called like extend(function helloWorld(){});
			to = from;
			from = {};
		}
		else if (typeof(to) == "object") { //called like extend(function helloWorld(){}, { staticMethod: function(){} })
			staticMethods = to;
			to = from;
			from = {};
		}

		window[to.name] = function () {
			if (this === window) { //Called without new, return static methods
				return window[to.name];
			}

			//Copy over any new proto methods
			for (var index in window[to.name].prototype) {
				if (typeof(to.prototype[index]) == "undefined") {
					to.prototype[index] = window[to.name].prototype[index];
				}
			}

			//Copy over base methods incase any more added since construct
			for (index in from.prototype || {}) {
				if (typeof(to.prototype[index]) == "undefined") {
					to.prototype[index] = from.prototype[index];
				}
			}

			//Build array of args for dynamic constructor calling
			var fullArgs = [undefined]; //reserve first key
			for (index = 0; index < arguments.length; index++) {
				fullArgs.push(arguments[index]);
			}

			var base = from;
			var prot = {};

			if (typeof(from) == "function") {
				//Call base constructor, base will get all its prototype methods so they will get stored in base class
				from.prototype.prot = prot; //Make sure that the object accesses the same prot object so remains the same
				fullArgs[0] = this;
				base = new (Function.prototype.bind.apply(from, fullArgs));
				prot = base.prot;
			}

			fullArgs[0] = base;
			to.prototype.base = base; //use prototypes to assign so can be immediately used
			to.prototype.prot = prot;
			var ins = new (Function.prototype.bind.apply(to, fullArgs));

			//Copy over ins methods
			for (index in ins.base) {
				if (typeof(ins[index]) == "undefined") {
					ins[index] = ins.base[index];
				}
			}

			//Stop the user overriding the base object, but still let them change props in the base object
			Object.defineProperty(ins, "base", {
				writable: false,
				configurable: false,
				enumerable: false,
				value: base
			});

			//Stop the user from overriding and any users out of scope from using
			Object.defineProperty(ins, "prot", {
				configurable: false,
				enumerable: false,
				get: function () {
					if (this.name != from.name) { //When calling from outside will be to, when calling from inside will be from
						return undefined; //Stop out of context viewing of protected object
					}

					return prot;
				},
				set: function () {} //Stop overriding
			});

			return ins;
		};

		//Copy base class' static methods
		var baseStaticMethods = (typeof(from) == "function" ? from() || from : from) || {};
		for (var index in baseStaticMethods) {
			window[to.name][index] = baseStaticMethods[index];
		}

		//Copy this class' static methods over, retain base class
		staticMethods.base = baseStaticMethods;
		for (index in staticMethods) {
			window[to.name][index] = staticMethods[index];
		}
	}
})();