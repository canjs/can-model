# can-model

[![Join the chat at https://gitter.im/canjs/canjs](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/canjs/canjs?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/canjs/can-model/blob/master/LICENSE.md)
[![npm version](https://badge.fury.io/js/can-model.svg)](https://www.npmjs.com/package/can-model)
[![Travis build status](https://travis-ci.org/canjs/can-model.svg?branch=master)](https://travis-ci.org/canjs/can-model)
[![Greenkeeper badge](https://badges.greenkeeper.io/canjs/can-model.svg)](https://greenkeeper.io/)

*Note: This is the [legacy](https://canjs.com/doc/can-legacy.html) [can.Model](https://v2.canjs.com/docs/can.Model.html) package.*

## 4.X Notes

- `can-model` now uses `can-ajax` which will try to JSON.parse() error responses. Instead of getting a jQuery XHR object as the 2nd argument of a `.catch(handler(response, jqXHR))`,
there is just a response.
