/**
 * A plugin to identify empty elements, esp those to fake styling
 *  <p>, <h1..6>, <li>, <ol>, <ul> and <br><br>
 * do we need to strip out &nbsp too? TODO
 *
 * TODO: add tests on dummy index page for these
 */

let $ = require('jquery')
let Plugin = require('../base')

let outlineItemTemplate = require('./index.js')
require('./index.js')

class FocusPlugin extends Plugin {
  getTitle () {
    return 'Keyboard focus order'
  }

  getDescription () {
    return `
             wiggle wiggle
         `
  }
  run () {
    var results = getTabbablesInOrder(document.querySelector('body'))
    results.forEach(function (element, index) {
      $(this).addClass('tota11y-focus') // so we can find them again
      annotate.errorLabel($(this), 'Empty!', $(this).prop('tagName'))
    })

    function getTabbablesInOrder (within) {
      /* 
               get a list of all elements that can be tabbed to and which are descendants of "within"
               in tab order (that is, in order by tabindex, but assume that tabindexless tabbable
               elements have tabindex 0, which means "tab to me in DOM order")
               Note that we have to get all tabbables in the whole document (because tabindex
               is a document-wide number) and then filter at the end to those which are
               descendants of "within".
            */
      var els = Array.prototype.slice
        .call(
          document.querySelectorAll('input,select,textarea,button,a,[tabindex]')
        )
        .map(function (el) {
          if (el.hasAttribute('tabindex')) {
            var val = parseInt(el.getAttribute('tabindex'), 10)
            if (isNaN(val) || val < 0) return [el, -1] // invalid tabindex so it's not tabbable at all
            return [el, val]
          } else {
            // tabbable but doesn't have a tabindex, so pretend it has tabindex 0
            return [el, 0]
          }
        })
      var zero_els = els.filter(function (x) {
        return x[1] === 0
      })
      var tabindex_els = els
        .filter(function (x) {
          return x[1] !== 0 && x[1] != -1
        })
        .sort(function (a, b) {
          return a[1] - b[1]
        })
      // note that elements with -1 as tabindex are thrown away and not included!

      // now walk through tabindex_els in reverse order and insert them at that index
      // it is not clear whether, given an element with tabindex=7 and an element with tabindex=42,
      // whether we're supposed to insert the 42 first and then the 7 (thus bumping the 42 to 43)
      // or insert the 7 first and then the 42. We do it in reverse order, meaning that only
      // the lowest tabindex will actually be *correct*.
      for (var i = tabindex_els.length - 1; i >= 0; i--) {
        var el = tabindex_els[i][0]
        var idx = tabindex_els[i][1]
        zero_els.splice(idx - 1, 0, [el, idx]) // tabindex is 1-based; the position in the zero_els array is 0-based
      }

      var in_order = zero_els.map(function (x) {
        return x[0]
      })

      // now filter in_order to only include children of "within"
      return in_order.filter(function (el) {
        return within.contains(el)
      })
    }
  }

  cleanup () {
    annotate.removeAll()
    $('.tota11y-focus').each(function () {
      $(this).empty()
    })
  }
}

module.exports = FocusPlugin
