# event-store

[![Greenkeeper badge](https://badges.greenkeeper.io/RHeactorJS/event-store.svg)](https://greenkeeper.io/)

[![npm version](https://img.shields.io/npm/v/@rheactorjs/event-store.svg)](https://www.npmjs.com/package/@rheactorjs/event-store)
[![Build Status](https://travis-ci.org/RHeactorJS/event-store.svg?branch=master)](https://travis-ci.org/RHeactorJS/event-store)
[![monitored by greenkeeper.io](https://img.shields.io/badge/greenkeeper.io-monitored-brightgreen.svg)](http://greenkeeper.io/) 
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![semantic-release](https://img.shields.io/badge/semver-semantic%20release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Test Coverage](https://codeclimate.com/github/RHeactorJS/event-store/badges/coverage.svg)](https://codeclimate.com/github/RHeactorJS/event-store/coverage)
[![Code Climate](https://codeclimate.com/github/RHeactorJS/event-store/badges/gpa.svg)](https://codeclimate.com/github/RHeactorJS/event-store)

Implementation of an event store based on [redis](https://redis.io/).

Contains [helper methods to manage secondary indices](https://github.com/RHeactorJS/event-store/blob/master/src/aggregate-index.js).

## Versioning

Storing events per aggregate is done in a list per individual aggregate, the order of the insertion is guaranteed by using [Redis lists](https://redis.io/topics/data-types#lists). This gives use an version number per event for free.

Lets assume we want to create a user `17`, we store a `UserCreatedEvent` for this aggregate id:

```javascript
eventStore.persist(new ModelEvent('UserCreatedEvent', '17', {name: 'John'}))
```

If we add another event later:

```javascript
eventStore.persist(new ModelEvent('UserNameUpdatedEvent', '17', {name: 'Mike'}))
```

this event will be appended to the list.

When aggregating the events, we can increase the version of the aggregate per event.

## Mutable Aggregates have been deprecated

The initial implementation of the event store modified models in place. More recently we decied to use immutable models instead. 

The [`ImmutableAggregateRepository`](https://github.com/RHeactorJS/event-store/blob/master/src/immutable-aggregate-repository.js) changes how Models are instantiated. It moves the responsibility of creating the model instance to the repository, where the `applyEvent()` method is invoked as a reducer. The method will return an instance of [`ImmutableAggregateRoot`](https://github.com/RHeactorJS/event-store/blob/master/src/immutable-aggregate-root.js) which can no longer be manipulated directly.

This also changes how meta information is stored in the Aggregates, it is now encapsuled in a separate object called [`AggregateMeta`](https://github.com/RHeactorJS/event-store/blob/master/src/aggregate-meta.js).

See the [tests](https://github.com/RHeactorJS/event-store/blob/master/test/immutable-aggregate-repository.spec.js) for details.

