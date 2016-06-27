@property {String} can-model.resource resource
@parent can-model.static

@description Define a restful resource URL.

@option {String}

A string URL to a restful resource. If the resource
is specified as `"resource"` and the model's [can-model.id id] is
`"id"`, resource will implement [can-model]'s ajax methods as follows:

 - [can-model.findAll] - `"GET resource"`
 - [can-model.findOne] - `"GET resource/{id}"`
 - [can-model.create] - `"POST resource"`
 - [can-model.update] - `"PUT resource/{id}"`
 - [can-model.destroy] - `"DELETE resource/{id}"`

Setting the `resource` property will not overwrite other implemented
ajax methods, however will overwrite inherited ajax methods.

@body

## Use

For each of the names (create, update, destroy, findOne, and findAll) use the 
URL provided by the `resource` property. For example:

```
Todo = Model.extend({
  resource: "/todos"
}, {});
```

Will create a Model that is identical to:

```
Todo = Model.extend({
  findAll: "GET /todos",
  findOne: "GET /todos/{id}",
  create:  "POST /todos",
  update:  "PUT /todos/{id}",
  destroy: "DELETE /todos/{id}"
},{});
```

Inherited AJAX methods will be overwritten when using the `resource` property. For example, inheriting our Todo model:

```
SpecialTodo = Todo.extend({
  resource: "/specialTodos"
}, {});
```

Will create a Todo model identical to:

```
SpecialTodo = Model.extend({
  findAll: "GET /specialTodos",
  findOne: "GET /specialTodos/{id}",
  create:  "POST /specialTodos",
  update:  "PUT /specialTodos/{id}",
  destroy: "DELETE /specialTodos/{id}"
}, {});
```
