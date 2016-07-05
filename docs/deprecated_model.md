@function can-model.model model
@parent can-model.static

@deprecated {2.1} Prior to 2.1, `.model` was used to convert ajax
responses into a data format useful for converting them into a Model instance
AND for converting them into that instance. In 2.1, [can-model.parseModel] should
be used to convert the ajax response into a data format useful to [can-model.model].

@description Convert raw data into a Model instance. If data's [can-model.id id]
matches a item in the store's `id`, `data` is merged with the instance and the
instance is returned.


@signature `Model.model(data)`
@param {Object} data The data to convert to a Model instance.
@return {Model} An instance of Model made with the given data.


@body

## Use

`.models(data)` is used to create or retrieve a [Model] instance
with the data provided. If data matches an instance in the [can-model.store],
that instance will be merged with the item's data and returneds

For example

```
Task = Model.extend({},{})

var t1 = new Task({id: 1, name: "dishes"})

// Binding on a model puts it in the store
t1.bind("change", function(){})

var task = Task.model({id: 1, name : "dishes", complete : false})

t1 === task //-> true
t1.attr("complete")  //-> false
```
