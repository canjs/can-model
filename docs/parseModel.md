@function can-model.parseModel parseModel
@parent can-model.static
@description Convert raw data into an object that can be used to
create a [can-model Model] instance.

@signature `Model.parseModel( data, xhr )`
@release 2.1


@param {Object} data The data to convert to a Model instance.
@param {XMLHTTPRequest} xhr The XMLHTTPRequest object used to make the request.
@return {Object} An object of properties to set at the [can-model::attr attributes]
of a model instance.

@signature `parseModel: "PROPERTY"`

Creates a `parseModel` function that looks for the attributes object in the PROPERTY
property of raw instance data.

@body

## Use

`Model.parseModel(data, xhr)` is used to
convert the raw response of a [can-model.findOne findOne],
[can-model.update update], and [can-model.create create] request
into an object that [can-model.model] can use to create
a model instances.

This method is never called directly. Instead the Promise returned
by `findOne`, `update`, and `create` is piped into `parseModel`. If `findOne` was called,
the result of that is sent to [can-model.model].

If your server is returning data in non-standard way,
overwriting `Model.parseModel` is the best way to normalize it.

## Expected data format

By default, [can-model.model] expects data to be a name-value pair
object like:

```
{id: 1, name : "dishes"}
```

If your data does not look like this, you probably want to overwrite `parseModel`.

## Overwriting parseModel

If your service returns data like:

```
{ thingsToDo: {name: "dishes", id: 5} }
```

You will want to overwrite `parseModel` to pass the model what it expects like:

```
Task = Model.extend({
 parseModel: function(data){
   return data.thingsToDo;
 }
},{});
```

You could also do this like:

```
Task = Model.extend({
 parseModel: "thingsToDo"
},{});
```
