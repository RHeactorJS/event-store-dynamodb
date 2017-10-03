/* global describe it expect */

import {AggregateMeta} from '../src'

describe('AggregateMeta', () => {
  describe('constructur', () => {
    it('should set id and version', () => {
      const a = new AggregateMeta('17', 1)
      expect(a.id).toEqual('17')
      expect(a.version).toEqual(1)
    })
  })
  describe('.updated', () => {
    it('should increase the version and set the updated date', () => {
      const a = new AggregateMeta('17', 1).updated()
      expect(a.version).toEqual(2)
      expect(a.updatedAt.getTime()).toBeLessThanOrEqual(Date.now())
    })
    it('should throw an TypeError on invalid data', () => {
      const a = new AggregateMeta('17', 1)
      expect(a.updated.bind(a, -1)).toThrow(TypeError)
    })
  })
  describe('.deleted', () => {
    it('should increase the version and set the deleted date', () => {
      const a = new AggregateMeta('17', 1).deleted()
      expect(a.version).toEqual(2)
      expect(a.deletedAt.getTime()).toBeLessThanOrEqual(Date.now())
    })
    it('should throw an TypeError on invalid data', () => {
      const a = new AggregateMeta('17', 1)
      expect(a.deleted.bind(a, -1)).toThrow(TypeError)
    })
  })
  describe('.createdAt', () => {
    it('should return time of creation', () => {
      const createdAt = new Date('2016-01-01T03:04:05+00:00')
      const a = new AggregateMeta('17', 1, createdAt)
      expect(a.createdAt).toEqual(createdAt)
      expect(a.modifiedAt).toEqual(createdAt)
    })
    it('should default to new Date()', () => {
      const a = new AggregateMeta('17', 1)
      expect(a.createdAt.getTime()).toBeLessThanOrEqual(Date.now())
    })
  })
  describe('.updatedAt', () => {
    it('should return time of updating', () => {
      const createdAt = new Date('2016-01-01T03:04:05+00:00')
      const a = new AggregateMeta('17', 1, createdAt)
      const updatedAt = new Date('2016-01-02T03:04:05+00:00')
      const a2 = a.updated(updatedAt)
      expect(a2.updatedAt).toEqual(updatedAt)
      expect(a2.modifiedAt).toEqual(updatedAt)
    })
    it('should default to new Date()', () => {
      const createdAt = new Date('2016-01-01T03:04:05+00:00')
      const a = new AggregateMeta('17', 1, createdAt)
      const a2 = a.updated()
      expect(a2.updatedAt.getTime()).toBeLessThanOrEqual(Date.now())
    })
  })
  describe('.deletedAt', () => {
    it('should return time of deleting', () => {
      const createdAt = new Date('2016-01-01T03:04:05+00:00')
      const updatedAt = new Date('2016-01-02T03:04:05+00:00')
      const deletedAt = new Date('2016-01-03T03:04:05+00:00')
      const a = new AggregateMeta('17', 1, createdAt)
      const a3 = a.updated(updatedAt).deleted(deletedAt)
      expect(a3.deletedAt).toEqual(deletedAt)
      expect(a3.modifiedAt).toEqual(deletedAt)
    })
    it('should default to new Date()', () => {
      const createdAt = new Date('2016-01-01T03:04:05+00:00')
      const updatedAt = new Date('2016-01-02T03:04:05+00:00')
      const a = new AggregateMeta('17', 1, createdAt)
      const a3 = a.updated(updatedAt).deleted()
      expect(a3.deletedAt.getTime()).toBeLessThanOrEqual(Date.now())
    })
  })
  describe('.isDeleted', () => {
    it('should return false if entity is not deleted', () => {
      const a = new AggregateMeta('17', 1)
      expect(a.isDeleted).toEqual(false)
    })
    it('should return true if entity is deleted', () => {
      const a = new AggregateMeta('17', 1).deleted()
      expect(a.isDeleted).toEqual(true)
    })
  })
  describe('.createdBy', () => {
    it('should return id of the creator', () => {
      const a = new AggregateMeta('17', 1, undefined, undefined, undefined, '42')
      expect(a.createdBy).toEqual('42')
    })
    it('should default to new undefined', () => {
      const a = new AggregateMeta('17', 1)
      expect(a.createdBy).toEqual(undefined)
    })
  })
})
