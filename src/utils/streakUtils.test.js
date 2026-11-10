import assert from 'node:assert/strict'
import {
  STREAK_STATUS,
  resolveStreakFromDays,
  getStreakHeatTier
} from './streakResolve.js'

function fromOffsets(offsets) {
  const filled = new Set(offsets)
  return resolveStreakFromDays((index) => filled.has(index))
}

function range(from, to) {
  const list = []
  for (let i = from; i <= to; i++) list.push(i)
  return list
}

assert.deepEqual(fromOffsets([0, ...range(2, 41)]), { days: 41, status: STREAK_STATUS.LIVE })
assert.deepEqual(fromOffsets(range(2, 41)), { days: 40, status: STREAK_STATUS.PAUSED })
assert.deepEqual(fromOffsets(range(3, 42)), { days: 40, status: STREAK_STATUS.COOLED })
assert.deepEqual(fromOffsets(range(4, 43)), { days: 0, status: STREAK_STATUS.EMPTY })

const everyOther = fromOffsets([0, 2, 4, 6, 8, 10, 12])
assert.equal(everyOther.days, 3)
assert.equal(everyOther.status, STREAK_STATUS.LIVE)

assert.deepEqual(fromOffsets(range(1, 10)), { days: 10, status: STREAK_STATUS.LIVE })

assert.equal(getStreakHeatTier(40, STREAK_STATUS.LIVE), 14)
assert.equal(getStreakHeatTier(40, STREAK_STATUS.COOLED), 7)
assert.equal(getStreakHeatTier(7, STREAK_STATUS.COOLED), 3)

console.log('streakUtils.test.js: all assertions passed')
