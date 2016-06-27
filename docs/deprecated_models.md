@function can-model.models models
@parent can-model.static

@deprecated {2.1} Prior to 2.1, `.models` was used to convert the ajax
responses into a data format useful for converting them into an observable
list AND for converting them into that list. In 2.1, [can-model.parseModels] should
be used to convert the ajax responses into a data format useful to [can-model.models].

@description Convert raw data into Model instances. Merge data with items in
the store if matches are found.

@signature `Model.models(data[, oldList])`
@param {Array<Object>} data The raw data from a `[Model.findAll findAll()]` request.
@param {Model.List} [oldList] If supplied, this List will be updated with the data from
__data__.
@return {Model.List} A List of Models made from the raw data.


@body

## Use

`.models(data)` is used to create a [can-model.List] of [Model] instances
with the data provided. If an item in data matches an instance in the [can-model.store],
that instance will be merged with the item's data and inserted in the list.

For example

```
Task = Model.extend({},{})

var t1 = new Task({id: 1, name: "dishes"});

// Binding on a model puts it in the store.
t1.bind("change", function(){})

var tasks = Task.models([
 {id: 1, name : "dishes", complete : false},
 {id: 2, name: "laundry", complete: true}
])

t1 === tasks.attr(0) //-> true
t1.attr("complete")  //-> false
```
