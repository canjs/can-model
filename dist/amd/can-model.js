/*can-model@2.3.11#can-model*/
define(function (require, exports, module) {
    (function (global) {
        var can = require('can-util');
        var Map = require('can-map');
        var Construct = require('can-construct');
        var List = require('can-list');
        var Observation = require('can-observation');
        var Event = require('can-event');
        var Promise = global.Promise;
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
                    can.assign(params, ajaxOb);
                }
                params.data = typeof data === 'object' && !can.isArray(data) ? can.assign(params.data || {}, data) : data;
                params.url = can.string.sub(params.url, params.data, true);
                return can.ajax(can.assign({
                    type: type.toUpperCase() || 'POST',
                    dataType: dataType || 'json',
                    success: success,
                    error: error
                }, params));
            }, makeRequest = function (modelObj, type, success, error, method) {
                var args;
                if (can.isArray(modelObj)) {
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
                    can.Model._reqs++;
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
                    if (typeof raw === 'undefined' || !can.isArray(raw)) {
                        throw new Error('Could not get any raw data while converting using .models');
                    }
                    if (modelList.length) {
                        modelList.splice(0);
                    }
                    can.each(raw, function (rawPart) {
                        tmp.push(self.model(rawPart, xhr));
                    });
                    modelList.push.apply(modelList, tmp);
                    if (!can.isArray(instancesRawData)) {
                        can.each(instancesRawData, function (val, prop) {
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
                    var model = oldModel && can.isFunction(oldModel.attr) ? oldModel.attr(attributes, this.removeAttr || false) : new this(attributes);
                    return model;
                }
            }, makeParser = {
                parseModel: function (prop) {
                    return function (attributes) {
                        return prop ? can.string.getObject(prop, attributes) : attributes;
                    };
                },
                parseModels: function (prop) {
                    return function (attributes) {
                        if (can.isArray(attributes)) {
                            return attributes;
                        }
                        prop = prop || 'data';
                        var result = can.string.getObject(prop, attributes);
                        if (!can.isArray(result)) {
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
                            attrs['new' + can.string.capitalize(id)] = attrs[identity];
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
        can.Model = Map.extend({
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
                if (!can.Model) {
                    return;
                }
                if (staticProps && staticProps.List) {
                    this.List = staticProps.List;
                    this.List.Map = this;
                } else {
                    this.List = base.List.extend({ Map: this }, {});
                }
                var self = this, clean = this._clean.bind(self);
                can.each(ajaxMethods, function (method, name) {
                    if (staticProps && staticProps[name] && (typeof staticProps[name] === 'string' || typeof staticProps[name] === 'object')) {
                        self[name] = ajaxMaker(method, staticProps[name]);
                    } else if (staticProps && staticProps.resource && !can.isFunction(staticProps[name])) {
                        self[name] = ajaxMaker(method, createURLFromResource(self, name));
                    }
                    if (self['make' + can.string.capitalize(name)]) {
                        var newMethod = self['make' + can.string.capitalize(name)](self[name]);
                        Construct._overwrite(self, base, name, function () {
                            can.Model._reqs++;
                            var def = newMethod.apply(this, arguments);
                            var then = def.then(clean);
                            def.catch(clean);
                            then.abort = def.abort;
                            return then;
                        });
                    }
                });
                var hasCustomConverter = {};
                can.each(converters, function (converter, name) {
                    var parseName = 'parse' + can.string.capitalize(name), dataProperty = staticProps && staticProps[name] || self[name];
                    if (typeof dataProperty === 'string') {
                        self[parseName] = dataProperty;
                        Construct._overwrite(self, base, name, converter);
                    } else if (staticProps && staticProps[name]) {
                        hasCustomConverter[parseName] = true;
                    }
                });
                can.each(makeParser, function (maker, parseName) {
                    var prop = staticProps && staticProps[parseName] || self[parseName];
                    if (typeof prop === 'string') {
                        Construct._overwrite(self, base, parseName, maker(prop));
                    } else if ((!staticProps || !can.isFunction(staticProps[parseName])) && !self[parseName]) {
                        var madeParser = maker();
                        madeParser.useModelConverter = hasCustomConverter[parseName];
                        Construct._overwrite(self, base, parseName, madeParser);
                    }
                });
                if (self.fullName === 'Model' || !self.fullName) {
                    self.fullName = 'Model' + ++modelNum;
                }
                can.Model._reqs = 0;
                this._url = this._shortName + '/{' + this.id + '}';
            },
            _ajax: ajaxMaker,
            _makeRequest: makeRequest,
            _clean: function () {
                can.Model._reqs--;
                if (!can.Model._reqs) {
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
                if (can.Model._reqs && id != null) {
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
        can.each(responseHandlers, function (method, name) {
            can.Model[name] = function (oldMethod) {
                return function () {
                    var args = can.makeArray(arguments), oldArgs = can.isFunction(args[1]) ? args.splice(0, 1) : args.splice(0, 2), def = pipe(oldMethod.apply(this, oldArgs), this, method);
                    def.then(args[0], args[1]);
                    return def;
                };
            };
        });
        can.each([
            'created',
            'updated',
            'destroyed'
        ], function (funcName) {
            can.Model.prototype[funcName] = function (attrs) {
                var self = this, constructor = self.constructor;
                if (attrs && typeof attrs === 'object') {
                    this.attr(can.isFunction(attrs.attr) ? attrs.attr() : attrs);
                }
                Event.trigger.call(this, {
                    type: funcName,
                    target: this
                }, []);
                Event.trigger.call(constructor, funcName, [this]);
            };
        });
        ML = can.Model.List = List.extend({
            _bubbleRule: function (eventName, list) {
                var bubbleRules = List._bubbleRule(eventName, list);
                bubbleRules.push('destroyed');
                return bubbleRules;
            }
        }, {
            setup: function (params) {
                if (can.isPlainObject(params) && !can.isArray(params)) {
                    List.prototype.setup.apply(this);
                    this.replace(can.isPromise(params) ? params : this.constructor.Map.findAll(params));
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
        module.exports = can.Model;
    }(function () {
        return this;
    }()));
});