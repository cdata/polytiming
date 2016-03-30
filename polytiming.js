(function() {
  'use strict';

  let measuredElements = new Set();
  let measuredMethods = new Set();
  let AuthenticPolymer;
  let AuthenticBase;

  Object.defineProperty(window, 'Polymer', {
    get: function() {
      return AuthenticPolymer;
    },

    set: function(Polymer) {
      AuthenticPolymer = Polymer;
      Object.defineProperty(Polymer, 'Base', {
        get: function() {
          return AuthenticBase;
        },

        set: function(Base) {
          AuthenticBase = Base;
          instrumentLifecycle(Base);
        }
      });
    }
  });

  function measuredMethod(name, work) {
    measuredMethods.add(name);
    return function() {
      let element = this.is || this.tagName;
      let elementName = `${element}-${name}`;
      let startMark = `${elementName}-start`;
      let endMark = `${elementName}-end`;
      let result;

      measuredElements.add(element);

      window.performance.mark(startMark);
      result = work.apply(this, arguments);
      window.performance.mark(endMark);
      window.performance.measure(elementName, startMark, endMark);
      return result;
    };
  }

  function instrumentLifecycle(proto) {
    proto.createdCallback = measuredMethod('created', proto.createdCallback);
    proto.attachedCallback = measuredMethod('attached', proto.attachedCallback);
  }

  function statsForElementMethod(element, method) {
    let measures = window.performance.getEntriesByName(`${element}-${method}`);
    let count = measures.length;
    let sum = measures.reduce(function(sum, measure) {
      return sum + measure.duration;
    }, 0);
    let average = sum ? sum / count : 0;

    return { count, average, sum };
  }

  window.console.polymerTimingCsv = function() {
    let header = 'element';

    measuredMethods.forEach(function(method) {
      header = `${header},${method} #,${method} avg. ms,${method} total`;
    });

    let rows = header;

    measuredElements.forEach(function(element) {
      let row = element;

      measuredMethods.forEach(function(method) {
        let stats = statsForElementMethod(element, method);

        Object.keys(stats).forEach(function(stat) {
          row = `${row},${stats[stat]}`;
        });
      });

      rows = `${rows}\n${row}`;
    });

    console.log(rows);
  };

  window.console.polymerTiming = function() {
    let elementData = {};

    measuredElements.forEach(function(element) {
      let methodData = {};

      measuredMethods.forEach(function(method) {
        let stats = statsForElementMethod(element, method);

        methodData[`${method} #`] = stats.count;
        methodData[`${method} avg. ms`] = stats.average;
        methodData[`${method} total`] = stats.sum;
      });

      elementData[element] = methodData;
    });

    console.table(elementData);
  }
})();
