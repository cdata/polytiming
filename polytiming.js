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

  window.console.polymerTiming = function() {
    let elementData = {};

    measuredElements.forEach(function(element) {
      let methodData = {};

      measuredMethods.forEach(function(method) {
        let measures = window.performance.getEntriesByName(`${element}-${method}`);
        let count = measures.length;
        let sum = measures.reduce(function(sum, measure) {
          return sum + measure.duration;
        }, 0);
        let average = sum ? sum / count : 0;

        methodData[`${method} #`] = count;
        methodData[`${method} avg. ms`] = average || 0;
        methodData[`${method} total`] = sum;
      });

      elementData[element] = methodData;
    });

    console.table(elementData);
  }
})();
