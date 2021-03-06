/* globals browser, catcher */

"use strict";

window.selectorLoader = (function () {
  const exports = {};

  // These modules are loaded in order, first standardScripts, then optionally onboardingScripts, and then selectorScripts
  // The order is important due to dependencies
  const standardScripts = [
    "catcher.js",
    "assertIsTrusted.js",
    "background/selectorLoader.js",
    "selector/callBackground.js",
    "selector/util.js"
  ];

  const selectorScripts = [
    "clipboard.js",
    "makeUuid.js",
    "build/shot.js",
    "randomString.js",
    "domainFromUrl.js",
    "build/inlineSelectionCss.js",
    "selector/documentMetadata.js",
    "selector/ui.js",
    "selector/shooter.js",
    "selector/uicontrol.js"
  ];

  // These are loaded on request (by the selector worker) to activate the onboarding:
  const onboardingScripts = [
    "build/onboardingCss.js",
    "build/onboardingHtml.js",
    "onboarding/slides.js"
  ];

  exports.unloadIfLoaded = function (tabId) {
    return browser.tabs.executeScript(tabId, {
      code: "window.selectorLoader && window.selectorLoader.unloadModules()",
      runAt: "document_start"
    }).then(result => {
      return result && result.toString() === "true";
    });
  };

  exports.loadModules = function (tabId, hasSeenOnboarding) {
    if (hasSeenOnboarding) {
      return executeModules(tabId, standardScripts.concat(selectorScripts));
    } else {
      return executeModules(tabId, standardScripts.concat(onboardingScripts).concat(selectorScripts));
    }
  };

  function executeModules(tabId, scripts) {
    let lastPromise = Promise.resolve(null);
    scripts.forEach((file) => {
      lastPromise = lastPromise.then(() => {
        return browser.tabs.executeScript(tabId, {
          file,
          runAt: "document_end"
        })
          .catch((error) => {
            console.error("error in script:", file, error);
            error.scriptName = file;
            throw error;
          })
      })
    });
    return lastPromise.then(() => {
      console.log("finished loading scripts:", scripts.join(" "));
    },
    (error) => {
      exports.unloadIfLoaded(tabId);
      catcher.unhandled(error);
      throw error;
    });
  }

  exports.unloadModules = function () {
    const watchFunction = catcher.watchFunction;
    let allScripts = standardScripts.concat(onboardingScripts).concat(selectorScripts);
    const moduleNames = allScripts.map((filename) =>
      filename.replace(/^.*\//, "").replace(/\.js$/, ""));
    moduleNames.reverse();
    for (let moduleName of moduleNames) {
      let moduleObj = window[moduleName];
      if (moduleObj && moduleObj.unload) {
        try {
          watchFunction(moduleObj.unload)();
        } catch (e) {
          // ignore (watchFunction handles it)
        }
      }
      delete window[moduleName];
    }
    return true;
  };

  exports.toggle = function (tabId, hasSeenOnboarding) {
    return exports.unloadIfLoaded(tabId)
      .then(wasLoaded => {
        if (!wasLoaded) {
          exports.loadModules(tabId, hasSeenOnboarding);
        }
        return !wasLoaded;
      })
  };

  return exports;
})();
null;
