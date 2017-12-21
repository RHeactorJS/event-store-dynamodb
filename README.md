# event-store-dynamodb

[![npm version](https://img.shields.io/npm/v/@rheactorjs/event-store-dynamodb.svg)](https://www.npmjs.com/package/@rheactorjs/event-store-dynamodb)
[![Build Status](https://travis-ci.org/RHeactorJS/event-store-dynamodb.svg?branch=master)](https://travis-ci.org/RHeactorJS/event-store-dynamodb)
[![Greenkeeper badge](https://badges.greenkeeper.io/RHeactorJS/event-store-dynamodb.svg)](https://greenkeeper.io/) 
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![semantic-release](https://img.shields.io/badge/semver-semantic%20release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Test Coverage](https://codeclimate.com/github/RHeactorJS/event-store-dynamodb/badges/coverage.svg)](https://codeclimate.com/github/RHeactorJS/event-store-dynamodb/coverage)
[![Code Climate](https://codeclimate.com/github/RHeactorJS/event-store-dynamodb/badges/gpa.svg)](https://codeclimate.com/github/RHeactorJS/event-store-dynamodb)

Implementation of an event store using DynamoDB.

Contains [helper methods to manage secondary indices](https://github.com/RHeactorJS/event-store-dynamodb/blob/master/src/aggregate-index.js).

## Versioning

Storing events per aggregateName is done in a list per individual aggregateName, the order of the insertion is guaranteed by using the version as the range key.
