/*[global-shim-start]*/
(function(exports, global, doEval){ // jshint ignore:line
	var origDefine = global.define;

	var get = function(name){
		var parts = name.split("."),
			cur = global,
			i;
		for(i = 0 ; i < parts.length; i++){
			if(!cur) {
				break;
			}
			cur = cur[parts[i]];
		}
		return cur;
	};
	var set = function(name, val){
		var parts = name.split("."),
			cur = global,
			i, part, next;
		for(i = 0; i < parts.length - 1; i++) {
			part = parts[i];
			next = cur[part];
			if(!next) {
				next = cur[part] = {};
			}
			cur = next;
		}
		part = parts[parts.length - 1];
		cur[part] = val;
	};
	var useDefault = function(mod){
		if(!mod || !mod.__esModule) return false;
		var esProps = { __esModule: true, "default": true };
		for(var p in mod) {
			if(!esProps[p]) return false;
		}
		return true;
	};
	var modules = (global.define && global.define.modules) ||
		(global._define && global._define.modules) || {};
	var ourDefine = global.define = function(moduleName, deps, callback){
		var module;
		if(typeof deps === "function") {
			callback = deps;
			deps = [];
		}
		var args = [],
			i;
		for(i =0; i < deps.length; i++) {
			args.push( exports[deps[i]] ? get(exports[deps[i]]) : ( modules[deps[i]] || get(deps[i]) )  );
		}
		// CJS has no dependencies but 3 callback arguments
		if(!deps.length && callback.length) {
			module = { exports: {} };
			var require = function(name) {
				return exports[name] ? get(exports[name]) : modules[name];
			};
			args.push(require, module.exports, module);
		}
		// Babel uses the exports and module object.
		else if(!args[0] && deps[0] === "exports") {
			module = { exports: {} };
			args[0] = module.exports;
			if(deps[1] === "module") {
				args[1] = module;
			}
		} else if(!args[0] && deps[0] === "module") {
			args[0] = { id: moduleName };
		}

		global.define = origDefine;
		var result = callback ? callback.apply(null, args) : undefined;
		global.define = ourDefine;

		// Favor CJS module.exports over the return value
		result = module && module.exports ? module.exports : result;
		modules[moduleName] = result;

		// Set global exports
		var globalExport = exports[moduleName];
		if(globalExport && !get(globalExport)) {
			if(useDefault(result)) {
				result = result["default"];
			}
			set(globalExport, result);
		}
	};
	global.define.orig = origDefine;
	global.define.modules = modules;
	global.define.amd = true;
	ourDefine("@loader", [], function(){
		// shim for @@global-helpers
		var noop = function(){};
		return {
			get: function(){
				return { prepareGlobal: noop, retrieveGlobal: noop };
			},
			global: global,
			__exec: function(__load){
				doEval(__load.source, global);
			}
		};
	});
}
)({},window,function(__$source__, __$global__) { // jshint ignore:line
	eval("(function() { " + __$source__ + " \n }).call(__$global__);");
}
)
/*can-model@3.0.0-pre.1#can-model*/
define('can-model', function (require, exports, module) {
    (function (global) {
        var Map = require('can-map');
        var Construct = require('can-construct');
        var List = require('can-list');
        var Observation = require('can-observation');
        var Event = require('can-event');
        var assign = require('can-util/js/assign/assign');
        var canAjax = require('can-util/dom/ajax/ajax');
        var dev = require('can-util/js/dev/dev');
        var each = require('can-util/js/each/each');
        var isArray = require('can-util/js/is-array/is-array');
        var isFunction = require('can-util/js/is-function/is-function');
        var isPlainObject = require('can-util/js/is-plain-object/is-plain-object');
        var isPromise = require('can-util/js/is-promise/is-promise');
        var makeArray = require('can-util/js/make-array/make-array');
        var ns = require('can-util/namespace');
        var string = require('can-util/js/string/string');
        var ML;
        var pipe = function (def, thisArg, func) {
                var d = def.then(func.bind(thisArg));
                if (typeof def.abort === 'function') {
                    d.abort = function () {
                        return def.abort();
                    };
                }
                return d;
            }, modelNum = 0, getId = function (inst) {
                Observation.add(inst, inst.constructor.id);
                return inst.___get(inst.constructor.id);
            }, ajax = function (ajaxOb, data, type, dataType, success, error) {
                var params = {};
                if (typeof ajaxOb === 'string') {
                    var parts = ajaxOb.split(/\s+/);
                    params.url = parts.pop();
                    if (parts.length) {
                        params.type = parts.pop();
                    }
                } else {
                    assign(params, ajaxOb);
                }
                params.data = typeof data === 'object' && !isArray(data) ? assign(params.data || {}, data) : data;
                params.url = string.sub(params.url, params.data, true);
                return canAjax(assign({
                    type: type.toUpperCase() || 'POST',
                    dataType: dataType || 'json',
                    success: success,
                    error: error
                }, params));
            }, makeRequest = function (modelObj, type, success, error, method) {
                var args;
                if (isArray(modelObj)) {
                    args = modelObj[1];
                    modelObj = modelObj[0];
                } else {
                    args = modelObj.serialize();
                }
                args = [args];
                var deferred, model = modelObj.constructor, jqXHR;
                if (type === 'update' || type === 'destroy') {
                    args.unshift(getId(modelObj));
                }
                jqXHR = model[type].apply(model, args);
                deferred = pipe(jqXHR, modelObj, function (data) {
                    modelObj[method || type + 'd'](data, jqXHR);
                    return modelObj;
                });
                if (jqXHR.abort) {
                    deferred.abort = function () {
                        jqXHR.abort();
                    };
                }
                deferred.then(success, error);
                return deferred;
            }, converters = {
                models: function (instancesRawData, oldList, xhr) {
                    ns.Model._reqs++;
                    if (!instancesRawData) {
                        return;
                    }
                    if (instancesRawData instanceof this.List) {
                        return instancesRawData;
                    }
                    var self = this, tmp = [], ListClass = self.List || ML, modelList = oldList instanceof List ? oldList : new ListClass(), rawDataIsList = instancesRawData instanceof ML, raw = rawDataIsList ? instancesRawData.serialize() : instancesRawData;
                    raw = self.parseModels(raw, xhr);
                    if (raw.data) {
                        instancesRawData = raw;
                        raw = raw.data;
                    }
                    if (typeof raw === 'undefined' || !isArray(raw)) {
                        throw new Error('Could not get any raw data while converting using .models');
                    }
                    if (modelList.length) {
                        modelList.splice(0);
                    }
                    each(raw, function (rawPart) {
                        tmp.push(self.model(rawPart, xhr));
                    });
                    modelList.push.apply(modelList, tmp);
                    if (!isArray(instancesRawData)) {
                        each(instancesRawData, function (val, prop) {
                            if (prop !== 'data') {
                                modelList.attr(prop, val);
                            }
                        });
                    }
                    setTimeout(this._clean.bind(this), 1);
                    return modelList;
                },
                model: function (attributes, oldModel, xhr) {
                    if (!attributes) {
                        return;
                    }
                    if (typeof attributes.serialize === 'function') {
                        attributes = attributes.serialize();
                    } else {
                        attributes = this.parseModel(attributes, xhr);
                    }
                    var id = attributes[this.id];
                    if ((id || id === 0) && this.store[id]) {
                        oldModel = this.store[id];
                    }
                    var model = oldModel && isFunction(oldModel.attr) ? oldModel.attr(attributes, this.removeAttr || false) : new this(attributes);
                    return model;
                }
            }, makeParser = {
                parseModel: function (prop) {
                    return function (attributes) {
                        return prop ? string.getObject(prop, attributes) : attributes;
                    };
                },
                parseModels: function (prop) {
                    return function (attributes) {
                        if (isArray(attributes)) {
                            return attributes;
                        }
                        prop = prop || 'data';
                        var result = string.getObject(prop, attributes);
                        if (!isArray(result)) {
                            throw new Error('Could not get any raw data while converting using .models');
                        }
                        return result;
                    };
                }
            }, ajaxMethods = {
                create: {
                    url: '_shortName',
                    type: 'post'
                },
                update: {
                    data: function (id, attrs) {
                        attrs = attrs || {};
                        var identity = this.id;
                        if (attrs[identity] && attrs[identity] !== id) {
                            attrs['new' + string.capitalize(id)] = attrs[identity];
                            delete attrs[identity];
                        }
                        attrs[identity] = id;
                        return attrs;
                    },
                    type: 'put'
                },
                destroy: {
                    type: 'delete',
                    data: function (id, attrs) {
                        attrs = attrs || {};
                        attrs.id = attrs[this.id] = id;
                        return attrs;
                    }
                },
                findAll: { url: '_shortName' },
                findOne: {}
            }, ajaxMaker = function (ajaxMethod, str) {
                return function (data) {
                    data = ajaxMethod.data ? ajaxMethod.data.apply(this, arguments) : data;
                    return ajax(str || this[ajaxMethod.url || '_url'], data, ajaxMethod.type || 'get');
                };
            }, createURLFromResource = function (model, name) {
                if (!model.resource) {
                    return;
                }
                var resource = model.resource.replace(/\/+$/, '');
                if (name === 'findAll' || name === 'create') {
                    return resource;
                } else {
                    return resource + '/{' + model.id + '}';
                }
            };
        ns.Model = Map.extend({
            fullName: 'Model',
            _reqs: 0,
            id: 'id',
            setup: function (base, fullName, staticProps, protoProps) {
                if (typeof fullName !== 'string') {
                    protoProps = staticProps;
                    staticProps = fullName;
                }
                if (!protoProps) {
                    protoProps = staticProps;
                }
                this.store = {};
                Map.setup.apply(this, arguments);
                if (!ns.Model) {
                    return;
                }
                if (staticProps && staticProps.List) {
                    this.List = staticProps.List;
                    this.List.Map = this;
                } else {
                    this.List = base.List.extend({ Map: this }, {});
                }
                var self = this, clean = this._clean.bind(self);
                each(ajaxMethods, function (method, name) {
                    if (staticProps && staticProps[name] && (typeof staticProps[name] === 'string' || typeof staticProps[name] === 'object')) {
                        self[name] = ajaxMaker(method, staticProps[name]);
                    } else if (staticProps && staticProps.resource && !isFunction(staticProps[name])) {
                        self[name] = ajaxMaker(method, createURLFromResource(self, name));
                    }
                    if (self['make' + string.capitalize(name)]) {
                        var newMethod = self['make' + string.capitalize(name)](self[name]);
                        Construct._overwrite(self, base, name, function () {
                            ns.Model._reqs++;
                            var def = newMethod.apply(this, arguments);
                            var then = def.then(clean);
                            def.catch(clean);
                            then.abort = def.abort;
                            return then;
                        });
                    }
                });
                var hasCustomConverter = {};
                each(converters, function (converter, name) {
                    var parseName = 'parse' + string.capitalize(name), dataProperty = staticProps && staticProps[name] || self[name];
                    if (typeof dataProperty === 'string') {
                        self[parseName] = dataProperty;
                        Construct._overwrite(self, base, name, converter);
                    } else if (staticProps && staticProps[name]) {
                        hasCustomConverter[parseName] = true;
                    }
                });
                each(makeParser, function (maker, parseName) {
                    var prop = staticProps && staticProps[parseName] || self[parseName];
                    if (typeof prop === 'string') {
                        Construct._overwrite(self, base, parseName, maker(prop));
                    } else if ((!staticProps || !isFunction(staticProps[parseName])) && !self[parseName]) {
                        var madeParser = maker();
                        madeParser.useModelConverter = hasCustomConverter[parseName];
                        Construct._overwrite(self, base, parseName, madeParser);
                    }
                });
                if (self.fullName === 'Model' || !self.fullName) {
                    self.fullName = 'Model' + ++modelNum;
                }
                ns.Model._reqs = 0;
                this._url = this._shortName + '/{' + this.id + '}';
            },
            _ajax: ajaxMaker,
            _makeRequest: makeRequest,
            _clean: function () {
                ns.Model._reqs--;
                if (!ns.Model._reqs) {
                    for (var id in this.store) {
                        if (!this.store[id]._bindings) {
                            delete this.store[id];
                        }
                    }
                }
                return arguments[0];
            },
            models: converters.models,
            model: converters.model
        }, {
            setup: function (attrs) {
                var id = attrs && attrs[this.constructor.id];
                if (ns.Model._reqs && id != null) {
                    this.constructor.store[id] = this;
                }
                Map.prototype.setup.apply(this, arguments);
            },
            isNew: function () {
                var id = getId(this);
                return !(id || id === 0);
            },
            save: function (success, error) {
                return makeRequest(this, this.isNew() ? 'create' : 'update', success, error);
            },
            destroy: function (success, error) {
                if (this.isNew()) {
                    var self = this;
                    var def = Promise.resolve(self);
                    def.then(success, error);
                    def.then(function (data) {
                        self.destroyed(data);
                    });
                    return def;
                }
                return makeRequest(this, 'destroy', success, error, 'destroyed');
            },
            _eventSetup: function () {
                var modelInstance = this.___get(this.constructor.id);
                if (modelInstance != null) {
                    this.constructor.store[modelInstance] = this;
                }
                return Map.prototype._eventSetup.apply(this, arguments);
            },
            _eventTeardown: function () {
                delete this.constructor.store[getId(this)];
                return Map.prototype._eventTeardown.apply(this, arguments);
            },
            ___set: function (prop, val) {
                Map.prototype.___set.call(this, prop, val);
                if (prop === this.constructor.id && this._bindings) {
                    this.constructor.store[getId(this)] = this;
                }
            }
        });
        var makeGetterHandler = function (name) {
                return function (data, readyState, xhr) {
                    return this[name](data, null, xhr);
                };
            }, createUpdateDestroyHandler = function (data) {
                if (this.parseModel.useModelConverter) {
                    return this.model(data);
                }
                return this.parseModel(data);
            };
        var responseHandlers = {
            makeFindAll: makeGetterHandler('models'),
            makeFindOne: makeGetterHandler('model'),
            makeCreate: createUpdateDestroyHandler,
            makeUpdate: createUpdateDestroyHandler,
            makeDestroy: createUpdateDestroyHandler
        };
        each(responseHandlers, function (method, name) {
            ns.Model[name] = function (oldMethod) {
                return function () {
                    var args = makeArray(arguments), oldArgs = isFunction(args[1]) ? args.splice(0, 1) : args.splice(0, 2), def = pipe(oldMethod.apply(this, oldArgs), this, method);
                    def.then(args[0], args[1]);
                    return def;
                };
            };
        });
        each([
            'created',
            'updated',
            'destroyed'
        ], function (funcName) {
            ns.Model.prototype[funcName] = function (attrs) {
                var self = this, constructor = self.constructor;
                if (attrs && typeof attrs === 'object') {
                    this.attr(isFunction(attrs.attr) ? attrs.attr() : attrs);
                }
                Event.trigger.call(this, {
                    type: funcName,
                    target: this
                }, []);
                Event.trigger.call(constructor, funcName, [this]);
            };
        });
        ML = ns.Model.List = List.extend({
            _bubbleRule: function (eventName, list) {
                var bubbleRules = List._bubbleRule(eventName, list);
                bubbleRules.push('destroyed');
                return bubbleRules;
            }
        }, {
            setup: function (params) {
                if (isPlainObject(params) && !isArray(params)) {
                    List.prototype.setup.apply(this);
                    this.replace(isPromise(params) ? params : this.constructor.Map.findAll(params));
                } else {
                    List.prototype.setup.apply(this, arguments);
                }
                this.bind('destroyed', this._destroyed.bind(this));
            },
            _destroyed: function (ev, attr) {
                if (/\w+/.test(attr)) {
                    var index;
                    while ((index = this.indexOf(ev.target)) > -1) {
                        this.splice(index, 1);
                    }
                }
            }
        });
        module.exports = ns.Model;
    }(function () {
        return this;
    }()));
});
/*[global-shim-end]*/
(function(){ // jshint ignore:line
	window._define = window.define;
	window.define = window.define.orig;
}
)();