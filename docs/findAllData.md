@description Retrieve multiple resources from a server.
@function can-model.findAllData findAllData
@parent can-model.static

Retrieves a list of items for [can-model.models], typically by making an 
Ajax request.

@param {Object} params Specifies the list to be retrieved.

@return {Promise} A Promise that resolves to a data structure
that can be understood by [can-model.models].

@signature `function(params) -> Promise`


@body

## Use

Typically, `findAll` is implemented with a "string" or [AjaxSettings ajax settings object] like:

```
findAll: "GET /tasks"
```
    
or

```
findAll: {url: "/tasks", dataType: "custom"}
```

[can-model.setup] converts this into an AJAX-ready function using [can-model.makeFindAll].
