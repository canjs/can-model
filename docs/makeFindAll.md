@function  can-model.makeFindAll makeFindAll
@parent can-model.static

`makeFindAll` is a hook that lets you define special `findAll` behavior. 
It is a generator function that lets you return the function that will 
actually be called when `findAll` is called.

@signature `Model.makeFindAll: function(findAllData) -> findAll`

Returns the external `findAll` method given the implemented [can-model.findAllData findAllData] function.

@param {Model.findAllData} findAllData

[can-model.findAll] is implemented with a `String`, [http://api.jquery.com/jQuery.ajax/#jQuery-ajax-settings ajax settings object], or
[can-model.findAllData findAllData] function. If it is implemented as
a `String` or [http://api.jquery.com/jQuery.ajax/#jQuery-ajax-settings ajax settings object], those values are used
to create a [can-model.findAllData findAllData] function.

The [can-model.findAllData findAllData] function is passed to `makeFindAll`. `makeFindAll`
should use `findAllData` internally to get the raw data for the request.

@return {function(params,success,error):Promise}

Returns function that implements the external API of `findAll`.

@body

## Use

When a user calls `MyModel.findAll({})`, the function returned by 
`makeFindAll` will be called. Here you can specify what you want to happen 
before the real request for data is made. Call the function passed in `findAllData` with `params` to make the AJAX request, or whatever the external request for data normally does.

`makeFindAll` can be used to implement base models that perform special
behavior, like caching, or adding special parameters to the request object. `makeFindAll` is passed a [can-model.findAllData findAllData] function that retrieves raw
data. It should return a function that when called, uses
the findAllData function to get the raw data and manually convert it to model instances with
[can-model.models models].

## Caching

The following uses `makeFindAll` to create a base `CachedModel`:

```js
CachedModel = Model.extend({
  makeFindAll: function(findAllData){
    // A place to store requests
    var cachedRequests = {};

    return function(params, success, error){
      // is this not cached?
      if(! cachedRequests[JSON.stringify(params)] ) {
        var self = this;
        // make the request for data, save Promise
        cachedRequests[JSON.stringify(params)] =
          findAllData(params).then(function(data){
            // convert the raw data into instances
            return self.models(data)
          })
      }
      // get the saved request
      var def = cachedRequests[JSON.stringify(params)]
      // hookup success and error
      def.then(success,error)
      return def;
    }
  }
},{})
```

The following Todo model will never request the same list of todo's twice:

```js
Todo = CachedModel({
  findAll: "/todos"
},{})

// widget 1
Todo.findAll({})

// widget 2
Todo.findAll({})
```
