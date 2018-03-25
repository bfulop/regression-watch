const R = require('ramda')
const puppeteer = require('puppeteer')
const { createTargetsList, createTargetScreenshots, compareScreenshots } = require('./utils')
const { testtargets } = require('./targets')
const { startServer } = require('./server')

const displayResults = ({ route, width, targetelem, numDiffPixels }) => {
  if (numDiffPixels > 100) {
    console.warn('diff ✗', route, width, targetelem, numDiffPixels)
  } else {
    console.log('diff ✓', route, width, targetelem, numDiffPixels)
  }
  return numDiffPixels
}

const runner = xt => {
  return new Promise((resolve, reject) => {
    setTimeout(function () {
      Promise.all(createTargetScreenshots('test')(xt))
        .then(R.map(compareScreenshots))
        .then(R.map(r => r.then(displayResults)))
        .then(r => {
          resolve(xt)
          return r
        })
        .catch(e => {
          console.error(e)
          return e
        })
    }, 300)
  })
}

puppeteer
  .launch()
  .then(b => {
    return Promise.all(createTargetsList(b)(testtargets))
      .then(r => {
        console.log('browsers setup start')
        startServer({
          compare: runner(r),
          snapshot: x => createTargetScreenshots('golden')(r)
        })
        // runner(r)
        return Promise.all(r)
      })
      .then(r => {
        console.log('browsers setup done')
        return b
      })
      .catch(e => {
        console.error('--------------- error ------------')
        console.error(e)
      })
  })
  .then(b => {
    console.log('sequence done, watching for changes')
    // b.close()
  })
  .catch(e => {
    console.error('+++++++++++++++ error ++++++++++++')
    console.error(e)
  })
